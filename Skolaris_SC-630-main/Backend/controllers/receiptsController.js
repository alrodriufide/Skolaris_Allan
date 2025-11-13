const ReadReceipt = require('../models/readReceiptModel');
const Report = require('../models/reportModel');
const Usuario = require('../models/usuarioModel');
const moment = require('moment');

const getReadReceipts = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesting_user = req.user.id;
    const { report_type, date_from, date_to, page = 1, limit = 20 } = req.query;

    if (requesting_user !== userId && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these receipts'
      });
    }

    let query = { user_id: userId };

    if (report_type || date_from || date_to) {
      const reportQuery = {};

      if (report_type) {
        reportQuery.report_type = report_type;
      }

      const reports = await Report.find(reportQuery).select('_id');
      const reportIds = reports.map(r => r._id);

      if (reportIds.length > 0) {
        query.report_id = { $in: reportIds };
      } else {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            current_page: parseInt(page),
            total_pages: 0,
            total_records: 0
          }
        });
      }
    }

    if (date_from || date_to) {
      query.read_at = {};
      if (date_from) {
        query.read_at.$gte = new Date(date_from);
      }
      if (date_to) {
        query.read_at.$lte = new Date(date_to);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const receipts = await ReadReceipt.find(query)
      .populate({
        path: 'report_id',
        populate: [
          { path: 'semester_id', select: 'name year' },
          { path: 'student_id', select: 'nombre apellido' }
        ]
      })
      .sort({ read_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReadReceipt.countDocuments(query);

    const formattedReceipts = receipts.map(receipt => ({
      id: receipt._id,
      report_type: receipt.report_id?.report_type || 'Unknown',
      semester: receipt.report_id?.semester_id ?
        `${receipt.report_id.semester_id.name} ${receipt.report_id.semester_id.year}` : 'Unknown',
      student_name: receipt.report_id?.student_id ?
        `${receipt.report_id.student_id.nombre} ${receipt.report_id.student_id.apellido}` : 'Unknown',
      read_at: receipt.read_at,
      ip_address: receipt.ip_address,
      confirmation_method: receipt.confirmation_method,
      user_agent: receipt.user_agent ? receipt.user_agent.substring(0, 100) : null
    }));

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
    const { ip_address, user_agent } = req;
    const { confirmation_method = 'electronic' } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    if (report.student_id.toString() !== user_id && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark this report as read'
      });
    }

    let receipt = await ReadReceipt.findOne({
      report_id: reportId,
      user_id: user_id
    });

    if (receipt) {
      receipt.read_at = new Date();
      receipt.ip_address = ip_address;
      receipt.user_agent = user_agent;
      receipt.confirmation_method = confirmation_method;
      await receipt.save();
    } else {
      receipt = new ReadReceipt({
        report_id: reportId,
        user_id: user_id,
        ip_address: ip_address,
        user_agent: user_agent,
        confirmation_method: confirmation_method
      });
      await receipt.save();
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

    const receipt = await ReadReceipt.findById(receiptId)
      .populate({
        path: 'report_id',
        populate: [
          { path: 'semester_id', select: 'name year start_date end_date' },
          { path: 'student_id', select: 'nombre apellido email grado' }
        ]
      })
      .populate('user_id', 'nombre apellido email');

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (receipt.user_id._id.toString() !== requesting_user && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this receipt'
      });
    }

    const formattedReceipt = {
      id: receipt._id,
      report: {
        id: receipt.report_id._id,
        type: receipt.report_id.report_type,
        semester: receipt.report_id.semester_id ?
          `${receipt.report_id.semester_id.name} ${receipt.report_id.semester_id.year}` : 'Unknown',
        generated_at: receipt.report_id.generated_at,
        expires_at: receipt.report_id.expires_at
      },
      user: {
        id: receipt.user_id._id,
        name: `${receipt.user_id.nombre} ${receipt.user_id.apellido}`,
        email: receipt.user_id.email
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

    if (requesting_user !== userId && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these statistics'
      });
    }

    const totalReceipts = await ReadReceipt.countDocuments({ user_id: userId });

    const receiptsByType = await ReadReceipt.aggregate([
      { $match: { user_id: new require('mongoose').Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'reports',
          localField: 'report_id',
          foreignField: '_id',
          as: 'report'
        }
      },
      { $unwind: '$report' },
      {
        $group: {
          _id: '$report.report_type',
          count: { $sum: 1 }
        }
      }
    ]);

    const receiptsByMonth = await ReadReceipt.aggregate([
      { $match: { user_id: new require('mongoose').Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: '$read_at' },
            month: { $month: '$read_at' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const stats = {
      total_receipts: totalReceipts,
      receipts_by_type: receiptsByType.map(item => ({
        type: item._id,
        count: item.count
      })),
      receipts_by_month: receiptsByMonth.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        count: item.count
      }))
    };

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

    if (requesting_user !== userId && !req.user.rol.includes('Admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to export these receipts'
      });
    }

    let query = { user_id: userId };

    if (report_type || date_from || date_to) {
      const reportQuery = {};

      if (report_type) {
        reportQuery.report_type = report_type;
      }

      const reports = await Report.find(reportQuery).select('_id');
      const reportIds = reports.map(r => r._id);

      if (reportIds.length > 0) {
        query.report_id = { $in: reportIds };
      } else {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No receipts found matching criteria'
        });
      }
    }

    if (date_from || date_to) {
      query.read_at = {};
      if (date_from) {
        query.read_at.$gte = new Date(date_from);
      }
      if (date_to) {
        query.read_at.$lte = new Date(date_to);
      }
    }

    const receipts = await ReadReceipt.find(query)
      .populate({
        path: 'report_id',
        populate: [
          { path: 'semester_id', select: 'name year' },
          { path: 'student_id', select: 'nombre apellido' }
        ]
      })
      .sort({ read_at: -1 });

    const formattedReceipts = receipts.map(receipt => ({
      id: receipt._id,
      report_type: receipt.report_id?.report_type || 'Unknown',
      semester: receipt.report_id?.semester_id ?
        `${receipt.report_id.semester_id.name} ${receipt.report_id.semester_id.year}` : 'Unknown',
      student_name: receipt.report_id?.student_id ?
        `${receipt.report_id.student_id.nombre} ${receipt.report_id.student_id.apellido}` : 'Unknown',
      read_at: receipt.read_at,
      ip_address: receipt.ip_address,
      confirmation_method: receipt.confirmation_method
    }));

    if (format === 'csv') {
      const csvHeader = 'Report Type,Semester,Student Name,Read At,IP Address,Confirmation Method\n';
      const csvData = formattedReceipts.map(r =>
        `"${r.report_type}","${r.semester}","${r.student_name}","${moment(r.read_at).format('YYYY-MM-DD HH:mm:ss')}","${r.ip_address || ''}","${r.confirmation_method}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="receipts_${userId}.csv"`);
      res.send(csvHeader + csvData);
    } else {
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