const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

const {
  getReadReceipts,
  markAsRead,
  getReceiptDetails,
  getReceiptStats,
  exportReceipts
} = require('../controllers/receiptsController');

router.get('/user/:userId',
  authMiddleware(['Estudiante', 'Admin']),
  validationMiddleware.validateObjectId('userId'),
  validationMiddleware.validateStudentAccess('userId'),
  getReadReceipts
);

router.post('/mark',
  authMiddleware(['Estudiante', 'Admin']),
  markAsRead
);

router.get('/details/:receiptId',
  authMiddleware(['Estudiante', 'Admin']),
  validationMiddleware.validateObjectId('receiptId'),
  getReceiptDetails
);

router.get('/stats/:userId',
  authMiddleware(['Estudiante', 'Admin']),
  validationMiddleware.validateObjectId('userId'),
  validationMiddleware.validateStudentAccess('userId'),
  getReceiptStats
);

router.get('/export/:userId',
  authMiddleware(['Estudiante', 'Admin']),
  validationMiddleware.validateObjectId('userId'),
  validationMiddleware.validateStudentAccess('userId'),
  exportReceipts
);

module.exports = router;