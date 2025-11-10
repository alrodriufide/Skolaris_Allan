// ==========================
// ✅ FUNCIONES GLOBALES
// ==========================

window.abrirModalEstudiantes = async function (claseId) {
    console.log("📘 Abriendo modal para clase:", claseId);
    window.claseSeleccionadaId = claseId;

    const modalElement = document.getElementById('modalEstudiantes');
    if (!modalElement) return console.error("❌ No existe el modalEstudiantes en el HTML");

    const modal = new bootstrap.Modal(modalElement);
    modal.show();

    await cargarEstudiantesPorClase(claseId);
};

async function cargarEstudiantesPorClase(claseId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return mostrarMensaje("No hay sesión activa.", "warning");

        // 1. Obtener la clase usando el nuevo router académico
        const clase = await fetch(`http://localhost:8000/api/academico/clases/${claseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
            return res.json();
        });

        const grupoId = clase.grupo._id;

        // 2. Obtener estudiantes del grupo usando el nuevo router académico
        const res = await fetch(`http://localhost:8000/api/academico/grupos/${grupoId}/estudiantes`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const estudiantesGrupo = await res.json();

        console.log("👥 Estudiantes del grupo:", estudiantesGrupo);
        mostrarModalEstudiantes(estudiantesGrupo);
    } catch (err) {
        console.error("[ERROR] al cargar estudiantes:", err);
        mostrarMensaje("No se pudieron cargar los estudiantes.", "danger");
    }
}

// Mostrar estudiantes en el modal (sin cambios)
function mostrarModalEstudiantes(estudiantes) {
    const lista = document.getElementById('listaEstudiantes');
    if (!lista) return;

    lista.innerHTML = '';

    if (!estudiantes.length) {
        lista.innerHTML = '<li class="list-group-item text-muted">No hay estudiantes en este grupo.</li>';
        return;
    }

    estudiantes.forEach(est => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
      ${est.nombre} ${est.apellido} (Cédula: ${est.cedula})
      <button class="btn btn-danger btn-sm" onclick="eliminarEstudiante('${est._id}')">Eliminar</button>
    `;
        lista.appendChild(li);
    });
}

window.agregarEstudiante = async function () {
    const cedula = document.getElementById('inputCedulaEstudiante').value.trim();
    if (!cedula) return mostrarMensaje('Ingresa un número de cédula válido.', 'warning');

    try {
        const token = localStorage.getItem('token');
        if (!token) return mostrarMensaje('No hay sesión activa.', 'warning');

        // 1. Buscar estudiante por cédula usando el nuevo router académico
        const resEst = await fetch(`http://localhost:8000/api/usuarios/cedula/${cedula}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (resEst.status === 404) return mostrarMensaje('No se encontró un estudiante con esa cédula.', 'warning');
        if (!resEst.ok) throw new Error(`HTTP ${resEst.status}`);

        const estudiante = await resEst.json();
        if (!estudiante.rol.includes('Estudiante'))
            return mostrarMensaje('Solo se pueden agregar estudiantes al grupo.', 'warning');

        // 2. Obtener grupoId de la clase actual usando el nuevo router
        const clase = await fetch(`http://localhost:8000/api/academico/clases/${window.claseSeleccionadaId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json());

        const grupoId = clase.grupo._id;

        // 3. Agregar estudiante al grupo usando el nuevo router académico
        const resAdd = await fetch(`http://localhost:8000/api/academico/grupos/${grupoId}/estudiantes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ estudianteId: estudiante._id })
        });

        if (!resAdd.ok) throw new Error(`Error HTTP ${resAdd.status}`);

        await cargarEstudiantesPorClase(window.claseSeleccionadaId);
        document.getElementById('inputCedulaEstudiante').value = '';
        mostrarMensaje('Estudiante agregado correctamente.', 'success');

    } catch (err) {
        console.error('[ERROR] Error al agregar estudiante:', err);
        mostrarMensaje(err.message, 'danger');
    }
};

window.eliminarEstudiante = async function (estudianteId) {
    const confirmar = confirm('¿Eliminar a este estudiante?');
    if (!confirmar) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/academico/grupos/estudiantes/${estudianteId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

        await cargarEstudiantesPorClase(window.claseSeleccionadaId);
        mostrarMensaje('Estudiante eliminado correctamente.', 'success');

    } catch (err) {
        console.error('[ERROR] Error al eliminar estudiante:', err);
        mostrarMensaje(err.message, 'danger');
    }
};

// ==========================
// ✅ CUANDO CARGA EL DOM
// ==========================
document.addEventListener('DOMContentLoaded', async function () {
    console.log("✅ Página de horarios_docente cargada");

    window.mostrarMensaje = function (msg, tipo = 'danger', duracion = 3000) {
        const contenedor = document.getElementById('mensajeEstudiante');
        if (!contenedor) return;

        contenedor.innerHTML = `
      <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

        setTimeout(() => {
            const alertDiv = contenedor.querySelector('.alert');
            if (alertDiv) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
                bsAlert.close();
            }
        }, duracion);
    };

    async function cargarClasesEnCards() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("⚠️ No hay token guardado en localStorage");
            return mostrarMensaje('Sesión expirada. Inicia sesión nuevamente.', 'warning');
        }

        try {
            // Usar el nuevo router académico para obtener clases
            const res = await fetch('http://localhost:8000/api/academico/clases', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) throw new Error(`Error ${res.status}`);
            const clases = await res.json();

            console.log("📚 Clases recibidas:", clases);

            const contenedor = document.querySelector('.list-group');
            if (!contenedor) return console.error('❌ No existe el contenedor .list-group');

            contenedor.innerHTML = '';

            if (clases.length === 0) {
                contenedor.innerHTML = `<p class="text-muted">No hay clases asignadas.</p>`;
                return;
            }

            clases.forEach(clase => {
                const grupoNombre = clase.grupo?.nombre || 'Grupo';
                const materiaNombre = clase.materia?.nombre || 'Materia';
                const horario = clase.horario
                    ? `${clase.horario.dia} ${clase.horario.horaInicio} - ${clase.horario.horaFin}`
                    : 'Horario no definido';

                const div = document.createElement('div');
                div.className = 'mb-3 p-3 border rounded shadow-sm';
                div.innerHTML = `
          <h5>${grupoNombre} - ${materiaNombre}</h5>
          <p>Horario: ${horario}</p>
          <button class="btn btn-sm btn-primary" onclick="abrirModalEstudiantes('${clase._id}')">
            Ver Estudiantes
          </button>
        `;
                contenedor.appendChild(div);
            });
        } catch (err) {
            console.error('[ERROR] Error al cargar clases:', err);
            mostrarMensaje('Error al cargar clases.', 'danger');
        }
    }

    await cargarClasesEnCards();
});