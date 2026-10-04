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

let lineas = [];

async function cargarBalances() {
  const response = await fetch(`${API}/balances`, {
    headers: getHeaders()
  });

  if (response.status === 401) {
    window.location.href = '../index.html';
    return;
  }

  const balances = await response.json();

  const columnas = {
    COPA_DE_LECHE: document.getElementById('listaCopaLeche'),
    COMEDOR_COMUN: document.getElementById('listaComedor'),
    COMEDOR_DIETA_ESPECIAL: document.getElementById('listaDieta')
  };

  Object.values(columnas).forEach(col => col.innerHTML = '');

  if (balances.length === 0) {
    Object.values(columnas).forEach(col => {
      col.innerHTML = '<p class="sin-registros">Sin registros</p>';
    });
    return;
  }

    balances.forEach(b => {
        const fecha = new Date(b.fecha).toLocaleDateString('es-AR');
        const col = columnas[b.tipo];
        if (col) {
        col.innerHTML += `
            <div class="balance-item" onclick="verBalance(${b.id})">
            <span class="balance-fecha">${fecha}</span>
            <span class="balance-menu">${b.menu || 'Sin menú'}</span>
            <span class="balance-total">$${parseFloat(b.total).toLocaleString('es-AR')}</span>
            </div>
        `;
        }
    });
}

async function verBalance(id) {
  const response = await fetch(`${API}/balances/${id}`, {
    headers: getHeaders()
  });

  const balance = await response.json();
  mostrarModalBalance(balance);
}

function mostrarModalBalance(balance) {
  const fecha = new Date(balance.fecha).toLocaleDateString('es-AR');
  const tipoNombre = {
    COPA_DE_LECHE: 'Copa de Leche',
    COMEDOR_COMUN: 'Comedor Común',
    COMEDOR_DIETA_ESPECIAL: 'Comedor Dieta Especial'
  };

  let lineasHTML = balance.lineas.map(l => `
    <tr>
      <td>${l.nombreIngrediente}</td>
      <td>${l.pesoPorRacion} kg/ración</td>
      <td>${parseFloat(l.cantidadUsada).toFixed(3)}</td>
      <td>$${parseFloat(l.precioUnitario).toLocaleString('es-AR')}</td>
      <td>$${parseFloat(l.subtotal).toLocaleString('es-AR')}</td>
    </tr>
  `).join('');

  document.getElementById('modalContenido').innerHTML = `
    <h3>${tipoNombre[balance.tipo]} — ${fecha}</h3>
    <p>Comensales: <strong>${balance.cantidadComensales}</strong></p>
    ${balance.menu ? `<p>Menú: <strong>${balance.menu}</strong></p>` : ''}
    <table class="tabla">
      <thead>
        <tr>
          <th>Ingrediente</th>
          <th>Peso/ración</th>
          <th>Cant. usada</th>
          <th>Precio unit.</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${lineasHTML}</tbody>
    </table>
    <div class="balance-totales">
      <p>Total: <strong>$${parseFloat(balance.total).toLocaleString('es-AR')}</strong></p>
      <p>Costo por ración: <strong>$${parseFloat(balance.costoPorRacion).toLocaleString('es-AR')}</strong></p>
    </div>
    <div class="modal-acciones">

        <div class="modal-botones">
            <button class="btn-eliminar" id="btnEliminar" onclick="confirmarEliminar(` + balance.id + `)">
            Eliminar
            </button>

            <button class="btn-cerrar" onclick="cerrarModal()">
            Cerrar
            </button>
        </div>

        <div id="confirmEliminar" class="confirmar-eliminacion">
            <p>¿Estás seguro de que querés eliminar este balance?</p>

            <div class="confirmar-botones">
            <button class="btn-eliminar" onclick="eliminarBalance(` + balance.id + `)">
                Sí, eliminar
            </button>

            <button class="btn-cancelar" onclick="cancelarEliminar()">
                Cancelar
            </button>
            </div>
        </div>

        </div>
  `;

  document.getElementById('modal').style.display = 'flex';
}

function confirmarEliminar() {
  document.getElementById('btnEliminar').style.display = 'none';
  document.getElementById('confirmEliminar').style.display = 'block';
}

function cancelarEliminar() {
  document.getElementById('confirmEliminar').style.display = 'none';
  document.getElementById('btnEliminar').style.display = 'block';
}
function cerrarModal() {
  document.getElementById('modal').style.display = 'none';
}

async function eliminarBalance(id) {
  const response = await fetch(`${API}/balances/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (response.ok) {
    cerrarModal();
    cargarBalances();
  }
}

function agregarLinea() {
  const nombreIngrediente = document.getElementById('nombreIngrediente').value;
  const pesoPorRacion = parseFloat(document.getElementById('pesoPorRacion').value);
  const precioUnitario = parseFloat(document.getElementById('precioUnitario').value);
  const cantidadComensales = parseInt(document.getElementById('cantAlumnos').value || 0) +
    parseInt(document.getElementById('cantOtrasEscuelas').value || 0);

    if (pesoPorRacion <= 0 || precioUnitario <= 0) {
    document.getElementById('errorIngrediente').textContent = 'El peso por ración y el precio unitario deben ser mayores a cero.';
    return;
    }
    document.getElementById('errorIngrediente').textContent = '';

  if (!nombreIngrediente || !pesoPorRacion || !precioUnitario) {
    alert('Completá todos los campos del ingrediente.');
    return;
  }

  const cantidadUsada = pesoPorRacion * cantidadComensales;
  const subtotal = cantidadUsada * precioUnitario;

  lineas.push({ nombreIngrediente, pesoPorRacion, precioUnitario });

  const tbody = document.getElementById('tablaLineas');
  const index = lineas.length - 1;
  tbody.innerHTML += `
    <tr id="linea-${index}">
      <td>${nombreIngrediente}</td>
      <td>${pesoPorRacion}</td>
      <td>${cantidadUsada.toFixed(3)}</td>
      <td>$${precioUnitario.toLocaleString('es-AR')}</td>
      <td>$${subtotal.toLocaleString('es-AR')}</td>
      <td><button onclick="eliminarLinea(${index})">✕</button></td>
    </tr>
  `;

  document.getElementById('nombreIngrediente').value = '';
  document.getElementById('pesoPorRacion').value = '';
  document.getElementById('precioUnitario').value = '';

  actualizarTotales();
}

function eliminarLinea(index) {
  lineas.splice(index, 1);
  cargarTablaLineas();
  actualizarTotales();
}

function cargarTablaLineas() {
  const cantidadComensales = parseInt(document.getElementById('cantAlumnos').value || 0) +
    parseInt(document.getElementById('cantOtrasEscuelas').value || 0);

  const tbody = document.getElementById('tablaLineas');
  tbody.innerHTML = '';

  lineas.forEach((l, index) => {
    const cantidadUsada = l.pesoPorRacion * cantidadComensales;
    const subtotal = cantidadUsada * l.precioUnitario;
    tbody.innerHTML += `
      <tr id="linea-${index}">
        <td>${l.nombreIngrediente}</td>
        <td>${l.pesoPorRacion}</td>
        <td>${cantidadUsada.toFixed(3)}</td>
        <td>$${l.precioUnitario.toLocaleString('es-AR')}</td>
        <td>$${subtotal.toLocaleString('es-AR')}</td>
        <td><button onclick="eliminarLinea(${index})">✕</button></td>
      </tr>
    `;
  });

  actualizarTotales();
}

function actualizarTotales() {
  const cantidadComensales = parseInt(document.getElementById('cantAlumnos').value || 0) +
    parseInt(document.getElementById('cantOtrasEscuelas').value || 0);

  document.getElementById('totalComensales').textContent = cantidadComensales;

  let total = 0;
  lineas.forEach(l => {
    total += l.pesoPorRacion * cantidadComensales * l.precioUnitario;
  });

  const costoPorRacion = cantidadComensales > 0 ? total / cantidadComensales : 0;

  document.getElementById('totalGeneral').textContent = '$' + total.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  document.getElementById('costoPorRacion').textContent = '$' + costoPorRacion.toLocaleString('es-AR', { minimumFractionDigits: 2 });
}

async function guardarBalance() {
  const fecha = document.getElementById('fechaBalance').value;
  const tipo = document.getElementById('tipoBalance').value;
  const cantidadAlumnos = parseInt(document.getElementById('cantAlumnos').value || 0);
  const cantidadOtrasEscuelas = parseInt(document.getElementById('cantOtrasEscuelas').value || 0);

  if (!fecha || !tipo) {
    alert('Completá la fecha y el tipo de balance.');
    return;
  }

  if (lineas.length === 0) {
    alert('Agregá al menos un ingrediente.');
    return;
  }

  const response = await fetch(`${API}/balances`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fecha, tipo, cantidadAlumnos, cantidadOtrasEscuelas, lineas, menu: document.getElementById('menuBalance').value || null })
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error);
    return;
  }

  lineas = [];
  document.getElementById('tablaLineas').innerHTML = '';
  document.getElementById('formBalance').reset();
  actualizarTotales();
  toggleFormBalance(false);
  cargarBalances();
}

function toggleFormBalance(mostrar) {
  document.getElementById('seccionFormBalance').style.display = mostrar ? 'block' : 'none';
  if (!mostrar) {
    lineas = [];
    document.getElementById('tablaLineas').innerHTML = '';
    document.getElementById('formBalance').reset();
    actualizarTotales();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarBalances();
});