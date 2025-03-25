const sequelize = require('../../utils/db'); // Assuming you export your sequelize instance
const Checkout = require('../../models/checkout.model');
const Book = require('../../models/book.model');
const User = require('../../models/user.model');
const Reservation = require('../../models/reservation.model'); // Import the reservation model
const queueHelper = require('../../utils/queueHelper');
const CustomError = require('../../utils/customError');

// Helper to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Maximum renewals allowed
const MAX_RENEWALS = 2;

exports.initiateCheckout = async (data) => {
  const { userId, bookIsbn, role, customDays } = data;
  if (!userId || !bookIsbn) {
    throw new CustomError('Missing required fields: userId and bookIsbn.', 400);
  }
  
  // Check if the user exists
  const user = await User.findOne({ where: { id: userId } });
  if (!user) {
    throw new CustomError('User not found.', 404);
  }
  
  // Retrieve the book record
  const book = await Book.findOne({ where: { isbn: bookIsbn } });
  if (!book) {
    throw new CustomError('Book not found.', 404);
  }
  
  if (book.availableCopies <= 0) {
    throw new CustomError('No available copies for checkout.', 400);
  }
  
  // Calculate due date based on role or customDays:
  // If customDays is provided and is a valid number greater than 0, use it.
  // Otherwise, use 30 days for Admin/Librarian, and 14 days for Patrons.
  let loanPeriod = 14;
  if (customDays && Number(customDays) > 0) {
    loanPeriod = Number(customDays);
  } else if (role && (role === 'Admin' || role === 'Librarian')) {
    loanPeriod = 30;
  }
  
  const checkoutDate = new Date();
  const dueDate = addDays(checkoutDate, loanPeriod);

  // Begin transaction to ensure atomic operations
  const transaction = await sequelize.transaction();
  try {
    // Create the checkout record
    const checkout = await Checkout.create({
      userId,
      bookIsbn,
      checkoutDate,
      dueDate,
      status: 'active'
    }, { transaction });
    
    // Check if there is an available reservation for this book.
    // This example assumes you want the earliest available reservation.
    const availableReservation = await Reservation.findOne({
      where: { bookIsbn, status: 'available' },
      order: [['queuePosition', 'ASC']],
      transaction
    });
    
    // if there is no reservation linked to the checkout
    // decrement the book copies, else don't decrement it
    // because we already decrement it when the reservation 
    // becomes available/promoted
    if (!availableReservation) {
      // Update book availability: decrement available copies
      await Book.update(
        { availableCopies: book.availableCopies - 1 },
        { where: { isbn: bookIsbn }, transaction }
      );
    }
    
    if (availableReservation) {
      // Link the checkout to the reservation if needed.
      // For example, you might store reservationId in the checkout record.
      // Here, we'll update the reservation to mark it as fulfilled.
      availableReservation.status = 'fulfilled';
      await availableReservation.save({ transaction });
      
      await queueHelper.adjustQueuePositions(bookIsbn);

      // Optionally, you can update the checkout with the reservation ID.
      await checkout.update({ reservationId: availableReservation.id }, { transaction });
    }
    
    // Commit the transaction
    await transaction.commit();
    
    return checkout;
  } catch (error) {
    await transaction.rollback();
    throw new CustomError(error.message, 500);
  }
};


exports.processReturn = async (data) => {
  const { checkoutId, returnDate, returnStatus, customFine } = data;
  if (!checkoutId) {
    throw new CustomError('Missing checkoutId.', 400);
  }
  
  const checkout = await Checkout.findOne({ where: { id: checkoutId } });
  if (!checkout) {
    throw new CustomError('Checkout record not found.', 404);
  }
  
  if (checkout.status !== 'active' && checkout.status !== 'overdue') {
    throw new CustomError('Checkout is not active.', 400);
  }
  
  const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
  
  // Validate: Return date should not be before the checkout date
  if (actualReturnDate < new Date(checkout.checkoutDate)) {
    throw new CustomError('Return date cannot be before the checkout date.', 400);
  }
  
  let fine = 0;
  let finalStatus = 'returned';
  
  if (returnStatus && (returnStatus === 'lost' || returnStatus === 'damaged')) {
    finalStatus = returnStatus;
    
    // Validate customFine if provided
    if (customFine !== undefined && customFine !== null && customFine !== '') {
      const parsedFine = parseFloat(customFine);
      if (isNaN(parsedFine) || parsedFine < 1 || parsedFine > 1000000) {
        throw new CustomError('Custom fine must be between 1 and 1,000,000 dollars.', 400);
      }
      fine = parsedFine;
    } else {
      // Fallback default fines if customFine is not provided
      if (returnStatus === 'lost') {
        fine = 20.00;
      } else if (returnStatus === 'damaged') {
        fine = 10.00;
      }
    }
  } else {
    // Standard returned: Calculate overdue fine if returned after due date
    if (actualReturnDate > checkout.dueDate) {
      const lateDays = Math.ceil((actualReturnDate - checkout.dueDate) / (1000 * 60 * 60 * 24));
      fine = lateDays * 0.50;
    }
  }
  
  const updatedCheckout = await checkout.update({
    returnDate: actualReturnDate,
    status: finalStatus,
    fine
  });
  
  // Increase available copies only if the item is returned in good condition.
  if (finalStatus === 'returned') {
    const book = await Book.findOne({ where: { isbn: checkout.bookIsbn } });
    if (book) {
      await Book.update(
        { availableCopies: book.availableCopies + 1 },
        { where: { isbn: checkout.bookIsbn } }
      );
    }
  }
  
  return updatedCheckout;
};





exports.renewCheckout = async (checkoutId, data) => {
  const checkout = await Checkout.findOne({ where: { id: checkoutId } });
  if (!checkout) {
    throw new CustomError('Checkout record not found.', 404);
  }
  
  if (checkout.status !== 'active') {
    throw new CustomError('Only active checkouts can be renewed.', 400);
  }
  
  if (checkout.renewalCount >= MAX_RENEWALS) {
    throw new CustomError('Renewal limit exceeded.', 400);
  }
  
  // Determine renewal period
  // Default is 14 days unless custom is provided.
  let renewalDays = 14;
  if (data.renewalOption === 'custom' && data.customDays && Number(data.customDays) > 0) {
    renewalDays = Number(data.customDays);
  }
  
  // Extend due date by the determined period
  const newDueDate = addDays(checkout.dueDate, renewalDays);
  
  const updatedCheckout = await checkout.update({
    renewalCount: checkout.renewalCount + 1,
    dueDate: newDueDate
  });
  
  return updatedCheckout;
};

exports.getCheckoutHistory = async (query) => {
  const where = {};
  if (query.userId) {
    where.userId = query.userId;
  }
  if (query.bookIsbn) {
    where.bookIsbn = query.bookIsbn;
  }
  // Additional filters can be added as needed
  
  const history = await Checkout.findAll({
    where,
    order: [['checkoutDate', 'DESC']]
  });
  
  return history;
};
