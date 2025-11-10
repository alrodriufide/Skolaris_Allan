import { apiFetch, getToken } from "./comunes/api.js";

const API_MATERIAS = "/academico/materias";

// Abrir modal agregar materia
document.getElementById('btnAgregarMateria').onclick = () => {
    bootstrap.Modal.getInstance(modalClase)?.hide();
    nombreMateria.value = "";
    new bootstrap.Modal(modalMateria).show();
};

// Guardar materia
document.getElementById('btnGuardarMateria').onclick = async () => {
    const nombre = nombreMateria.value.trim();
    if (!nombre) return Swal.fire({ icon: "error", text: "Ingrese un nombre" });

    const nueva = await apiFetch(API_MATERIAS, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getToken()
        },
        body: JSON.stringify({ nombre })
    });

    // Agregar al select
    const opt = new Option(nueva.nombre, nueva._id, true, true);
    materia.add(opt);

    bootstrap.Modal.getInstance(modalMateria).hide();
    new bootstrap.Modal(modalClase).show();

    Swal.fire({ icon: "success", title: "Materia creada" });
};

// Cargar materias en select (reutilizable)
export async function cargarMateriasEnSelect() {
    try {
        const data = await apiFetch(API_MATERIAS, {
            headers: { "Authorization": "Bearer " + getToken() }
        });

        materia.innerHTML = `<option value="">Seleccione una materia</option>`;

        (data || []).forEach(m =>
            materia.add(new Option(m.nombre, m._id))
        );

    } catch (err) {
        Swal.fire({
            icon: "error",
            title: "Error al cargar materias",
            text: err.message || "Intente nuevamente"
        });
        console.error("Error cargando materias:", err);
    }
}
