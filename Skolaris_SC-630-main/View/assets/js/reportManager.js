class ReportManager {
  constructor() {
    this.currentUserId = null;
    this.availableReports = [];
    this.confirmedReports = new Set();
    this.reportStatistics = {};

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadInitialData();
    this.setupEventListeners();
  }

  bindEvents() {
    // Report confirmation buttons
    document.getElementById('btnConfirmarCalificaciones')?.addEventListener('click', () => this.confirmReport('grades'));
    document.getElementById('btnConfirmarAsistencias')?.addEventListener('click', () => this.confirmReport('attendance'));

    // View receipts button
    document.getElementById('viewReceipts')?.addEventListener('click', () => this.viewReceipts());

    // Download report buttons
    document.getElementById('downloadGradesReport')?.addEventListener('click', () => this.downloadReport('grades'));
    document.getElementById('downloadAttendanceReport')?.addEventListener('click', () => this.downloadReport('attendance'));

    // Filter controls
    document.getElementById('reportTypeFilter')?.addEventListener('change', () => this.filterReports());
    document.getElementById('dateFilter')?.addEventListener('change', () => this.filterReports());
  }

  async loadInitialData() {
    try {
      this.showLoading(true);

      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.currentUserId = user.id;

      if (!this.currentUserId) {
        throw new Error('No se pudo identificar al usuario');
      }

      await Promise.all([
        this.loadAvailableReports(),
        this.loadReportStatistics()
      ]);

      this.renderReports();
      this.renderStatistics();

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Error cargando datos iniciales');
    } finally {
      this.showLoading(false);
    }
  }

  async loadAvailableReports() {
    try {
      const response = await apiService.getAvailableReports(this.currentUserId);
      this.availableReports = response.data || [];

      // Update report availability UI
      this.updateReportAvailability();
    } catch (error) {
      console.error('Error loading available reports:', error);
      this.availableReports = [];
    }
  }

  async loadReportStatistics() {
    try {
      const receiptsResponse = await apiService.getReceiptStats(this.currentUserId);
      this.reportStatistics = receiptsResponse.data || {};
    } catch (error) {
      console.error('Error loading report statistics:', error);
      this.reportStatistics = {};
    }
  }

  updateReportAvailability() {
    // Update grades report availability
    const gradesReport = this.availableReports.find(r => r.report_type === 'grades' && r.is_active);
    const gradesCheckbox = document.getElementById('checkboxCalificaciones');
    const gradesButton = document.getElementById('btnConfirmarCalificaciones');
    const gradesMessage = document.getElementById('mensajeCalificaciones');

    if (gradesReport) {
      if (gradesCheckbox) {
        gradesCheckbox.disabled = false;
        gradesCheckbox.checked = gradesReport.is_read;
      }
      if (gradesButton) {
        gradesButton.disabled = gradesReport.is_read;
        gradesButton.textContent = gradesReport.is_read ? 'Confirmado' : 'Confirmar';
        gradesButton.classList.toggle('btn-success', !gradesReport.is_read);
        gradesButton.classList.toggle('btn-secondary', gradesReport.is_read);
      }
      if (gradesMessage) {
        gradesMessage.classList.add('d-none');
      }

      // Store report ID for confirmation
      if (!gradesReport.is_read) {
        gradesCheckbox.dataset.reportId = gradesReport._id;
      }
    } else {
      if (gradesCheckbox) {
        gradesCheckbox.disabled = true;
        gradesCheckbox.checked = false;
      }
      if (gradesButton) {
        gradesButton.disabled = true;
        gradesButton.textContent = 'No disponible';
      }
      if (gradesMessage) {
        gradesMessage.classList.remove('d-none');
      }
    }

    // Update attendance report availability
    const attendanceReport = this.availableReports.find(r => r.report_type === 'attendance' && r.is_active);
    const attendanceCheckbox = document.getElementById('checkboxAsistencias');
    const attendanceButton = document.getElementById('btnConfirmarAsistencias');
    const attendanceMessage = document.getElementById('mensajeAsistencias');

    if (attendanceReport) {
      if (attendanceCheckbox) {
        attendanceCheckbox.disabled = false;
        attendanceCheckbox.checked = attendanceReport.is_read;
      }
      if (attendanceButton) {
        attendanceButton.disabled = attendanceReport.is_read;
        attendanceButton.textContent = attendanceReport.is_read ? 'Confirmado' : 'Confirmar';
        attendanceButton.classList.toggle('btn-success', !attendanceReport.is_read);
        attendanceButton.classList.toggle('btn-secondary', attendanceReport.is_read);
      }
      if (attendanceMessage) {
        attendanceMessage.classList.add('d-none');
      }

      // Store report ID for confirmation
      if (!attendanceReport.is_read) {
        attendanceCheckbox.dataset.reportId = attendanceReport._id;
      }
    } else {
      if (attendanceCheckbox) {
        attendanceCheckbox.disabled = true;
        attendanceCheckbox.checked = false;
      }
      if (attendanceButton) {
        attendanceButton.disabled = true;
        attendanceButton.textContent = 'No disponible';
      }
      if (attendanceMessage) {
        attendanceMessage.classList.remove('d-none');
      }
    }
  }

  async confirmReport(reportType) {
    try {
      let checkbox, reportId;

      if (reportType === 'grades') {
        checkbox = document.getElementById('checkboxCalificaciones');
        reportId = checkbox.dataset.reportId;
      } else if (reportType === 'attendance') {
        checkbox = document.getElementById('checkboxAsistencias');
        reportId = checkbox.dataset.reportId;
      }

      if (!checkbox || !reportId) {
        throw new Error('No se encontró el reporte para confirmar');
      }

      if (!checkbox.checked) {
        this.showError('Debe marcar la casilla de confirmación antes de continuar');
        return;
      }

      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Confirmar lectura de reporte',
        html: this.createConfirmationHTML(reportType),
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Confirmar lectura',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#8ABD3C',
        preConfirm: () => {
          const confirmationMethod = document.querySelector('input[name="confirmationMethod"]:checked')?.value;
          const comments = document.getElementById('confirmationComments')?.value;
          return { confirmationMethod, comments };
        }
      });

      if (result.isConfirmed) {
        this.showLoading(true);

        const { confirmationMethod, comments } = result.value;

        // Confirm the report
        const response = await apiService.confirmReportRead(reportId);

        if (response.success) {
          this.showSuccess('Reporte confirmado exitosamente');

          // Update UI
          checkbox.checked = true;
          checkbox.disabled = true;
          this.confirmedReports.add(reportId);

          // Update button state
          const button = reportType === 'grades' ?
            document.getElementById('btnConfirmarCalificaciones') :
            document.getElementById('btnConfirmarAsistencias');

          if (button) {
            button.disabled = true;
            button.textContent = 'Confirmado';
            button.classList.remove('btn-success');
            button.classList.add('btn-secondary');
          }

          // Reload data to update statistics
          await this.loadReportStatistics();
          this.renderStatistics();

          // Show receipt details
          await this.showReceiptDetails(response.data._id);

        } else {
          throw new Error(response.message || 'Error confirmando reporte');
        }
      }

    } catch (error) {
      console.error('Error confirming report:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  createConfirmationHTML(reportType) {
    const reportName = reportType === 'grades' ? 'Calificaciones' : 'Asistencias';

    return `
      <div class="text-start">
        <p>Está por confirmar que ha leído el reporte de <strong>${reportName}</strong>.</p>

        <div class="mb-3">
          <label class="form-label fw-bold">Método de confirmación:</label>
          <div>
            <div class="form-check mb-2">
              <input class="form-check-input" type="radio" name="confirmationMethod" id="methodCheckbox" value="checkbox" checked>
              <label class="form-check-label" for="methodCheckbox">
                Casilla de verificación
              </label>
            </div>
            <div class="form-check mb-2">
              <input class="form-check-input" type="radio" name="confirmationMethod" id="methodElectronic" value="electronic">
              <label class="form-check-label" for="methodElectronic">
                Firma electrónica
              </label>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label for="confirmationComments" class="form-label fw-bold">Comentarios (opcional):</label>
          <textarea class="form-control" id="confirmationComments" rows="3"
                    placeholder="Agregue cualquier comentario sobre el reporte..."></textarea>
        </div>

        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Esta confirmación será registrada con fecha, hora y dirección IP para fines de auditoría.
        </div>
      </div>
    `;
  }

  async showReceiptDetails(receiptId) {
    try {
      const receipt = await apiService.getReceiptDetails(receiptId);

      Swal.fire({
        title: 'Comprobante de Lectura',
        html: this.createReceiptHTML(receipt.data),
        width: '600px',
        confirmButtonText: 'Descargar comprobante',
        showCancelButton: true,
        cancelButtonText: 'Cerrar'
      }).then((result) => {
        if (result.isConfirmed) {
          this.downloadReceipt(receipt.data);
        }
      });

    } catch (error) {
      console.error('Error showing receipt details:', error);
    }
  }

  createReceiptHTML(receipt) {
    const formattedDate = moment(receipt.read_at).format('DD [de] MMMM [de] YYYY [a las] HH:mm');

    return `
      <div class="text-start">
        <div class="mb-3">
          <h6 class="fw-bold">Información del Reporte:</h6>
          <p><strong>Tipo:</strong> ${this.getReportTypeDisplay(receipt.report.report_type)}</p>
          <p><strong>Período:</strong> ${receipt.report.semester || 'N/A'}</p>
          <p><strong>Generado:</strong> ${moment(receipt.report.generated_at).format('DD/MM/YYYY HH:mm')}</p>
        </div>

        <div class="mb-3">
          <h6 class="fw-bold">Información de Confirmación:</h6>
          <p><strong>Fecha y hora:</strong> ${formattedDate}</p>
          <p><strong>Método:</strong> ${this.getConfirmationMethodDisplay(receipt.confirmation_method)}</p>
          <p><strong>Dirección IP:</strong> ${receipt.ip_address || 'N/A'}</p>
        </div>

        <div class="alert alert-success">
          <i class="fas fa-check-circle me-2"></i>
          <strong>Confirmación registrada exitosamente</strong>
        </div>
      </div>
    `;
  }

  getReportTypeDisplay(type) {
    const types = {
      'grades': 'Reporte de Calificaciones',
      'attendance': 'Reporte de Asistencias',
      'combined': 'Reporte Completo'
    };
    return types[type] || type;
  }

  getConfirmationMethodDisplay(method) {
    const methods = {
      'checkbox': 'Casilla de verificación',
      'electronic': 'Firma electrónica',
      'signature': 'Firma digital'
    };
    return methods[method] || method;
  }

  async downloadReceipt(receipt) {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Add header
      doc.setFontSize(16);
      doc.text('Comprobante de Lectura de Reporte', 105, 20, { align: 'center' });

      // Add receipt details
      doc.setFontSize(12);
      doc.text(`ID de Comprobante: ${receipt._id}`, 20, 40);
      doc.text(`Tipo de Reporte: ${this.getReportTypeDisplay(receipt.report.report_type)}`, 20, 50);
      doc.text(`Fecha de Confirmación: ${moment(receipt.read_at).format('YYYY-MM-DD HH:mm')}`, 20, 60);
      doc.text(`Método de Confirmación: ${this.getConfirmationMethodDisplay(receipt.confirmation_method)}`, 20, 70);
      doc.text(`Dirección IP: ${receipt.ip_address || 'N/A'}`, 20, 80);

      // Add user info
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      doc.text(`Estudiante: ${user.nombre} ${user.apellido}`, 20, 90);
      doc.text(`Email: ${user.email || 'N/A'}`, 20, 100);

      // Add footer
      doc.text('Este comprobante tiene validez legal como constancia de lectura.', 20, 120);
      doc.text(`Generado: ${moment().format('YYYY-MM-DD HH:mm')}`, 20, 130);

      // Save the PDF
      const filename = `Comprobante_Lectura_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
      doc.save(filename);

    } catch (error) {
      console.error('Error downloading receipt:', error);
      this.showError('Error descargando comprobante');
    }
  }

  async downloadReport(reportType) {
    try {
      this.showLoading(true);

      const report = this.availableReports.find(r => r.report_type === reportType && r.is_active);
      if (!report) {
        throw new Error('Reporte no disponible');
      }

      const pdfBlob = await apiService.generatePDFReport(report._id);
      const filename = this.generateReportFilename(report);
      apiService.downloadFile(pdfBlob, filename);

      this.showSuccess('Reporte descargado exitosamente');

    } catch (error) {
      console.error('Error downloading report:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  generateReportFilename(report) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const studentName = `${user.nombre}_${user.apellido}`.replace(/\s+/g, '_');
    const reportType = this.getReportTypeDisplay(report.report_type).replace(/\s+/g, '_');
    const date = moment().format('YYYY-MM-DD');
    return `Reporte_${reportType}_${studentName}_${date}.pdf`;
  }

  async viewReceipts() {
    try {
      this.showLoading(true);

      const receipts = await apiService.getReadReceipts(this.currentUserId);

      if (receipts.data.length === 0) {
        Swal.fire({
          title: 'No hay recibos disponibles',
          text: 'No se encontraron comprobantes de lectura.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
        return;
      }

      // Create HTML for receipts table
      const receiptsHTML = this.createReceiptsTableHTML(receipts.data);

      Swal.fire({
        title: 'Comprobantes de Lectura',
        html: receiptsHTML,
        width: '900px',
        showConfirmButton: false,
        showCloseButton: true
      });

    } catch (error) {
      console.error('Error viewing receipts:', error);
      this.showError('Error cargando comprobantes');
    } finally {
      this.showLoading(false);
    }
  }

  createReceiptsTableHTML(receipts) {
    let html = `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo de Reporte</th>
              <th>Período</th>
              <th>Método</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    receipts.forEach(receipt => {
      const formattedDate = moment(receipt.read_at).format('DD/MM/YYYY HH:mm');

      html += `
        <tr>
          <td>${formattedDate}</td>
          <td>${this.getReportTypeDisplay(receipt.report_type)}</td>
          <td>${receipt.semester || 'N/A'}</td>
          <td>${this.getConfirmationMethodDisplay(receipt.confirmation_method)}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="reportManager.showReceiptDetails('${receipt._id}')">
              <i class="fas fa-eye"></i> Ver
            </button>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    return html;
  }

  renderReports() {
    const container = document.getElementById('reportsList');
    if (!container) return;

    if (this.availableReports.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-file-alt fa-3x mb-3 text-muted"></i>
          <p class="text-muted">No hay reportes disponibles en este momento</p>
        </div>
      `;
      return;
    }

    let html = '';
    this.availableReports.forEach(report => {
      const statusClass = report.is_read ? 'bg-success' : 'bg-warning';
      const statusText = report.is_read ? 'Leído' : 'Pendiente';

      html += `
        <div class="card mb-3">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-md-6">
                <h6 class="card-title mb-1">
                  <i class="fas fa-file-alt me-2"></i>
                  ${this.getReportTypeDisplay(report.report_type)}
                </h6>
                <p class="text-muted mb-0">
                  Período: ${report.semester || 'N/A'} |
                  Generado: ${moment(report.generated_at).format('DD/MM/YYYY')}
                </p>
              </div>
              <div class="col-md-3 text-center">
                <span class="badge ${statusClass}">${statusText}</span>
              </div>
              <div class="col-md-3 text-end">
                <div class="btn-group">
                  <button class="btn btn-sm btn-outline-primary" onclick="reportManager.downloadReport('${report.report_type}')">
                    <i class="fas fa-download"></i> Descargar
                  </button>
                  ${!report.is_read ?
                    `<button class="btn btn-sm btn-success" onclick="reportManager.confirmReport('${report.report_type}')">
                      <i class="fas fa-check"></i> Confirmar
                    </button>` : ''
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderStatistics() {
    const elements = {
      'statTotalReports': this.reportStatistics.total_receipts || 0,
      'statGradesReports': this.getReportCountByType('grades'),
      'statAttendanceReports': this.getReportCountByType('attendance'),
      'statPendingReports': this.getPendingReportsCount()
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });

    this.renderStatisticsChart();
  }

  getReportCountByType(type) {
    if (!this.reportStatistics.receipts_by_type) return 0;
    const item = this.reportStatistics.receipts_by_type.find(r => r.type === type);
    return item ? item.count : 0;
  }

  getPendingReportsCount() {
    return this.availableReports.filter(r => !r.is_read).length;
  }

  renderStatisticsChart() {
    const container = document.getElementById('statisticsChart');
    if (!container || !this.reportStatistics.receipts_by_type) return;

    const data = this.reportStatistics.receipts_by_type;

    let html = `
      <h6 class="mb-3">Reportes por Tipo</h6>
      <div class="report-stats">
    `;

    data.forEach(item => {
      const percentage = this.reportStatistics.total_receipts > 0
        ? (item.count / this.reportStatistics.total_receipts) * 100
        : 0;

      html += `
        <div class="stat-item mb-3">
          <div class="d-flex justify-content-between mb-1">
            <span>${this.getReportTypeDisplay(item.type)}</span>
            <span class="badge bg-primary">${item.count}</span>
          </div>
          <div class="progress" style="height: 20px;">
            <div class="progress-bar bg-primary" role="progressbar" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  }

  filterReports() {
    const typeFilter = document.getElementById('reportTypeFilter')?.value;
    const dateFilter = document.getElementById('dateFilter')?.value;

    let filteredReports = [...this.availableReports];

    if (typeFilter && typeFilter !== 'all') {
      filteredReports = filteredReports.filter(r => r.report_type === typeFilter);
    }

    if (dateFilter) {
      const filterDate = moment(dateFilter);
      filteredReports = filteredReports.filter(r =>
        moment(r.generated_at).isSame(filterDate, 'day')
      );
    }

    // Update display with filtered results
    this.renderFilteredReports(filteredReports);
  }

  renderFilteredReports(reports) {
    // Store original reports and temporarily replace
    const originalReports = this.availableReports;
    this.availableReports = reports;
    this.renderReports();
    this.availableReports = originalReports;
  }

  setupEventListeners() {
    // Auto-refresh every 5 minutes
    setInterval(() => {
      this.loadAvailableReports();
      this.loadReportStatistics();
      this.renderReports();
      this.renderStatistics();
    }, 300000);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            this.viewReceipts();
            break;
        }
      }
    });
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

// Initialize the report manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.reportManager = new ReportManager();
});

// Add some CSS for the enhanced features
const style = document.createElement('style');
style.textContent = `
  .report-stats {
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .stat-item {
    margin-bottom: 15px;
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

  .report-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .report-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .confirmation-dialog {
    max-width: 500px;
  }

  .receipt-details {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin: 10px 0;
  }
`;
document.head.appendChild(style);