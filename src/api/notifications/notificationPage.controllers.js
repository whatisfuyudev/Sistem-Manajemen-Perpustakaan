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
      return res.status(404).send('<h1>Notification not found</h1>');
    }
    
    const notification = result.notifications[0].dataValues;

    // Render the EJS view with the notification data
    res.render('admin-notification-detail', { notification });
  } catch (err) {
    next(err);
  }
};
