const API = 'http://localhost:3000/api';  //guardo la constante para no escribir mil veces el url

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`    //getToken recupera la credencial con la que se autentica
  };
}

// Cargar lista de usuarios
async function cargarUsuarios() {            //La función es async porque va a hacer una operación que tarda: una petición al servidor.
  const response = await fetch(`${API}/usuarios`, {   //es como decir http://localhost:3000/api/usuarios
    headers: getHeaders()                       //hace un GET http://localhost:3000/api/usuarios
  });

  if (response.status === 401) {
    window.location.href = '../index.html';
    return;
  }

  const usuarios = await response.json();
  const tbody = document.getElementById('tablaUsuarios');  //esto pide buscar en el HTML el elemento que tenga id="tablaUsuarios"
  tbody.innerHTML = '';                                    //borra lo que hubiera previamente.

  usuarios.forEach(u => {                         //por cada usuario que se recibe va construyendo HTML.
    tbody.innerHTML += `
      <tr>
        <td>${u.nombre} ${u.apellido}</td>
        <td>${u.usuario}</td>
        <td>${u.rol}</td>
        <td>
          <button onclick="editarUsuario(${u.id}, '${u.nombre}', '${u.apellido}', '${u.usuario}', '${u.rol}')">Modificar</button>
          <button onclick="eliminarUsuario(${u.id})">Eliminar</button>
        </td>
      </tr>
    `;
  });
}

// Mostrar/ocultar formulario
function toggleFormulario(mostrar) {  //Esta función controla si se muestra o se oculta el formulario.
  document.getElementById('formulario').style.display = mostrar ? 'block' : 'none';
  document.getElementById('errorForm').textContent = '';
  if (!mostrar) {
    document.getElementById('usuarioForm').reset();
    document.getElementById('usuarioId').value = '';
    document.getElementById('formTitulo').textContent = 'Nuevo usuario';
  }
}

// Guardar usuario (crear o modificar)
async function guardarUsuario(e) {
  e.preventDefault();           //evita que el formulario haga su comportamiento HTML tradicional de recargar la página.

  const id = document.getElementById('usuarioId').value; //Si id está vacío: No existe usuario → CREAR
                                                         //Si id tiene un valor: Existe usuario → MODIFICAR
  const body = {
    nombre: document.getElementById('nombre').value,
    apellido: document.getElementById('apellido').value,
    usuario: document.getElementById('usuario').value,
    password: document.getElementById('password').value,
    rol: document.getElementById('rol').value
  };

  const url = id ? `${API}/usuarios/${id}` : `${API}/usuarios`;
  const method = id ? 'PUT' : 'POST';

  const response = await fetch(url, {    //Esta es la comunicación real frontend → backend.
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
  cargarUsuarios();
}

// Cargar datos en formulario para editar
function editarUsuario(id, nombre, apellido, usuario, rol) {   
  document.getElementById('usuarioId').value = id;
  document.getElementById('nombre').value = nombre;
  document.getElementById('apellido').value = apellido;
  document.getElementById('usuario').value = usuario;
  document.getElementById('password').value = '';   //La contraseña se deja vacía (no se recupera la contraseña real del usuario)
  document.getElementById('rol').value = rol;
  document.getElementById('formTitulo').textContent = 'Modificar usuario';  //cambia el título del formulario.
  toggleFormulario(true);
}

// Eliminar usuario
async function eliminarUsuario(id) {
  if (!confirm('¿Estás seguro de que querés eliminar este usuario?')) return;

  const response = await fetch(`${API}/usuarios/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (response.ok) {
    cargarUsuarios();    //vuelve a cargar la tabla para que desaparezca el usuario eliminado.
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarios();     //cuando entrás a la página aparecen automáticamente los usuarios.
  document.getElementById('usuarioForm').addEventListener('submit', guardarUsuario);
});