const Grade = require('../models/gradeModel');
const GradeHistory = require('../models/gradeHistoryModel');
const Usuario = require('../models/usuarioModel');
const Grupo = require('../models/grupoModel');
const Materia = require('../models/materiaModel');
const Joi = require('joi');

const gradeValidationSchema = Joi.object({
  student_id: Joi.string().required(),
  group_id: Joi.string().required(),
  subject_id: Joi.string().required(),
  semester_id: Joi.string().required(),
  grade_value: Joi.number().min(0).max(100).required(),
  grade_scale: Joi.string().valid('0-100', '1-10', 'A-F').default('0-100'),
  comments: Joi.string().optional()
});

const registerGrades = async (req, res) => {
  try {
    const { grades } = req.body;
    const teacher_id = req.user.id;

    if (!Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Grades array is required'
      });
    }

    const results = [];
    const errors = [];

    for (const gradeData of grades) {
      const { error, value } = gradeValidationSchema.validate(gradeData);

      if (error) {
        errors.push({
          student_id: gradeData.student_id,
          error: error.details[0].message
        });
        continue;
      }

      const existingGrade = await Grade.findOne({
        student_id: value.student_id,
        subject_id: value.subject_id,
        semester_id: value.semester_id
      });

      if (existingGrade) {
        errors.push({
          student_id: value.student_id,
          error: 'Grade already exists for this student and subject'
        });
        continue;
      }

      const grade = new Grade({
        ...value,
        teacher_id
      });

      await grade.save();
      results.push(grade);
    }

    res.status(201).json({
      success: true,
      message: `${results.length} grades registered successfully`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error registering grades:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const modifyGrades = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const { grade_value, comments, change_reason } = req.body;
    const modified_by = req.user.id;

    const validationSchema = Joi.object({
      grade_value: Joi.number().min(0).max(100).required(),
      comments: Joi.string().optional(),
      change_reason: Joi.string().required()
    });

    const { error, value } = validationSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const existingGrade = await Grade.findById(gradeId);

    if (!existingGrade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    const old_value = existingGrade.grade_value;

    existingGrade.grade_value = value.grade_value;
    existingGrade.comments = value.comments || existingGrade.comments;
    existingGrade.modified_by = modified_by;
    existingGrade.updated_at = Date.now();

    await existingGrade.save();

    const gradeHistory = new GradeHistory({
      grade_id: existingGrade._id,
      old_value,
      new_value: value.grade_value,
      changed_by: modified_by,
      change_reason: value.change_reason
    });

    await gradeHistory.save();

    res.status(200).json({
      success: true,
      message: 'Grade modified successfully',
      data: existingGrade
    });

  } catch (error) {
    console.error('Error modifying grade:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getStudentGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester_id } = req.query;

    let query = { student_id: studentId };

    if (semester_id) {
      query.semester_id = semester_id;
    }

    const grades = await Grade.find(query)
      .populate('teacher_id', 'nombre apellido')
      .populate('subject_id', 'nombre')
      .populate('semester_id', 'name year')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Error getting student grades:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getGradesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { semester_id, subject_id } = req.query;
    const teacher_id = req.user.id;

    let query = {
      group_id: groupId,
      teacher_id: teacher_id
    };

    if (semester_id) {
      query.semester_id = semester_id;
    }

    if (subject_id) {
      query.subject_id = subject_id;
    }

    const grades = await Grade.find(query)
      .populate('student_id', 'nombre apellido email')
      .populate('subject_id', 'nombre')
      .populate('semester_id', 'name year')
      .sort({ 'student_id.apellido': 1, 'student_id.nombre': 1 });

    res.status(200).json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Error getting group grades:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getGradesBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { student_id } = req.query;

    let query = { semester_id: semesterId };

    if (student_id) {
      query.student_id = student_id;
    }

    const grades = await Grade.find(query)
      .populate('student_id', 'nombre apellido email')
      .populate('teacher_id', 'nombre apellido')
      .populate('subject_id', 'nombre')
      .populate('group_id', 'nombre')
      .sort({ 'student_id.apellido': 1, 'student_id.nombre': 1 });

    res.status(200).json({
      success: true,
      data: grades
    });

  } catch (error) {
    console.error('Error getting semester grades:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getGradeHistory = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const history = await GradeHistory.find({ grade_id: gradeId })
      .populate('changed_by', 'nombre apellido')
      .sort({ changed_at: -1 });

    res.status(200).json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting grade history:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const teacher_id = req.user.id;

    const grade = await Grade.findById(gradeId);

    if (!grade) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    if (grade.teacher_id.toString() !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this grade'
      });
    }

    await Grade.findByIdAndDelete(gradeId);

    res.status(200).json({
      success: true,
      message: 'Grade deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting grade:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerGrades,
  modifyGrades,
  getStudentGrades,
  getGradesByGroup,
  getGradesBySemester,
  getGradeHistory,
  deleteGrade
};