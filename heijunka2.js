const CENTROS = [
  { wc: 'WC7411', nombre: 'SMT Line_1: 1 Module single Reel' },
  { wc: 'WC7412', nombre: 'SMT Line_2: 3 Module single Reel' },
  { wc: 'WC7413', nombre: 'SMT Line_3: 1 Module Dual  Reel' },
  { wc: 'WC7414', nombre: 'SMT Line_4: 4 Modules Dual  Reel' },
  { wc: 'WC7415', nombre: 'SMT Line_5: 3 Modules Dual  Reel' },
  { wc: 'WC7416', nombre: 'SMT Line_6: 3 Modules Dual  Reel' },
  { wc: 'WC7417', nombre: 'SMT Line_7: 3 Modules  single Reel' },
  { wc: 'WC7457', nombre: 'SMT Line_8: 3 Modules  single Reel' }
];
const START_TIME = new Date('2024-01-01T06:30:00');
const PX_PER_MIN = 2;
const GAP_MINUTES = 15;
const HOURS = 24;
const TIMELINE_WIDTH = HOURS * 60 * PX_PER_MIN;

const partes = {
  'PZA-A': { color: '#E74C3C', receta: ['WC7411', 'WC7416'] },
  'PZA-B': { color: '#3498DB', receta: ['WC7412', 'WC7417'] },
  'PZA-C': { color: '#2ECC71', receta: ['WC7414', 'WC7414'] }
};

const ordenes = [
  { id: 1001, parte: 'PZA-A', cantidad: 100, operaciones: [
    { centro: 'WC7411', duracion: 60 },
    { centro: 'WC7416', duracion: 300 }
  ]},
  { id: 1002, parte: 'PZA-B', cantidad: 800, operaciones: [
    { centro: 'WC7412', duracion: 50 },
    { centro: 'WC7417', duracion: 135 }
  ]},
  { id: 1003, parte: 'PZA-C', cantidad: 1400, operaciones: [
    { centro: 'WC7414', duracion: 45 },
    { centro: 'WC7414', duracion: 180 }
  ]}
];

const asignadas = new Set();

function minutosDesdeInicio(fechaStr) {
  if(!fechaStr) return 0;
  const fecha = new Date(fechaStr);
  return (fecha - START_TIME) / 60000;
}

// Busca la operación en la orden según id, centro y posición en receta
function findOperacion(ordenId, centro, recetaIndex) {
  for (const orden of ordenes) {
    if (orden.id === ordenId) {
      let countInReceta = 0;
      for (let i = 0; i <= recetaIndex; i++) {
        if (partes[orden.parte].receta[i] === centro) countInReceta++;
      }
      let countInOps = 0;
      for (let i = 0; i < orden.operaciones.length; i++) {
        if (orden.operaciones[i].centro === centro) {
          countInOps++;
          if (countInOps === countInReceta) return orden.operaciones[i];
        }
      }
    }
  }
  return null;
}

function crearCentro(centroObj) {
  const wc = centroObj.wc;
  const nombre = centroObj.nombre;
  const div = $(`
    <div class="centro" data-centro="${wc}">
      <div class="centro-label">${wc} - ${nombre}</div>
      <div class="centro-flex">
        <div class="queue-centro" data-centro-queue="${wc}">
          <div class="queue-title">Queue ${wc} - ${nombre}</div>
          <div class="queue-list"></div>
        </div>
        <div class="timeline"></div>
      </div>
    </div>
  `);
  $('#gantt-timelines').append(div);

  const lineaTiempo = div.find('.timeline');
  lineaTiempo.css({
    width: TIMELINE_WIDTH + 'px',
    minWidth: TIMELINE_WIDTH + 'px',
    maxWidth: TIMELINE_WIDTH + 'px',
    height: '100px',
    background: '#f8f8f8',
    border: '1px solid #eee',
    position: 'relative',
    marginBottom: '10px',
    boxSizing: 'content-box',
    overflow: 'auto'
  });

  // Vertical hour lines and hour labels
  for (let h = 0; h < HOURS; h++) {
    const left = h * 60 * PX_PER_MIN;
    // Draw vertical line
    lineaTiempo.append(`<div class="hora-vline" style="
      position:absolute;
      top:0;
      left:${left}px;
      width:1px;
      height:100%;
      background:#ccc;
      z-index:0;
      "></div>`);
    // Draw hour label
    const hora = new Date(START_TIME.getTime() + h * 60 * 60000);
    const label = hora.getHours().toString().padStart(2, '0') + ':' + hora.getMinutes().toString().padStart(2, '0');
    lineaTiempo.append('<div class="hora" style="left:' + left + 'px; top:0; z-index:2; background:#f8f8f8cc; padding:0 2px; position:absolute;">' + label + '</div>');
  }

  lineaTiempo.droppable({
    accept: '.op',
    greedy: true,
    drop: function(event, ui) {
      const op = ui.helper.data('op');
      if (!op) { alert('Error interno: operación no encontrada.'); return; }
      const centro = $(this).closest('.centro').data('centro');
      if (op.centro !== centro) return;

      // Encontrar recetaIndex correcto
      const receta = partes[op.parte].receta;
      let recetaIndex = 0;
      let count = 0;
      for (let i = 0; i < receta.length; i++) {
        if (receta[i] === op.centro) {
          if (ordenes.find(o => o.id === op.id).operaciones.indexOf(op) === count) {
            recetaIndex = i; break;
          }
          count++;
        }
      }

      const left = event.pageX - $(this).offset().left;
      let propuestaDropDate = new Date(START_TIME.getTime() + Math.max(0, Math.round(left / PX_PER_MIN)) * 60000);

      // 1. Calcular minStart para recetaIndex > 0
      let minStart = null;
      if (recetaIndex > 0) {
        const prevCentro = receta[recetaIndex - 1];
        const prevOp = findOperacion(op.id, prevCentro, recetaIndex-1);
        if (!prevOp || !prevOp.horaInicio) {
          alert('Primero debes programar la operación anterior: ' + prevCentro);
          return;
        }
        const prevIni = new Date(prevOp.horaInicio);
        const prevFin = new Date(prevIni.getTime() + prevOp.duracion * 60000);
        minStart = new Date(prevFin.getTime() + GAP_MINUTES * 60000);
      }

      // 2. Recopilar todos los intervalos ocupados en la timeline (excluyendo la misma op)
      let timelineOps = [];
      $(this).find('.op').each(function() {
        const opExistente = $(this).data('op');
        if (opExistente && opExistente.id !== op.id) {
          const ini = new Date(opExistente.horaInicio);
          const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
          timelineOps.push({ini, fin});
        }
      });
      timelineOps.sort((a, b) => a.ini - b.ini);

      // 3. Nueva lógica: buscar el hueco más cercano a la derecha de donde soltó, pero NUNCA antes de minStart
      //    (si hay hueco donde soltó, ahí se queda; si no, busca el primer hueco posible)
      let inicioDeseado = minStart && propuestaDropDate < minStart ? minStart : propuestaDropDate;
      let finDeseado = new Date(inicioDeseado.getTime() + op.duracion * 60000);

      // Buscar hueco sin traslapes
      let nuevoInicio = inicioDeseado;
      let nuevoFin = finDeseado;
      let found = false;

      // Recorremos los huecos entre operaciones programadas (o antes de la primera, o después de la última)
      let t0 = minStart && minStart > inicioDeseado ? minStart : inicioDeseado;
      let t1;
      for (let i = 0; i <= timelineOps.length; i++) {
        t1 = (i < timelineOps.length) ? timelineOps[i].ini : null;
        let posibleInicio = t0;
        if (minStart && posibleInicio < minStart) posibleInicio = minStart;
        let posibleFin = new Date(posibleInicio.getTime() + op.duracion * 60000);
        if (t1 && posibleFin > t1) {
          t0 = timelineOps[i].fin;
          continue;
        }
        if (posibleInicio < inicioDeseado) {
          if (i < timelineOps.length) {
            t0 = timelineOps[i].fin;
          }
          continue;
        }
        nuevoInicio = posibleInicio;
        nuevoFin = posibleFin;
        found = true;
        break;
      }
      if (!found) {
        nuevoInicio = minStart ? (timelineOps.length > 0 ? timelineOps[timelineOps.length-1].fin : minStart) : (timelineOps.length > 0 ? timelineOps[timelineOps.length-1].fin : inicioDeseado);
        nuevoFin = new Date(nuevoInicio.getTime() + op.duracion * 60000);
      }

      op.horaInicio = nuevoInicio.toISOString();
      asignadas.add(op.id + '-' + op.centro + '-' + recetaIndex);

      // Elimina si ya estaba puesta
      $(this).find('.op').each(function() {
        const dataOp = $(this).data('op');
        if (dataOp && dataOp.id === op.id && dataOp.centro === op.centro && ordenes.find(o => o.id === op.id).operaciones.indexOf(dataOp) === ordenes.find(o => o.id === op.id).operaciones.indexOf(op)) {
          $(this).remove();
        }
      });

      ui.draggable.remove();
      const newOpDiv = crearOperacion(op, false, true);
      $(this).append(newOpDiv);

      programarSiguientes(op, recetaIndex);
    }
  });
}

function programarSiguientes(op, recetaIndex) {
  const orden = ordenes.find(o => o.id === op.id);
  const receta = partes[op.parte].receta;
  let prevOp = op;
  for (let i = recetaIndex + 1; i < receta.length; i++) {
    const nextCentro = receta[i];
    const nextOp = findOperacion(op.id, nextCentro, i);
    if (!nextOp) break;
    const prevStart = new Date(prevOp.horaInicio);
    const prevFin = new Date(prevStart.getTime() + prevOp.duracion * 60000);
    let minStart = new Date(prevFin.getTime() + GAP_MINUTES * 60000);

    // Igual lógica de hueco más cercano
    let timelineOps = [];
    $(`[data-centro="${nextCentro}"] .timeline`).find('.op').each(function() {
      const opExistente = $(this).data('op');
      if (opExistente && opExistente.id !== nextOp.id) {
        const ini = new Date(opExistente.horaInicio);
        const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
        timelineOps.push({ini, fin});
      }
    });
    timelineOps.sort((a, b) => a.ini - b.ini);

    let posibleInicio = minStart;
    let posibleFin = new Date(posibleInicio.getTime() + nextOp.duracion * 60000);
    let found = false;
    let t0 = posibleInicio;
    let t1;
    for (let j = 0; j <= timelineOps.length; j++) {
      t1 = (j < timelineOps.length) ? timelineOps[j].ini : null;
      let iniTest = t0;
      let finTest = new Date(iniTest.getTime() + nextOp.duracion * 60000);
      if (t1 && finTest > t1) {
        t0 = timelineOps[j].fin;
        continue;
      }
      // Se queda en el primer hueco suficiente
      posibleInicio = iniTest;
      posibleFin = finTest;
      found = true;
      break;
    }
    if (!found) {
      posibleInicio = timelineOps.length > 0 ? timelineOps[timelineOps.length-1].fin : minStart;
      posibleFin = new Date(posibleInicio.getTime() + nextOp.duracion * 60000);
    }

    nextOp.horaInicio = posibleInicio.toISOString();
    asignadas.add(nextOp.id + '-' + nextOp.centro + '-' + i);

    let centroDiv = $(`[data-centro="${nextCentro}"] .timeline`);
    centroDiv.find('.op').each(function() {
      const dataOp = $(this).data('op');
      if (dataOp && dataOp.id === nextOp.id && dataOp.centro === nextOp.centro && orden.operaciones.indexOf(dataOp) === orden.operaciones.indexOf(nextOp)) {
        $(this).remove();
      }
    });
    centroDiv.append(crearOperacion(nextOp, false, true));
    prevOp = nextOp;
  }
}

function crearOperacion(op, isQueue = false, inGantt = false) {
  const color = partes[op.parte].color;
  const width = op.duracion * PX_PER_MIN;
  const horaTooltip = op.horaInicio ? 'Inicio: ' + new Date(op.horaInicio).toLocaleTimeString() : '';
  const contenido = '<div class="op" title="' + horaTooltip + '">' +
                    '<strong>Ord ' + op.id + '</strong><br>' +
                    'Pza: ' + op.parte + '<br>' +
                    'Qty: ' + op.cantidad +
                    '</div>';
  const $div = $(contenido);
  if (isQueue) {
    $div.css({ backgroundColor: color, opacity: 0.5, marginBottom: '8px', position: 'static', width: width + 'px' });
  } else {
    $div.css({ backgroundColor: color, width: width + 'px', opacity: 1, left: op.horaInicio ? (minutosDesdeInicio(op.horaInicio) * PX_PER_MIN) + 'px' : 0, position: 'absolute' });
  }
  $div.data('op', op);
  $div.draggable({
    helper: 'clone',
    appendTo: 'body',
    revert: 'invalid',
    zIndex: 1000,
    start: function(e, ui) {
      $(ui.helper).data('op', op);
      $(ui.helper).addClass('op').css('opacity', 0.7);
    }
  });
  return $div;
}

function cargarOrdenes() {
  $('.queue-list').empty();
  for (const orden of ordenes) {
    for (let i = 0; i < orden.operaciones.length; i++) {
      const op = orden.operaciones[i];
      op.id = orden.id; op.parte = orden.parte; op.cantidad = orden.cantidad; delete op.horaInicio;
    }
    const primerOp = orden.operaciones[0];
    const id = primerOp.id + '-' + primerOp.centro + '-0';
    if (!asignadas.has(id)) {
      const queueList = $(`[data-centro-queue="${primerOp.centro}"] .queue-list`);
      queueList.append(crearOperacion(primerOp, true));
    }
    for (let i = 0; i < orden.operaciones.length; i++) {
      const op = orden.operaciones[i];
      if (op.horaInicio) {
        asignadas.add(op.id + '-' + op.centro + '-' + i);
        $(`[data-centro="${op.centro}"] .timeline`).append(crearOperacion(op, false, true));
      }
    }
  }
}

$(function() {
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});