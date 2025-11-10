// Simple in-memory database service for testing without MongoDB
const {
  sampleUsers,
  sampleGroups,
  sampleSubjects,
  sampleSemesters,
  sampleGrades,
  sampleReports,
  sampleReadReceipts,
  sampleGradeHistory
} = require('../sampleData');

class SimpleDbService {
  constructor() {
    this.isMongoAvailable = false;
    this.data = {
      users: [...sampleUsers],
      groups: [...sampleGroups],
      subjects: [...sampleSubjects],
      semesters: [...sampleSemesters],
      grades: [...sampleGrades],
      reports: [...sampleReports],
      readReceipts: [...sampleReadReceipts],
      gradeHistory: [...sampleGradeHistory]
    };
  }

  // User operations
  async findUserById(id) {
    return this.data.users.find(u => u._id === id) || null;
  }

  async findUserByEmail(email) {
    return this.data.users.find(u => u.email === email) || null;
  }

  async findUsers(filter = {}) {
    let users = [...this.data.users];

    if (filter.rol) {
      users = users.filter(u => u.rol && u.rol.some(r => filter.rol.includes(r)));
    }

    if (filter.activo !== undefined) {
      users = users.filter(u => u.activo === filter.activo);
    }

    return users;
  }

  // Grade operations
  async findGrades(filter = {}) {
    let grades = [...this.data.grades];

    if (filter.student_id) {
      grades = grades.filter(g => g.student_id === filter.student_id);
    }

    if (filter.teacher_id) {
      grades = grades.filter(g => g.teacher_id === filter.teacher_id);
    }

    if (filter.group_id) {
      grades = grades.filter(g => g.group_id === filter.group_id);
    }

    if (filter.subject_id) {
      grades = grades.filter(g => g.subject_id === filter.subject_id);
    }

    if (filter.semester_id) {
      grades = grades.filter(g => g.semester_id === filter.semester_id);
    }

    return grades;
  }

  async createGrade(gradeData) {
    const newGrade = {
      _id: `grade${Date.now()}`,
      ...gradeData,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.data.grades.push(newGrade);
    return newGrade;
  }

  async updateGrade(id, updateData) {
    const index = this.data.grades.findIndex(g => g._id === id);
    if (index === -1) return null;

    this.data.grades[index] = {
      ...this.data.grades[index],
      ...updateData,
      updated_at: new Date()
    };

    return this.data.grades[index];
  }

  async deleteGrade(id) {
    const index = this.data.grades.findIndex(g => g._id === id);
    if (index === -1) return false;

    this.data.grades.splice(index, 1);
    return true;
  }

  // Report operations
  async findReports(filter = {}) {
    let reports = [...this.data.reports];

    if (filter.student_id) {
      reports = reports.filter(r => r.student_id === filter.student_id);
    }

    if (filter.report_type) {
      reports = reports.filter(r => r.report_type === filter.report_type);
    }

    if (filter.semester_id) {
      reports = reports.filter(r => r.semester_id === filter.semester_id);
    }

    if (filter.is_active !== undefined) {
      reports = reports.filter(r => r.is_active === filter.is_active);
    }

    return reports;
  }

  async createReport(reportData) {
    const newReport = {
      _id: `report${Date.now()}`,
      ...reportData,
      generated_at: new Date()
    };
    this.data.reports.push(newReport);
    return newReport;
  }

  async updateReport(id, updateData) {
    const index = this.data.reports.findIndex(r => r._id === id);
    if (index === -1) return null;

    this.data.reports[index] = {
      ...this.data.reports[index],
      ...updateData
    };

    return this.data.reports[index];
  }

  // Read receipt operations
  async findReadReceipts(filter = {}) {
    let receipts = [...this.data.readReceipts];

    if (filter.user_id) {
      receipts = receipts.filter(r => r.user_id === filter.user_id);
    }

    if (filter.report_id) {
      receipts = receipts.filter(r => r.report_id === filter.report_id);
    }

    if (filter.report_type && Array.isArray(filter.report_id)) {
      // Filter by report type if report_id array is provided
      const reports = this.data.reports.filter(r =>
        filter.report_type.includes(r.report_type)
      ).map(r => r._id);
      receipts = receipts.filter(r => reports.includes(r.report_id));
    }

    return receipts;
  }

  async createReadReceipt(receiptData) {
    const newReceipt = {
      _id: `receipt${Date.now()}`,
      ...receiptData,
      read_at: new Date()
    };
    this.data.readReceipts.push(newReceipt);
    return newReceipt;
  }

  // Grade history operations
  async findGradeHistory(filter = {}) {
    let history = [...this.data.gradeHistory];

    if (filter.grade_id) {
      history = history.filter(h => h.grade_id === filter.grade_id);
    }

    return history;
  }

  async createGradeHistory(historyData) {
    const newHistory = {
      _id: `history${Date.now()}`,
      ...historyData,
      changed_at: new Date()
    };
    this.data.gradeHistory.push(newHistory);
    return newHistory;
  }

  // Populate helper
  async populate(data, path) {
    if (!data || !Array.isArray(data)) return data;

    return data.map(item => {
      const populated = { ...item };

      if (path.includes('student_id') && item.student_id) {
        populated.student_id = this.data.users.find(u => u._id === item.student_id);
      }

      if (path.includes('teacher_id') && item.teacher_id) {
        populated.teacher_id = this.data.users.find(u => u._id === item.teacher_id);
      }

      if (path.includes('group_id') && item.group_id) {
        populated.group_id = this.data.groups.find(g => g._id === item.group_id);
      }

      if (path.includes('subject_id') && item.subject_id) {
        populated.subject_id = this.data.subjects.find(s => s._id === item.subject_id);
      }

      if (path.includes('semester_id') && item.semester_id) {
        populated.semester_id = this.data.semesters.find(s => s._id === item.semester_id);
      }

      return populated;
    });
  }

  // Helper methods for specific queries
  async getGradesByGroup(groupId, semesterId, subjectId) {
    let grades = this.data.grades.filter(g => g.group_id === groupId);

    if (semesterId) {
      grades = grades.filter(g => g.semester_id === semesterId);
    }

    if (subjectId) {
      grades = grades.filter(g => g.subject_id === subjectId);
    }

    return this.populate(grades, 'student_id,teacher_id,subject_id,semester_id');
  }

  async getStudentGrades(studentId, semesterId) {
    let grades = this.data.grades.filter(g => g.student_id === studentId);

    if (semesterId) {
      grades = grades.filter(g => g.semester_id === semesterId);
    }

    return this.populate(grades, 'teacher_id,subject_id,semester_id');
  }

  async getGroupStudents(groupId) {
    const group = this.data.groups.find(g => g._id === groupId);
    if (!group || !group.estudiantes) return [];

    return this.data.users.filter(u =>
      group.estudiantes.includes(u._id)
    );
  }

  async getAvailableReports(studentId) {
    const reports = this.data.reports.filter(r =>
      r.student_id === studentId && r.is_active
    );

    return Promise.all(reports.map(async report => {
      const receipt = this.data.readReceipts.find(r =>
        r.report_id === report._id && r.user_id === studentId
      );

      return {
        ...report,
        is_read: !!receipt,
        read_at: receipt ? receipt.read_at : null
      };
    }));
  }

  async getReceiptStats(userId) {
    const userReceipts = this.data.readReceipts.filter(r => r.user_id === userId);
    const totalReceipts = userReceipts.length;

    // Group by report type
    const receiptsByType = [];
    const typeCounts = {};

    userReceipts.forEach(receipt => {
      const report = this.data.reports.find(r => r._id === receipt.report_id);
      if (report) {
        if (!typeCounts[report.report_type]) {
          typeCounts[report.report_type] = 0;
        }
        typeCounts[report.report_type]++;
      }
    });

    Object.entries(typeCounts).forEach(([type, count]) => {
      receiptsByType.push({ type, count });
    });

    // Group by month
    const receiptsByMonth = [];
    const monthCounts = {};

    userReceipts.forEach(receipt => {
      const date = new Date(receipt.read_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = 0;
      }
      monthCounts[monthKey]++;
    });

    Object.entries(monthCounts).forEach(([month, count]) => {
      receiptsByMonth.push({ month, count });
    });

    return {
      total_receipts: totalReceipts,
      receipts_by_type: receiptsByType,
      receipts_by_month: receiptsByMonth
    };
  }

  // Subject operations
  async getSubjects() {
    return this.data.subjects;
  }

  // Semester operations
  async getSemesters() {
    return this.data.semesters;
  }

  async getCurrentSemester() {
    return this.data.semesters.find(s => s.is_current);
  }
}

module.exports = new SimpleDbService();