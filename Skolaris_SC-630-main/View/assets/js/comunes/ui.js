function mostrarMensaje(msg, tipo = "danger", duracion = 3000) {
    const contenedor = document.getElementById("mensajeGeneral");
    if (!contenedor) return;

    contenedor.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${msg}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
    setTimeout(() => {
        const alerta = contenedor.querySelector(".alert");
        if (alerta) bootstrap.Alert.getOrCreateInstance(alerta).close();
    }, duracion);
}
