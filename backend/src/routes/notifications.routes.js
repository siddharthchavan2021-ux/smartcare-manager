const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications.controller');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', notificationsController.getNotifications);
router.get('/unread', notificationsController.getUnreadCount);
router.put('/:id/read', notificationsController.markRead);
router.put('/read-all', notificationsController.markAllRead);

module.exports = router;
