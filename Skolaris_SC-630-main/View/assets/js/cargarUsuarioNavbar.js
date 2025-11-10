document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return alert("No hay token");

  try {
    const response = await fetch('http://localhost:8000/api/usuarios/me', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('No autorizado');

    const user = await response.json();

    const nombreSpan = document.querySelector('.media-body .mb-0.font-small.text-gray-900');
    if (nombreSpan) {
      nombreSpan.textContent = `${user.nombre} ${user.apellido}`;
    }

    const avatarImg = document.querySelector('.media .avatar.rounded-circle');
    if (avatarImg && user.foto) {
      avatarImg.src = user.foto;
    }

  } catch (error) {
    console.error('Error cargando usuario:', error);
  }
});
