import { apiFetch } from "./comunes/api.js";

const API_DOCENTES = "/usuarios?rol=Docente";

export async function cargarDocentes() {
    const lista = await apiFetch(API_DOCENTES);

    const select = document.getElementById("docente");
    if (!select) return; // Evita errores si se llama en otra vista

    select.innerHTML = `<option value="">Seleccione un docente</option>`;

    lista.forEach(d =>
        select.add(new Option(`${d.nombre} ${d.apellido}`, d._id))
    );
}
