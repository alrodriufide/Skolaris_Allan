// Esperamos que todo el documento esté completamente cargado
document.addEventListener('DOMContentLoaded', function () {
  
  // Datos "quemados" de los estudiantes para cada grupo
  const estudiantesGrupo1 = [
    { nombre: "Christopher Carballo", calificacion: "", comentario: "" },
    { nombre: "Maria Medina", calificacion: "", comentario: "" }
  ];
  
  const estudiantesGrupo2 = [
    { nombre: "Carlos Madrigal", calificacion: "", comentario: "" },
    { nombre: "Nancy Guillén", calificacion: "", comentario: "" }
  ];

  // Obtenemos todos los botones de Registrar Calificaciones
  const botonesRegistrar = document.querySelectorAll('.btnRegistrar');
  
  // Obtenemos elementos del formulario
  const formulario = document.getElementById('formularioCalificaciones');
  const tituloFormulario = document.getElementById('tituloFormulario');
  const form = document.getElementById('formCalificaciones');
  const btnCancelar = document.getElementById('btnCancelar');
  
  // Función para cargar los datos de los estudiantes en la tabla
  function cargarEstudiantes(estudiantes) {
    const tablaEstudiantes = document.getElementById('tablaEstudiantes');
    tablaEstudiantes.innerHTML = ''; // Limpiar la tabla antes de agregar los datos
    
    estudiantes.forEach((estudiante, index) => {
      // Crear la fila para cada estudiante
      const fila = document.createElement('tr');

      // Crear celdas para el nombre, calificación y comentarios
      const celdaNombre = document.createElement('td');
      celdaNombre.textContent = estudiante.nombre;

      const celdaCalificacion = document.createElement('td');
      const inputCalificacion = document.createElement('input');
      inputCalificacion.type = 'number';
      inputCalificacion.classList.add('form-control');
      inputCalificacion.value = estudiante.calificacion;
      inputCalificacion.name = `calificacion${index}`;
      celdaCalificacion.appendChild(inputCalificacion);

      const celdaComentario = document.createElement('td');
      const textareaComentario = document.createElement('textarea');
      textareaComentario.classList.add('form-control');
      textareaComentario.rows = '1';
      textareaComentario.placeholder = 'Opcional';
      textareaComentario.name = `comentario${index}`;
      textareaComentario.value = estudiante.comentario;
      celdaComentario.appendChild(textareaComentario);

      // Añadir las celdas a la fila
      fila.appendChild(celdaNombre);
      fila.appendChild(celdaCalificacion);
      fila.appendChild(celdaComentario);

      // Añadir la fila a la tabla
      tablaEstudiantes.appendChild(fila);
    });
  }

  // Recorremos cada botón y agregamos el evento de click
  botonesRegistrar.forEach(function (boton) {
    boton.addEventListener('click', function () {
      const grupo = boton.getAttribute('data-grupo');
      
      // Cambiamos el título del formulario
      tituloFormulario.textContent = `Registrar Calificaciones - Grupo ${grupo}`;
      
      // Cargar los estudiantes dependiendo del grupo
      if (grupo === '1A') {
        cargarEstudiantes(estudiantesGrupo1);
      } else if (grupo === '2B') {
        cargarEstudiantes(estudiantesGrupo2);
      }

      // Mostramos el formulario
      formulario.classList.remove('d-none');
    });
  });

  // Evento para cancelar y ocultar el formulario
  btnCancelar.addEventListener('click', function () {
    formulario.classList.add('d-none');
  });

  // Evento para enviar el formulario (simulado)
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    
    // Guardar las calificaciones y comentarios
    const grupo = tituloFormulario.textContent.split(" - ")[1].split(" ")[1]; // Obtener el grupo
    
    const estudiantes = grupo === '1A' ? estudiantesGrupo1 : estudiantesGrupo2;

    estudiantes.forEach((estudiante, index) => {
      estudiante.calificacion = form[`calificacion${index}`].value;
      estudiante.comentario = form[`comentario${index}`].value;
    });
    
    alert('✅ Calificaciones guardadas correctamente');
    form.reset();
    formulario.classList.add('d-none');
  });
});
