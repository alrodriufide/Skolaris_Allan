class GradeManager {
  constructor() {
    this.currentGroup = null;
    this.currentSemester = null;
    this.currentSubject = null;
    this.isModifying = false;
    this.autoSaveInterval = null;
    this.originalGrades = new Map();
    this.unsavedChanges = new Set();

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadInitialData();
    this.setupAutoSave();
    this.setupRealTimeValidation();
  }

  bindEvents() {
    // Group selection buttons
    document.querySelectorAll('.btnRegistrar').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleRegisterGrades(e));
    });

    document.querySelectorAll('.btnModificar').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleModifyGrades(e));
    });

    // Semester selection
    const btnConfirmar = document.getElementById('btnConfirmar');
    if (btnConfirmar) {
      btnConfirmar.addEventListener('click', () => this.confirmSemesterSelection());
    }

    // Form submission
    const formCalificaciones = document.getElementById('formCalificaciones');
    if (formCalificaciones) {
      formCalificaciones.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Cancel buttons
    document.getElementById('btnCancelar')?.addEventListener('click', () => this.cancelForm());
    document.getElementById('btnCancelarSeleccion')?.addEventListener('click', () => this.cancelSemesterSelection());

    // Auto-save controls
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  async loadInitialData() {
    try {
      await Promise.all([
        this.loadSemesters(),
        this.loadSubjects(),
        this.loadTeacherGroups()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Error loading initial data');
    }
  }

  async loadSemesters() {
    try {
      const response = await apiService.getSemesters();
      this.semesters = response.data || [];
      this.populateSemesterDropdown();
    } catch (error) {
      console.error('Error loading semesters:', error);
      this.semesters = [];
    }
  }

  async loadSubjects() {
    try {
      const response = await apiService.getSubjects();
      this.subjects = response.data || [];
      this.populateSubjectDropdown();
    } catch (error) {
      console.error('Error loading subjects:', error);
      this.subjects = [];
    }
  }

  async loadTeacherGroups() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await apiService.getTeacherGroups(user.id);
      this.teacherGroups = response.data || [];
      this.updateGroupButtons();
    } catch (error) {
      console.error('Error loading teacher groups:', error);
      this.teacherGroups = [];
    }
  }

  populateSemesterDropdown() {
    const selectSemester = document.getElementById('semestre');
    if (!selectSemester) return;

    selectSemester.innerHTML = '<option value="">Seleccione un semestre</option>';

    this.semesters.forEach(semester => {
      const option = document.createElement('option');
      option.value = semester._id;
      option.textContent = `${semester.name} ${semester.year}`;
      option.dataset.isCurrent = semester.is_current;

      if (semester.is_current) {
        option.selected = true;
      }

      selectSemester.appendChild(option);
    });
  }

  populateSubjectDropdown() {
    if (!document.getElementById('subjectSelect')) return;

    const selectSubject = document.getElementById('subjectSelect');
    selectSubject.innerHTML = '<option value="">Seleccione una materia</option>';

    this.subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject._id;
      option.textContent = subject.nombre;
      selectSubject.appendChild(option);
    });
  }

  updateGroupButtons() {
    // Update group buttons based on actual teacher assignments
    document.querySelectorAll('.btnRegistrar, .btnModificar').forEach(btn => {
      const groupName = btn.dataset.grupo;
      const isAssigned = this.teacherGroups.some(group =>
        group.nombre.toLowerCase().includes(groupName.toLowerCase())
      );

      btn.disabled = !isAssigned;
      if (!isAssigned) {
        btn.title = 'No tienes asignado este grupo';
      }
    });
  }

  handleRegisterGrades(e) {
    this.currentGroup = e.target.dataset.grupo;
    this.isModifying = false;
    this.showGradeForm();
  }

  handleModifyGrades(e) {
    this.currentGroup = e.target.dataset.grupo;
    this.isModifying = true;
    this.showSemesterSelection();
  }

  showSemesterSelection() {
    document.getElementById('formularioSeleccionSemestre').classList.remove('d-none');
    document.getElementById('formularioCalificaciones').classList.add('d-none');
  }

  confirmSemesterSelection() {
    const selectSemester = document.getElementById('semestre');
    if (!selectSemester.value) {
      this.showError('Por favor seleccione un semestre');
      return;
    }

    this.currentSemester = selectSemester.value;
    document.getElementById('formularioSeleccionSemestre').classList.add('d-none');
    this.showGradeForm();
  }

  cancelSemesterSelection() {
    document.getElementById('formularioSeleccionSemestre').classList.add('d-none');
  }

  async showGradeForm() {
    const formDiv = document.getElementById('formularioCalificaciones');
    const titulo = document.getElementById('tituloFormulario');

    const action = this.isModifying ? 'Modificar' : 'Registrar';
    titulo.textContent = `${action} Calificaciones - Grupo ${this.currentGroup}`;

    // Add subject selection for registration
    if (!this.isModifying) {
      this.insertSubjectSelection();
    }

    formDiv.classList.remove('d-none');

    await this.loadStudents();
    this.renderStudentTable();
  }

  insertSubjectSelection() {
    if (document.getElementById('subjectSelectionRow')) return;

    const formBody = document.querySelector('#formCalificaciones .table thead');
    const headerRow = formBody.querySelector('tr');

    const subjectRow = document.createElement('tr');
    subjectRow.id = 'subjectSelectionRow';
    subjectRow.innerHTML = `
      <td colspan="3" class="text-center p-3">
        <div class="row align-items-center">
          <div class="col-md-4">
            <label for="subjectSelect" class="form-label">Materia:</label>
            <select id="subjectSelect" class="form-select" required>
              <option value="">Seleccione una materia</option>
            </select>
          </div>
          <div class="col-md-4">
            <label for="gradeScaleSelect" class="form-label">Escala de calificación:</label>
            <select id="gradeScaleSelect" class="form-select">
              <option value="0-100">0-100</option>
              <option value="1-10">1-10</option>
              <option value="A-F">A-F</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Acciones rápidas:</label>
            <div>
              <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="gradeManager.fillAllGrades(100)">
                Poner 100 a todos
              </button>
              <button type="button" class="btn btn-sm btn-outline-secondary" onclick="gradeManager.clearAllGrades()">
                Limpiar todo
              </button>
            </div>
          </div>
        </div>
      </td>
    `;

    headerRow.parentNode.insertBefore(subjectRow, headerRow);
    this.populateSubjectDropdown();

    // Add change listener
    document.getElementById('subjectSelect').addEventListener('change', () => {
      this.currentSubject = document.getElementById('subjectSelect').value;
    });
  }

  async loadStudents() {
    try {
      const groupId = this.getGroupIdByName(this.currentGroup);
      if (!groupId) {
        throw new Error('Grupo no encontrado');
      }

      const response = await apiService.getGroupStudents(groupId);
      this.students = response.data || [];

      if (this.isModifying && this.currentSemester && this.currentSubject) {
        await this.loadExistingGrades();
      }
    } catch (error) {
      console.error('Error loading students:', error);
      this.showError('Error cargando estudiantes');
      this.students = [];
    }
  }

  async loadExistingGrades() {
    try {
      const groupId = this.getGroupIdByName(this.currentGroup);
      const response = await apiService.getGradesByGroup(groupId, this.currentSemester, this.currentSubject);

      this.existingGrades = {};
      response.data.forEach(grade => {
        this.existingGrades[grade.student_id._id] = grade;
        this.originalGrades.set(grade.student_id._id, grade.grade_value);
      });
    } catch (error) {
      console.error('Error loading existing grades:', error);
      this.existingGrades = {};
    }
  }

  getGroupIdByName(groupName) {
    const group = this.teacherGroups.find(g =>
      g.nombre.toLowerCase().includes(groupName.toLowerCase())
    );
    return group ? group._id : null;
  }

  renderStudentTable() {
    const tbody = document.getElementById('tablaEstudiantes');
    tbody.innerHTML = '';

    this.students.forEach(student => {
      const row = document.createElement('tr');
      const existingGrade = this.existingGrades?.[student._id];

      row.innerHTML = `
        <td>${student.nombre} ${student.apellido}</td>
        <td>
          <input type="number"
                 class="form-control grade-input"
                 data-student-id="${student._id}"
                 value="${existingGrade ? existingGrade.grade_value : ''}"
                 min="0"
                 max="100"
                 step="0.1"
                 placeholder="0-100"
                 ${this.isModifying ? '' : 'required'}>
          <div class="invalid-feedback"></div>
        </td>
        <td>
          <textarea class="form-control comments-input"
                    data-student-id="${student._id}"
                    rows="2"
                    placeholder="Comentarios opcionales">${existingGrade ? existingGrade.comments || '' : ''}</textarea>
        </td>
      `;

      tbody.appendChild(row);
    });

    this.bindGradeInputEvents();
  }

  bindGradeInputEvents() {
    document.querySelectorAll('.grade-input').forEach(input => {
      input.addEventListener('input', (e) => this.handleGradeInputChange(e));
      input.addEventListener('blur', (e) => this.validateGradeInput(e.target));
    });

    document.querySelectorAll('.comments-input').forEach(input => {
      input.addEventListener('input', (e) => this.handleCommentsChange(e));
    });
  }

  handleGradeInputChange(e) {
    const studentId = e.target.dataset.studentId;

    if (this.isModifying) {
      const originalValue = this.originalGrades.get(studentId) || '';
      if (e.target.value !== originalValue.toString()) {
        this.unsavedChanges.add(studentId);
        e.target.classList.add('modified');
      } else {
        this.unsavedChanges.delete(studentId);
        e.target.classList.remove('modified');
      }
    }

    this.updateSaveButtonState();
  }

  handleCommentsChange(e) {
    const studentId = e.target.dataset.studentId;
    if (this.isModifying) {
      this.unsavedChanges.add(studentId);
    }
  }

  validateGradeInput(input) {
    const value = parseFloat(input.value);
    const feedback = input.nextElementSibling;

    input.classList.remove('is-valid', 'is-invalid');

    if (isNaN(value) || value < 0 || value > 100) {
      input.classList.add('is-invalid');
      feedback.textContent = 'La calificación debe estar entre 0 y 100';
      return false;
    }

    input.classList.add('is-valid');
    return true;
  }

  setupRealTimeValidation() {
    // Real-time validation for all grade inputs
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('grade-input')) {
        clearTimeout(e.target.validationTimeout);
        e.target.validationTimeout = setTimeout(() => {
          this.validateGradeInput(e.target);
        }, 500);
      }
    });
  }

  async handleFormSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      this.showError('Por favor corrija los errores en el formulario');
      return;
    }

    try {
      this.showLoading(true);

      if (this.isModifying) {
        await this.submitModifications();
      } else {
        await this.submitNewGrades();
      }

      this.showSuccess('Calificaciones guardadas exitosamente');
      this.cancelForm();

    } catch (error) {
      console.error('Error submitting grades:', error);
      this.showError(this.getErrorMessage(error));
    } finally {
      this.showLoading(false);
    }
  }

  validateForm() {
    let isValid = true;

    if (!this.isModifying) {
      const subjectSelect = document.getElementById('subjectSelect');
      if (!subjectSelect || !subjectSelect.value) {
        this.showError('Por favor seleccione una materia');
        return false;
      }
      this.currentSubject = subjectSelect.value;
    }

    document.querySelectorAll('.grade-input').forEach(input => {
      if (!input.disabled && !this.validateGradeInput(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  async submitNewGrades() {
    const grades = [];

    document.querySelectorAll('.grade-input').forEach(input => {
      if (input.value) {
        grades.push({
          student_id: input.dataset.studentId,
          group_id: this.getGroupIdByName(this.currentGroup),
          subject_id: this.currentSubject,
          semester_id: this.getCurrentSemesterId(),
          grade_value: parseFloat(input.value),
          grade_scale: document.getElementById('gradeScaleSelect')?.value || '0-100',
          comments: document.querySelector(`.comments-input[data-student-id="${input.dataset.studentId}"]`).value
        });
      }
    });

    if (grades.length === 0) {
      throw new Error('No hay calificaciones para guardar');
    }

    const response = await apiService.registerGrades(grades);

    if (!response.success) {
      throw new Error(response.message || 'Error registrando calificaciones');
    }

    return response;
  }

  async submitModifications() {
    const modifications = [];

    for (const studentId of this.unsavedChanges) {
      const gradeInput = document.querySelector(`.grade-input[data-student-id="${studentId}"]`);
      const commentsInput = document.querySelector(`.comments-input[data-student-id="${studentId}"]`);
      const existingGrade = this.existingGrades[studentId];

      if (existingGrade && gradeInput.value) {
        modifications.push({
          gradeId: existingGrade._id,
          grade_value: parseFloat(gradeInput.value),
          comments: commentsInput.value,
          change_reason: await this.getChangeReason(studentId)
        });
      }
    }

    if (modifications.length === 0) {
      throw new Error('No hay modificaciones para guardar');
    }

    const results = await Promise.all(
      modifications.map(mod => apiService.modifyGrades(mod.gradeId, mod))
    );

    return results;
  }

  async getChangeReason(studentId) {
    return new Promise((resolve) => {
      Swal.fire({
        title: 'Motivo de la modificación',
        input: 'text',
        inputLabel: 'Por favor especifique el motivo de esta modificación',
        inputPlaceholder: 'Ej: Error de captura, corrección, etc.',
        inputValidator: (value) => {
          if (!value || value.length < 5) {
            return 'El motivo debe tener al menos 5 caracteres';
          }
        },
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        resolve(result.value || 'Modificación de calificación');
      });
    });
  }

  getCurrentSemesterId() {
    if (this.currentSemester) {
      return this.currentSemester;
    }

    const currentSemester = this.semesters.find(s => s.is_current);
    return currentSemester ? currentSemester._id : this.semesters[0]?._id;
  }

  fillAllGrades(value) {
    document.querySelectorAll('.grade-input').forEach(input => {
      if (!input.disabled) {
        input.value = value;
        this.handleGradeInputChange({ target: input });
      }
    });
  }

  clearAllGrades() {
    document.querySelectorAll('.grade-input').forEach(input => {
      if (!input.disabled) {
        input.value = '';
        this.handleGradeInputChange({ target: input });
      }
    });

    document.querySelectorAll('.comments-input').forEach(input => {
      input.value = '';
    });
  }

  setupAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.unsavedChanges.size > 0) {
        this.autoSave();
      }
    }, 60000); // Auto-save every minute
  }

  async autoSave() {
    try {
      // Implementation for auto-save functionality
      console.log('Auto-saving grades...');
      // Would implement a draft save functionality here
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  handleVisibilityChange() {
    if (document.hidden && this.unsavedChanges.size > 0) {
      this.showUnsavedChangesWarning();
    }
  }

  showUnsavedChangesWarning() {
    Swal.fire({
      title: 'Cambios no guardados',
      text: 'Tiene cambios sin guardar. ¿Qué desea hacer?',
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Guardar y salir',
      denyButtonText: 'Salir sin guardar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        document.getElementById('formCalificaciones').dispatchEvent(new Event('submit'));
      } else if (result.isDenied) {
        this.cancelForm();
      }
    });
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const form = document.getElementById('formCalificaciones');
      if (form && !form.classList.contains('d-none')) {
        form.dispatchEvent(new Event('submit'));
      }
    }

    // Escape to cancel
    if (e.key === 'Escape') {
      const form = document.getElementById('formCalificaciones');
      if (form && !form.classList.contains('d-none')) {
        this.cancelForm();
      }
    }
  }

  updateSaveButtonState() {
    const submitBtn = document.querySelector('#formCalificaciones button[type="submit"]');
    if (submitBtn) {
      if (this.unsavedChanges.size > 0) {
        submitBtn.textContent = 'Guardar cambios';
        submitBtn.classList.add('btn-warning');
        submitBtn.classList.remove('btn-success');
      } else {
        submitBtn.textContent = 'Guardar';
        submitBtn.classList.add('btn-success');
        submitBtn.classList.remove('btn-warning');
      }
    }
  }

  cancelForm() {
    document.getElementById('formularioCalificaciones').classList.add('d-none');
    document.getElementById('subjectSelectionRow')?.remove();

    // Reset state
    this.currentGroup = null;
    this.currentSemester = null;
    this.currentSubject = null;
    this.isModifying = false;
    this.students = [];
    this.existingGrades = {};
    this.originalGrades.clear();
    this.unsavedChanges.clear();
  }

  showLoading(show) {
    const submitBtn = document.querySelector('#formCalificaciones button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = show;
      submitBtn.innerHTML = show ?
        '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...' :
        'Guardar';
    }
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

  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }
}

// Initialize the grade manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.gradeManager = new GradeManager();
});

// Clean up when page is unloaded
window.addEventListener('beforeunload', () => {
  if (window.gradeManager) {
    window.gradeManager.destroy();
  }
});