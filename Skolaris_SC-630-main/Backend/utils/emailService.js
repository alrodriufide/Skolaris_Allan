const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    this.fromAddress = process.env.EMAIL_FROM || 'noreply@skolaris.edu';
  }

  async sendReportNotification(studentEmail, reportData) {
    try {
      const subject = `Academic Report Available - ${reportData.student.nombre} ${reportData.student.apellido}`;
      const html = this.generateReportNotificationHTML(reportData);

      const mailOptions = {
        from: this.fromAddress,
        to: studentEmail,
        subject: subject,
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Report notification sent to ${studentEmail}`);
      return true;

    } catch (error) {
      console.error('Error sending report notification:', error);
      throw error;
    }
  }

  async sendGradeUpdateNotification(studentEmail, gradeData) {
    try {
      const subject = `Grade Update - ${gradeData.subject}`;
      const html = this.generateGradeUpdateHTML(gradeData);

      const mailOptions = {
        from: this.fromAddress,
        to: studentEmail,
        subject: subject,
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Grade update notification sent to ${studentEmail}`);
      return true;

    } catch (error) {
      console.error('Error sending grade update notification:', error);
      throw error;
    }
  }

  async sendReportWithAttachment(studentEmail, reportData, pdfBuffer) {
    try {
      const studentName = `${reportData.student.nombre} ${reportData.student.apellido}`;
      const semesterInfo = `${reportData.semester.name} ${reportData.semester.year}`;
      const filename = `Academic_Report_${studentName.replace(/\s+/g, '_')}_${semesterInfo.replace(/\s+/g, '_')}.pdf`;

      const mailOptions = {
        from: this.fromAddress,
        to: studentEmail,
        subject: `Academic Report - ${studentName}`,
        html: this.generateReportWithAttachmentHTML(reportData),
        attachments: [
          {
            filename: filename,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Report with attachment sent to ${studentEmail}`);
      return true;

    } catch (error) {
      console.error('Error sending report with attachment:', error);
      throw error;
    }
  }

  async sendConfirmationReminder(studentEmail, reportData) {
    try {
      const subject = `Action Required: Please Confirm Report Review`;
      const html = this.generateConfirmationReminderHTML(reportData);

      const mailOptions = {
        from: this.fromAddress,
        to: studentEmail,
        subject: subject,
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Confirmation reminder sent to ${studentEmail}`);
      return true;

    } catch (error) {
      console.error('Error sending confirmation reminder:', error);
      throw error;
    }
  }

  generateReportNotificationHTML(reportData) {
    const { student, semester, generated_at, average_grade, total_grades } = reportData;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Academic Report Available</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
          .content { margin-bottom: 30px; }
          .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .stats { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Academic Report Available</h1>
            <p>Skolaris Educational System</p>
          </div>

          <div class="content">
            <h2>Hello ${student.nombre} ${student.apellido},</h2>
            <p>Your academic report for <strong>${semester.name} ${semester.year}</strong> is now available for review.</p>

            <div class="stats">
              <h3>Report Summary:</h3>
              <ul>
                <li><strong>Total Subjects:</strong> ${total_grades}</li>
                <li><strong>Overall Average:</strong> ${average_grade}</li>
                <li><strong>Generated:</strong> ${moment(generated_at).format('MMMM DD, YYYY')}</li>
              </ul>
            </div>

            <p>Please log in to your Skolaris account to view the complete report and confirm that you have reviewed it.</p>

            <a href="${process.env.FRONTEND_URL || 'https://skolaris.edu'}/login" class="btn">View Your Report</a>

            <p><strong>Important:</strong> You must confirm that you have reviewed this report to complete the process.</p>
          </div>

          <div class="footer">
            <p>This is an automated message from the Skolaris Educational System.</p>
            <p>If you have questions, please contact your academic advisor.</p>
            <p>&copy; ${new Date().getFullYear()} Skolaris. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateGradeUpdateHTML(gradeData) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Grade Update Notification</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #28a745; padding-bottom: 20px; margin-bottom: 30px; }
          .grade-info { background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📈 Grade Update</h1>
            <p>Skolaris Educational System</p>
          </div>

          <div class="content">
            <h2>Hello,</h2>
            <p>Your grade has been updated. Here are the details:</p>

            <div class="grade-info">
              <h3>Grade Information:</h3>
              <ul>
                <li><strong>Subject:</strong> ${gradeData.subject}</li>
                <li><strong>New Grade:</strong> ${gradeData.grade_value} (${gradeData.grade_scale})</li>
                <li><strong>Teacher:</strong> ${gradeData.teacher}</li>
                <li><strong>Updated:</strong> ${moment(gradeData.updated_at).format('MMMM DD, YYYY [at] h:mm A')}</li>
              </ul>
              ${gradeData.comments ? `<p><strong>Comments:</strong> ${gradeData.comments}</p>` : ''}
            </div>

            <p>Please log in to your Skolaris account to view all your grades and generate reports.</p>
          </div>

          <div class="footer">
            <p>This is an automated message from the Skolaris Educational System.</p>
            <p>&copy; ${new Date().getFullYear()} Skolaris. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateReportWithAttachmentHTML(reportData) {
    const { student, semester, generated_at } = reportData;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Academic Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #17a2b8; padding-bottom: 20px; margin-bottom: 30px; }
          .attachment-notice { background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8; }
          .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Your Academic Report</h1>
            <p>Skolaris Educational System</p>
          </div>

          <div class="content">
            <h2>Hello ${student.nombre} ${student.apellido},</h2>
            <p>Your academic report for <strong>${semester.name} ${semester.year}</strong> is attached to this email.</p>

            <div class="attachment-notice">
              <h3>📎 Attached Document:</h3>
              <p>Your complete academic report has been generated and attached as a PDF file. Please save this document for your records.</p>
              <p><strong>Generated:</strong> ${moment(generated_at).format('MMMM DD, YYYY [at] h:mm A')}</p>
            </div>

            <p>You can also access this report anytime by logging into your Skolaris account.</p>
          </div>

          <div class="footer">
            <p>This is an automated message from the Skolaris Educational System.</p>
            <p>&copy; ${new Date().getFullYear()} Skolaris. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateConfirmationReminderHTML(reportData) {
    const { student, semester, generated_at, expires_at } = reportData;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Action Required: Report Review Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 3px solid #ffc107; padding-bottom: 20px; margin-bottom: 30px; }
          .urgent-notice { background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .btn { display: inline-block; padding: 12px 24px; background-color: #ffc107; color: #212529; text-decoration: none; border-radius: 5px; margin: 10px 0; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Action Required</h1>
            <p>Report Review Confirmation Needed</p>
          </div>

          <div class="content">
            <h2>Hello ${student.nombre} ${student.apellido},</h2>
            <div class="urgent-notice">
              <h3>📋 Please Confirm Report Review</h3>
              <p>You have an academic report waiting for confirmation:</p>
              <ul>
                <li><strong>Period:</strong> ${semester.name} ${semester.year}</li>
                <li><strong>Generated:</strong> ${moment(generated_at).format('MMMM DD, YYYY')}</li>
                ${expires_at ? `<li><strong>Expires:</strong> ${moment(expires_at).format('MMMM DD, YYYY')}</li>` : ''}
              </ul>
            </div>

            <p>Please log in to your Skolaris account to review your report and confirm that you have read it.</p>

            <a href="${process.env.FRONTEND_URL || 'https://skolaris.edu'}/reports" class="btn">Review & Confirm Report</a>

            <p><strong>Why is this important?</strong> Confirming that you have reviewed your report helps ensure academic compliance and keeps your records up to date.</p>
          </div>

          <div class="footer">
            <p>This is an automated reminder from the Skolaris Educational System.</p>
            <p>If you have already confirmed this report, please disregard this message.</p>
            <p>&copy; ${new Date().getFullYear()} Skolaris. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send messages');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();