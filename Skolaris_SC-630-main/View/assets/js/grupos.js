import { apiFetch, getToken } from "./comunes/api.js";

const API_GRUPOS = "/academico/grupos";

const gradoSelect = document.getElementById("grado");
const grupoSelect = document.getElementById("grupo");
const nombreGrupo = document.getElementById("nombreGrupo");


// Abrir modal grupo
btnAgregarGrupo.onclick = () => {
    bootstrap.Modal.getInstance(modalClase)?.hide();
    nombreGrupo.value = "";
    new bootstrap.Modal(modalGrupo).show();
};

// Guardar grupo
btnGuardarGrupo.onclick = async () => {
    const nombre = nombreGrupo.value.trim();
    const grado = gradoSelect.value;

    if (!nombre || !grado) return Swal.fire({ icon: "error", text: "Complete los campos" });

    const nuevo = await apiFetch(API_GRUPOS, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
        body: JSON.stringify({ nombre, grado })
    });

    grupoSelect.add(new Option(nuevo.nombre, nuevo._id, true, true));

    bootstrap.Modal.getInstance(modalGrupo).hide();
    new bootstrap.Modal(modalClase).show();
    Swal.fire({ icon: "success", title: "Grupo creado" });
};

export async function cargarGruposEnSelect() {
    const lista = await apiFetch(API_GRUPOS, { headers: { "Authorization": "Bearer " + getToken() } });

    grupoSelect.innerHTML = `<option value="">Seleccione un grupo</option>`;
    lista.forEach(g => grupoSelect.add(new Option(g.nombre, g._id)));
}

// Exportado porque lo usa clases.js
export const cargarDocentes = async () => { }; // <- Ya lo moveremos aquí si quieres
