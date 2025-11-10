const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

const {
  registerGrades,
  modifyGrades,
  getStudentGrades,
  getGradesByGroup,
  getGradesBySemester,
  getGradeHistory,
  deleteGrade
} = require('../controllers/gradesController');

router.post('/register',
  authMiddleware(['Docente', 'Admin']),
  validationMiddleware.validateGradeRegistration,
  validationMiddleware.validateGroupAssignment,
  registerGrades
);

router.put('/modify/:gradeId',
  authMiddleware(['Docente', 'Admin']),
  validationMiddleware.validateObjectId('gradeId'),
  validationMiddleware.validateResourceOwnership(require('../models/gradeModel'), 'gradeId'),
  validationMiddleware.validateGradeModification,
  validationMiddleware.validateGradeScale,
  modifyGrades
);

router.get('/student/:studentId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  validationMiddleware.validateObjectId('studentId'),
  validationMiddleware.validateStudentAccess('studentId'),
  getStudentGrades
);

router.get('/group/:groupId',
  authMiddleware(['Docente', 'Admin']),
  validationMiddleware.validateObjectId('groupId'),
  getGradesByGroup
);

router.get('/semester/:semesterId',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  validationMiddleware.validateObjectId('semesterId'),
  getGradesBySemester
);

router.get('/:gradeId/history',
  authMiddleware(['Estudiante', 'Docente', 'Admin']),
  validationMiddleware.validateObjectId('gradeId'),
  getGradeHistory
);

router.delete('/:gradeId',
  authMiddleware(['Docente', 'Admin']),
  validationMiddleware.validateObjectId('gradeId'),
  validationMiddleware.validateResourceOwnership(require('../models/gradeModel'), 'gradeId'),
  deleteGrade
);

module.exports = router;