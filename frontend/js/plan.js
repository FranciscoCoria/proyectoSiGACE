const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes'];

let planActual = null;

async function cargarPlanes() {
  const response = await fetch(`${API}/planes`, { headers: getHeaders() });
  if (response.status === 401) { window.location.href = '../index.html'; return; }

  const planes = await response.json();
  const lista = document.getElementById('listaPlanes');
  lista.innerHTML = '';

  if (planes.length === 0) {
    lista.innerHTML = '<p class="sin-registros">No hay planes cargados.</p>';
    return;
  }

  planes.forEach(p => {
    const fecha = new Date(p.mes);
    const mes = MESES[fecha.getUTCMonth()];
    const anio = fecha.getUTCFullYear();
    const estadoClase = p.estado.toLowerCase().replace('_', '-');
    lista.innerHTML += `
      <div class="plan-item" onclick="verPlan(${p.id})">
        <span class="plan-mes">${mes} ${anio}</span>
        <span class="plan-estado estado-${estadoClase}">${p.estado.replace('_', ' ')}</span>
      </div>
    `;
  });
}

async function verPlan(id) {
  const response = await fetch(`${API}/planes/${id}`, { headers: getHeaders() });
  const plan = await response.json();
  planActual = plan;
  mostrarPlan(plan);
}

function mostrarPlan(plan) {
  document.getElementById('seccionLista').style.display = 'none';
  document.getElementById('seccionPlan').style.display = 'block';

  const fecha = new Date(plan.mes);
  const mes = MESES[fecha.getUTCMonth()];
  const anio = fecha.getUTCFullYear();

  document.getElementById('tituloPlan').textContent = `Plan mensual — ${mes} ${anio}`;
  document.getElementById('estadoPlan').textContent = plan.estado.replace(/_/g, ' ');
  document.getElementById('estadoPlan').className = 'plan-estado estado-' + plan.estado.toLowerCase().replace(/_/g, '-');

  const esEditable = plan.estado !== 'APROBADO';
  const esEconoma = JSON.parse(localStorage.getItem('usuario')).rol === 'ECONOMA';
  const esDirectora = JSON.parse(localStorage.getItem('usuario')).rol === 'DIRECTORA';

  const btnEnviar = document.getElementById('btnEnviar');
  const btnEliminarPlan = document.getElementById('btnEliminarPlan');
  const btnAprobar = document.getElementById('btnAprobar');
  const btnObservacion = document.getElementById('btnObservacion');
  const btnGuardarCambios = document.getElementById('btnGuardarCambios');

  if (btnEnviar) btnEnviar.style.display = esEconoma && (plan.estado === 'BORRADOR' || plan.estado === 'CON_OBSERVACIONES') ? 'inline-block' : 'none';
  if (btnEliminarPlan) btnEliminarPlan.style.display = esEconoma && plan.estado !== 'APROBADO' ? 'inline-block' : 'none';
  if (btnAprobar) btnAprobar.style.display = esDirectora && plan.estado === 'ENVIADO' ? 'inline-block' : 'none';
  if (btnObservacion) btnObservacion.style.display = esDirectora && plan.estado === 'ENVIADO' ? 'inline-block' : 'none';
  if (btnGuardarCambios) btnGuardarCambios.style.display = esEditable && esEconoma ? 'inline-block' : 'none';

  if (plan.obsDirectora) {
    document.getElementById('obsDirectora').style.display = 'block';
    document.getElementById('textoObsDirectora').textContent = plan.obsDirectora;
  } else {
    document.getElementById('obsDirectora').style.display = 'none';
  }

  const grilla = document.getElementById('grillaPlan');
  grilla.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'grilla-header';
  header.innerHTML = DIAS_SEMANA.map(d => `<div class="grilla-col-header">${d}</div>`).join('') + '<div class="grilla-col-header">Observaciones</div>';
  grilla.appendChild(header);

  plan.semanas.forEach(semana => {
    const fila = document.createElement('div');
    fila.className = 'grilla-fila';

    for (let col = 0; col < 5; col++) {
      const celda = document.createElement('div');
      
      const diaEnColumna = semana.dias.find(dia => {
        const dow = new Date(new Date(plan.mes).getUTCFullYear(), new Date(plan.mes).getUTCMonth(), dia.numDia).getDay();
        return dow === col + 1;
      });

      if (diaEnColumna) {
        celda.className = 'grilla-celda';
        celda.innerHTML = `
          <div class="grilla-dia-num">Día ${diaEnColumna.numDia}</div>
          <div class="grilla-campo">
            <label>Desayuno</label>
            <textarea data-semana="${semana.numSemana}" data-dia="${diaEnColumna.numDia}" data-campo="desayuno" ${!esEditable || !esEconoma ? 'disabled' : ''}>${diaEnColumna.desayuno || ''}</textarea>
          </div>
          <div class="grilla-campo">
            <label>Almuerzo</label>
            <textarea data-semana="${semana.numSemana}" data-dia="${diaEnColumna.numDia}" data-campo="almuerzo" ${!esEditable || !esEconoma ? 'disabled' : ''}>${diaEnColumna.almuerzo || ''}</textarea>
          </div>
        `;
      } else {
        celda.className = 'grilla-celda grilla-celda-vacia';
      }
      fila.appendChild(celda);
    }

    const celdaObs = document.createElement('div');
    celdaObs.className = 'grilla-celda grilla-obs';
    celdaObs.innerHTML = `
      <label>Semana ${semana.numSemana}</label>
      <textarea data-semana="${semana.numSemana}" data-campo="obs" ${!esEditable || !esEconoma ? 'disabled' : ''}>${semana.obsEconoma || ''}</textarea>
    `;
    fila.appendChild(celdaObs);
    grilla.appendChild(fila);
  });

  if (esEditable && esEconoma) {
    document.getElementById('btnGuardarCambios').style.display = 'inline-block';
  } else {
    document.getElementById('btnGuardarCambios').style.display = 'none';
  }
}

function recolectarDatos() {
  const semanas = {};

  document.querySelectorAll('#grillaPlan textarea').forEach(el => {
    const numSemana = parseInt(el.dataset.semana);
    const numDia = el.dataset.dia ? parseInt(el.dataset.dia) : null;
    const campo = el.dataset.campo;

    if (!semanas[numSemana]) semanas[numSemana] = { numSemana, dias: {}, obsEconoma: '' };

    if (campo === 'obs') {
      semanas[numSemana].obsEconoma = el.value;
    } else {
      if (!semanas[numSemana].dias[numDia]) semanas[numSemana].dias[numDia] = { numDia };
      semanas[numSemana].dias[numDia][campo] = el.value;
    }
  });

  return Object.values(semanas).map(s => ({
    numSemana: s.numSemana,
    obsEconoma: s.obsEconoma,
    dias: Object.values(s.dias)
  }));
}

async function guardarCambios() {
  const semanas = recolectarDatos();
  const response = await fetch(`${API}/planes/${planActual.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ semanas })
  });

  if (response.ok) {
    verPlan(planActual.id);
  }
}

async function enviarPlan() {
  const response = await fetch(`${API}/planes/${planActual.id}/enviar`, {
    method: 'POST',
    headers: getHeaders()
  });

  const data = await response.json();
  if (!response.ok) {
    document.getElementById('errorPlan').textContent = data.error;
    return;
  }
  document.getElementById('errorPlan').textContent = '';
  verPlan(planActual.id);
}

async function aprobarPlan() {
  const response = await fetch(`${API}/planes/${planActual.id}/aprobar`, {
    method: 'POST',
    headers: getHeaders()
  });
  if (response.ok) verPlan(planActual.id);
}

async function guardarObservacion() {
  const obs = document.getElementById('inputObservacion').value;
  if (!obs) { document.getElementById('errorObs').textContent = 'La observación no puede estar vacía.'; return; }

  const response = await fetch(`${API}/planes/${planActual.id}/observacion`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ obsDirectora: obs })
  });

  if (response.ok) {
    document.getElementById('seccionObservacion').style.display = 'none';
    verPlan(planActual.id);
  }
}

async function eliminarPlan() {
  const response = await fetch(`${API}/planes/${planActual.id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  if (response.ok) {
    volverLista();
  }
}

function volverLista() {
  planActual = null;
  document.getElementById('seccionLista').style.display = 'block';
  document.getElementById('seccionPlan').style.display = 'none';
  document.getElementById('seccionObservacion').style.display = 'none';
  document.getElementById('errorPlan').textContent = '';
  cargarPlanes();
}

function mostrarFormObservacion() {
  document.getElementById('seccionObservacion').style.display = 'block';
  document.getElementById('inputObservacion').value = '';
  document.getElementById('errorObs').textContent = '';
}

function generarGrillaCreacion() {
  const mes = parseInt(document.getElementById('mesPlanMes').value);
  const anio = parseInt(document.getElementById('mesPlanAnio').value);
  const grilla = document.getElementById('grillaCreacion');
  

  if (!mes || !anio) {
    grilla.innerHTML = '';
    return;
  }

  grilla.innerHTML = '';
  document.getElementById('errorNuevoPlan').textContent = ''; 
  const ultimoDia = new Date(anio, mes, 0).getDate();

  // Organizar días en semanas reales (lunes a viernes)
  let semanas = [];
  let semanaActual = null;

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const fecha = new Date(anio, mes - 1, dia);
    const dow = fecha.getDay(); // 0=dom, 1=lun, ..., 5=vie, 6=sab
    if (dow === 0 || dow === 6) continue;

    if (dow === 1 || semanaActual === null) {
      // Nuevo lunes o primer día hábil del mes
      if (semanaActual) semanas.push(semanaActual);
      semanaActual = { numSemana: semanas.length + 1, dias: [] };
    }

    semanaActual.dias.push(dia);
  }
  if (semanaActual && semanaActual.dias.length > 0) semanas.push(semanaActual);

  const header = document.createElement('div');
  header.className = 'grilla-header';
  header.innerHTML = DIAS_SEMANA.map(d => `<div class="grilla-col-header">${d}</div>`).join('') + '<div class="grilla-col-header">Observaciones</div>';
  grilla.appendChild(header);

  semanas.forEach(semana => {
    const fila = document.createElement('div');
    fila.className = 'grilla-fila';

    for (let col = 0; col < 5; col++) {
      const celda = document.createElement('div');

      // Calcular qué día de la semana corresponde a cada columna
      const diaEnColumna = semana.dias.find(d => {
        const dow = new Date(anio, mes - 1, d).getDay();
        return dow === col + 1; // col 0=lun(1), col 1=mar(2), etc
      });

      if (diaEnColumna) {
        celda.className = 'grilla-celda';
        celda.innerHTML = `
          <div class="grilla-dia-num">Día ${diaEnColumna}</div>
          <div class="grilla-campo">
            <label>Desayuno</label>
            <textarea data-semana="${semana.numSemana}" data-dia="${diaEnColumna}" data-campo="desayuno" placeholder="Desayuno..."></textarea>
          </div>
          <div class="grilla-campo">
            <label>Almuerzo</label>
            <textarea data-semana="${semana.numSemana}" data-dia="${diaEnColumna}" data-campo="almuerzo" placeholder="Almuerzo..."></textarea>
          </div>
        `;
      } else {
        celda.className = 'grilla-celda grilla-celda-vacia';
      }
      fila.appendChild(celda);
    }

    const celdaObs = document.createElement('div');
    celdaObs.className = 'grilla-celda grilla-obs';
    celdaObs.innerHTML = `
      <label>Semana ${semana.numSemana}</label>
      <textarea data-semana="${semana.numSemana}" data-campo="obs" placeholder="Observaciones..."></textarea>
    `;
    fila.appendChild(celdaObs);
    grilla.appendChild(fila);
  });
}

function recolectarDatosCreacion() {
  const semanas = {};
  document.querySelectorAll('#grillaCreacion textarea').forEach(el => {
    const numSemana = parseInt(el.dataset.semana);
    const numDia = el.dataset.dia ? parseInt(el.dataset.dia) : null;
    const campo = el.dataset.campo;
    if (!semanas[numSemana]) semanas[numSemana] = { numSemana, dias: {}, obsEconoma: '' };
    if (campo === 'obs') {
      semanas[numSemana].obsEconoma = el.value;
    } else {
      if (!semanas[numSemana].dias[numDia]) semanas[numSemana].dias[numDia] = { numDia };
      semanas[numSemana].dias[numDia][campo] = el.value;
    }
  });
  return Object.values(semanas).map(s => ({
    numSemana: s.numSemana,
    obsEconoma: s.obsEconoma,
    dias: Object.values(s.dias)
  }));
}

async function crearPlanNuevo() {
  const mes = parseInt(document.getElementById('mesPlanMes').value);
  const anio = parseInt(document.getElementById('mesPlanAnio').value);
  
  if (!mes || !anio) {
    document.getElementById('errorNuevoPlan').textContent = 'Seleccioná el mes y año.';
    return;
  }

  const mesStr = `${anio}-${String(mes).padStart(2, '0')}-01`;
  const semanas = recolectarDatosCreacion();

  const response = await fetch(`${API}/planes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ mes: mesStr, semanas })
  });

  const data = await response.json();
  if (!response.ok) {
    document.getElementById('errorNuevoPlan').textContent = data.error;
    return;
  }

  document.getElementById('formNuevoPlan').style.display = 'none';
  cargarPlanes();
  verPlan(data.id);
}

document.addEventListener('DOMContentLoaded', () => {
  cargarPlanes();
});