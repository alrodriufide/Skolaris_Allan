const simpleDbService = require('../services/simpleDbService');
const moment = require('moment');

const getReadReceipts = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesting_user = req.user.id;
    const { report_type, date_from, date_to, page = 1, limit = 20 } = req.query;

    // Authorization check
    if (requesting_user !== userId && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these receipts'
      });
    }

    // Get receipts
    let receipts = await simpleDbService.findReadReceipts({
      user_id: userId
    });

    // Apply filters
    if (report_type || date_from || date_to) {
      if (report_type) {
        const reports = await simpleDbService.findReports({
          report_type: report_type,
          is_active: true
        });
        const reportIds = reports.map(r => r._id);
        receipts = receipts.filter(r => reportIds.includes(r.report_id));
      }

      if (date_from || date_to) {
        const fromDate = date_from ? new Date(date_from) : new Date('1900-01-01');
        const toDate = date_to ? new Date(date_to) : new Date('2100-12-31');
        receipts = receipts.filter(r => {
          const readAt = new Date(r.read_at);
          return readAt >= fromDate && readAt <= toDate;
        });
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = receipts.length;
    const paginatedReceipts = receipts.slice(skip, skip + parseInt(limit));

    // Format receipts
    const formattedReceipts = paginatedReceipts.map(receipt => {
      const report = simpleDbService.data.reports.find(r => r._id === receipt.report_id);
      const semester = report ? simpleDbService.data.semesters.find(s => s._id === report.semester_id) : null;

      return {
        id: receipt._id,
        report_type: report?.report_type || 'Unknown',
        semester: semester ? `${semester.name} ${semester.year}` : 'Unknown',
        student_name: report?.report_data?.student ?
          `${report.report_data.student.nombre} ${report.report_data.student.apellido}` : 'Unknown',
        read_at: receipt.read_at,
        ip_address: receipt.ip_address,
        confirmation_method: receipt.confirmation_method,
        user_agent: receipt.user_agent ? receipt.user_agent.substring(0, 100) : null
      };
    });

    res.status(200).json({
      success: true,
      data: formattedReceipts,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_records: total
      }
    });

  } catch (error) {
    console.error('Error getting read receipts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { reportId } = req.body;
    const user_id = req.user.id;
    const { confirmation_method = 'electronic' } = req.body;

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
    if (report.student_id !== user_id && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this report as read'
      });
    }

    // Check if receipt already exists
    const existingReceipts = await simpleDbService.findReadReceipts({
      report_id: reportId,
      user_id: user_id
    });

    let receipt;
    if (existingReceipts.length > 0) {
      // Update existing receipt
      receipt = existingReceipts[0];
      receipt.read_at = new Date();
      receipt.confirmation_method = confirmation_method;
      // In a real DB, we'd update the record
    } else {
      // Create new receipt
      receipt = await simpleDbService.createReadReceipt({
        report_id: reportId,
        user_id: user_id,
        ip_address: req.ip || '127.0.0.1',
        user_agent: req.get('User-Agent') || 'Unknown',
        confirmation_method: confirmation_method
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report marked as read',
      data: receipt
    });

  } catch (error) {
    console.error('Error marking report as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getReceiptDetails = async (req, res) => {
  try {
    const { receiptId } = req.params;
    const requesting_user = req.user.id;

    // Get receipt
    const receipts = await simpleDbService.findReadReceipts({ _id: receiptId });

    if (receipts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    const receipt = receipts[0];

    // Get related data
    const report = simpleDbService.data.reports.find(r => r._id === receipt.report_id);
    const semester = report ? simpleDbService.data.semesters.find(s => s._id === report.semester_id) : null;
    const user = await simpleDbService.findUserById(receipt.user_id);

    // Authorization check
    if (user && receipt.user_id !== requesting_user && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this receipt'
      });
    }

    const formattedReceipt = {
      id: receipt._id,
      report: {
        id: report?._id || 'Unknown',
        type: report?.report_type || 'Unknown',
        semester: semester ? `${semester.name} ${semester.year}` : 'Unknown',
        generated_at: report?.generated_at || new Date(),
        expires_at: report?.expires_at || null
      },
      user: {
        id: user?._id || 'Unknown',
        name: user ? `${user.nombre} ${user.apellido}` : 'Unknown',
        email: user?.email || 'Unknown'
      },
      read_at: receipt.read_at,
      ip_address: receipt.ip_address,
      confirmation_method: receipt.confirmation_method,
      user_agent: receipt.user_agent
    };

    res.status(200).json({
      success: true,
      data: formattedReceipt
    });

  } catch (error) {
    console.error('Error getting receipt details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getReceiptStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesting_user = req.user.id;

    // Authorization check
    if (requesting_user !== userId && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these statistics'
      });
    }

    const stats = await simpleDbService.getReceiptStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting receipt statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const exportReceipts = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesting_user = req.user.id;
    const { format = 'json', report_type, date_from, date_to } = req.query;

    // Authorization check
    if (requesting_user !== userId && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export these receipts'
      });
    }

    // Get receipts
    let receipts = await simpleDbService.findReadReceipts({
      user_id: userId
    });

    // Apply filters
    if (report_type || date_from || date_to) {
      if (report_type) {
        const reports = await simpleDbService.findReports({
          report_type: report_type,
          is_active: true
        });
        const reportIds = reports.map(r => r._id);
        receipts = receipts.filter(r => reportIds.includes(r.report_id));
      }

      if (date_from || date_to) {
        const fromDate = date_from ? new Date(date_from) : new Date('1900-01-01');
        const toDate = date_to ? new Date(date_to) : new Date('2100-12-31');
        receipts = receipts.filter(r => {
          const readAt = new Date(r.read_at);
          return readAt >= fromDate && readAt <= toDate;
        });
      }
    }

    // Format receipts for export
    const formattedReceipts = receipts.map(receipt => {
      const report = simpleDbService.data.reports.find(r => r._id === receipt.report_id);
      const semester = report ? simpleDbService.data.semesters.find(s => s._id === report.semester_id) : null;

      return {
        id: receipt._id,
        report_type: report?.report_type || 'Unknown',
        semester: semester ? `${semester.name} ${semester.year}` : 'Unknown',
        student_name: report?.report_data?.student ?
          `${report.report_data.student.nombre} ${report.report_data.student.apellido}` : 'Unknown',
        read_at: receipt.read_at,
        ip_address: receipt.ip_address,
        confirmation_method: receipt.confirmation_method
      };
    });

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Report Type,Semester,Student Name,Read At,IP Address,Confirmation Method\n';
      const csvData = formattedReceipts.map(r =>
        `"${r.report_type}","${r.semester}","${r.student_name}","${moment(r.read_at).format('YYYY-MM-DD HH:mm:ss')}","${r.ip_address || ''}","${r.confirmation_method}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="receipts_${userId}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        data: formattedReceipts,
        exported_at: new Date(),
        total_records: formattedReceipts.length
      });
    }

  } catch (error) {
    console.error('Error exporting receipts:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getReadReceipts,
  markAsRead,
  getReceiptDetails,
  getReceiptStats,
  exportReceipts
};