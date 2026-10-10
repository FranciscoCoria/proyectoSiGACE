const API = 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

function getFechaHoy() {
  const hoy = new Date();
  return hoy.toISOString().split('T')[0];
}

async function cargarAsistencia(fecha) {
  const response = await fetch(`${API}/asistencia/${fecha}`, {
    headers: getHeaders()
  });

  if (response.status === 401) {
    window.location.href = '../index.html';
    return;
  }

  const data = await response.json();
  const tbody = document.getElementById('tablaAsistencia');
  const btnGuardar = document.getElementById('btnGuardar');
  tbody.innerHTML = '';

  const esFechaFutura = new Date(fecha) > new Date(getFechaHoy());
  
  const mensajeEl = document.getElementById('mensajeAsistencia');
  if (mensajeEl) mensajeEl.textContent = '';

  if (data.existe) {
    const esModoLectura = fecha !== getFechaHoy();

    data.asistencia.registros.forEach(r => {
      tbody.innerHTML += `
        <tr>
          <td>${r.alumno.apellido}, ${r.alumno.nombre}</td>
          <td>${r.alumno.dieta || '-'}</td>
          <td>
            <input type="checkbox" 
              data-id="${r.alumno.id}" 
              ${r.presente ? 'checked' : ''} 
              ${esModoLectura ? 'disabled' : ''}>
          </td>
        </tr>
      `;
    });

    if (data.alumnosSinRegistro && data.alumnosSinRegistro.length > 0) {
      data.alumnosSinRegistro.forEach(a => {
        tbody.innerHTML += `
          <tr>
            <td>${a.apellido}, ${a.nombre}</td>
            <td>${a.dieta || '-'}</td>
            <td>
              <input type="checkbox" 
                data-id="${a.id}"
                ${esModoLectura ? 'disabled' : ''}>
            </td>
          </tr>
        `;
      });
    }

    btnGuardar.style.display = esModoLectura ? 'none' : 'block';

  } else {
    if (esFechaFutura) {
      tbody.innerHTML = '<tr><td colspan="3">No se puede registrar asistencia para fechas futuras.</td></tr>';
      btnGuardar.style.display = 'none';
      return;
    }

    data.alumnos.forEach(a => {
      tbody.innerHTML += `
        <tr>
          <td>${a.apellido}, ${a.nombre}</td>
          <td>${a.dieta || '-'}</td>
          <td>
            <input type="checkbox" data-id="${a.id}">
          </td>
        </tr>
      `;
    });

    btnGuardar.style.display = 'block';
  }

  document.querySelectorAll('#tablaAsistencia input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const msg = document.getElementById('mensajeAsistencia');
      if (msg) msg.textContent = '';
    });
  });
}

async function guardarAsistencia() {
  const fecha = document.getElementById('fecha').value;
  const checkboxes = document.querySelectorAll('#tablaAsistencia input[type="checkbox"]');
  
  const registros = Array.from(checkboxes).map(cb => ({
    alumnoId: parseInt(cb.dataset.id),
    presente: cb.checked
  }));

  const response = await fetch(`${API}/asistencia`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fecha, registros })
  });

  const data = await response.json();

  if (!response.ok) {
  document.getElementById('mensajeAsistencia').textContent = data.error;
  return;
}

  await cargarAsistencia(fecha);
  document.getElementById('mensajeAsistencia').style.color = '#155724';
  document.getElementById('mensajeAsistencia').textContent = 'Asistencia guardada correctamente.';
}

document.addEventListener('DOMContentLoaded', () => {
  const fechaInput = document.getElementById('fecha');
  fechaInput.value = getFechaHoy();
  fechaInput.max = getFechaHoy();

  cargarAsistencia(getFechaHoy());

  fechaInput.addEventListener('change', () => {
    cargarAsistencia(fechaInput.value);
  });
});