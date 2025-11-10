const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const simpleGradesController = require('../controllers/simpleGradesController');
const simpleReportsController = require('../controllers/simpleReportsController');
const simpleReceiptsController = require('../controllers/simpleReceiptsController');
const simpleDbService = require('../services/simpleDbService');

// Grades routes using simple database
router.post('/register',
  authMiddleware(['Docente', 'Admin']),
  simpleGradesController.registerGrades
);

router.put('/modify/:gradeId',
  authMiddleware(['Docente', 'Admin']),
  simpleGradesController.modifyGrades
);

router.get('/student/:studentId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  simpleGradesController.getStudentGrades
);

router.get('/group/:groupId',
  authMiddleware(['Docente', 'Admin']),
  simpleGradesController.getGradesByGroup
);

router.get('/semester/:semesterId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  simpleGradesController.getGradesBySemester
);

router.get('/:gradeId/history',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  simpleGradesController.getGradeHistory
);

router.delete('/:gradeId',
  authMiddleware(['Docente', 'Admin']),
  simpleGradesController.deleteGrade
);

// Reports routes using simple database
router.post('/generate',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  simpleReportsController.generateSemesterReport
);

router.post('/confirm',
  authMiddleware(['Estudiante', 'Admin']),
  simpleReportsController.confirmReportRead
);

router.get('/student/:studentId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  simpleReportsController.getAvailableReports
);

router.get('/download/:reportId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  simpleReportsController.generatePDFReport
);

router.delete('/:reportId',
  authMiddleware(['Admin', 'Estudiante']),
  simpleReportsController.deleteReport
);

// Receipts routes using simple database
router.get('/user/:userId',
  authMiddleware(['Estudiante', 'Admin']),
  simpleReceiptsController.getReadReceipts
);

router.post('/mark',
  authMiddleware(['Estudiante', 'Admin']),
  simpleReceiptsController.markAsRead
);

router.get('/details/:receiptId',
  authMiddleware(['Estudiante', 'Admin']),
  simpleReceiptsController.getReceiptDetails
);

router.get('/stats/:userId',
  authMiddleware(['Estudiante', 'Admin']),
  simpleReceiptsController.getReceiptStats
);

router.get('/export/:userId',
  authMiddleware(['Estudiante', 'Admin']),
  simpleReceiptsController.exportReceipts
);

// Utility endpoints
router.get('/subjects',
  authMiddleware(['Docente', 'Admin', 'Estudiante']),
  async (req, res) => {
    try {
      const subjects = await simpleDbService.getSubjects();
      res.status(200).json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Error getting subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

router.get('/semesters',
  authMiddleware(['Docente', 'Admin', 'Estudiante']),
  async (req, res) => {
    try {
      const semesters = await simpleDbService.getSemesters();
      res.status(200).json({
        success: true,
        data: semesters
      });
    } catch (error) {
      console.error('Error getting semesters:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

router.get('/current-semester',
  authMiddleware(['Docente', 'Admin', 'Estudiante']),
  async (req, res) => {
    try {
      const currentSemester = await simpleDbService.getCurrentSemester();
      if (!currentSemester) {
        return res.status(404).json({
          success: false,
          message: 'No current semester found'
        });
      }
      res.status(200).json({
        success: true,
        data: currentSemester
      });
    } catch (error) {
      console.error('Error getting current semester:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

router.get('/groups',
  authMiddleware(['Docente', 'Admin']),
  async (req, res) => {
    try {
      const groups = simpleDbService.data.groups;
      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      console.error('Error getting groups:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

router.get('/groups/:groupId/students',
  authMiddleware(['Docente', 'Admin']),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const students = await simpleDbService.getGroupStudents(groupId);
      res.status(200).json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Error getting group students:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

// User endpoints
router.get('/users/profile',
  authMiddleware(['Admin', 'Docente', 'Estudiante']),
  async (req, res) => {
    try {
      const user = await simpleDbService.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

module.exports = router;