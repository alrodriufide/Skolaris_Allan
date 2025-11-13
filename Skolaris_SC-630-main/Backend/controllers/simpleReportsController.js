const simpleDbService = require('../services/simpleDbService');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const generateSemesterReport = async (req, res) => {
  try {
    const { studentId, semesterId } = req.body;
    const requesting_user = req.user.id;

    // Get student info
    const student = await simpleDbService.findUserById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Authorization check
    if (requesting_user !== studentId && !req.user.rol.includes('Admin') && !req.user.rol.includes('Docente')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate this report'
      });
    }

    // Get grades for the semester
    const grades = await simpleDbService.getStudentGrades(studentId, semesterId);

    // Get semester info
    const semesters = await simpleDbService.getSemesters();
    const semester = semesters.find(s => s._id === semesterId);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found'
      });
    }

    // Calculate statistics
    const validGrades = grades.filter(g => g.grade_value !== null && g.grade_value !== undefined);
    const totalGrades = grades.length;
    const average = validGrades.length > 0
      ? (validGrades.reduce((sum, g) => sum + g.grade_value, 0) / validGrades.length).toFixed(2)
      : 0;

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
        teacher: grade.teacher_id?.nombre || 'N/A',
        created_at: grade.created_at
      })),
      generated_at: new Date(),
      total_grades: totalGrades,
      average_grade: average
    };

    // Check if report already exists
    const existingReports = await simpleDbService.findReports({
      student_id: studentId,
      semester_id: semesterId,
      report_type: 'grades',
      is_active: true
    });

    let report;
    if (existingReports.length > 0) {
      // Update existing report
      report = existingReports[0];
      report = await simpleDbService.updateReport(report._id, {
        report_data: report_data,
        generated_at: new Date(),
        expires_at: moment().add(30, 'days').toDate()
      });
    } else {
      // Create new report
      report = await simpleDbService.createReport({
        student_id: studentId,
        report_type: 'grades',
        semester_id: semesterId,
        report_data: report_data,
        expires_at: moment().add(30, 'days').toDate(),
        is_active: true
      });
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

    // Get report
    const reports = await simpleDbService.findReports({ _id: reportId });

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];

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

    // Authorization check
    if (requesting_user !== report.student_id && !req.user.rol.includes('Admin') && !req.user.rol.includes('Docente')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this report'
      });
    }

    // Generate PDF
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    // Create a promise to handle PDF generation
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Add content to PDF
      doc.fontSize(20).text('Academic Report', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text(`Student: ${report.report_data.student.nombre} ${report.report_data.student.apellido}`);
      doc.text(`Grade: ${report.report_data.student.grado}`);
      doc.text(`Email: ${report.report_data.student.email}`);
      doc.moveDown();

      doc.text(`Semester: ${report.report_data.semester.name} ${report.report_data.semester.year}`);
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

      doc.moveDown();
      doc.fontSize(10).text('This is an official academic report generated by the Skolaris system.', { align: 'center' });
      doc.text(`Generated on ${moment().format('YYYY-MM-DD HH:mm')}`, { align: 'center' });

      doc.end();
    });

    const pdfData = await pdfPromise;

    // Generate filename
    const filename = `report_${report.report_data.student.nombre}_${report.report_data.student.apellido}_${report.report_data.semester.name}_${report.report_data.semester.year}.pdf`;

    // Set headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfData);

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

    // Get report
    const reports = await simpleDbService.findReports({ _id: reportId });

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];

    // Authorization check
    if (report.student_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this report'
      });
    }

    // Check if receipt already exists
    const existingReceipts = await simpleDbService.findReadReceipts({
      report_id: reportId,
      user_id: user_id
    });

    if (existingReceipts.length > 0) {
      return res.status(200).json({
        success: false,
        message: 'Report already confirmed as read'
      });
    }

    // Create read receipt
    const readReceipt = await simpleDbService.createReadReceipt({
      report_id: reportId,
      user_id: user_id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.get('User-Agent') || 'Unknown',
      confirmation_method: 'checkbox'
    });

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

    // Authorization check
    if (requesting_user !== studentId && !req.user.rol.includes('Admin') && !req.user.rol.includes('Docente')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these reports'
      });
    }

    const reports = await simpleDbService.getAvailableReports(studentId);

    res.status(200).json({
      success: true,
      data: reports
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

    // Get report
    const reports = await simpleDbService.findReports({ _id: reportId });

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    const report = reports[0];

    // Authorization check
    if (!req.user.rol.includes('Admin') && requesting_user !== report.student_id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this report'
      });
    }

    // Deactivate report
    const updatedReport = await simpleDbService.updateReport(reportId, {
      is_active: false
    });

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