import { apiFetch, getToken } from "./comunes/api.js";

const API_HORARIOS = "/horarios";

btnAgregarHorario.onclick = () => {
    bootstrap.Modal.getInstance(modalClase)?.hide();
    diaHorario.value = horaInicioHorario.value = horaFinHorario.value = aulaHorario.value = comentarioHorario.value = "";
    new bootstrap.Modal(modalHorario).show();
};

btnGuardarHorario.onclick = async () => {
    const body = {
        dia: diaHorario.value,
        horaInicio: horaInicioHorario.value,
        horaFin: horaFinHorario.value,
        aula: aulaHorario.value,
        comentario: comentarioHorario.value,
        grupoId: grupo.value
    };

    const nuevo = await apiFetch(API_HORARIOS, {
        method: "POST",
        body: JSON.stringify(body)
    });

    Swal.fire({ icon: "success", title: "Horario creado" });
};

export async function cargarHorariosEnSelect() {
    const lista = await apiFetch(API_HORARIOS);

    horario.innerHTML = `<option value="">Seleccione un horario</option>`;
    lista.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h._id;
        opt.textContent = `${h.dia} (${h.horaInicio}-${h.horaFin})`;
        opt.dataset.dia = h.dia;
        opt.dataset.horainicio = h.horaInicio;
        opt.dataset.horafin = h.horaFin;
        opt.dataset.aula = h.aula;
        horario.appendChild(opt);
    });
}
