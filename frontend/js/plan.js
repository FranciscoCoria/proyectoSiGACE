const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Lunes','Martes','Miércoles','Jueves','Viernes'];

let planActual = null;

async function cargarPlanes() {
  const response = await fetch(`${API}/planes`, { headers: getHeaders() });
  if (response.status === 401) { window.location.href = '../index.html'; return; }

  const planes = await response.json();
  const lista = document.getElementById('listaPlanes');
  lista.innerHTML = '';

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const planesVisibles = usuario.rol === 'DIRECTORA' 
  ? planes.filter(p => p.estado !== 'BORRADOR')
  : planes;

    if (planesVisibles.length === 0) {
    lista.innerHTML = '<p class="sin-registros">No hay planes disponibles.</p>';
  return;
}
  planesVisibles.forEach(p => {
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
  const btnExportar = document.getElementById('btnExportar');

  if (btnEnviar) btnEnviar.style.display = esEconoma && (plan.estado === 'BORRADOR' || plan.estado === 'CON_OBSERVACIONES') ? 'inline-block' : 'none';
  if (btnEliminarPlan) btnEliminarPlan.style.display = esEconoma && plan.estado !== 'APROBADO' ? 'inline-block' : 'none';
  if (btnAprobar) btnAprobar.style.display = esDirectora && plan.estado === 'ENVIADO' ? 'inline-block' : 'none';
  if (btnObservacion) btnObservacion.style.display = esDirectora && plan.estado === 'ENVIADO' ? 'inline-block' : 'none';
  if (btnGuardarCambios) btnGuardarCambios.style.display = esEditable && esEconoma ? 'inline-block' : 'none';
  if (btnExportar) btnExportar.style.display = plan.estado === 'APROBADO' ? 'inline-block' : 'none';

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
  // Guardar cambios primero
  const semanas = recolectarDatos();
  const responseSave = await fetch(`${API}/planes/${planActual.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ semanas })
  });

  if (!responseSave.ok) {
    document.getElementById('errorPlan').textContent = 'Error al guardar los cambios.';
    return;
  }

  // Después enviar
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


function cargarImagen(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));

    img.src = src;
  });
}

function escribirTextoAdaptado(doc, texto, x, y, ancho, alto, tamanoInicial = 7.5, tamanoMinimo = 5.5) {
  let tamano = tamanoInicial;

  while (tamano >= tamanoMinimo) {
    doc.setFontSize(tamano);

    const lineas = doc.splitTextToSize(texto, ancho);
    const alturaLinea = tamano * 0.4;
    const alturaTexto = lineas.length * alturaLinea;

    if (alturaTexto <= alto) {
      doc.text(lineas, x, y);
      return;
    }

    tamano -= 0.5;
  }

  // Si incluso con el tamaño mínimo no entra,
  // usamos el mínimo pero seguimos mostrando todo el texto.
  doc.setFontSize(tamanoMinimo);

  const lineas = doc.splitTextToSize(texto, ancho);
  doc.text(lineas, x, y);
}

async function exportarPlanPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const logo = await cargarImagen('../img/logo.png');

  const fecha = new Date(planActual.mes);
  const mes = MESES[fecha.getUTCMonth()];
  const anio = fecha.getUTCFullYear();

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;

  // ============================================================
  // COLORES
  // ============================================================

  const bordó = [107, 31, 43];
  const bordóClaro = [123, 41, 56];
  const fondoSuave = [250, 246, 245];
  const borde = [210, 195, 197];
  const texto = [61, 61, 61];
  const gris = [110, 100, 102];

  // ============================================================
// ENCABEZADO
// ============================================================

let y = 11;

// Logo
if (logo && logo.complete && logo.naturalWidth > 0) {
  try {
    doc.addImage(
      logo,
      'PNG',
      margin,
      y - 3,
      18,
      18
    );
  } catch (error) {
    console.log('No se pudo agregar el logo al PDF.');
  }
}

// ------------------------------------------------------------
// INFORMACIÓN DE LA ESCUELA
// ------------------------------------------------------------

doc.setTextColor(...texto);
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);

doc.text(
  'Escuela N° 523 — Domingo F. Sarmiento',
  margin + 23,
  y + 4
);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...gris);

doc.text(
  'Av. San Martín 384 - Gobernador Crespo [C.P. 3044]',
  margin + 23,
  y + 8
);

doc.text(
  'Teléfono: 3498-480004 - Email: prim523_gobernadorcrespo@santafe.edu.ar',
  margin + 23,
  y + 11
);

// ------------------------------------------------------------
// INFORMACIÓN DEL PLAN
// ------------------------------------------------------------

doc.setTextColor(...gris);
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);

doc.text(
  'Plan mensual',
  pageWidth - margin,
  y + 2,
  { align: 'right' }
);

doc.setTextColor(...bordó);
doc.setFont('helvetica', 'bold');
doc.setFontSize(18);

doc.text(
  `${mes} ${anio}`,
  pageWidth - margin,
  y + 10,
  { align: 'right' }
);

// Línea separadora
y += 21;

doc.setDrawColor(...borde);
doc.setLineWidth(0.5);

doc.line(
  margin,
  y,
  pageWidth - margin,
  y
);

y += 6;

  // ============================================================
  // TABLA
  // ============================================================

  const colHeaders = [
    'LUNES',
    'MARTES',
    'MIÉRCOLES',
    'JUEVES',
    'VIERNES',
    'OBSERVACIONES'
  ];

  const colWidths = [45, 45, 45, 45, 45, 52];

  const headerHeight = 9;

  const cantidadSemanas = planActual.semanas.length;

  /*
   * Para 5 semanas usamos prácticamente todo el espacio
   * disponible de la hoja.
   */
  const espacioEstado = planActual.obsDirectora ? 17 : 11;
  const espacioPie = 12;

  const espacioDisponible =
    pageHeight -
    y -
    headerHeight -
    espacioEstado -
    espacioPie;

  const rowHeight = Math.min(
    30,
    espacioDisponible / cantidadSemanas
  );

  // Tamaños según cantidad de semanas
  const modoCompacto = cantidadSemanas >= 5;

  const fontDia = modoCompacto ? 8 : 10;
  const fontComida = modoCompacto ? 7 : 9;
  const fontEtiqueta = modoCompacto ? 5.5 : 6.5;
  const fontObservacion = modoCompacto ? 7 : 9;

  // ============================================================
  // HEADER DE TABLA
  // ============================================================

  let x = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  colHeaders.forEach((header, i) => {
    doc.setFillColor(...bordóClaro);

    doc.rect(
      x,
      y,
      colWidths[i],
      headerHeight,
      'F'
    );

    doc.text(
      header,
      x + colWidths[i] / 2,
      y + 6,
      { align: 'center' }
    );

    x += colWidths[i];
  });

  y += headerHeight;

  // ============================================================
  // SEMANAS
  // ============================================================

  planActual.semanas.forEach((semana, indiceSemana) => {
    x = margin;

    // ----------------------------------------------------------
    // DÍAS
    // ----------------------------------------------------------

    for (let col = 0; col < 5; col++) {
      const diaEnColumna = semana.dias.find(dia => {
        const fechaDia = new Date(
          anio,
          fecha.getUTCMonth(),
          dia.numDia
        );

        return fechaDia.getDay() === col + 1;
      });

      // Fondo alternado
      if (indiceSemana % 2 === 0) {
        doc.setFillColor(...fondoSuave);

        doc.rect(
          x,
          y,
          colWidths[col],
          rowHeight,
          'F'
        );
      }

      // Borde
      doc.setDrawColor(...borde);
      doc.setLineWidth(0.3);

      doc.rect(
        x,
        y,
        colWidths[col],
        rowHeight
      );

      if (diaEnColumna) {
        // ======================================================
        // DÍA
        // ======================================================

        doc.setTextColor(...bordó);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontDia);

        doc.text(
          `DÍA ${diaEnColumna.numDia}`,
          x + 3,
          y + 5
        );

        // ======================================================
        // DESAYUNO
        // ======================================================

        doc.setTextColor(...gris);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontEtiqueta);

        doc.text(
          'DESAYUNO',
          x + 3,
          y + 9
        );

        doc.setTextColor(...texto);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontComida);

        if (diaEnColumna.desayuno) {
          const desayunoLines = doc.splitTextToSize(
            diaEnColumna.desayuno,
            colWidths[col] - 6
          );

          /*
           * En 5 semanas dejamos solamente dos líneas.
           * Si el texto es más largo, se prioriza que la
           * información no invada el espacio del almuerzo.
           */
          const maxLineas = modoCompacto ? 2 : 3;

          doc.text(
            desayunoLines.slice(0, maxLineas),
            x + 3,
            y + 13
          );
        } else {
          doc.setTextColor(...gris);

          doc.text(
            '—',
            x + 3,
            y + 13
          );
        }

        // ======================================================
        // ALMUERZO
        // ======================================================

        const posicionEtiquetaAlmuerzo =
          modoCompacto ? y + rowHeight - 10 : y + 22;

        const posicionTextoAlmuerzo =
          modoCompacto ? y + rowHeight - 6 : y + 26;

        doc.setTextColor(...gris);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fontEtiqueta);

        doc.text(
          'ALMUERZO',
          x + 3,
          posicionEtiquetaAlmuerzo
        );

        doc.setTextColor(...texto);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fontComida);

        if (diaEnColumna.almuerzo) {
          const almuerzoLines = doc.splitTextToSize(
            diaEnColumna.almuerzo,
            colWidths[col] - 6
          );

          const maxLineas = modoCompacto ? 2 : 3;

          doc.text(
            almuerzoLines.slice(0, maxLineas),
            x + 3,
            posicionTextoAlmuerzo
          );
        } else {
          doc.setTextColor(...gris);

          doc.text(
            '—',
            x + 3,
            posicionTextoAlmuerzo
          );
        }
      }

      x += colWidths[col];
    }

    // ==========================================================
    // OBSERVACIONES
    // ==========================================================

    if (indiceSemana % 2 === 0) {
      doc.setFillColor(...fondoSuave);

      doc.rect(
        x,
        y,
        colWidths[5],
        rowHeight,
        'F'
      );
    }

    doc.setDrawColor(...borde);

    doc.rect(
      x,
      y,
      colWidths[5],
      rowHeight
    );

    // Semana
    doc.setTextColor(...bordó);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(modoCompacto ? 7.5 : 8.5);

    doc.text(
      `SEMANA ${semana.numSemana}`,
      x + 3,
      y + 6
    );

    // Observación
    if (semana.obsEconoma) {
      doc.setTextColor(...texto);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontObservacion);

      const obsLines = doc.splitTextToSize(
        semana.obsEconoma,
        colWidths[5] - 6
      );

      const maxLineas = modoCompacto ? 4 : 6;

      doc.text(
        obsLines.slice(0, maxLineas),
        x + 3,
        y + 11
      );
    } else {
      doc.setTextColor(...gris);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      doc.text(
        'Sin observaciones',
        x + 3,
        y + 11
      );
    }

    y += rowHeight;
  });

  // ============================================================
  // ESTADO
  // ============================================================

  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...bordó);

  doc.text(
    'Estado:',
    margin,
    y
  );

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...texto);

  doc.text(
    planActual.estado.replace(/_/g, ' '),
    margin + 14,
    y
  );

  // ============================================================
  // OBSERVACIÓN DIRECTORA
  // ============================================================

  if (planActual.obsDirectora) {
    y += 6;

    const obsTexto =
      `Observación de la directora: ${planActual.obsDirectora}`;

    const obsLines = doc.splitTextToSize(
      obsTexto,
      pageWidth - margin * 2
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...gris);

    doc.text(
      obsLines,
      margin,
      y
    );
  }

  // ============================================================
  // PIE DE PÁGINA
  // ============================================================

  const totalPaginas = doc.internal.getNumberOfPages();

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);

    doc.setDrawColor(...borde);
    doc.setLineWidth(0.3);

    doc.line(
      margin,
      pageHeight - 9,
      pageWidth - margin,
      pageHeight - 9
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...gris);

    doc.text(
      'SiGACE — Sistema de Gestión Administrativa de Comedores Escolares',
      margin,
      pageHeight - 4
    );

    doc.text(
      `Página ${pagina} de ${totalPaginas}`,
      pageWidth - margin,
      pageHeight - 4,
      { align: 'right' }
    );
  }

  // ============================================================
  // GUARDAR
  // ============================================================

  doc.save(`plan-mensual-${mes}-${anio}.pdf`);
}