const notificationService = require('./notifications.service');

exports.renderAdminNotificationDetail = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).send('<h1>Invalid notification ID</h1>');
    }

    // Fetch the notification and any related data (if needed)
    const result = await notificationService.getNotificationHistory({id});
    if (!result.total) {
      next();
    }
    
    const notification = result.notifications[0].dataValues;

    // Render the EJS view with the notification data
    res.render('admin-notification-detail', { notification });
  } catch (err) {
    next(err);
  }
};


exports.renderAdminNotificationEdit = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).send('<h1>Invalid notification ID</h1>');
    }

    // Fetch single notification record
    const result = await notificationService.getNotificationHistory({id});
    if (!result.total) {
      next();
    }
    
    const notification = result.notifications[0].dataValues;


    // Render EJS template with the notification object
    res.render('admin-notification-edit', { notification });
  } catch (err) {
    next(err);
  }
};

exports.renderAdminNotificationAddAndSchedule = async (req, res, next) => {
  try {
    // You can pass any needed context here
    res.render('admin-notification-add-and-schedule');
  } catch (err) {
    next(err);
  }
};

