// src/api/checkouts/checkouts.service.js
const sequelize = require('../../utils/db'); // Assuming you export your sequelize instance
const Checkout = require('../../models/checkout.model');
const Book = require('../../models/book.model');
const User = require('../../models/user.model');
const Reservation = require('../../models/reservation.model'); // Import the reservation model
const queueHelper = require('../../utils/queueHelper');
const CustomError = require('../../utils/customError');
const { Op } = require('sequelize');

// Helper to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Maximum renewals allowed
const MAX_RENEWALS = 2;

// fine
const dailyFineAmount = 0.50;

exports.getDailyFineAmount = async () => {
  return dailyFineAmount;
}

exports.getById = async (checkoutId) => {
  const checkout = await Checkout.findOne({ where: { id: checkoutId } });
  if (!checkout) {
    throw new CustomError(`Checkout with id=${checkoutId} not found`, 404);
  }
  return checkout;
};

exports.updateCheckout = async (checkoutId, updates) => {
  // 1) Load the existing checkout record
  const checkout = await Checkout.findOne({ where: { id: checkoutId } });
  if (!checkout) {
    throw new CustomError(`Checkout with id=${checkoutId} not found`, 404);
  }

  // 2) Validate related User
  if (updates.userId != null) {
    const user = await User.findByPk(updates.userId);
    if (!user) {
      throw new CustomError(`User with id=${updates.userId} not found`, 400);
    }
  }

  // 3) Validate related Book
  if (updates.bookIsbn != null) {
    const book = await Book.findOne({ where: { isbn: updates.bookIsbn } });
    if (!book) {
      throw new CustomError(`Book with ISBN=${updates.bookIsbn} not found`, 400);
    }
  }

  // 4) Apply all provided updates
  //    (only fields present in `updates` will be changed)
  checkout.set(updates);

  // 5) Save back to the database
  return await checkout.save();
};

exports.getCheckoutDetail = async (checkoutId) => {
  // Fetch the checkout record
  const checkout = await Checkout.findOne({ where: { id: checkoutId } });
  if (!checkout) {
    throw new CustomError('Checkout record not found.', 404);
  }
  
  // Fetch associated book data using the book ISBN from checkout
  const book = await Book.findOne({ where: { isbn: checkout.bookIsbn } });
  // Fetch user data using the userId from checkout
  const user = await User.findOne({ where: { id: checkout.userId } });
  // Fetch reservation if this checkout is tied to one
  let reservation = null;
  if (checkout.reservationId) {
    reservation = await Reservation.findOne({ where: { id: checkout.reservationId } });
  }
  
  // Return the aggregated detail object
  return {
    checkout,
    book,
    user,
    reservation
  };
};

exports.initiateCheckout = async (data) => {
  const { userId, bookIsbn, customDays } = data;
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
  const role = user.role;
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

  if (!['active','overdue'].includes(checkout.status)) {
    throw new CustomError('Checkout is not active.', 400);
  }

  const actualReturnDate = returnDate
    ? new Date(returnDate)
    : new Date();

  if (actualReturnDate < new Date(checkout.checkoutDate)) {
    throw new CustomError(
      'Return date cannot be before the checkout date.',
      400
    );
  }

  // 1) Compute any overdue fine
  let overdueFine = 0;
  if (actualReturnDate > checkout.dueDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    const lateDays = Math.ceil(
      (actualReturnDate - checkout.dueDate) / msPerDay
    );
    overdueFine = lateDays * dailyFineAmount;
  }

  // 2) Determine base fine + final status
  let baseFine = 0;
  let finalStatus = 'returned';

  if (returnStatus === 'lost' || returnStatus === 'damaged') {
    finalStatus = returnStatus;

    if (customFine !== undefined && customFine !== null && customFine !== '') {
      const parsed = parseFloat(customFine);
      if (isNaN(parsed) || parsed < 1 || parsed > 1_000_000) {
        throw new CustomError(
          'Custom fine must be between 1 and 1,000,000 dollars.',
          400
        );
      }
      baseFine = parsed;
    } else {
      baseFine = returnStatus === 'lost' ? 20.00 : 10.00;
    }
  }

  // 3) Total fine is sum of overdue + base (if any)
  const totalFine = parseFloat((overdueFine + baseFine).toFixed(2));

  // 4) Update the checkout
  const updated = await checkout.update({
    returnDate:      actualReturnDate,
    status:          finalStatus,
    fine:            totalFine
  });

  // 5) If truly returned (not lost/damaged), put the copy back
  if (finalStatus === 'returned') {
    await Book.increment(
      { availableCopies: 1 },
      { where: { isbn: checkout.bookIsbn } }
    );
  }

  return updated;
};

exports.requestRenewal = async (checkoutId, data) => {
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
  
  // Check if a renewal request is already pending.
  if (checkout.renewalRequested) {
    throw new CustomError('Renewal request already pending.', 400);
  }
  
  // Determine renewal period:
  // Default is 14 days unless custom is provided.
  let renewalDays = 14;
  if (data.renewalOption === 'custom' && data.customDays && Number(data.customDays) > 0) {
    renewalDays = Number(data.customDays);
  }
  
  // Mark the renewal request; do not update dueDate immediately.
  checkout.renewalRequested = true;
  checkout.requestedRenewalDays = renewalDays;  // Optionally record the requested period
  await checkout.save();
  
  return { message: 'Renewal request submitted successfully.', checkout };
};


exports.renewCheckout = async (checkoutId, data) => {
  // 1. Find the checkout record
  const checkout = await Checkout.findOne({ where: { id: checkoutId } });
  if (!checkout) {
    throw new CustomError('Checkout record not found.', 404);
  }

  // 2. Only active checkouts can be renewed
  if (checkout.status !== 'active') {
    throw new CustomError('Only active checkouts can be renewed.', 400);
  }

  // 3. Ensure the patron has actually requested a renewal
  if (!checkout.renewalRequested) {
    throw new CustomError('No renewal request pending for this checkout.', 400);
  }

  // 4. Enforce renewal limits
  if (checkout.renewalCount >= MAX_RENEWALS) {
    throw new CustomError('Renewal limit exceeded.', 400);
  }

  // 5. Determine the number of days to renew:
  //    - Use the days the patron requested (if any)
  //    - Otherwise, fall back to any admin-provided override or a default
  let renewalDays;
  if (checkout.requestedRenewalDays && checkout.requestedRenewalDays > 0) {
    renewalDays = checkout.requestedRenewalDays;
  } else if (data.renewalOption === 'custom' && data.customDays && Number(data.customDays) > 0) {
    renewalDays = Number(data.customDays);
  } else {
    renewalDays = 14; // default standard period
  }

  // 6. Extend the due date
  const newDueDate = addDays(checkout.dueDate, renewalDays);

  // 7. Apply the updates: increment renewalCount, set new dueDate, clear request flags
  const updated = await checkout.update({
    renewalCount: checkout.renewalCount + 1,
    dueDate: newDueDate,
    renewalRequested: false,
    requestedRenewalDays: null
  });

  return updated;
};

exports.getCheckoutHistory = async (query, authUser) => {
  const {
    page = 1,
    limit = 10,
    checkoutId,
    bookIsbn,
    status,
    reservationId,
    startDate,
    endDate,
    dateField,
    userId
  } = query;
  const offset = (page - 1) * limit;
  const whereClause = {};

  // 1) Always filter by checkoutId if provided
  if (checkoutId) {
    whereClause.id = parseInt(checkoutId, 10);
  }

  // If the user is a Patron, force filtering by their own ID.
  if (authUser.role === 'Patron') {
    whereClause.userId = authUser.id;
  } else {
    // For librarians and admin, allow optional filtering by userId.
    if (userId) {
      whereClause.userId = userId;
    }
  }

  // Filter by Book ISBN if provided.
  if (bookIsbn) {
    whereClause.bookIsbn = { [Op.iLike]: `%${bookIsbn}%` };
  }
  

  // Filter by Reservation Id if provided.
  if (reservationId !== undefined && reservationId !== '') {
    whereClause.reservationId = parseInt(reservationId, 10);
  }
  

  // Filter by Status if provided.
  if (status) {
    if (status === 'others') {
      // "others" means not active, returned, or overdue.
      whereClause.status = { [Op.notIn]: ['active', 'returned', 'overdue'] };
    } else {
      whereClause.status = status;
    }
  }

  // Apply date range filtering.
  // Choose which date field to filter on. Default is checkoutDate.
  const fieldToFilter = dateField ? dateField : 'checkoutDate';
  if (startDate && endDate) {
    whereClause[fieldToFilter] = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  } else if (startDate) {
    whereClause[fieldToFilter] = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    whereClause[fieldToFilter] = { [Op.lte]: new Date(endDate) };
  }

  // Execute the query with pagination, ordering by id DESC
  const { count, rows } = await Checkout.findAndCountAll({
    where: whereClause,
    offset,
    limit: parseInt(limit, 10),
    order: [['id', 'DESC']],   // ← sort by id from largest to smallest
  });

  return {
    total: count,
    checkouts: rows,
    page: parseInt(page, 10)
  };
};
