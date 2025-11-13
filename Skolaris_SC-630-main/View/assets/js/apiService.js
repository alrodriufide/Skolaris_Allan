class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.token = localStorage.getItem('token');
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    if (typeof axios !== 'undefined') {
      axios.interceptors.request.use(
        (config) => {
          if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      axios.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            this.logout();
            window.location.href = 'inicio_sesion.html';
          }
          return Promise.reject(error);
        }
      );
    }
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken() {
    return this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(method, endpoint, data = null, params = null) {
    const config = {
      method,
      headers: this.getAuthHeaders(),
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          url.searchParams.append(key, params[key]);
        }
      });
    }

    try {
      const response = await fetch(url.toString(), config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Grades API Methods
  async registerGrades(gradesData) {
    return this.request('POST', '/grades/register', { grades: gradesData });
  }

  async modifyGrades(gradeId, gradeData) {
    return this.request('PUT', `/grades/modify/${gradeId}`, gradeData);
  }

  async getStudentGrades(studentId, semesterId = null) {
    const params = semesterId ? { semester_id: semesterId } : null;
    return this.request('GET', `/grades/student/${studentId}`, null, params);
  }

  async getGradesByGroup(groupId, semesterId = null, subjectId = null) {
    const params = {};
    if (semesterId) params.semester_id = semesterId;
    if (subjectId) params.subject_id = subjectId;
    return this.request('GET', `/grades/group/${groupId}`, null, params);
  }

  async getGradesBySemester(semesterId, studentId = null) {
    const params = studentId ? { student_id: studentId } : null;
    return this.request('GET', `/grades/semester/${semesterId}`, null, params);
  }

  async getGradeHistory(gradeId) {
    return this.request('GET', `/grades/${gradeId}/history`);
  }

  async deleteGrade(gradeId) {
    return this.request('DELETE', `/grades/${gradeId}`);
  }

  // Reports API Methods
  async generateSemesterReport(studentId, semesterId) {
    return this.request('POST', '/reports/generate', { studentId, semesterId });
  }

  async generatePDFReport(reportId) {
    const config = {
      method: 'GET',
      headers: this.getAuthHeaders(),
    };

    try {
      const response = await fetch(`${this.baseURL}/reports/download/${reportId}`, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  }

  async confirmReportRead(reportId) {
    return this.request('POST', '/reports/confirm', { reportId });
  }

  async getAvailableReports(studentId) {
    return this.request('GET', `/reports/student/${studentId}`);
  }

  async deleteReport(reportId) {
    return this.request('DELETE', `/reports/${reportId}`);
  }

  // Receipts API Methods
  async getReadReceipts(userId, filters = {}) {
    return this.request('GET', `/receipts/user/${userId}`, null, filters);
  }

  async markAsRead(reportId, confirmationMethod = 'electronic') {
    return this.request('POST', '/receipts/mark', {
      reportId,
      confirmation_method: confirmationMethod
    });
  }

  async getReceiptDetails(receiptId) {
    return this.request('GET', `/receipts/details/${receiptId}`);
  }

  async getReceiptStats(userId) {
    return this.request('GET', `/receipts/stats/${userId}`);
  }

  async exportReceipts(userId, format = 'json', filters = {}) {
    return this.request('GET', `/receipts/export/${userId}`, null, { ...filters, format });
  }

  // User API Methods
  async getUserInfo() {
    return this.request('GET', '/usuarios/profile');
  }

  async updateUser(userData) {
    return this.request('PUT', '/usuarios/profile', userData);
  }

  // Groups API Methods
  async getTeacherGroups(teacherId) {
    return this.request('GET', `/grupos/teacher/${teacherId}`);
  }

  async getGroupStudents(groupId) {
    return this.request('GET', `/grupos/${groupId}/students`);
  }

  // Subjects API Methods
  async getSubjects() {
    return this.request('GET', '/materias');
  }

  async getSubject(subjectId) {
    return this.request('GET', `/materias/${subjectId}`);
  }

  // Semesters API Methods
  async getSemesters() {
    return this.request('GET', '/semesters');
  }

  async getCurrentSemester() {
    return this.request('GET', '/semesters/current');
  }

  // Utility Methods
  async uploadFile(file, endpoint = '/upload') {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      method: 'POST',
      headers: {},
      body: formData,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async validateToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.request('GET', '/auth/validate');
      return response.success;
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
      return false;
    }
  }

  // Cache Management
  cache = new Map();

  async cachedRequest(method, endpoint, data = null, cacheKey = null, cacheDuration = 300000) {
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheDuration) {
        return cached.data;
      }
    }

    const result = await this.request(method, endpoint, data);

    if (cacheKey) {
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }

    return result;
  }

  clearCache() {
    this.cache.clear();
  }

  // Error Handling
  handleApiError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);

    if (error.message) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return defaultMessage;
  }

  // Retry Logic
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        }
      }
    }

    throw lastError;
  }
}

// Create global instance
window.apiService = new ApiService();

// Make it available for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
}