const Report = require('../models/reportModel');
const ReadReceipt = require('../models/readReceiptModel');
const Grade = require('../models/gradeModel');
const Usuario = require('../models/usuarioModel');
const Semester = require('../models/semesterModel');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const generateSemesterReport = async (req, res) => {
  try {
    const { studentId, semesterId } = req.body;
    const requesting_user = req.user.id;

    const student = await Usuario.findById(studentId).select('nombre apellido email grado');
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (requesting_user !== studentId.toString() && !req.user.rol.includes('Admin') && !req.user.rol.includes('Docente')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate this report'
      });
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    const grades = await Grade.find({
      student_id: studentId,
      semester_id: semesterId
    })
      .populate('subject_id', 'nombre')
      .populate('teacher_id', 'nombre apellido')
      .sort({ 'subject_id.nombre': 1 });

    const report_data = {
      student: {
        nombre: student.nombre,
        apellido: student.apellido,
        email: student.email,
        grado: student.grado
      },
      semester: {
        name: semester.name,
        year: semester.year,
        start_date: semester.start_date,
        end_date: semester.end_date
      },
      grades: grades.map(grade => ({
        subject: grade.subject_id?.nombre || 'N/A',
        grade: grade.grade_value,
        scale: grade.grade_scale,
        comments: grade.comments,
        teacher: `${grade.teacher_id?.nombre || ''} ${grade.teacher_id?.apellido || ''}`.trim(),
        created_at: grade.created_at
      })),
      generated_at: new Date(),
      total_grades: grades.length,
      average_grade: grades.length > 0
        ? (grades.reduce((sum, grade) => sum + grade.grade_value, 0) / grades.length).toFixed(2)
        : 0
    };

    const existingReport = await Report.findOne({
      student_id: studentId,
      semester_id: semesterId,
      report_type: 'grades',
      is_active: true
    });

    if (existingReport) {
      existingReport.report_data = report_data;
      existingReport.generated_at = new Date();
      existingReport.expires_at = moment().add(30, 'days').toDate();
      await existingReport.save();
      var report = existingReport;
    } else {
      report = new Report({
        student_id: studentId,
        report_type: 'grades',
        semester_id: semesterId,
        report_data: report_data,
        expires_at: moment().add(30, 'days').toDate()
      });
      await report.save();
    }

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: report
    });

  } catch (error) {
    console.error('Error generating semester report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const generatePDFReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const requesting_user = req.user.id;

    const report = await Report.findById(reportId)
      .populate('student_id', 'nombre apellido email grado')
      .populate('semester_id', 'name year');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!report.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Report is no longer active'
      });
    }

    if (report.expires_at && moment().isAfter(report.expires_at)) {
      return res.status(403).json({
        success: false,
        message: 'Report has expired'
      });
    }

    if (requesting_user !== report.student_id._id.toString() &&
        !req.user.rol.includes('Admin') &&
        !req.user.rol.includes('Docente')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `report_${report.student_id.nombre}_${report.student_id.apellido}_${report.semester_id.name}_${report.semester_id.year}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(20).text('Academic Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Student: ${report.student_id.nombre} ${report.student_id.apellido}`);
    doc.text(`Grade: ${report.student_id.grado}`);
    doc.text(`Email: ${report.student_id.email}`);
    doc.moveDown();

    doc.text(`Semester: ${report.semester_id.name} ${report.semester_id.year}`);
    doc.text(`Generated: ${moment(report.generated_at).format('YYYY-MM-DD HH:mm')}`);
    doc.moveDown();

    doc.fontSize(16).text('Grades', { underline: true });
    doc.moveDown();

    if (report.report_data.grades && report.report_data.grades.length > 0) {
      report.report_data.grades.forEach((grade, index) => {
        doc.fontSize(12);
        doc.text(`${index + 1}. ${grade.subject}`);
        doc.text(`   Grade: ${grade.grade}/${grade.scale}`);
        doc.text(`   Teacher: ${grade.teacher}`);
        if (grade.comments) {
          doc.text(`   Comments: ${grade.comments}`);
        }
        doc.moveDown();
      });

      doc.moveDown();
      doc.fontSize(14).text(`Average Grade: ${report.report_data.average_grade}`);
      doc.text(`Total Subjects: ${report.report_data.total_grades}`);
    } else {
      doc.text('No grades available for this semester.');
    }

    doc.end();

  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const confirmReportRead = async (req, res) => {
  try {
    const { reportId } = req.body;
    const user_id = req.user.id;
    const { ip_address, user_agent } = req;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.student_id.toString() !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this report'
      });
    }

    const existingReceipt = await ReadReceipt.findOne({
      report_id: reportId,
      user_id: user_id
    });

    if (existingReceipt) {
      return res.status(200).json({
        success: false,
        message: 'Report already confirmed as read'
      });
    }

    const readReceipt = new ReadReceipt({
      report_id: reportId,
      user_id: user_id,
      ip_address: ip_address,
      user_agent: user_agent,
      confirmation_method: 'checkbox'
    });

    await readReceipt.save();

    res.status(200).json({
      success: true,
      message: 'Report confirmed as read',
      data: readReceipt
    });

  } catch (error) {
    console.error('Error confirming report read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getAvailableReports = async (req, res) => {
  try {
    const { studentId } = req.params;
    const requesting_user = req.user.id;

    if (requesting_user !== studentId && !req.user.rol.includes('Admin') && !req.user.rol.includes('Docente')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these reports'
      });
    }

    const reports = await Report.find({
      student_id: studentId,
      is_active: true,
      $or: [
        { expires_at: null },
        { expires_at: { $gt: new Date() } }
      ]
    })
      .populate('semester_id', 'name year')
      .sort({ generated_at: -1 });

    const reportsWithReceipts = await Promise.all(
      reports.map(async (report) => {
        const receipt = await ReadReceipt.findOne({
          report_id: report._id,
          user_id: studentId
        });

        return {
          ...report.toObject(),
          is_read: !!receipt,
          read_at: receipt ? receipt.read_at : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: reportsWithReceipts
    });

  } catch (error) {
    console.error('Error getting available reports:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const requesting_user = req.user.id;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (!req.user.rol.includes('Admin') &&
        requesting_user !== report.student_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    report.is_active = false;
    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  generateSemesterReport,
  generatePDFReport,
  confirmReportRead,
  getAvailableReports,
  deleteReport
};