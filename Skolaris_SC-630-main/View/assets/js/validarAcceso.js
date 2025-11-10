const paginasPermitidas = {
  estudiante: [
    'actividades_usuario.html',
    'asistencia_usuario.html',
    'calificaciones_usuario.html',
    'comunicacion_usuario.html',
    'docentes_usuario.html',
    'horarios_usuario.html',
    'inicio_sesion.html',
    'olvide_contrasena.html',
    'perfil.html',
    'reportes_usuario.html',
    'Soporte.html',
    'ver_normativa.html',
    'pagina_principal.html'
  ],
  admin: [
    'actividades_usuario.html',
    'asistencia_usuario.html',
    'calificaciones_usuario.html',
    'comunicacion_usuario.html',
    'docentes_usuario.html',
    'horarios_usuario.html',
    'inicio_sesion.html',
    'olvide_contrasena.html',
    'perfil.html',
    'reportes_usuario.html',
    'Soporte.html',
    'ver_normativa.html',
    'pagina_principal.html',
    'actividades_docente.html',
    'administrador.html',
    'asistencia_docente.html',
    'calificaciones_docente.html',
    'comunicacion_docente.html',
    'docentes_administrador.html',
    'horarios_administrador.html',
    'horarios_docente.html',
    'reportes_docente.html'
  ],
  profesor: [
    'asistencia_docente.html',
    'calificaciones_docente.html',
    'comunicacion_docente.html',
    'horarios_docente.html',
    'inicio_sesion.html',
    'olvide_contrasena.html',
    'perfil.html',
    'reportes_docente.html',
    'Soporte.html',
    'ver_normativa.html',
    'pagina_principal.html'
  ]
};

function validarAcceso() {
  const role = localStorage.getItem('userRole');
  if (!role) {
    alert('No has iniciado sesión.');
    window.location.href = 'inicio_sesion.html'; 
    return;
  }

  const paginaActual = window.location.pathname.split('/').pop();

  if (!paginasPermitidas[role]) {
    alert('Rol no reconocido.');
    window.location.href = 'inicio_sesion.html';
    return;
  }

  if (!paginasPermitidas[role].includes(paginaActual)) {
    alert('No tienes permiso para acceder a esta página.');
    window.location.href = 'pagina_principal.html';
  }
}

validarAcceso();
// Este script se ejecuta al cargar la página para validar el acceso según el rol del usuario
// y redirigirlo si no tiene permiso para ver la página actual. 