class ReceiptManager {
  constructor() {
    this.currentUserId = null;
    this.receipts = [];
    this.statistics = {};
    this.filteredReceipts = [];
    this.currentFilter = 'all';
    this.currentReceipt = null;

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadInitialData();
    this.setupEventListeners();
  }

  bindEvents() {
    // Date filter buttons
    document.getElementById('dateFrom')?.addEventListener('change', () => this.applyDateFilter());
    document.getElementById('dateTo')?.addEventListener('change', () => this.applyDateFilter());

    // Download receipt button in modal
    document.getElementById('downloadReceiptBtn')?.addEventListener('click', () => this.downloadCurrentReceipt());

    // Set default date range (last 30 days)
    this.setDefaultDateRange();
  }

  setDefaultDateRange() {
    const today = moment();
    const thirtyDaysAgo = moment().subtract(30, 'days');

    const dateFrom = document.getElementById('dateFrom');
    const dateTo = document.getElementById('dateTo');

    if (dateFrom && dateTo) {
      dateFrom.value = thirtyDaysAgo.format('YYYY-MM-DD');
      dateTo.value = today.format('YYYY-MM-DD');
    }
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
        this.loadReceipts(),
        this.loadStatistics()
      ]);

      this.renderReceipts();
      this.renderStatistics();
      this.renderTimeline();

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Error cargando datos iniciales');
    } finally {
      this.showLoading(false);
    }
  }

  async loadReceipts() {
    try {
      const response = await apiService.getReadReceipts(this.currentUserId);
      this.receipts = response.data || [];
      this.filteredReceipts = [...this.receipts];
    } catch (error) {
      console.error('Error loading receipts:', error);
      this.receipts = [];
      this.filteredReceipts = [];
    }
  }

  async loadStatistics() {
    try {
      const response = await apiService.getReceiptStats(this.currentUserId);
      this.statistics = response.data || {};
    } catch (error) {
      console.error('Error loading statistics:', error);
      this.statistics = {};
    }
  }

  renderReceipts() {
    const tbody = document.querySelector('#receiptsTable tbody');
    if (!tbody) return;

    if (this.filteredReceipts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4">
            <div class="text-muted">
              <i class="fas fa-inbox fa-3x mb-3"></i>
              <p>No se encontraron comprobantes que coincidan con los filtros seleccionados</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = '';

    this.filteredReceipts.forEach(receipt => {
      const row = this.createReceiptRow(receipt);
      tbody.appendChild(row);
    });

    this.setupRowInteractions();
  }

  createReceiptRow(receipt) {
    const row = document.createElement('tr');

    const formattedDate = moment(receipt.read_at).format('DD/MM/YYYY HH:mm');
    const reportTypeDisplay = this.getReportTypeDisplay(receipt.report_type);
    const methodDisplay = this.getConfirmationMethodDisplay(receipt.confirmation_method);
    const truncatedIP = receipt.ip_address ?
      (receipt.ip_address.length > 15 ? receipt.ip_address.substring(0, 15) + '...' : receipt.ip_address) :
      'N/A';

    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <i class="fas fa-clock me-2 text-muted"></i>
          <div>
            <div class="fw-bold">${formattedDate}</div>
            <small class="text-muted">${moment(receipt.read_at).fromNow()}</small>
          </div>
        </div>
      </td>
      <td>
        <span class="badge bg-primary">${reportTypeDisplay}</span>
      </td>
      <td>${receipt.semester || 'N/A'}</td>
      <td>
        <span class="badge bg-info">${methodDisplay}</span>
      </td>
      <td>
        <code class="text-muted">${truncatedIP}</code>
      </td>
      <td>
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-outline-primary" onclick="receiptManager.viewReceiptDetails('${receipt._id}')" title="Ver detalles">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-success" onclick="receiptManager.downloadReceipt('${receipt._id}')" title="Descargar">
            <i class="fas fa-download"></i>
          </button>
        </div>
      </td>
    `;

    return row;
  }

  getReportTypeDisplay(type) {
    const types = {
      'grades': 'Calificaciones',
      'attendance': 'Asistencias',
      'combined': 'Completo'
    };
    return types[type] || type;
  }

  getConfirmationMethodDisplay(method) {
    const methods = {
      'checkbox': 'Casilla',
      'electronic': 'Electrónica',
      'signature': 'Firma Digital'
    };
    return methods[method] || method;
  }

  renderStatistics() {
    const elements = {
      'totalReceipts': this.statistics.total_receipts || 0,
      'thisMonthReceipts': this.getThisMonthCount(),
      'todayReceipts': this.getTodayCount(),
      'mostRecentReceipts': this.getMostRecentCount()
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    });
  }

  getThisMonthCount() {
    const thisMonth = moment().startOf('month');
    return this.receipts.filter(r => moment(r.read_at).isSameOrAfter(thisMonth)).length;
  }

  getTodayCount() {
    const today = moment().startOf('day');
    return this.receipts.filter(r => moment(r.read_at).isSameOrAfter(today)).length;
  }

  getMostRecentCount() {
    if (this.receipts.length === 0) return 0;

    const sortedReceipts = [...this.receipts].sort((a, b) =>
      new Date(b.read_at) - new Date(a.read_at)
    );

    const mostRecent = sortedReceipts[0];
    const oneWeekAgo = moment().subtract(7, 'days');

    return this.receipts.filter(r =>
      moment(r.read_at).isSameOrAfter(mostRecent.read_at) &&
      moment(r.read_at).isSameOrAfter(oneWeekAgo)
    ).length;
  }

  renderTimeline() {
    const container = document.getElementById('receiptsTimeline');
    if (!container) return;

    if (this.filteredReceipts.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-history fa-3x mb-3 text-muted"></i>
          <p class="text-muted">No hay comprobantes para mostrar en la línea de tiempo</p>
        </div>
      `;
      return;
    }

    // Sort receipts by date (most recent first)
    const sortedReceipts = [...this.filteredReceipts].sort((a, b) =>
      new Date(b.read_at) - new Date(a.read_at)
    );

    let html = '<div class="timeline">';

    sortedReceipts.forEach((receipt, index) => {
      const isLatest = index === 0;
      const date = moment(receipt.read_at);
      const formattedDate = date.format('DD [de] MMMM [de] YYYY');
      const formattedTime = date.format('HH:mm');

      html += `
        <div class="timeline-item ${isLatest ? 'timeline-latest' : ''}">
          <div class="timeline-marker">
            <i class="fas fa-${isLatest ? 'star' : 'check'}"></i>
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <h6 class="timeline-title">
                ${this.getReportTypeDisplay(receipt.report_type)} - ${receipt.semester || 'N/A'}
              </h6>
              <small class="timeline-date">${formattedDate} a las ${formattedTime}</small>
            </div>
            <div class="timeline-body">
              <div class="row align-items-center">
                <div class="col-md-8">
                  <p class="mb-1">
                    <strong>Método:</strong> ${this.getConfirmationMethodDisplay(receipt.confirmation_method)}
                  </p>
                  ${receipt.ip_address ?
                    `<p class="mb-1"><strong>IP:</strong> <code>${receipt.ip_address}</code></p>` :
                    ''
                  }
                </div>
                <div class="col-md-4 text-end">
                  <button class="btn btn-sm btn-outline-primary" onclick="receiptManager.viewReceiptDetails('${receipt._id}')">
                    <i class="fas fa-eye me-1"></i> Ver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  async viewReceiptDetails(receiptId) {
    try {
      this.showLoading(true);

      const receipt = await apiService.getReceiptDetails(receiptId);
      this.currentReceipt = receipt.data;

      // Update modal content
      const modalContent = document.getElementById('receiptDetailsContent');
      const modalTitle = document.getElementById('receiptDetailsModalLabel');

      modalTitle.innerHTML = `
        <i class="fas fa-file-contract me-2"></i>Comprobante #${receipt.data._id.substring(-8)}
      `;

      modalContent.innerHTML = this.createReceiptDetailsHTML(receipt.data);

      // Show modal
      const modal = new bootstrap.Modal(document.getElementById('receiptDetailsModal'));
      modal.show();

    } catch (error) {
      console.error('Error viewing receipt details:', error);
      this.showError('Error cargando detalles del comprobante');
    } finally {
      this.showLoading(false);
    }
  }

  createReceiptDetailsHTML(receipt) {
    const formattedDate = moment(receipt.read_at).format('dddd, D [de] MMMM [de] YYYY [a las] h:mm A');
    const userAgent = receipt.user_agent ? receipt.user_agent.substring(0, 100) + '...' : 'N/A';

    return `
      <div class="receipt-details">
        <div class="row mb-3">
          <div class="col-md-6">
            <h6 class="text-muted">Información del Reporte</h6>
            <p><strong>Tipo:</strong> ${this.getReportTypeDisplay(receipt.report.report_type)}</p>
            <p><strong>Período:</strong> ${receipt.report.semester || 'N/A'}</p>
            <p><strong>Generado:</strong> ${moment(receipt.report.generated_at).format('DD/MM/YYYY HH:mm')}</p>
          </div>
          <div class="col-md-6">
            <h6 class="text-muted">Información de Confirmación</h6>
            <p><strong>Fecha y hora:</strong></p>
            <p class="mb-2">${formattedDate}</p>
            <p><strong>Método:</strong> ${this.getConfirmationMethodDisplay(receipt.confirmation_method)}</p>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-12">
            <h6 class="text-muted">Detalles Técnicos</h6>
            <div class="table-responsive">
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td><strong>ID del Comprobante:</strong></td>
                    <td><code>${receipt._id}</code></td>
                  </tr>
                  <tr>
                    <td><strong>Dirección IP:</strong></td>
                    <td><code>${receipt.ip_address || 'No registrada'}</code></td>
                  </tr>
                  <tr>
                    <td><strong>Navegador:</strong></td>
                    <td class="text-truncate" style="max-width: 300px;">${userAgent}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="alert alert-success">
          <i class="fas fa-check-circle me-2"></i>
          <strong>Este comprobante es válido como evidencia de lectura</strong>
          <p class="mb-0 mt-2">
            <small>La información contenida en este documento ha sido registrada electrónicamente y no puede ser modificada.</small>
          </p>
        </div>

        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          <strong>Nota:</strong> Este comprobante fue generado automáticamente cuando confirmó la lectura del reporte.
        </div>
      </div>

      <style>
        .receipt-details {
          font-size: 14px;
        }
        .receipt-details h6 {
          color: #6c757d;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }
      </style>
    `;
  }

  async downloadReceipt(receiptId) {
    try {
      let receiptData = this.currentReceipt;

      if (!receiptData || receiptData._id !== receiptId) {
        receiptData = await apiService.getReceiptDetails(receiptId);
        receiptData = receiptData.data;
      }

      this.generateReceiptPDF(receiptData);

    } catch (error) {
      console.error('Error downloading receipt:', error);
      this.showError('Error descargando comprobante');
    }
  }

  downloadCurrentReceipt() {
    if (this.currentReceipt) {
      this.generateReceiptPDF(this.currentReceipt);
    }
  }

  generateReceiptPDF(receipt) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Add header
    doc.setFontSize(16);
    doc.text('Comprobante de Lectura de Reporte', 105, 20, { align: 'center' });

    // Add receipt details
    doc.setFontSize(12);
    doc.text(`ID de Comprobante: ${receipt._id}`, 20, 40);
    doc.text(`Tipo de Reporte: ${this.getReportTypeDisplay(receipt.report.report_type)}`, 20, 50);
    doc.text(`Período: ${receipt.report.semester || 'N/A'}`, 20, 60);
    doc.text(`Fecha de Confirmación: ${moment(receipt.read_at).format('YYYY-MM-DD HH:mm:ss')}`, 20, 70);
    doc.text(`Método de Confirmación: ${this.getConfirmationMethodDisplay(receipt.confirmation_method)}`, 20, 80);

    if (receipt.ip_address) {
      doc.text(`Dirección IP: ${receipt.ip_address}`, 20, 90);
    }

    // Add user info
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    doc.text(`Estudiante: ${user.nombre} ${user.apellido}`, 20, 110);
    doc.text(`Email: ${user.email || 'N/A'}`, 20, 120);

    // Add legal notice
    doc.setFontSize(10);
    doc.text('Este documento es un comprobante válido de lectura electrónica.', 20, 140);
    doc.text('Contiene información verificable incluyendo fecha, hora y dirección IP.', 20, 150);
    doc.text(`Generado: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 20, 160);

    // Add footer
    doc.text('Sistema Educativo Skolaris - Todos los derechos reservados', 105, 280, { align: 'center' });

    // Save the PDF
    const filename = `Comprobante_Lectura_${moment(receipt.read_at).format('YYYY-MM-DD_HH-mm')}.pdf`;
    doc.save(filename);

    this.showSuccess('Comprobante descargado exitosamente');
  }

  async exportReceipts(format) {
    try {
      this.showLoading(true);

      const response = await apiService.exportReceipts(
        this.currentUserId,
        format,
        this.getCurrentFilters()
      );

      if (format === 'json') {
        // Download JSON file
        const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
        const filename = `Comprobantes_${moment().format('YYYY-MM-DD')}.json`;
        apiService.downloadFile(blob, filename);
      } else if (format === 'csv') {
        // Response is already a blob for CSV
        const filename = `Comprobantes_${moment().format('YYYY-MM-DD')}.csv`;
        apiService.downloadFile(response, filename);
      }

      this.showSuccess(`Comprobantes exportados exitosamente en formato ${format.toUpperCase()}`);

    } catch (error) {
      console.error('Error exporting receipts:', error);
      this.showError('Error exportando comprobantes');
    } finally {
      this.showLoading(false);
    }
  }

  getCurrentFilters() {
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;

    const filters = {};
    if (this.currentFilter !== 'all') {
      filters.report_type = this.currentFilter;
    }
    if (dateFrom) {
      filters.date_from = dateFrom;
    }
    if (dateTo) {
      filters.date_to = dateTo;
    }

    return filters;
  }

  filterByType(type) {
    this.currentFilter = type;

    if (type === 'all') {
      this.filteredReceipts = [...this.receipts];
    } else {
      this.filteredReceipts = this.receipts.filter(r => r.report_type === type);
    }

    this.renderReceipts();
    this.renderTimeline();
  }

  applyDateFilter() {
    const dateFrom = document.getElementById('dateFrom')?.value;
    const dateTo = document.getElementById('dateTo')?.value;

    if (!dateFrom || !dateTo) {
      this.showError('Por favor seleccione ambas fechas');
      return;
    }

    const fromDate = moment(dateFrom).startOf('day');
    const toDate = moment(dateTo).endOf('day');

    if (fromDate.isAfter(toDate)) {
      this.showError('La fecha "desde" no puede ser posterior a la fecha "hasta"');
      return;
    }

    this.filteredReceipts = this.receipts.filter(receipt => {
      const receiptDate = moment(receipt.read_at);
      return receiptDate.isBetween(fromDate, toDate, null, '[]');
    });

    this.renderReceipts();
    this.renderTimeline();

    this.showSuccess(`Filtro aplicado: ${this.filteredReceipts.length} comprobantes encontrados`);
  }

  setupRowInteractions() {
    // Add hover effects
    document.querySelectorAll('#receiptsTable tbody tr').forEach(row => {
      row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = '#f8f9fa';
      });
      row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = '';
      });
    });
  }

  setupEventListeners() {
    // Auto-refresh every 5 minutes
    setInterval(() => {
      this.loadReceipts();
      this.loadStatistics();
      this.renderReceipts();
      this.renderStatistics();
      this.renderTimeline();
    }, 300000);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'e':
            e.preventDefault();
            this.exportReceipts('json');
            break;
          case 'r':
            e.preventDefault();
            this.loadReceipts();
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
}

// Initialize the receipt manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.receiptManager = new ReceiptManager();
});

// Add CSS for timeline
const style = document.createElement('style');
style.textContent = `
  .timeline {
    position: relative;
    padding-left: 30px;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #dee2e6;
  }

  .timeline-item {
    position: relative;
    margin-bottom: 20px;
  }

  .timeline-item:last-child {
    margin-bottom: 0;
  }

  .timeline-marker {
    position: absolute;
    left: -30px;
    top: 5px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: white;
    border: 2px solid #dee2e6;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #6c757d;
  }

  .timeline-latest .timeline-marker {
    background: #007bff;
    border-color: #007bff;
    color: white;
  }

  .timeline-content {
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .timeline-latest .timeline-content {
    border-color: #007bff;
    box-shadow: 0 4px 8px rgba(0,123,255,0.2);
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f8f9fa;
  }

  .timeline-title {
    margin: 0;
    color: #495057;
  }

  .timeline-date {
    color: #6c757d;
    font-size: 12px;
  }

  .timeline-body {
    margin: 0;
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