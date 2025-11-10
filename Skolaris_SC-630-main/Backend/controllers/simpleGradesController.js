const simpleDbService = require('../services/simpleDbService');
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

      // Check if grade already exists
      const existingGrades = await simpleDbService.findGrades({
        student_id: value.student_id,
        subject_id: value.subject_id,
        semester_id: value.semester_id
      });

      if (existingGrades.length > 0) {
        errors.push({
          student_id: value.student_id,
          error: 'Grade already exists for this student and subject'
        });
        continue;
      }

      const grade = await simpleDbService.createGrade({
        ...value,
        teacher_id
      });

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

    const existingGrade = await simpleDbService.findGrades({ _id: gradeId });

    if (existingGrade.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    const grade = existingGrade[0];
    const old_value = grade.grade_value;

    const updatedGrade = await simpleDbService.updateGrade(gradeId, {
      grade_value: value.grade_value,
      comments: value.comments || grade.comments,
      modified_by: modified_by
    });

    // Create grade history
    await simpleDbService.createGradeHistory({
      grade_id: gradeId,
      old_value,
      new_value: value.grade_value,
      changed_by: modified_by,
      change_reason: value.change_reason
    });

    res.status(200).json({
      success: true,
      message: 'Grade modified successfully',
      data: updatedGrade
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

    const grades = await simpleDbService.getStudentGrades(studentId, semester_id);

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

    const grades = await simpleDbService.getGradesByGroup(groupId, semester_id, subject_id);

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

    const grades = await simpleDbService.findGrades({
      semester_id: semesterId,
      student_id: student_id
    });

    const populatedGrades = await simpleDbService.populate(grades,
      'student_id,teacher_id,subject_id,group_id'
    );

    res.status(200).json({
      success: true,
      data: populatedGrades
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

    const history = await simpleDbService.findGradeHistory({ grade_id: gradeId });

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

    const grades = await simpleDbService.findGrades({ _id: gradeId });

    if (grades.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

    const grade = grades[0];

    if (grade.teacher_id !== teacher_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this grade'
      });
    }

    const deleted = await simpleDbService.deleteGrade(gradeId);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Grade deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Grade not found'
      });
    }

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