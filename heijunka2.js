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
const PX_PER_MIN = 1;
const GAP_MINUTES = 15;
const HOURS = 36;
const TIMELINE_WIDTH = HOURS * 60 * PX_PER_MIN;

const partes = {
  'PZA-A': { color: '#E74C3C', receta: ['WC7411', 'WC7416'] },
  'PZA-B': { color: '#3498DB', receta: ['WC7412', 'WC7417'] },
  'PZA-C': { color: '#2ECC71', receta: ['WC7414', 'WC7414'] },
  'PZA-D': { color: '#F1C40F', receta: ['WC7413', 'WC7415', 'WC7416'] },
  'PZA-E': { color: '#8E44AD', receta: ['WC7457', 'WC7412'] }
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
  ]},
  { id: 1004, parte: 'PZA-D', cantidad: 600, operaciones: [
    { centro: 'WC7413', duracion: 30, horaInicio: '2024-01-01T12:30:00' },
    { centro: 'WC7415', duracion: 60 },
	{ centro: 'WC7416', duracion: 120 }
  ]},
  { id: 1005, parte: 'PZA-E', cantidad: 350, operaciones: [
    { centro: 'WC7457', duracion: 75 },
    { centro: 'WC7412', duracion: 90 }
  ]},
  { id: 1006, parte: 'PZA-A', cantidad: 240, operaciones: [
    { centro: 'WC7411', duracion: 70 },
    { centro: 'WC7416', duracion: 180 }
  ]},
  { id: 1007, parte: 'PZA-B', cantidad: 900, operaciones: [
    { centro: 'WC7412', duracion: 65 },
    { centro: 'WC7417', duracion: 110 }
  ]},
  { id: 1008, parte: 'PZA-C', cantidad: 800, operaciones: [
    { centro: 'WC7414', duracion: 60 },
    { centro: 'WC7414', duracion: 150 }
  ]},
  { id: 1009, parte: 'PZA-D', cantidad: 1200, operaciones: [
    { centro: 'WC7413', duracion: 0, horaInicio: '2024-01-01T08:30:00'},
	{ centro: 'WC7415', duracion: 80, horaInicio: '2024-01-01T08:30:00' },
    { centro: 'WC7416', duracion: 95 }
  ]},
  { id: 1010, parte: 'PZA-E', cantidad: 450, operaciones: [
    { centro: 'WC7457', duracion: 90,  horaInicio: '2024-01-01T16:30:00' },
    { centro: 'WC7412', duracion: 105 }
  ]},
   // Más órdenes para simular mejor
  { id: 1011, parte: 'PZA-A', cantidad: 350, operaciones: [
    { centro: 'WC7411', duracion: 85 },
    { centro: 'WC7416', duracion: 190 }
  ]},
  { id: 1012, parte: 'PZA-B', cantidad: 700, operaciones: [
    { centro: 'WC7412', duracion: 55 },
    { centro: 'WC7417', duracion: 120 }
  ]},
  { id: 1013, parte: 'PZA-C', cantidad: 2000, operaciones: [
    { centro: 'WC7414', duracion: 50 },
    { centro: 'WC7414', duracion: 200 }
  ]},
  { id: 1014, parte: 'PZA-D', cantidad: 800, operaciones: [
    { centro: 'WC7413', duracion: 40 },
    { centro: 'WC7415', duracion: 75 },
    { centro: 'WC7416', duracion: 130 }
  ]},
  { id: 1015, parte: 'PZA-E', cantidad: 500, operaciones: [
    { centro: 'WC7457', duracion: 60 },
    { centro: 'WC7412', duracion: 110 }
  ]},
  { id: 1016, parte: 'PZA-A', cantidad: 210, operaciones: [
    { centro: 'WC7411', duracion: 65 },
    { centro: 'WC7416', duracion: 155 }
  ]},
  { id: 1017, parte: 'PZA-B', cantidad: 960, operaciones: [
    { centro: 'WC7412', duracion: 60 },
    { centro: 'WC7417', duracion: 115 }
  ]},
  { id: 1018, parte: 'PZA-C', cantidad: 1200, operaciones: [
    { centro: 'WC7414', duracion: 48 },
    { centro: 'WC7414', duracion: 170 }
  ]},
  { id: 1019, parte: 'PZA-D', cantidad: 630, operaciones: [
    { centro: 'WC7413', duracion: 35 },
    { centro: 'WC7415', duracion: 80 },
    { centro: 'WC7416', duracion: 110 }
  ]},
  { id: 1020, parte: 'PZA-E', cantidad: 410, operaciones: [
    { centro: 'WC7457', duracion: 72 },
    { centro: 'WC7412', duracion: 92 }
  ]}
];

const asignadas = new Set();

function minutosDesdeInicio(fechaStr) {
  if (!fechaStr) return 0;
  const fecha = new Date(fechaStr);
  return (fecha - START_TIME) / 60000;
}

function findOperacion(ordenId, centro, recetaIndex) {
  for (const orden of ordenes) {
    if (orden.id === ordenId) {
      // Contar ocurrencias en receta
      let countInReceta = 0;
      for (let i = 0; i <= recetaIndex; i++) {
        if (partes[orden.parte].receta[i] === centro) countInReceta++;
      }
      // Buscar esa ocurrencia en operaciones
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

// ... (todo lo anterior igual)

// --- FUNCIÓN RECURSIVA DE TRASLAPE ---
/**
 * Corrige recursivamente el inicio de una operación para evitar traslapes en el timeline.
 * @param {Date} propuestaInicio - Propuesta inicial de inicio.
 * @param {number} duracion - Duración de la operación en minutos.
 * @param {string} centro - Centro de trabajo (wc).
 * @param {object} op - Objeto operación (para excluirse a sí misma).
 * @returns {Date} - Inicio corregido sin traslapes.
 */
function corregirTraslape(propuestaInicio, duracion, centro, op) {
  let nuevaHoraInicio = new Date(propuestaInicio);
  let nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + duracion * 60000);
  let traslapeEncontrado = false;
  let maxFinTraslape = null;

  $(`[data-centro="${centro}"] .timeline .op`).each(function() {
    const opExistente = $(this).data('op');
    if (
      opExistente &&
      (!op || opExistente.id !== op.id || opExistente.centro !== op.centro ||
      (opExistente.horaInicio !== op.horaInicio)) // Excluirse a sí misma si se está reubicando
    ) {
      const ini = new Date(opExistente.horaInicio);
      const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
      if ((nuevaHoraInicio < fin) && (nuevaHoraFin > ini)) {
        traslapeEncontrado = true;
        if (!maxFinTraslape || fin > maxFinTraslape) {
          maxFinTraslape = fin;
        }
      }
    }
  });

  if (traslapeEncontrado && maxFinTraslape) {
    // Llamada recursiva con el nuevo inicio propuesto al final del traslape más largo
    return corregirTraslape(maxFinTraslape, duracion, centro, op);
  } else {
    // No hay traslape
    return nuevaHoraInicio;
  }
}

// ... (resto del código igual, pero cambia la lógica de drop y programación de siguientes operaciones a continuación)


function crearCentro(centroObj) {
  const wc = centroObj.wc;
  const nombre = centroObj.nombre;
  const div = $(`
    <div class="centro" data-centro="${wc}">
      <div class="centro-label">${wc} - ${nombre}</div>
      <div class="centro-flex">
        <div class="queue-centro" data-centro-queue="${wc}">
          <div class="queue-title">Queue ${wc}</div>
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
	//overflow: 'auto'
  });

  // Vertical hour lines and hour labels
  for (let h = 0; h < HOURS; h++) {
    const left = h * 60 * PX_PER_MIN;
    lineaTiempo.append(`<div class="hora-vline" style="
					  position:absolute;
					  top:0;
					  left:${left}px;
					  width:1px;
					  height:100%;
					  background:#ccc;
					  z-index:0;
					  "></div>`);
    const hora = new Date(START_TIME.getTime() + h * 60 * 60000);
    const label = hora.getHours().toString().padStart(2, '0') + ':' + hora.getMinutes().toString().padStart(2, '0');
    lineaTiempo.append('<div class="hora" style="left:' + left + 'px; top:0; z-index:2; background:#f8f8f8cc; padding:0 2px; position:absolute;">' + label + '</div>');
  }

// --- EN EL DROP DE TIMELINE (sustituye el ajuste de traslapes por la función recursiva) ---
lineaTiempo.droppable({
  accept: '.op',
  greedy: true,
  drop: function(event, ui) {
    const op = ui.helper.data('op');
    if (!op) {
      alert('Error interno: operación no encontrada. Intenta de nuevo.');
      return;
    }
    if (!op.parte || !partes[op.parte]) {
      alert("Operación sin parte válida.");
      return;
    }
    const centro = $(this).closest('.centro').data('centro');
    const receta = partes[op.parte].receta;

    // Encontrar el índice correcto en la receta para este op (por si hay centros repetidos)
    let recetaIndex = 0, count = 0;
    for (let i = 0; i < receta.length; i++) {
      if (receta[i] === op.centro) {
        recetaIndex = i;
        if (ordenes.find(o => o.id === op.id).operaciones.indexOf(op) === count) {
          break;
        }
        count++;
      }
    }

    if (op.centro !== centro) return;

    let dropDate;
    if (recetaIndex > 0) {
      const prevCentro = receta[recetaIndex - 1];
      const prevOp = findOperacion(op.id, prevCentro, recetaIndex-1);
      if (!prevOp || !prevOp.horaInicio) {
        alert('Primero debes despachar la operación anterior: ' + prevCentro);
        return;
      }
      const prevStart = new Date(prevOp.horaInicio);
      //const minStart = new Date(prevStart.getTime() + prevOp.duracion * 60000);
	  const minStart = new Date(prevStart.getTime() + GAP_MINUTES * 60000);
		
      const left = event.pageX - $(this).offset().left;
      const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
      let propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);

      if (propuestaDropDate < minStart) {
        propuestaDropDate = minStart;
      }

      // --- USAR LA FUNCIÓN RECURSIVA ---
      let nuevaHoraInicio = corregirTraslape(propuestaDropDate, op.duracion, centro, op);
      dropDate = nuevaHoraInicio;
      op.horaInicio = dropDate.toISOString();
    } else {
      // Primera operación: libre
      const left = event.pageX - $(this).offset().left;
      const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
      let propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);

      // --- USAR LA FUNCIÓN RECURSIVA ---
      let nuevaHoraInicio = corregirTraslape(propuestaDropDate, op.duracion, centro, op);
      dropDate = nuevaHoraInicio;
      op.horaInicio = dropDate.toISOString();
    }

    asignadas.add(op.id + '-' + op.centro + '-' + recetaIndex);

    // Remove any existing op with same id, centro y recetaIndex
    $(this).find('.op').each(function() {
      const dataOp = $(this).data('op');
      if (
        dataOp &&
        dataOp.id === op.id &&
        dataOp.centro === op.centro &&
        ordenes.find(o => o.id === op.id).operaciones.indexOf(dataOp) === ordenes.find(o => o.id === op.id).operaciones.indexOf(op)
      ) {
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

// --- EN programarSiguientes TAMBIÉN CAMBIA EL AJUSTE DE TRASLAPE ---
function programarSiguientes(op, recetaIndex) {
  const orden = ordenes.find(o => o.id === op.id);
  const receta = partes[op.parte].receta;
  let prevOp = op;
  for (let i = recetaIndex + 1; i < receta.length; i++) {
    const nextCentro = receta[i];
    const nextOp = findOperacion(op.id, nextCentro, i);

    if (!nextOp) break;
    const prevStart = new Date(prevOp.horaInicio);
    const minStart = new Date(prevStart.getTime() + prevOp.duracion * 60000);

    // --- USAR LA FUNCIÓN RECURSIVA ---
    let propuestaInicio = minStart;
    let nuevaHoraInicio = corregirTraslape(propuestaInicio, nextOp.duracion, nextCentro, nextOp);

    nextOp.horaInicio = nuevaHoraInicio.toISOString();
    asignadas.add(nextOp.id + '-' + nextOp.centro + '-' + i);

    let centroDiv = $(`[data-centro="${nextCentro}"] .timeline`);
    centroDiv.find('.op').each(function() {
      const dataOp = $(this).data('op');
      if (
        dataOp &&
        dataOp.id === nextOp.id &&
        dataOp.centro === nextOp.centro &&
        orden.operaciones.indexOf(dataOp) === orden.operaciones.indexOf(nextOp)
      ) {
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
  const horaTooltip = op.horaInicio ? 'Inicio: ' + new Date(op.horaInicio).toLocaleTimeString() + '<br/>Duracion: ' + op.duracion+ ' mins <br/>Fin: ' + new Date( new Date(op.horaInicio).getTime() + op.duracion * 60000).toLocaleTimeString()   : '';
  const contenido = '<div class="op" title="' + horaTooltip + '">' +
  //const contenido = '<div class="op" >' +
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
	cursorAt: { left: 0, top: 0 },
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
      op.id = orden.id;
      op.parte = orden.parte;
      op.cantidad = orden.cantidad;
	  //op.horaInicio = orden.operaciones[i].horaInicio;
     // delete op.horaInicio;
    }
    const primerOp = orden.operaciones[0];
    const id = primerOp.id + '-' + primerOp.centro + '-0';

    for (let i = 0; i < orden.operaciones.length; i++) {
      const op = orden.operaciones[i];
      if (op.horaInicio) {
        asignadas.add(op.id + '-' + op.centro + '-' + i);
        $(`[data-centro="${op.centro}"] .timeline`).append(crearOperacion(op, false, true));
		programarSiguientes(op,i);
      }
    }
	
	  if (!asignadas.has(id)) {
      const queueList = $(`[data-centro-queue="${primerOp.centro}"] .queue-list`);
      queueList.append(crearOperacion(primerOp, true));
    }
	
  }
}

$(function() {
  if ($('#gantt-main').length === 0) {
    $('body').append('<div id="gantt-main" style="display: flex; align-items: flex-start; gap: 32px;"><div id="gantt-queues"></div><div id="gantt-timelines" style="flex:1"></div></div>');
  }
  for (const centro of CENTROS) {
    if ($(`[data-centro-queue="${centro.wc}"]`).length === 0) {
      $('#gantt-queues').append(`
        <div class="queue-centro" data-centro-queue="${centro.wc}" style="min-width: 140px; margin-bottom:16px; background: #f2f6fa; border-radius: 6px; border: 1px solid #b3c9e2; padding: 4px 0 7px 0; min-height: 80px; box-sizing: border-box; box-shadow: 1px 2px 5px #0002;">
          <div class="queue-title" style="font-size: 12px; text-align: center; margin-bottom: 4px; color: #444; font-weight: bold; letter-spacing: 1px;">Queue ${centro.wc}</div>
          <div class="queue-list" style="display:flex; flex-direction:column; gap:8px; align-items:stretch; padding:2px 4px;"></div>
        </div>
      `);
    }
  }
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});
