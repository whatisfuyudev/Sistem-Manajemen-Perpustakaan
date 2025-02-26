// src/api/checkouts/checkouts.service.js
const { Op } = require('sequelize');
const Checkout = require('../../models/checkout.model');
const Book = require('../../models/book.model');
const User = require('../../models/user.model'); // Optional: for additional eligibility checks

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
    throw new Error('Missing required fields: userId and bookIsbn.');
  }
  
  // Check if the user exists
  const user = await User.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found.');
  }
  
  // Optionally, check user eligibility (fines, overdue items, etc.)
  // For simplicity, we assume eligibility here.
  
  // Retrieve the book record
  const book = await Book.findOne({ where: { isbn: bookIsbn } });
  if (!book) {
    throw new Error('Book not found.');
  }
  
  if (book.availableCopies <= 0) {
    throw new Error('No available copies for checkout.');
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
  
  // Create the checkout record
  const checkout = await Checkout.create({
    userId,
    bookIsbn,
    checkoutDate,
    dueDate,
    status: 'active'
  });
  
  // Update book availability: decrement available copies
  await Book.update(
    { availableCopies: book.availableCopies - 1 },
    { where: { isbn: bookIsbn } }
  );
  
  return checkout;
};


exports.processReturn = async (data) => {
  const { checkoutId, returnDate, returnStatus } = data;
  if (!checkoutId) {
    throw new Error('Missing checkoutId.');
  }
  
  const checkout = await Checkout.findOne({ where: { id: checkoutId } });
  if (!checkout) {
    throw new Error('Checkout record not found.');
  }
  
  if (checkout.status !== 'active' && checkout.status !== 'overdue') {
    throw new Error('Checkout is not active.');
  }
  
  const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
  
  // Validate: Return date should not be before the checkout date
  if (actualReturnDate < new Date(checkout.checkoutDate)) {
    throw new Error('Return date cannot be before the checkout date.');
  }
  
  // Determine final status and fine
  // If the admin marks the item as "lost" or "damaged", use fixed fines.
  // Otherwise, if "returned", calculate overdue fine if applicable.
  let fine = 0;
  let finalStatus = 'returned';
  
  if (returnStatus && (returnStatus === 'lost' || returnStatus === 'damaged')) {
    finalStatus = returnStatus;
    if (returnStatus === 'lost') {
      fine = 20.00; // Fixed fine for lost items
    } else if (returnStatus === 'damaged') {
      fine = 10.00; // Fixed fine for damaged items
    }
  } else {
    // Standard returned: Calculate overdue fine if returned after due date
    if (actualReturnDate > checkout.dueDate) {
      const lateDays = Math.ceil((actualReturnDate - checkout.dueDate) / (1000 * 60 * 60 * 24));
      fine = lateDays * 0.50;
    }
  }
  
  // Update the checkout record
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
    throw new Error('Checkout record not found.');
  }
  
  if (checkout.status !== 'active') {
    throw new Error('Only active checkouts can be renewed.');
  }
  
  if (checkout.renewalCount >= MAX_RENEWALS) {
    throw new Error('Renewal limit exceeded.');
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
