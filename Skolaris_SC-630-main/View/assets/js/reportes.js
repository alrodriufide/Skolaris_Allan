document.addEventListener('DOMContentLoaded', function() {
  
    // Obtener los elementos de los reportes y botones
    const btnConfirmarCalificaciones = document.getElementById('btnConfirmarCalificaciones');
    const btnConfirmarAsistencias = document.getElementById('btnConfirmarAsistencias');
    const mensajeConfirmacion = document.getElementById('mensajeConfirmacion');
    const btnOk = document.getElementById('btnOk');
    const mensajeCalificaciones = document.getElementById('mensajeCalificaciones');
    const mensajeAsistencias = document.getElementById('mensajeAsistencias');
    
    // Controlar la disponibilidad de los reportes (simulado aquí)
    const reporteCalificacionesDisponible = true;  // Cambiar a `false` si el reporte no está disponible
    const reporteAsistenciasDisponible = false;   // Cambiar a `false` si el reporte no está disponible
  
    // Mostrar/ocultar los mensajes de disponibilidad de los reportes
    if (!reporteCalificacionesDisponible) {
      mensajeCalificaciones.classList.remove('d-none');
      document.getElementById('checkboxCalificaciones').disabled = true;  // Desactivar checkbox
    } else {
      mensajeCalificaciones.classList.add('d-none');
      document.getElementById('checkboxCalificaciones').disabled = false;  // Habilitar checkbox
    }
  
    if (!reporteAsistenciasDisponible) {
      mensajeAsistencias.classList.remove('d-none');
      document.getElementById('checkboxAsistencias').disabled = true;  // Desactivar checkbox
    } else {
      mensajeAsistencias.classList.add('d-none');
      document.getElementById('checkboxAsistencias').disabled = false;  // Habilitar checkbox
    }
  
    // Habilitar botón "Confirmar" solo cuando el checkbox esté marcado
    document.getElementById('checkboxCalificaciones').addEventListener('change', function() {
      btnConfirmarCalificaciones.disabled = !this.checked;
    });
  
    document.getElementById('checkboxAsistencias').addEventListener('change', function() {
      btnConfirmarAsistencias.disabled = !this.checked;
    });
  
    // Función para manejar la confirmación de la lectura del reporte
    function confirmarLectura(reporte) {
      if (!reporte.checked) {
        alert('Debe marcar el checkbox antes de confirmar.');
        return;
      }
  
      // Mostrar el mensaje de confirmación
      mensajeConfirmacion.classList.remove('d-none');
    }
  
    // Evento para el botón de Confirmar Calificaciones
    btnConfirmarCalificaciones.addEventListener('click', function() {
      const checkboxCalificaciones = document.getElementById('checkboxCalificaciones');
      confirmarLectura(checkboxCalificaciones);
    });
  
    // Evento para el botón de Confirmar Asistencias
    btnConfirmarAsistencias.addEventListener('click', function() {
      const checkboxAsistencias = document.getElementById('checkboxAsistencias');
      confirmarLectura(checkboxAsistencias);
    });
  
    // Evento para el botón "Ok" en el mensaje de confirmación
    btnOk.addEventListener('click', function() {
      mensajeConfirmacion.classList.add('d-none');
      alert('✅ Su confirmación ha sido registrada.');
    });

    //ASISTENCIA
    
  });
  