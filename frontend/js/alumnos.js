async function cargarAlumnos() {
  const response = await fetch(`${API}/alumnos`, {
    headers: getHeaders()
  });

  if (response.status === 401) {
    window.location.href = '../index.html';
    return;
  }

  const alumnos = await response.json();
  const tbody = document.getElementById('tablaAlumnos');
  tbody.innerHTML = '';

  if (alumnos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No hay alumnos registrados.</td></tr>';
    return;
  }

  alumnos.forEach(a => {
    tbody.innerHTML += `
      <tr>
        <td>${a.apellido}, ${a.nombre}</td>
        <td>${a.dieta || '-'}</td>
        <td>
          <button onclick="editarAlumno(${a.id}, '${a.nombre}', '${a.apellido}', '${a.dieta || ''}')">Modificar</button>
          <button onclick="eliminarAlumno(${a.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

function toggleFormulario(mostrar) {
  document.getElementById('formulario').style.display = mostrar ? 'block' : 'none';
  document.getElementById('errorForm').textContent = '';
  if (!mostrar) {
    document.getElementById('alumnoForm').reset();
    document.getElementById('alumnoId').value = '';
    document.getElementById('formTitulo').textContent = 'Nuevo alumno';
  }
}

async function guardarAlumno(e) {
  e.preventDefault();

  const id = document.getElementById('alumnoId').value;
  const body = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    dieta: document.getElementById('dieta').value || null
  };

  const url = id ? `${API}/alumnos/${id}` : `${API}/alumnos`;
  const method = id ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    document.getElementById('errorForm').textContent = data.error;
    return;
  }

  toggleFormulario(false);
  cargarAlumnos();
}

function editarAlumno(id, nombre, apellido, dieta) {
  document.getElementById('alumnoId').value = id;
  document.getElementById('nombre').value = nombre;
  document.getElementById('apellido').value = apellido;
  document.getElementById('dieta').value = dieta;
  document.getElementById('formTitulo').textContent = 'Modificar alumno';
  toggleFormulario(true);
}

async function eliminarAlumno(id) {
  const confirmDiv = document.getElementById('confirmEliminarAlumno');
  confirmDiv.style.display = 'block';
  document.getElementById('btnConfirmarElimAlumno').onclick = async () => {
    const response = await fetch(`${API}/alumnos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (response.ok) {
      confirmDiv.style.display = 'none';
      cargarAlumnos();
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  cargarAlumnos();
  document.getElementById('alumnoForm').addEventListener('submit', guardarAlumno);
});