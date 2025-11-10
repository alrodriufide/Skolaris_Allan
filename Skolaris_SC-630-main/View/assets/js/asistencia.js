// reportes.js

// Datos de asistencia simulados
const asistenciaData = [
    { fecha: '2025-01-10', asistio: true },
    { fecha: '2025-01-11', asistio: false },
    { fecha: '2025-01-12', asistio: true },
    { fecha: '2025-01-13', asistio: true },
    { fecha: '2025-01-14', asistio: false }
  ];
  
  // Función para mostrar la tabla de asistencia
  function mostrarTablaAsistencia() {
    const tbody = document.getElementById('asistenciaTable');
    // Limpiar cualquier dato previo
    tbody.innerHTML = "";
  
    asistenciaData.forEach(registro => {
      const tr = document.createElement('tr');
      
      // Columna de fecha
      const tdFecha = document.createElement('td');
      tdFecha.textContent = registro.fecha;
      tr.appendChild(tdFecha);
  
      // Columna de estado con estilos: verde si asistió, rojo si no
      const tdEstado = document.createElement('td');
      tdEstado.textContent = registro.asistio ? "Asistió" : "No Asistió";
      tdEstado.style.color = registro.asistio ? "green" : "red";
      tr.appendChild(tdEstado);
  
      tbody.appendChild(tr);
    });
  }
  
  // Función para simular la generación del reporte PDF (mostrar el contenedor)
  function generarReportePDF() {
    document.getElementById('pdfContainer').style.display = 'block';
    alert("PDF generado con éxito. Ahora puedes descargarlo.");
  }
  
  // Función para generar y descargar un PDF válido usando jsPDF,
  // incluyendo el semestre seleccionado
  function descargarPDF() {
    // Obtener el semestre seleccionado
    const semestreSelect = document.getElementById('semestreSelect');
    let semestreTexto = "No especificado";
    if (semestreSelect && semestreSelect.value) {
      switch(semestreSelect.value) {
        case "primero":
          semestreTexto = "Primer Semestre";
          break;
        case "segundo":
          semestreTexto = "Segundo Semestre";
          break;
        case "tercero":
          semestreTexto = "Tercer Semestre";
          break;
        default:
          semestreTexto = semestreSelect.value;
      }
    }
  
    // Obtenemos jsPDF del objeto global
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    // Agregar contenido al PDF
    doc.setFontSize(16);
    doc.text("Reporte de Asistencia", 10, 20);
    
    doc.setFontSize(12);
    doc.text("Datos del Estudiante:", 10, 30);
    doc.text("Nombre: Christopher", 10, 40);
    doc.text("Apellidos: Carballo", 10, 50);
    doc.text("Correo: chris@skolaris.ac.cr", 10, 60);
    
    // Información del semestre seleccionado
    doc.text(`Semestre: ${semestreTexto}`, 10, 70);
    
    doc.text("Asistencias:", 10, 90);
    let offsetY = 100;
    asistenciaData.forEach((registro, index) => {
      doc.text(`${registro.fecha}: ${registro.asistio ? "Asistió" : "No Asistió"}`, 10, offsetY + (index * 10));
    });
  
    doc.save('reporte_asistencia.pdf');
  }
  
  // Inicialización de eventos cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM completamente cargado y analizado.");
  
    const confirmSemestreBtn = document.getElementById('confirmSemestre');
    if (confirmSemestreBtn) {
      confirmSemestreBtn.addEventListener('click', function () {
        console.log("Botón Confirmar Semestre clickeado.");
        // Se permite cambiar de semestre, por lo que se "resetea" cualquier PDF generado
        document.getElementById('pdfContainer').style.display = 'none';
  
        // Se muestra el contenedor y se actualiza la tabla de asistencias
        const asistenciaContainer = document.getElementById('asistenciaContainer');
        if (asistenciaContainer) {
          asistenciaContainer.style.display = 'block';
          mostrarTablaAsistencia();
        } else {
          console.error("No se encontró el contenedor de asistencia (asistenciaContainer).");
        }
      });
    } else {
      console.error("No se encontró el botón de Confirmar Semestre (confirmSemestre).");
    }
    
    const generarReporteBtn = document.getElementById('generarReporte');
    if (generarReporteBtn) {
      generarReporteBtn.addEventListener('click', function () {
        console.log("Botón Generar Reporte clickeado.");
        generarReportePDF();
      });
    } else {
      console.error("No se encontró el botón de Generar Reporte (generarReporte).");
    }
    
    const descargarPDFBtn = document.getElementById('descargarPDF');
    if (descargarPDFBtn) {
      descargarPDFBtn.addEventListener('click', function () {
        console.log("Botón Descargar PDF clickeado.");
        descargarPDF();
      });
    } else {
      console.error("No se encontró el botón de Descargar PDF (descargarPDF).");
    }
  });
  