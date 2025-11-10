document.addEventListener('DOMContentLoaded', async () => {
  const tabla = document.querySelector('.schedule-table tbody');

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horasBase = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00'];

  const token = localStorage.getItem('token');
  if (!token) return alert("No hay token disponible. Inicia sesión nuevamente.");

  try {
    // Obtener usuario actual (con grupo poblado)
    const userRes = await fetch('http://localhost:8000/api/usuarios/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userRes.ok) throw new Error('No se pudo obtener la información del usuario.');

    const userData = await userRes.json();

    if (!userData.grupo || !userData.grupo._id) {
      tabla.innerHTML = '<tr><td colspan="6">No tienes un grupo asignado actualmente.</td></tr>';
      return;
    }

    const grupoId = userData.grupo._id;

    // Actualizar la URL para usar el endpoint correcto
    const res = await fetch(`http://localhost:8000/api/academico/clases/bloques/${grupoId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Error al obtener los horarios del grupo.');

    const bloques = await res.json();

    console.log("Bloques recibidos:", bloques);

    tabla.innerHTML = '';

    horasBase.forEach(hora => {
      const fila = document.createElement('tr');
      const tdHora = document.createElement('td');
      tdHora.textContent = hora;
      fila.appendChild(tdHora);

      diasSemana.forEach(dia => {
        const celda = document.createElement('td');

        // Normalizar hora para comparar (acepta '7:00' y '07:00')
        const horaNorm = hora.length === 4 ? '0' + hora : hora;

        const clase = bloques.find(b =>
          b.horario?.dia === dia &&
          b.horario?.horaInicio.slice(0, 5) === horaNorm.slice(0, 5)
        );

        if (clase) {
          const div = document.createElement('div');
          div.className = 'class-block';
          div.textContent = clase.materia?.nombre || 'Clase';

          div.onclick = () => {
            showModal(
              clase.materia?.nombre || 'Clase',
              `${clase.horario?.horaInicio} - ${clase.horario?.horaFin}`,
              `Profesor: ${clase.docente ? clase.docente.nombre + ' ' + clase.docente.apellido : 'N/A'}`,
              clase.horario?.aula || clase.horario?.comentario || 'Sin detalles'
            );
          };
          celda.appendChild(div);
        }
        fila.appendChild(celda);
      });

      tabla.appendChild(fila);
    });

  } catch (err) {
    console.error('Error al cargar horarios:', err);
    alert('No se pudieron obtener los horarios. Verifica tu conexión o sesión.');
  }
});

// Pequeña implementación de modal para evitar errores si no existe
function showModal(titulo, horario, docente, detalle) {
  const mensaje = `${titulo}\n${horario}\n${docente}\n${detalle}`;
  alert(mensaje);
}