const API = window.location.origin + '/api';

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
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
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
  if (mensajeEl) {
    mensajeEl.textContent = '';
    mensajeEl.className = '';
    mensajeEl.style.display = 'none';
  }

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

    if (fecha !== getFechaHoy()) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#74696a;">No se registró asistencia para esta fecha.</td></tr>';
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
    if (msg) {
      msg.textContent = '';
      msg.className = '';
      msg.style.display = 'none';
    }
  });
});

  document.querySelectorAll('#tablaAsistencia input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', actualizarContador);
  });
  actualizarContador();

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
  const msgEl = document.getElementById('mensajeAsistencia');
  msgEl.style.display = 'block';
  msgEl.className = 'mensaje-exito';
  msgEl.textContent = 'Asistencia guardada correctamente.';
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


function actualizarContador() {
  const checkboxes = document.querySelectorAll('#tablaAsistencia input[type="checkbox"]');
  const presentes = Array.from(checkboxes).filter(cb => cb.checked).length;
  const total = checkboxes.length;
  const el = document.getElementById('contadorPresentes');
  if (el) el.textContent = `Presentes: ${presentes} / ${total}`;
}