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
  const fecha = new Date(balance.fecha);
  const fechaFormateada = fecha.toLocaleDateString('es-AR', { timeZone: 'UTC' });

  const tipoNombre = {
    COPA_DE_LECHE: 'Copa de Leche',
    COMEDOR_COMUN: 'Comedor Común',
    COMEDOR_DIETA_ESPECIAL: 'Comedor Dieta Especial'
  };

  const tipoComida = balance.tipo === 'COPA_DE_LECHE' ? 'Desayuno' : 'Almuerzo';

  let lineasHTML = balance.lineas.map(l => `
    <tr>
      <td>${l.nombreIngrediente}</td>
      <td style="text-align:center">${parseFloat(l.cantidadUsada).toFixed(3)}</td>
      <td style="text-align:center">$${parseFloat(l.precioUnitario).toLocaleString('es-AR')}</td>
      <td style="text-align:center">$${parseFloat(l.subtotal).toLocaleString('es-AR')}</td>
      <td>${l.otrasAclaraciones || ''}</td>
    </tr>
  `).join('');

  document.getElementById('modalContenido').innerHTML = `
    <div style="font-family: Arial, sans-serif; font-size: 0.9rem; color: #3d3d3d;">

      <!-- ENCABEZADO -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-bottom:12px; border-bottom:2px solid #6b1f2b;">
        <div>
          <h3 style="color:#6b1f2b; margin:0 0 4px;">${tipoNombre[balance.tipo]}</h3>
          <p style="margin:0; color:#74696a; font-size:0.8rem;">Balance de inversión diario</p>
        </div>
        <div style="text-align:right;">
          <p style="margin:0; font-weight:bold;">${fechaFormateada}</p>
        </div>
      </div>

      <!-- MENÚ Y TOTAL COMENSALES -->
      <div style="display:flex; gap:16px; margin-bottom:16px;">
        <div style="flex:2; background:#f7eeee; border-radius:4px; padding:10px;">
          <p style="margin:0 0 4px; font-weight:bold; font-size:0.8rem; color:#6b1f2b;">MENÚ — ${tipoComida.toUpperCase()}</p>
          <p style="margin:0;">${balance.menu || '<em style="color:#74696a">Sin menú registrado</em>'}</p>
        </div>
        <div style="flex:1; background:#f7eeee; border-radius:4px; padding:10px; text-align:center;">
          <p style="margin:0 0 4px; font-weight:bold; font-size:0.8rem; color:#6b1f2b;">COMENSALES</p>
          <p style="margin:0; font-size:1.5rem; font-weight:bold; color:#6b1f2b;">${balance.cantidadComensales}</p>
        </div>
      </div>

      <!-- TABLA INGREDIENTES -->
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem; margin-bottom:12px;">
        <thead>
          <tr style="background:#7b2938; color:white;">
            <th style="padding:6px 8px; text-align:left;">Artículo</th>
            <th style="padding:6px 8px; text-align:center;">Cant. usada</th>
            <th style="padding:6px 8px; text-align:center;">Precio unit.</th>
            <th style="padding:6px 8px; text-align:center;">Subtotal</th>
            <th style="padding:6px 8px; text-align:center;">Aclaraciones</th>
          </tr>
        </thead>
        <tbody>
          ${lineasHTML}
        </tbody>
        <tfoot>
          <tr style="background:#f7eeee; font-weight:bold;">
            <td colspan="3" style="padding:6px 8px; text-align:right;">Total general:</td>
            <td style="padding:6px 8px; text-align:center;">$${parseFloat(balance.total).toLocaleString('es-AR')}</td>
          </tr>
          <tr style="background:#f7eeee; font-weight:bold;">
            <td colspan="3" style="padding:6px 8px; text-align:right;">Costo por ración:</td>
            <td style="padding:6px 8px; text-align:center;">$${parseFloat(balance.costoPorRacion).toLocaleString('es-AR')}</td>
          </tr>
        </tfoot>
      </table>

      <!-- DETALLE COMENSALES -->
      <div style="margin-bottom:12px;">
        <p style="font-weight:bold; font-size:0.85rem; color:#6b1f2b; margin-bottom:6px;">ASISTENCIA</p>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px;">
          <div style="background:#f0f0f0; border-radius:4px; padding:8px 12px; display:flex; justify-content:space-between;">
            <span>Alumnos</span>
            <strong>${balance.cantidadAlumnos}</strong>
          </div>
          <div style="background:#f0f0f0; border-radius:4px; padding:8px 12px; display:flex; justify-content:space-between;">
            <span>Otra escuela</span>
            <strong>${balance.cantidadOtrasEscuelas}</strong>
          </div>
          <div style="background:#f0f0f0; border-radius:4px; padding:8px 12px; display:flex; justify-content:space-between;">
            <span>Personal comedor</span>
            <strong>${balance.personalComedor}</strong>
          </div>
          <div style="background:#f0f0f0; border-radius:4px; padding:8px 12px; display:flex; justify-content:space-between;">
            <span>Otros</span>
            <strong>${balance.otros}</strong>
          </div>
          <div style="background:#e8d5d7; border-radius:4px; padding:8px 12px; display:flex; justify-content:space-between; grid-column: span 2;">
            <span style="font-weight:bold;">Total comensales</span>
            <strong>${balance.cantidadComensales}</strong>
          </div>
        </div>
      </div>

    </div>

    <!-- ACCIONES -->
    <div class="modal-acciones" style="margin-top:16px;">
      <div class="modal-botones">
        <button class="btn-eliminar" id="btnEliminar" onclick="confirmarEliminar(` + balance.id + `)">Eliminar</button>
        <button class="btn-cerrar" onclick="cerrarModal()">Cerrar</button>
      </div>
      <div id="confirmEliminar" class="confirmar-eliminacion">
        <p>¿Estás seguro de que querés eliminar este balance?</p>
        <div class="confirmar-botones">
          <button class="btn-eliminar" onclick="eliminarBalance(` + balance.id + `)">Sí, eliminar</button>
          <button class="btn-cancelar" onclick="cancelarEliminar()">Cancelar</button>
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
    parseInt(document.getElementById('cantOtrasEscuelas').value || 0) +
    parseInt(document.getElementById('cantPersonal').value || 0) +
    parseInt(document.getElementById('cantOtros').value || 0);

    if (pesoPorRacion <= 0 || precioUnitario <= 0) {
    document.getElementById('errorIngrediente').textContent = 'El peso por ración y el precio unitario deben ser mayores a cero.';
    return;
    }
    document.getElementById('errorIngrediente').textContent = '';

  if (!nombreIngrediente || !pesoPorRacion || !precioUnitario) {
    document.getElementById('errorIngrediente').textContent = 'Completá todos los campos del ingrediente.';
    return;
  }
  const otrasAclaraciones = document.getElementById('otrasAclaraciones').value;
  const cantidadUsada = pesoPorRacion * cantidadComensales;
  const subtotal = cantidadUsada * precioUnitario;

  lineas.push({ nombreIngrediente, pesoPorRacion, precioUnitario, otrasAclaraciones });

  const tbody = document.getElementById('tablaLineas');
  const index = lineas.length - 1;
  tbody.innerHTML += `
    <tr id="linea-${index}">
      <td>${nombreIngrediente}</td>
      <td>${pesoPorRacion}</td>
      <td>${cantidadUsada.toFixed(3)}</td>
      <td>$${precioUnitario.toLocaleString('es-AR')}</td>
      <td>$${subtotal.toLocaleString('es-AR')}</td>
      <td>${otrasAclaraciones || ''}</td>
      <td><button onclick="eliminarLinea(${index})">✕</button></td>
    </tr>
  `;

  document.getElementById('nombreIngrediente').value = '';
  document.getElementById('pesoPorRacion').value = '';
  document.getElementById('precioUnitario').value = '';
  document.getElementById('otrasAclaraciones').value = '';
  actualizarTotales();
}

function eliminarLinea(index) {
  lineas.splice(index, 1);
  cargarTablaLineas();
  actualizarTotales();
}

function cargarTablaLineas() {
  const cantidadComensales = parseInt(document.getElementById('cantAlumnos').value || 0) +
    parseInt(document.getElementById('cantOtrasEscuelas').value || 0) +
    parseInt(document.getElementById('cantPersonal').value || 0) +
    parseInt(document.getElementById('cantOtros').value || 0);

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
        <td>${l.otrasAclaraciones || ''}</td>
        <td><button onclick="eliminarLinea(${index})">✕</button></td>
      </tr>
    `;
  });

  actualizarTotales();
}

function actualizarTotales() {
  const cantidadComensales = parseInt(document.getElementById('cantAlumnos').value || 0) +
    parseInt(document.getElementById('cantOtrasEscuelas').value || 0) +
    parseInt(document.getElementById('cantPersonal').value || 0) +
    parseInt(document.getElementById('cantOtros').value || 0);
  const totalEl = document.getElementById('totalComensales');
if (totalEl) totalEl.textContent = cantidadComensales;

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
  const personalComedor = parseInt(document.getElementById('cantPersonal').value || 0);
  const otros = parseInt(document.getElementById('cantOtros').value || 0);
  
  if (!fecha || !tipo) {
    document.getElementById('errorBalance').textContent = 'Completá la fecha y el tipo de balance.';
    return;
  }

  if (lineas.length === 0) {
    document.getElementById('errorBalance').textContent = 'Agregá al menos un ingrediente.';
    return;
  }

  document.getElementById('errorBalance').textContent = '';

  const response = await fetch(`${API}/balances`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ fecha, tipo, cantidadAlumnos, cantidadOtrasEscuelas, personalComedor, otros, lineas, menu: document.getElementById('menuBalance').value || null })
  });

  const data = await response.json();

  if (!response.ok) {
    document.getElementById('errorBalance').textContent = data.error;
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