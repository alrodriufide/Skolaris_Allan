// /js/clases.js
import { apiFetch } from "./comunes/api.js";
import { cargarDocentes } from "./docentes.js";
import { cargarGruposEnSelect } from "./grupos.js";
import { cargarHorariosEnSelect } from "./horarios_administrador.js";
import { cargarMateriasEnSelect } from "./materias.js";
import { cargarGrados } from "./grados.js";

let claseEditando = null;

// Abrir modal para crear / editar clase
window.abrirFormulario = async (modo, claseId = null) => {
    await cargarDocentes();
    await cargarHorariosEnSelect();
    await cargarMateriasEnSelect();
    await cargarGruposEnSelect();
    await cargarGrados();

    document.getElementById('modalClaseTitulo').innerText =
        modo === 'editar' ? 'Editar Clase' : 'Agregar Clase';

    document.getElementById('btnGuardarClase').onclick =
        modo === 'editar' ? actualizarClase : crearClase;

    if (modo === 'editar') {
        const data = await apiFetch(`/clases/${claseId}`);
        claseEditando = data;

        document.getElementById('docente').value = data.docente?._id || "";
        document.getElementById('grupo').value = data.grupo?._id || "";
        document.getElementById('horario').value = data.horario?._id || "";
        document.getElementById('materia').value = data.materia?._id || "";
        document.getElementById('grado').value = data.grado?._id || "";
    }

    new bootstrap.Modal(document.getElementById('modalClase')).show();
};

// Cargar clases en la tabla
export async function cargarClasesEnTabla() {
    const clases = await apiFetch(`/clases`);
    const tbody = document.getElementById('tablaClasesBody');
    tbody.innerHTML = '';

    clases.forEach(c => {
        const row = tbody.insertRow();

        // Docente
        row.insertCell().textContent = c.docente
            ? `${c.docente.nombre} ${c.docente.apellido}`
            : '';

        // Materia
        row.insertCell().textContent = c.materia?.nombre || '';

        // Grupo
        row.insertCell().textContent = c.grupo?.nombre || '';

        // Día
        row.insertCell().textContent = c.horario?.dia || '';

        // Hora
        row.insertCell().textContent = c.horario
            ? `${c.horario.horaInicio} - ${c.horario.horaFin}`
            : '';

        // Aula
        row.insertCell().textContent = c.horario?.aula || '';

        // Acciones
        const accionesCell = row.insertCell();
        accionesCell.innerHTML = `
            <button class="btn btn-sm btn-primary" onclick="abrirFormulario('editar','${c._id}')">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="eliminarClase('${c._id}')">Eliminar</button>
        `;
    });
}

async function crearClase() {
    const materiaInput = document.getElementById('materia');
    const docenteInput = document.getElementById('docente');
    const grupoInput = document.getElementById('grupo');
    const horarioSelect = document.getElementById('horario');

    const body = {
        materia: materiaInput.value,
        docente: docenteInput.value,
        grupo: grupoInput.value,
        horario: horarioSelect.value   // 👈 ahora enviamos el ID del horario
    };

    if (!body.materia || !body.docente || !body.grupo || !body.horario) {
        return Swal.fire({ icon: "error", text: "Complete todos los campos de la clase" });
    }

    try {
        await apiFetch(`/clases`, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        Swal.fire({ icon: "success", title: "Clase creada" });
    } catch (err) {
        Swal.fire({ icon: "error", title: "Error al crear clase", text: err.message });
    }

    bootstrap.Modal.getInstance(document.getElementById('modalClase')).hide();
    cargarClasesEnTabla();
}

async function actualizarClase() {
    if (!claseEditando) return;

    const materiaInput = document.getElementById('materia');
    const docenteInput = document.getElementById('docente');
    const grupoInput = document.getElementById('grupo');
    const horarioSelect = document.getElementById('horario');

    const body = {
        materia: materiaInput.value,
        docente: docenteInput.value,
        grupo: grupoInput.value,
        horario: horarioSelect.value   // 👈 igual que en crearClase
    };

    if (!body.materia || !body.docente || !body.grupo || !body.horario) {
        return Swal.fire({ icon: "error", text: "Complete todos los campos de la clase" });
    }

    try {
        await apiFetch(`/clases/${claseEditando._id}`, {
            method: "PUT",
            body: JSON.stringify(body)
        });

        Swal.fire({ icon: "success", title: "Clase actualizada" });
    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Error al actualizar",
            text: err.message || "Algo salió mal"
        });
    }

    bootstrap.Modal.getInstance(document.getElementById('modalClase')).hide();
    cargarClasesEnTabla();
}

window.eliminarClase = async id => {
    await apiFetch(`/clases/${id}`, { method: 'DELETE' });
    cargarClasesEnTabla();
};

document.addEventListener("DOMContentLoaded", cargarClasesEnTabla);
