import { apiFetch, getToken } from "./comunes/api.js";

const API_GRADOS = "/grados";

btnAgregarGrado.onclick = () => {
    nombreGrado.value = "";
    const modal = new bootstrap.Modal(modalGrado, { backdrop: 'static', keyboard: false });
    modal.show();
};

btnGuardarGrado.onclick = async () => {
    const nombre = nombreGrado.value.trim();
    if (!nombre) return Swal.fire({ icon: "error", text: "Ingrese un nombre" });

    const nuevo = await apiFetch(API_GRADOS, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + getToken() },
        body: JSON.stringify({ nombre })
    });

    grado.add(new Option(nuevo.nombre, nuevo._id, true, true));

    bootstrap.Modal.getInstance(modalGrado).hide();
    new bootstrap.Modal(modalClase).show();
    Swal.fire({ icon: "success", title: "Grado creado" });
};

export async function cargarGrados() {
    const lista = await apiFetch(API_GRADOS, { headers: { "Authorization": "Bearer " + getToken() } });

    grado.innerHTML = `<option value="">Seleccione un grado</option>`;
    lista.forEach(g => grado.add(new Option(g.nombre, g._id)));
}
