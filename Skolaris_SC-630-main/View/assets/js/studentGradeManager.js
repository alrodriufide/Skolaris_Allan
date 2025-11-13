class StudentGradeManager {
  constructor() {
    this.currentStudentId = null;
    this.currentSemesterId = null;
    this.grades = [];
    this.semesters = [];
    this.statistics = {};

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadInitialData();
    this.setupEventListeners();
  }

  bindEvents() {
    // Semester navigation buttons
    document.getElementById('btnSemestreAnterior')?.addEventListener('click', () => this.showPreviousSemester());
    document.getElementById('btnVolverActuales')?.addEventListener('click', () => this.showCurrentSemester());

    // Report generation buttons
    document.getElementById('btnGenerarReporte')?.addEventListener('click', () => this.generateReport('current'));
    document.getElementById('btnGenerarReporteAnterior')?.addEventListener('click', () => this.generateReport('previous'));

    // Export buttons
    document.getElementById('exportPDF')?.addEventListener('click', () => this.exportGrades('pdf'));
    document.getElementById('exportExcel')?.addEventListener('click', () => this.exportGrades('excel'));

    // Filter and search
    document.getElementById('subjectFilter')?.addEventListener('change', () => this.filterGrades());
    document.getElementById('searchInput')?.addEventListener('input', () => this.searchGrades());

    // View toggle
    document.getElementById('viewCompact')?.addEventListener('click', () => this.setGradeView('compact'));
    document.getElementById('viewDetailed')?.addEventListener('click', () => this.setGradeView('detailed'));
  }

  async loadInitialData() {
    try {
      this.showLoading(true);

      // Get current student from localStorage or API
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentStudentId = user.id;

      if (!this.currentStudentId) {
        throw new Error('No se pudo identificar al estudiante');
      }

      await Promise.all([
        this.loadSemesters(),
        this.loadCurrentGrades(),
        this.loadStatistics()
      ]);

      this.renderGradeTable();
      this.renderStatistics();

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Error cargando datos iniciales');
    } finally {
      this.showLoading(false);
    }
  }

  async loadSemesters() {
    try {
      const response = await apiService.getSemesters();
      this.semesters = response.data || [];

      // Find current semester
      const currentSemester = this.semesters.find(s => s.is_current);
      this.currentSemesterId = currentSemester ? currentSemester._id : this.semesters[0]?._id;

      this.populateSemesterSelector();
    } catch (error) {
      console.error('Error loading semesters:', error);
      this.semesters = [];
    }
  }

  async loadCurrentGrades() {
    try {
      const response = await apiService.getStudentGrades(this.currentStudentId, this.currentSemesterId);
      this.grades = response.data || [];
    } catch (error) {
      console.error('Error loading current grades:', error);
      this.grades = [];
    }
  }

  async loadPreviousGrades() {
    try {
      const previousSemester = this.getPreviousSemester();
      if (!previousSemester) {
        throw new Error('No hay semestre anterior disponible');
      }

      const response = await apiService.getStudentGrades(this.currentStudentId, previousSemester._id);
      this.previousGrades = response.data || [];
    } catch (error) {
      console.error('Error loading previous grades:', error);
      this.previousGrades = [];
    }
  }

  async loadStatistics() {
    try {
      // Calculate statistics from current grades
      const totalGrades = this.grades.length;
      const validGrades = this.grades.filter(g => g.grade_value !== null && g.grade_value !== undefined);

      if (validGrades.length > 0) {
        const sum = validGrades.reduce((acc, grade) => acc + grade.grade_value, 0);
        const average = sum / validGrades.length;
        const highest = Math.max(...validGrades.map(g => g.grade_value));
        const lowest = Math.min(...validGrades.map(g => g.grade_value));

        this.statistics = {
          total: totalGrades,
          graded: validGrades.length,
          average: average.toFixed(2),
          highest: highest,
          lowest: lowest,
          missing: totalGrades - validGrades.length
        };
      } else {
        this.statistics = {
          total: 0,
          graded: 0,
          average: '0.00',
          highest: 0,
          lowest: 0,
          missing: 0
        };
      }
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  }

  populateSemesterSelector() {
    const selector = document.getElementById('semesterSelector');
    if (!selector) return;

    selector.innerHTML = '';

    this.semesters.forEach(semester => {
      const option = document.createElement('option');
      option.value = semester._id;
      option.textContent = `${semester.name} ${semester.year}`;
      option.selected = semester._id === this.currentSemesterId;
      selector.appendChild(option);
    });

    selector.addEventListener('change', (e) => {
      this.changeSemester(e.target.value);
    });
  }

  renderGradeTable() {
    const tbody = document.querySelector('#calificacionesActuales tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (this.grades.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4">
            <div class="text-muted">
              <i class="fas fa-inbox fa-3x mb-3"></i>
              <p>No hay calificaciones disponibles para este semestre</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    this.grades.forEach(grade => {
      const row = this.createGradeRow(grade);
      tbody.appendChild(row);
    });

    this.setupGradeInteractions();
  }

  createGradeRow(grade) {
    const row = document.createElement('tr');

    const gradeClass = this.getGradeClass(grade.grade_value);
    const gradeDisplay = grade.grade_value !== null && grade.grade_value !== undefined
      ? `${grade.grade_value} <span class="badge ${gradeClass} ms-2">${this.getGradeLetter(grade.grade_value)}</span>`
      : '<span class="text-muted">No disponible</span>';

    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <i class="fas fa-book me-2 text-primary"></i>
          <div>
            <div class="fw-bold">${grade.subject_id?.nombre || 'Materia'}</div>
            <small class="text-muted">Prof: ${grade.teacher_id ? `${grade.teacher_id.nombre} ${grade.teacher_id.apellido}` : 'N/A'}</small>
          </div>
        </div>
      </td>
      <td class="text-center">
        <div class="grade-value ${gradeClass}">
          ${gradeDisplay}
        </div>
      </td>
      <td>
        <div class="comments-section">
          ${grade.comments ?
            `<div class="comment-bubble">
              <i class="fas fa-comment me-1"></i>
              <span>${grade.comments}</span>
            </div>` :
            '<span class="text-muted">Sin comentarios</span>'
          }
        </div>
      </td>
      <td>
        <div class="actions">
          <button class="btn btn-sm btn-outline-primary" onclick="studentGradeManager.viewGradeDetails('${grade._id}')" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success" onclick="studentGradeManager.generateSubjectReport('${grade._id}')" title="Generar reporte de esta materia">
            <i class="fas fa-file-pdf"></i>
          </button>
        </div>
      </td>
    `;

    return row;
  }

  getGradeClass(grade) {
    if (grade === null || grade === undefined) return 'bg-secondary';
    if (grade >= 90) return 'bg-success';
    if (grade >= 80) return 'bg-primary';
    if (grade >= 70) return 'bg-info';
    if (grade >= 60) return 'bg-warning';
    return 'bg-danger';
  }

  getGradeLetter(grade) {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  }

  renderStatistics() {
    this.updateStatisticsCard();
    this.renderProgressChart();
    this.renderGradeDistribution();
  }

  updateStatisticsCard() {
    const elements = {
      'statAverage': this.statistics.average,
      'statTotal': this.statistics.total,
      'statGraded': this.statistics.graded,
      'statMissing': this.statistics.missing
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  renderProgressChart() {
    const container = document.getElementById('progressChart');
    if (!container) return;

    const percentage = this.statistics.total > 0
      ? (this.statistics.graded / this.statistics.total) * 100
      : 0;

    container.innerHTML = `
      <div class="progress-container">
        <div class="d-flex justify-content-between mb-2">
          <span>Progreso de calificaciones</span>
          <span class="fw-bold">${percentage.toFixed(1)}%</span>
        </div>
        <div class="progress">
          <div class="progress-bar bg-success" role="progressbar" style="width: ${percentage}%"></div>
        </div>
        <small class="text-muted">${this.statistics.graded} de ${this.statistics.total} materias calificadas</small>
      </div>
    `;
  }

  renderGradeDistribution() {
    const container = document.getElementById('gradeDistribution');
    if (!container) return;

    const distribution = this.calculateGradeDistribution();

    container.innerHTML = `
      <h6 class="mb-3">Distribución de calificaciones</h6>
      <div class="grade-bars">
        ${distribution.map(item => `
          <div class="grade-bar-item">
            <div class="d-flex justify-content-between mb-1">
              <span>${item.range}</span>
              <span class="badge bg-secondary">${item.count}</span>
            </div>
            <div class="progress" style="height: 20px;">
              <div class="progress-bar ${item.color}" role="progressbar" style="width: ${item.percentage}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  calculateGradeDistribution() {
    const ranges = [
      { min: 90, max: 100, label: '90-100 (A)', color: 'bg-success' },
      { min: 80, max: 89, label: '80-89 (B)', color: 'bg-primary' },
      { min: 70, max: 79, label: '70-79 (C)', color: 'bg-info' },
      { min: 60, max: 69, label: '60-69 (D)', color: 'bg-warning' },
      { min: 0, max: 59, label: '0-59 (F)', color: 'bg-danger' }
    ];

    const distribution = ranges.map(range => {
      const count = this.grades.filter(g =>
        g.grade_value !== null &&
        g.grade_value >= range.min &&
        g.grade_value <= range.max
      ).length;

      return {
        range: range.label,
        count: count,
        color: range.color,
        percentage: this.statistics.total > 0 ? (count / this.statistics.total) * 100 : 0
      };
    });

    return distribution;
  }

  async showCurrentSemester() {
    document.getElementById('calificacionesActuales').classList.remove('d-none');
    document.getElementById('calificacionesAnteriores').classList.add('d-none');

    await this.loadCurrentGrades();
    this.renderGradeTable();
  }

  async showPreviousSemester() {
    document.getElementById('calificacionesActuales').classList.add('d-none');
    document.getElementById('calificacionesAnteriores').classList.remove('d-none');

    await this.loadPreviousGrades();
    this.renderPreviousGradeTable();
  }

  renderPreviousGradeTable() {
    const tbody = document.querySelector('#calificacionesAnteriores tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!this.previousGrades || this.previousGrades.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="text-center py-4">
            <div class="text-muted">
              <i class="fas fa-inbox fa-3x mb-3"></i>
              <p>No hay calificaciones disponibles para el semestre anterior</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    this.previousGrades.forEach(grade => {
      const row = this.createPreviousGradeRow(grade);
      tbody.appendChild(row);
    });
  }

  createPreviousGradeRow(grade) {
    const row = document.createElement('tr');
    const gradeClass = this.getGradeClass(grade.grade_value);
    const gradeDisplay = grade.grade_value !== null && grade.grade_value !== undefined
      ? `${grade.grade_value} <span class="badge ${gradeClass} ms-2">${this.getGradeLetter(grade.grade_value)}</span>`
      : '<span class="text-muted">No disponible</span>';

    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <i class="fas fa-book me-2 text-primary"></i>
          <div>
            <div class="fw-bold">${grade.subject_id?.nombre || 'Materia'}</div>
            <small class="text-muted">Prof: ${grade.teacher_id ? `${grade.teacher_id.nombre} ${grade.teacher_id.apellido}` : 'N/A'}</small>
          </div>
        </div>
      </td>
      <td class="text-center">
        <div class="grade-value ${gradeClass}">
          ${gradeDisplay}
        </div>
      </td>
      <td>
        <div class="comments-section">
          ${grade.comments ?
            `<div class="comment-bubble">
              <i class="fas fa-comment me-1"></i>
              <span>${grade.comments}</span>
            </div>` :
            '<span class="text-muted">Sin comentarios</span>'
          }
        </div>
      </td>
    `;

    return row;
  }

  async generateReport(type) {
    try {
      this.showLoading(true);

      const semesterId = type === 'current' ? this.currentSemesterId : this.getPreviousSemester()._id;

      const response = await apiService.generateSemesterReport(this.currentStudentId, semesterId);

      if (response.success) {
        // Generate and download PDF
        const pdfBlob = await apiService.generatePDFReport(response.data._id);
        const filename = this.generateReportFilename(type);
        apiService.downloadFile(pdfBlob, filename);

        // Show success message
        this.showSuccess('Reporte generado exitosamente');

        // Update available reports
        await this.updateAvailableReports();
      } else {
        throw new Error(response.message || 'Error generando reporte');
      }

    } catch (error) {
      console.error('Error generating report:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  generateReportFilename(type) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const studentName = `${user.nombre}_${user.apellido}`.replace(/\s+/g, '_');
    const semesterName = type === 'current' ? 'Actual' : 'Anterior';
    return `Reporte_Calificaciones_${studentName}_${semesterName}.pdf`;
  }

  async generateSubjectReport(gradeId) {
    try {
      this.showLoading(true);

      const grade = this.grades.find(g => g._id === gradeId);
      if (!grade) {
        throw new Error('Calificación no encontrada');
      }

      // Generate a focused report for this specific subject
      const reportData = {
        student: {
          nombre: grade.student_id?.nombre || 'Estudiante',
          apellido: grade.student_id?.apellido || '',
          email: grade.student_id?.email || ''
        },
        subject: {
          nombre: grade.subject_id?.nombre || 'Materia',
          grade: grade.grade_value,
          comments: grade.comments,
          teacher: grade.teacher_id ? `${grade.teacher_id.nombre} ${grade.teacher_id.apellido}` : 'N/A'
        },
        generated_at: new Date()
      };

      // Create PDF using jsPDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Add content to PDF
      doc.setFontSize(16);
      doc.text('Reporte de Materia', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Materia: ${reportData.subject.nombre}`, 20, 40);
      doc.text(`Calificación: ${reportData.subject.grade || 'N/A'}`, 20, 50);
      doc.text(`Profesor: ${reportData.subject.teacher}`, 20, 60);

      if (reportData.subject.comments) {
        doc.text('Comentarios:', 20, 70);
        const splitComments = doc.splitTextToSize(reportData.subject.comments, 170);
        doc.text(splitComments, 20, 80);
      }

      doc.text(`Generado: ${moment(reportData.generated_at).format('YYYY-MM-DD HH:mm')}`, 20, 120);

      // Download the PDF
      const filename = `Reporte_${reportData.subject.nombre.replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);

      this.showSuccess('Reporte de materia generado exitosamente');

    } catch (error) {
      console.error('Error generating subject report:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  async exportGrades(format) {
    try {
      this.showLoading(true);

      if (format === 'pdf') {
        await this.exportToPDF();
      } else if (format === 'excel') {
        await this.exportToExcel();
      }

    } catch (error) {
      console.error('Error exporting grades:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  async exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text('Reporte de Calificaciones', 105, 20, { align: 'center' });

    // Add student info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    doc.setFontSize(12);
    doc.text(`Estudiante: ${user.nombre} ${user.apellido}`, 20, 35);
    doc.text(`Semestre: ${this.getCurrentSemesterName()}`, 20, 45);
    doc.text(`Generado: ${moment().format('YYYY-MM-DD HH:mm')}`, 20, 55);

    // Add grades table
    let yPosition = 70;
    doc.text('Materias:', 20, yPosition);
    yPosition += 10;

    this.grades.forEach(grade => {
      const subjectName = grade.subject_id?.nombre || 'Materia';
      const gradeValue = grade.grade_value !== null && grade.grade_value !== undefined
        ? grade.grade_value.toString()
        : 'N/A';
      const comments = grade.comments || '';

      doc.text(`${subjectName}: ${gradeValue}`, 25, yPosition);
      yPosition += 7;

      if (comments) {
        const splitComments = doc.splitTextToSize(comments, 165);
        doc.text(splitComments, 30, yPosition);
        yPosition += splitComments.length * 5;
      }

      yPosition += 3;
    });

    // Add statistics
    yPosition += 10;
    doc.text('Estadísticas:', 20, yPosition);
    yPosition += 7;
    doc.text(`Promedio: ${this.statistics.average}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Total materias: ${this.statistics.total}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Calificadas: ${this.statistics.graded}`, 25, yPosition);

    // Save the PDF
    const filename = `Calificaciones_${user.nombre}_${user.apellido}_${moment().format('YYYY-MM-DD')}.pdf`;
    doc.save(filename);
  }

  async exportToExcel() {
    // Create CSV content
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    let csvContent = '\ufeff'; // BOM for UTF-8

    // Add header
    csvContent += `Reporte de Calificaciones - ${user.nombre} ${user.apellido}\n`;
    csvContent += `Semestre: ${this.getCurrentSemesterName()}\n`;
    csvContent += `Generado: ${moment().format('YYYY-MM-DD HH:mm')}\n\n`;

    // Add table header
    csvContent += 'Materia,Calificación,Comentarios,Profesor\n';

    // Add grades data
    this.grades.forEach(grade => {
      const subjectName = grade.subject_id?.nombre || 'Materia';
      const gradeValue = grade.grade_value !== null && grade.grade_value !== undefined
        ? grade.grade_value.toString()
        : 'N/A';
      const comments = grade.comments || '';
      const teacher = grade.teacher_id ? `${grade.teacher_id.nombre} ${grade.teacher_id.apellido}` : 'N/A';

      csvContent += `"${subjectName}","${gradeValue}","${comments}","${teacher}"\n`;
    });

    // Add statistics
    csvContent += '\nEstadísticas\n';
    csvContent += `Promedio,"${this.statistics.average}"\n`;
    csvContent += `Total materias,"${this.statistics.total}"\n`;
    csvContent += `Calificadas,"${this.statistics.graded}"\n`;

    // Download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Calificaciones_${user.nombre}_${user.apellido}_${moment().format('YYYY-MM-DD')}.csv`;
    apiService.downloadFile(blob, filename);
  }

  getCurrentSemesterName() {
    const currentSemester = this.semesters.find(s => s._id === this.currentSemesterId);
    return currentSemester ? `${currentSemester.name} ${currentSemester.year}` : 'Actual';
  }

  getPreviousSemester() {
    const currentIndex = this.semesters.findIndex(s => s._id === this.currentSemesterId);
    return currentIndex > 0 ? this.semesters[currentIndex - 1] : null;
  }

  async changeSemester(semesterId) {
    this.currentSemesterId = semesterId;
    await this.loadCurrentGrades();
    await this.loadStatistics();
    this.renderGradeTable();
    this.renderStatistics();
  }

  async viewGradeDetails(gradeId) {
    try {
      const grade = this.grades.find(g => g._id === gradeId);
      if (!grade) {
        throw new Error('Calificación no encontrada');
      }

      const gradeHistory = await apiService.getGradeHistory(gradeId);

      Swal.fire({
        title: 'Detalles de la Calificación',
        html: this.createGradeDetailsHTML(grade, gradeHistory.data || []),
        width: '600px',
        confirmButtonText: 'Cerrar'
      });

    } catch (error) {
      console.error('Error viewing grade details:', error);
      this.showError('Error cargando detalles de la calificación');
    }
  }

  createGradeDetailsHTML(grade, history) {
    const gradeClass = this.getGradeClass(grade.grade_value);
    const createdDate = moment(grade.created_at).format('DD/MM/YYYY HH:mm');

    let html = `
      <div class="text-start">
        <div class="row mb-3">
          <div class="col-6"><strong>Materia:</strong></div>
          <div class="col-6">${grade.subject_id?.nombre || 'N/A'}</div>
        </div>
        <div class="row mb-3">
          <div class="col-6"><strong>Calificación:</strong></div>
          <div class="col-6">
            <span class="badge ${gradeClass} fs-6">${grade.grade_value || 'N/A'}</span>
          </div>
        </div>
        <div class="row mb-3">
          <div class="col-6"><strong>Profesor:</strong></div>
          <div class="col-6">${grade.teacher_id ? `${grade.teacher_id.nombre} ${grade.teacher_id.apellido}` : 'N/A'}</div>
        </div>
        <div class="row mb-3">
          <div class="col-6"><strong>Fecha de registro:</strong></div>
          <div class="col-6">${createdDate}</div>
        </div>
        <div class="row mb-3">
          <div class="col-6"><strong>Comentarios:</strong></div>
          <div class="col-6">${grade.comments || 'Sin comentarios'}</div>
        </div>
    `;

    if (history.length > 0) {
      html += `
        <div class="mt-4">
          <h6 class="fw-bold">Historial de modificaciones:</h6>
          <div class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Valor anterior</th>
                  <th>Valor nuevo</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
      `;

      history.forEach(item => {
        const changeDate = moment(item.changed_at).format('DD/MM/YYYY HH:mm');
        html += `
          <tr>
            <td>${changeDate}</td>
            <td>${item.old_value || 'N/A'}</td>
            <td>${item.new_value}</td>
            <td>${item.change_reason}</td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  setupGradeInteractions() {
    // Add hover effects and tooltips
    document.querySelectorAll('.grade-value').forEach(element => {
      element.addEventListener('mouseenter', (e) => this.showGradeTooltip(e));
      element.addEventListener('mouseleave', () => this.hideGradeTooltip());
    });
  }

  showGradeTooltip(event) {
    const gradeValue = parseFloat(event.target.textContent);
    const tooltip = this.createTooltip(gradeValue);

    event.target.appendChild(tooltip);
    setTimeout(() => tooltip.classList.add('show'), 10);
  }

  hideGradeTooltip() {
    const tooltips = document.querySelectorAll('.grade-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
  }

  createTooltip(gradeValue) {
    const tooltip = document.createElement('div');
    tooltip.className = 'grade-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="grade-analysis">${this.analyzeGrade(gradeValue)}</div>
      </div>
    `;
    return tooltip;
  }

  analyzeGrade(gradeValue) {
    if (gradeValue >= 90) return 'Excelente rendimiento';
    if (gradeValue >= 80) return 'Buen rendimiento';
    if (gradeValue >= 70) return 'Rendimiento aceptable';
    if (gradeValue >= 60) return 'Necesita mejorar';
    return 'Rendimiento insuficiente';
  }

  filterGrades() {
    const filterValue = document.getElementById('subjectFilter')?.value;
    if (!filterValue) {
      this.renderGradeTable();
      return;
    }

    const filteredGrades = this.grades.filter(grade =>
      grade.subject_id?.nombre?.toLowerCase().includes(filterValue.toLowerCase())
    );

    this.renderFilteredGrades(filteredGrades);
  }

  searchGrades() {
    const searchValue = document.getElementById('searchInput')?.value.toLowerCase();
    if (!searchValue) {
      this.renderGradeTable();
      return;
    }

    const filteredGrades = this.grades.filter(grade =>
      grade.subject_id?.nombre?.toLowerCase().includes(searchValue) ||
      grade.comments?.toLowerCase().includes(searchValue) ||
      (grade.teacher_id?.nombre + ' ' + grade.teacher_id?.apellido).toLowerCase().includes(searchValue)
    );

    this.renderFilteredGrades(filteredGrades);
  }

  renderFilteredGrades(filteredGrades) {
    const tbody = document.querySelector('#calificacionesActuales tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredGrades.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4">
            <div class="text-muted">
              <i class="fas fa-search fa-3x mb-3"></i>
              <p>No se encontraron calificaciones que coincidan con los filtros</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    filteredGrades.forEach(grade => {
      const row = this.createGradeRow(grade);
      tbody.appendChild(row);
    });

    this.setupGradeInteractions();
  }

  setGradeView(viewType) {
    const container = document.getElementById('calificacionesActuales');
    container.classList.remove('view-compact', 'view-detailed');
    container.classList.add(`view-${viewType}`);

    // Update button states
    document.getElementById('viewCompact')?.classList.toggle('active', viewType === 'compact');
    document.getElementById('viewDetailed')?.classList.toggle('active', viewType === 'detailed');
  }

  setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'p':
            e.preventDefault();
            this.generateReport('current');
            break;
          case 'e':
            e.preventDefault();
            this.exportGrades('pdf');
            break;
        }
      }
    });

    // Auto-refresh (every 5 minutes)
    setInterval(() => {
      this.loadCurrentGrades();
      this.loadStatistics();
      this.renderGradeTable();
      this.renderStatistics();
    }, 300000);
  }

  showLoading(show) {
    const loadingElements = document.querySelectorAll('.loading-overlay');
    loadingElements.forEach(element => {
      element.style.display = show ? 'block' : 'none';
    });
  }

  showSuccess(message) {
    Swal.fire({
      title: 'Éxito',
      text: message,
      icon: 'success',
      timer: 3000,
      showConfirmButton: false
    });
  }

  showError(message) {
    Swal.fire({
      title: 'Error',
      text: message,
      icon: 'error',
      confirmButtonText: 'OK'
    });
  }

  getErrorMessage(error) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'Ocurrió un error inesperado';
  }
}

// Initialize the student grade manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.studentGradeManager = new StudentGradeManager();
});

// Add some CSS for the enhanced features
const style = document.createElement('style');
style.textContent = `
  .grade-value {
    font-size: 1.1rem;
    font-weight: bold;
    padding: 8px 12px;
    border-radius: 6px;
    display: inline-block;
    min-width: 80px;
  }

  .comment-bubble {
    background-color: #f8f9fa;
    border-left: 4px solid #007bff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .actions .btn {
    margin: 0 2px;
  }

  .grade-tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    white-space: nowrap;
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .grade-tooltip.show {
    opacity: 1;
  }

  .grade-tooltip::after {
    content: '';
    position: absolute;
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid #333;
  }

  .view-compact .comments-section {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .view-detailed .comments-section {
    max-width: 300px;
  }

  .progress-container {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .grade-bars {
    margin-top: 15px;
  }

  .grade-bar-item {
    margin-bottom: 10px;
  }

  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255,255,255,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    display: none;
  }

  .spinner-border {
    width: 3rem;
    height: 3rem;
  }
`;
document.head.appendChild(style);