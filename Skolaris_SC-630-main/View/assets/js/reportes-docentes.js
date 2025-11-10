// js/reportes-docentes.js

document.addEventListener('DOMContentLoaded', () => {
    // 1) Datos hardcodeados de grupos
    const groups = [
      { id: '1A', name: 'Grupo 1A' },
      { id: '2B', name: 'Grupo 2B' }
    ];
  
    // 2) Datos hardcodeados de confirmaciones
    //    Separados por tipo y por id de grupo
    const confirmaciones = {
      calificaciones: {
        '1A': [
          { studentName: 'Christopher Carballo', confirmed: true },
          { studentName: 'Carlos Madrigal', confirmed: false },
          { studentName: 'Nancy Guillén', confirmed: true }
        ],
        '2B': [
          { studentName: 'Luis Martínez', confirmed: true },
          { studentName: 'Sofía Díaz', confirmed: true },
          { studentName: 'Mariana Torres', confirmed: false }
        ]
      },
      asistencias: {
        '1A': [
          { studentName: 'Christopher Carballo', confirmed: false },
          { studentName: 'Carlos Madrigal', confirmed: true },
          { studentName: 'Nancy Guillén', confirmed: false }
        ],
        '2B': [
          { studentName: 'Luis Martínez', confirmed: false },
          { studentName: 'Sofía Díaz', confirmed: true },
          { studentName: 'Mariana Torres', confirmed: true }
        ]
      }
    };
  
    // Referencias al DOM
    const groupsTbody  = document.querySelector('#groupsTable tbody');
    const califSection = document.getElementById('calificacionesSection');
    const asisSection  = document.getElementById('asistenciasSection');
    const califTbody   = document.querySelector('#calificacionesTable tbody');
    const asisTbody    = document.querySelector('#asistenciasTable tbody');
  
    // 3) Renderizar listado de grupos
    groups.forEach(group => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${group.name}</td>
        <td class="text-center">
          <button 
            class="btn" 
            style="background-color: #8ABD3C; border-color: #8ABD3C; font-family: 'Inter', sans-serif; color: white;"
            data-id="${group.id}" 
            data-type="calificaciones">
            Calificaciones
          </button>
          <button 
            class="btn" 
            style="background-color: #EC5832; border-color: #EC5832; font-family: 'Inter', sans-serif; color: white;"
            data-id="${group.id}" 
            data-type="asistencias">
            Asistencias
          </button>
        </td>
      `;
      groupsTbody.appendChild(tr);
    });
  
    // 4) Manejar click en botones de acción
    groupsTbody.addEventListener('click', e => {
      if (e.target.tagName !== 'BUTTON') return;
  
      const groupId = e.target.dataset.id;
      const type    = e.target.dataset.type; // 'calificaciones' o 'asistencias'
  
      // Limpiar y ocultar secciones
      califSection.classList.add('d-none');
      asisSection.classList.add('d-none');
      califTbody.innerHTML = '';
      asisTbody.innerHTML  = '';
  
      // Obtener datos del array
      const data = confirmaciones[type][groupId] || [];
  
      // Renderizar filas de confirmaciones
      data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.studentName}</td>
          <td>${item.confirmed ? 'Sí' : 'No'}</td>
        `;
        if (type === 'calificaciones') {
          califTbody.appendChild(tr);
        } else {
          asisTbody.appendChild(tr);
        }
      });
  
      // Mostrar la sección correspondiente
      if (type === 'calificaciones') {
        califSection.classList.remove('d-none');
      } else {
        asisSection.classList.remove('d-none');
      }
    });
  });
  