const Joi = require('joi');
const Grade = require('../models/gradeModel');
const Report = require('../models/reportModel');
const Semester = require('../models/semesterModel');
const Usuario = require('../models/usuarioModel');
const Grupo = require('../models/grupoModel');
const Materia = require('../models/materiaModel');

const validateGradeRegistration = (req, res, next) => {
  const schema = Joi.object({
    grades: Joi.array().items(
      Joi.object({
        student_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        group_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        subject_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        semester_id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        grade_value: Joi.number().min(0).max(100).required(),
        grade_scale: Joi.string().valid('0-100', '1-10', 'A-F').default('0-100'),
        comments: Joi.string().max(500).optional().allow('')
      })
    ).min(1).required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.body = value;
  next();
};

const validateGradeModification = (req, res, next) => {
  const schema = Joi.object({
    grade_value: Joi.number().min(0).max(100).required(),
    comments: Joi.string().max(500).optional().allow(''),
    change_reason: Joi.string().min(5).max(200).required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.body = value;
  next();
};

const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }

    next();
  };
};

const validateReportGeneration = (req, res, next) => {
  const schema = Joi.object({
    studentId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    semesterId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.body = value;
  next();
};

const validateReportConfirmation = (req, res, next) => {
  const schema = Joi.object({
    reportId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  req.body = value;
  next();
};

const validateResourceOwnership = (resourceModel, idParam = 'id', ownerField = 'teacher_id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user.id;
      const userRole = req.user.rol;

      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (userRole.includes('Admin')) {
        return next();
      }

      if (resource[ownerField] && resource[ownerField].toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();

    } catch (error) {
      console.error('Error in resource ownership validation:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

const validateStudentAccess = (studentIdParam = 'studentId') => {
  return async (req, res, next) => {
    try {
      const studentId = req.params[studentIdParam];
      const userId = req.user.id;
      const userRole = req.user.rol;

      if (userId === studentId || userRole.includes('Admin') || userRole.includes('Docente')) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this student resource'
      });

    } catch (error) {
      console.error('Error in student access validation:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

const validateGroupAssignment = async (req, res, next) => {
  try {
    const { group_id } = req.body;
    const teacherId = req.user.id;
    const userRole = req.user.rol;

    if (userRole.includes('Admin')) {
      return next();
    }

    const teacher = await Usuario.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (teacher.grupo && teacher.grupo.toString() !== group_id) {
      return res.status(403).json({
        success: false,
        message: 'Teacher is not assigned to this group'
      });
    }

    next();

  } catch (error) {
    console.error('Error in group assignment validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const validateGradeScale = (req, res, next) => {
  const { grade_value, grade_scale } = req.body;

  let isValid = false;

  switch (grade_scale) {
    case '0-100':
      isValid = grade_value >= 0 && grade_value <= 100;
      break;
    case '1-10':
      isValid = grade_value >= 1 && grade_value <= 10;
      break;
    case 'A-F':
      isValid = ['A', 'B', 'C', 'D', 'F'].includes(grade_value.toUpperCase());
      break;
    default:
      isValid = false;
  }

  if (!isValid) {
    return res.status(400).json({
      success: false,
      message: `Grade value ${grade_value} is not valid for scale ${grade_scale}`
    });
  }

  next();
};

const validateSemesterDates = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.body;

    if (start_date && end_date) {
      const startDate = new Date(start_date);
      const endDate = new Date(end_date);

      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before end date'
        });
      }

      const now = new Date();
      if (endDate < now) {
        return res.status(400).json({
          success: false,
          message: 'End date cannot be in the past'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Error in semester date validation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  validateGradeRegistration,
  validateGradeModification,
  validateObjectId,
  validateReportGeneration,
  validateReportConfirmation,
  validateResourceOwnership,
  validateStudentAccess,
  validateGroupAssignment,
  validateGradeScale,
  validateSemesterDates
};