document.addEventListener('DOMContentLoaded', function () {

  // Datos de ejemplo (estudiantes por grupo y semestre)
  const estudiantesGrupo1SemestreActual = [
    { nombre: "Christopher Carballo", calificacion: "", comentario: "" },
    { nombre: "María Rodríguez", calificacion: "", comentario: "" }
  ];

  const estudiantesGrupo1SemestreAnterior = [
    { nombre: "Christopher Carballo", calificacion: "80", comentario: "Requiere mejorar" },
    { nombre: "María Rodríguez", calificacion: "90", comentario: "Buen desempeño" }
  ];

  const estudiantesGrupo2SemestreActual = [
    { nombre: "Carlos Gómez", calificacion: "", comentario: "" },
    { nombre: "Ana López", calificacion: "", comentario: "" }
  ];

  const estudiantesGrupo2SemestreAnterior = [
    { nombre: "Carlos Gómez", calificacion: "75", comentario: "Puede mejorar" },
    { nombre: "Ana López", calificacion: "88", comentario: "Excelente trabajo" }
  ];

  // Obtener los botones de modificar calificaciones
  const botonesModificar = document.querySelectorAll('.btnModificar');
  const formularioSeleccionSemestre = document.getElementById('formularioSeleccionSemestre');
  const formularioCalificaciones = document.getElementById('formularioCalificaciones');
  const formulario = document.getElementById('formCalificaciones');
  const tituloFormulario = document.getElementById('tituloFormulario');
  const btnCancelar = document.getElementById('btnCancelar');
  const btnCancelarSeleccion = document.getElementById('btnCancelarSeleccion');
  const btnConfirmar = document.getElementById('btnConfirmar');

  // Función para cargar los estudiantes en la tabla de calificaciones
  function cargarEstudiantes(estudiantes) {
    const tablaEstudiantes = document.getElementById('tablaEstudiantes');
    tablaEstudiantes.innerHTML = ''; // Limpiar la tabla antes de agregar datos

    estudiantes.forEach((estudiante, index) => {
      const fila = document.createElement('tr');

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

      fila.appendChild(celdaNombre);
      fila.appendChild(celdaCalificacion);
      fila.appendChild(celdaComentario);

      tablaEstudiantes.appendChild(fila);
    });
  }

  // Función para mostrar el formulario de selección de semestre
  botonesModificar.forEach(function (boton) {
    boton.addEventListener('click', function () {
      const grupo = boton.getAttribute('data-grupo');

      // Mostrar el formulario para seleccionar semestre
      formularioSeleccionSemestre.classList.remove('d-none');

      // Evento de confirmación de semestre
      btnConfirmar.addEventListener('click', function () {
        const semestreSeleccionado = document.getElementById('semestre').value;

        if (semestreSeleccionado === '') {
          alert('Por favor, seleccione un semestre.');
          return;
        }

        // Cambiar el título del formulario
        tituloFormulario.textContent = `Modificar Calificaciones - Grupo ${grupo} - Semestre ${semestreSeleccionado.charAt(0).toUpperCase() + semestreSeleccionado.slice(1)}`;

        // Cargar los estudiantes según el semestre y grupo seleccionado
        if (grupo === '1A') {
          cargarEstudiantes(semestreSeleccionado === 'actual' ? estudiantesGrupo1SemestreActual : estudiantesGrupo1SemestreAnterior);
        } else if (grupo === '2B') {
          cargarEstudiantes(semestreSeleccionado === 'actual' ? estudiantesGrupo2SemestreActual : estudiantesGrupo2SemestreAnterior);
        }

        // Ocultar el formulario de selección de semestre y mostrar el formulario de calificaciones
        formularioSeleccionSemestre.classList.add('d-none');
        formularioCalificaciones.classList.remove('d-none');
      });

      // Evento de cancelación de selección de semestre
      btnCancelarSeleccion.addEventListener('click', function () {
        formularioSeleccionSemestre.classList.add('d-none');
      });
    });
    
  });

  // Evento para cancelar la modificación de calificaciones
  btnCancelar.addEventListener('click', function () {
    formularioCalificaciones.classList.add('d-none');
  });

  // Evento para guardar las calificaciones
  formulario.addEventListener('submit', function (e) {
    e.preventDefault();

    const grupo = tituloFormulario.textContent.split(" - ")[1].split(" ")[1];
    const semestre = tituloFormulario.textContent.split(" - ")[2].split(" ")[1].toLowerCase();

    const estudiantes = grupo === '1A' ? (semestre === 'actual' ? estudiantesGrupo1SemestreActual : estudiantesGrupo1SemestreAnterior) : 
                                          (semestre === 'actual' ? estudiantesGrupo2SemestreActual : estudiantesGrupo2SemestreAnterior);

    estudiantes.forEach((estudiante, index) => {
      estudiante.calificacion = formulario[`calificacion${index}`].value;
      estudiante.comentario = formulario[`comentario${index}`].value;
    });

    alert('✅ Calificaciones guardadas correctamente');
    formulario.reset();
    formularioCalificaciones.classList.add('d-none');
  });
});
