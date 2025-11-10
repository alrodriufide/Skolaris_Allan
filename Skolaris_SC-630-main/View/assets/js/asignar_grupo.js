document.addEventListener("DOMContentLoaded", async () => {
  const tabla = document.getElementById("tabla-estudiantes");
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Token no encontrado. Por favor inicia sesión.");
    return;
  }

  try {
    const [usuariosRes, gruposRes] = await Promise.all([
      fetch("http://localhost:8000/api/usuarios?rol=Estudiante", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("http://localhost:8000/api/grupos", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!usuariosRes.ok || !gruposRes.ok)
      throw new Error("Error al cargar datos");

    const estudiantes = await usuariosRes.json();
    const grupos = await gruposRes.json();

    estudiantes.forEach((est) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${est.nombre || "Sin nombre"}</td>
        <td>${est.email}</td>
        <td class="grupo-actual" data-id="${est._id}">${
        est.grupo && est.grupo.nombre ? est.grupo.nombre : "Ninguno"
      }</td>
        <td>
          <select class="form-select grupo-select" data-id="${est._id}">
            <option value="">-- Seleccionar --</option>
            ${grupos
              .map((g) => `<option value="${g._id}">${g.nombre}</option>`)
              .join("")}
          </select>
        </td>
        <td>
          <button class="btn btn-success btn-asignar" data-id="${
            est._id
          }">Asignar</button>
        </td>
      `;
      tabla.appendChild(tr);
    });

    // Manejadores para los botones
    document.querySelectorAll(".btn-asignar").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const select = document.querySelector(`select[data-id="${id}"]`);
        const grupoId = select.value;

        if (!grupoId) return alert("Selecciona un grupo.");

        try {
          const res = await fetch(
            `http://localhost:8000/api/usuarios/${id}/asignar-grupo`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ grupoId }),
            }
          );

          const data = await res.json();

          if (res.ok) {
            alert("Grupo asignado correctamente");

            // Obtener el nombre del grupo desde el <select>
            const nombreGrupo = select.options[select.selectedIndex].text;

            // Actualizar solo el texto de la columna de grupo
            const celdaGrupo = document.querySelector(
              `td.grupo-actual[data-id="${id}"]`
            );
            if (celdaGrupo) celdaGrupo.textContent = nombreGrupo;
          } else {
            alert("Error: " + (data.error || "No se pudo asignar"));
          }
        } catch (error) {
          console.error("Error al asignar grupo:", error);
          alert("Error inesperado al asignar grupo.");
        }
      });
    });
  } catch (err) {
    console.error("Error:", err);
    alert("Hubo un problema al cargar los datos.");
  }
});
