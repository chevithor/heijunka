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

// Busca la operación en la orden según id y centro
function findOperacion(ordenId, centro) {
  for (const orden of ordenes) {
    if (orden.id === ordenId) {
      for (const op of orden.operaciones) {
        if (op.centro === centro) return op;
      }
    }
  }
  return null;
}

function crearCentro(centroObj) {
  const wc = centroObj.wc;
  const nombre = centroObj.nombre;
  // .centro > .centro-label + .centro-flex (.queue-centro + .timeline)
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
  for (let h = 0; h < 24; h++) {
    const hora = new Date(START_TIME.getTime() + h * 60 * 60000);
    const left = h * 60 * PX_PER_MIN;
    const label = hora.getHours().toString().padStart(2, '0') + ':' + hora.getMinutes().toString().padStart(2, '0');
    lineaTiempo.append('<div class="hora" style="left:' + left + 'px;">' + label + '</div>');
  }

  lineaTiempo.droppable({
    accept: '.op',
    greedy: true,
    drop: function(event, ui) {
      const op = ui.helper.data('op');
      if (!op) { alert('Error interno: operación no encontrada.'); return; }
      const centro = $(this).closest('.centro').data('centro');
      if (op.centro !== centro) return;

      // Determina el índice en la receta
      const receta = partes[op.parte].receta;
      const index = receta.indexOf(op.centro);

      let dropDate;
      if (index > 0) {
        // No es la primera operación: depende del fin de la anterior + GAP
        const prevCentro = receta[index - 1];
        const prevOp = findOperacion(op.id, prevCentro);
        if (!prevOp || !prevOp.horaInicio) {
          alert('Primero debes programar la operación anterior: ' + prevCentro);
          return;
        }
        const prevIni = new Date(prevOp.horaInicio);
        const prevFin = new Date(prevIni.getTime() + prevOp.duracion * 60000);
        const minStart = new Date(prevFin.getTime() + GAP_MINUTES * 60000);

        // El usuario puede dejar la op antes del mínimo, forzamos a después del mínimo
        const left = event.pageX - $(this).offset().left;
        const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
        let propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);
        let nuevaHoraInicio = propuestaDropDate < minStart ? minStart : propuestaDropDate;
        let nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);

        // Evita traslapes
        let traslapes = [];
        $(this).find('.op').each(function() {
          const opExistente = $(this).data('op');
          if (opExistente && opExistente.id !== op.id) {
            const ini = new Date(opExistente.horaInicio);
            const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
            if ((nuevaHoraInicio < fin) && (nuevaHoraFin > ini)) {
              traslapes.push(fin);
            }
          }
        });
        if (traslapes.length > 0) {
          const maxFin = new Date(Math.max.apply(null, traslapes));
          nuevaHoraInicio = maxFin;
          nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
        }
        dropDate = nuevaHoraInicio;
        op.horaInicio = dropDate.toISOString();
      } else {
        // Primera operación: libre, pero evita traslapes
        const left = event.pageX - $(this).offset().left;
        const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
        let propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);
        let nuevaHoraInicio = propuestaDropDate;
        let nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);

        let traslapes = [];
        $(this).find('.op').each(function() {
          const opExistente = $(this).data('op');
          if (opExistente && opExistente.id !== op.id) {
            const ini = new Date(opExistente.horaInicio);
            const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
            if ((nuevaHoraInicio < fin) && (nuevaHoraFin > ini)) {
              traslapes.push(fin);
            }
          }
        });
        if (traslapes.length > 0) {
          const maxFin = new Date(Math.max.apply(null, traslapes));
          nuevaHoraInicio = maxFin;
          nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
        }
        dropDate = nuevaHoraInicio;
        op.horaInicio = dropDate.toISOString();
      }

      asignadas.add(op.id + '-' + op.centro);

      // Elimina si ya estaba puesta
      $(this).find('.op').each(function() {
        const dataOp = $(this).data('op');
        if (dataOp && dataOp.id === op.id && dataOp.centro === op.centro) {
          $(this).remove();
        }
      });

      ui.draggable.remove();

      const newOpDiv = crearOperacion(op, false, true); // inGantt = true
      $(this).append(newOpDiv);

      programarSiguientes(op);
    }
  });
}

function programarSiguientes(op) {
  const receta = partes[op.parte].receta;
  let prevOp = op;
  for (let i = receta.indexOf(op.centro) + 1; i < receta.length; i++) {
    const nextCentro = receta[i];
    const nextOp = findOperacion(op.id, nextCentro);
    if (!nextOp) break;
    // Calcula el inicio: fin anterior + GAP
    const prevStart = new Date(prevOp.horaInicio);
    const prevFin = new Date(prevStart.getTime() + prevOp.duracion * 60000);
    let minStart = new Date(prevFin.getTime() + GAP_MINUTES * 60000);

    // Evita traslapes en este centro
    let nuevaHoraInicio = minStart;
    let nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + nextOp.duracion * 60000);
    let centroDiv = $(`[data-centro="${nextCentro}"] .timeline`);
    let traslapes = [];
    centroDiv.find('.op').each(function() {
      const opExistente = $(this).data('op');
      if (opExistente && opExistente.id !== nextOp.id) {
        const ini = new Date(opExistente.horaInicio);
        const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
        if ((nuevaHoraInicio < fin) && (nuevaHoraFin > ini)) {
          traslapes.push(fin);
        }
      }
    });
    if (traslapes.length > 0) {
      const maxFin = new Date(Math.max.apply(null, traslapes));
      nuevaHoraInicio = maxFin;
      nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + nextOp.duracion * 60000);
    }
    nextOp.horaInicio = nuevaHoraInicio.toISOString();
    asignadas.add(nextOp.id + '-' + nextOp.centro);

    // Borra si ya existe
    centroDiv.find('.op').each(function() {
      const dataOp = $(this).data('op');
      if (dataOp && dataOp.id === nextOp.id && dataOp.centro === nextOp.centro) {
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
    const id = primerOp.id + '-' + primerOp.centro;
    if (!asignadas.has(id)) {
      const queueList = $(`[data-centro-queue="${primerOp.centro}"] .queue-list`);
      queueList.append(crearOperacion(primerOp, true));
    }
    for (const op of orden.operaciones) {
      if (op.horaInicio) {
        asignadas.add(op.id + '-' + op.centro);
        $(`[data-centro="${op.centro}"] .timeline`).append(crearOperacion(op, false, true));
      }
    }
  }
}

$(function() {
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});