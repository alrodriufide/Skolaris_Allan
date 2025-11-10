document.addEventListener('DOMContentLoaded', async () => {
  const tabla = document.querySelector('.schedule-table tbody');

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  const horasBase = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00'];

  // Obtener token y extraer grupoId
  const token = localStorage.getItem('token');
  if (!token) {
    alert("No se encontró token. Por favor inicia sesión.");
    window.location.href = "login.html";
    return;
  }

  let grupoId;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    grupoId = payload.grupo;
    if (!grupoId) {
      alert("No se encontró grupoId en el token.");
      return;
    }
  } catch (err) {
    console.error("Error al decodificar token:", err);
    alert("Token inválido. Por favor inicia sesión de nuevo.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:8000/api/horarios/bloques/${grupoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const bloques = await res.json();
    if (!Array.isArray(bloques)) throw new Error("Formato de respuesta no esperado");

    tabla.innerHTML = '';

    horasBase.forEach(hora => {
      const fila = document.createElement('tr');
      const tdHora = document.createElement('td');
      tdHora.textContent = hora;
      fila.appendChild(tdHora);

      diasSemana.forEach(dia => {
        const celda = document.createElement('td');

        const clase = bloques.find(b =>
          b.dia === dia &&
          b.horaInicio.slice(0, 5) === hora.padStart(5, '0')
        );

        if (clase) {
          const div = document.createElement('div');
          div.className = 'class-block';
          div.textContent = clase.materia;

          div.onclick = () => showModal(
            clase.materia,
            `${clase.horaInicio} - ${clase.horaFin}`,
            `Profe: ${clase.docente}`,
            clase.aula || 'Sin comentarios'
          );

          celda.appendChild(div);
        }

        fila.appendChild(celda);
      });

      tabla.appendChild(fila);
    });

  } catch (err) {
    console.error('Error al cargar horarios:', err);
    alert('No se pudieron obtener los horarios.');
  }
});
