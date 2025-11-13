const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

const {
  generateSemesterReport,
  generatePDFReport,
  confirmReportRead,
  getAvailableReports,
  deleteReport
} = require('../controllers/reportsController');

router.post('/generate',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  validationMiddleware.validateReportGeneration,
  validationMiddleware.validateStudentAccess('studentId'),
  generateSemesterReport
);

router.post('/confirm',
  authMiddleware(['Estudiante', 'Admin']),
  validationMiddleware.validateReportConfirmation,
  confirmReportRead
);

router.get('/student/:studentId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  validationMiddleware.validateObjectId('studentId'),
  validationMiddleware.validateStudentAccess('studentId'),
  getAvailableReports
);

router.get('/download/:reportId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  validationMiddleware.validateObjectId('reportId'),
  generatePDFReport
);

router.delete('/:reportId',
  authMiddleware(['Admin', 'Estudiante']),
  validationMiddleware.validateObjectId('reportId'),
  deleteReport
);

module.exports = router;