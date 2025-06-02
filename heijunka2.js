const CENTROS = ['Corte', 'Soldadura', 'Pintura'];
const START_TIME = new Date('2024-01-01T06:30:00');
const PX_PER_MIN = 2;
const GAP_MINUTES = 15;

const partes = {
  'PZA-A': { color: '#E74C3C', receta: ['Corte', 'Soldadura', 'Pintura'] },
  'PZA-B': { color: '#3498DB', receta: ['Corte', 'Pintura'] },
  'PZA-C': { color: '#2ECC71', receta: ['Corte', 'Soldadura'] }
};

const ordenes = [
  { id: 1001, parte: 'PZA-A', cantidad: 10, operaciones: [
    { centro: 'Corte', duracion: 60, horaInicio: '2024-01-01T06:30:00' },
    { centro: 'Soldadura', duracion: 45 },
    { centro: 'Pintura', duracion: 30 }
  ]} ,
  { id: 1002, parte: 'PZA-B', cantidad: 8, operaciones: [
    { centro: 'Corte', duracion: 50, horaInicio: '2024-01-01T08:00:00' },
    { centro: 'Pintura', duracion: 35 }
  ]},
  { id: 1003, parte: 'PZA-C', cantidad: 6, operaciones: [
    { centro: 'Corte', duracion: 55 },
    { centro: 'Soldadura', duracion: 40 }
  ]},
  { id: 1004, parte: 'PZA-B', cantidad: 12, operaciones: [
    { centro: 'Corte', duracion: 40 },
    { centro: 'Pintura', duracion: 45 }
  ]},
  { id: 1005, parte: 'PZA-A', cantidad: 5, operaciones: [
    { centro: 'Corte', duracion: 50 },
    { centro: 'Soldadura', duracion: 35 },
    { centro: 'Pintura', duracion: 25 }
  ]},
  { id: 1006, parte: 'PZA-C', cantidad: 7, operaciones: [
    { centro: 'Corte', duracion: 45 },
    { centro: 'Soldadura', duracion: 40 }
  ]}
];

const asignadas = new Set();

function minutosDesdeInicio(fechaStr) {
  const fecha = new Date(fechaStr);
  return (fecha - START_TIME) / 60000;
}

function sumarMinutos(fechaStr, minutos) {
  const fecha = new Date(fechaStr);
  return new Date(fecha.getTime() + minutos * 60000).toISOString();
}

// Crea la estructura visual de cada centro, su timeline y su queue de primeras operaciones
function crearCentro(nombre) {
  const div = $(`
    <div class="centro" data-centro="${nombre}" style="display: flex; align-items: flex-start;">
      <div style="flex: 1 1 auto;">
        <div class="centro-label">${nombre}</div>
        <div class="timeline" style="position: relative; height: 100px; background: #f8f8f8; margin-bottom: 10px;"></div>
      </div>
      <div class="queue-centro" data-centro-queue="${nombre}" style="min-width: 140px; margin-left: 12px;">
        <div class="queue-title" style="font-size: 12px; text-align: center; margin-bottom: 4px; color: #444;">Queue</div>
        <div class="queue-list"></div>
      </div>
    </div>
  `);
  $('#gantt').append(div);

  const lineaTiempo = div.find('.timeline');
  for (let h = 0; h < 24; h++) {
    const hora = new Date(START_TIME.getTime() + h * 60 * 60000);
    const left = h * 60 * PX_PER_MIN;
    const label = hora.getHours().toString().padStart(2, '0') + ':' + hora.getMinutes().toString().padStart(2, '0');
    lineaTiempo.append('<div class="hora" style="position: absolute; top: 0; left: ' + left + 'px; font-size:11px; color:#bbb;">' + label + '</div>');
  }

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
      const index = receta.indexOf(op.centro);

      if (op.centro !== centro) return;

      let dropDate;
      if (index > 0) {
        const prevCentro = receta[index - 1];
        const prevOp = findOperacion(op.id, prevCentro);
        if (!prevOp || !prevOp.horaInicio) {
          alert('Primero debes despachar la operación anterior: ' + prevCentro);
          return;
        }
        const prevStart = new Date(prevOp.horaInicio);
        const minStart = new Date(prevStart.getTime() + GAP_MINUTES * 60000);

        const left = event.pageX - $(this).offset().left;
        const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
        const propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);

        if (propuestaDropDate < minStart) {
          alert("No puedes programar antes de " + minStart.toLocaleTimeString() + " (15 min después de la operación previa). Se ajustará automáticamente.");
          dropDate = minStart;
        } else {
          dropDate = propuestaDropDate;
        }
        op.horaInicio = dropDate.toISOString();
      } else {
        // Primera operación: libre
        const left = event.pageX - $(this).offset().left;
        const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
        dropDate = new Date(START_TIME.getTime() + dropMin * 60000);
        op.horaInicio = dropDate.toISOString();
      }

      asignadas.add(op.id + '-' + op.centro);

      // Remove any existing op with same id in timeline (if moving)
      $(this).find('.op').each(function() {
        const dataOp = $(this).data('op');
        if (dataOp && dataOp.id === op.id && dataOp.centro === op.centro) {
          $(this).remove();
        }
      });

      // Remove from per-order queue or timeline
      ui.draggable.remove();

      const newOpDiv = crearOperacion(op, false, true); // inGantt = true
      $(this).append(newOpDiv);

      // Si es la primer operación, programar automáticamente el resto
      if (index === 0) {
        programarSiguientes(op);
      }
    }
  });
}

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

function programarSiguientes(op) {
  const receta = partes[op.parte].receta;
  let prevOp = op;
  for (let i = receta.indexOf(op.centro) + 1; i < receta.length; i++) {
    const nextCentro = receta[i];
    const nextOp = findOperacion(op.id, nextCentro);
    if (!nextOp) break;
    const prevStart = new Date(prevOp.horaInicio);
    const minStart = new Date(prevStart.getTime() + GAP_MINUTES * 60000);
    nextOp.horaInicio = minStart.toISOString();
    asignadas.add(nextOp.id + '-' + nextOp.centro);

    const centroDiv = $(`[data-centro="${nextOp.centro}"] .timeline`);
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

// inGantt: true if rendering inside gantt (so always draggable)
function crearOperacion(op, isQueue = false, inGantt = false) {
  if (!op.parte || !partes[op.parte]) {
    console.error("Error: operación sin 'parte' válida", op);
    return $('<div></div>');
  }
  const color = partes[op.parte].color;
  const width = op.duracion * PX_PER_MIN;
  const horaTooltip = op.horaInicio ? 'Inicio: ' + new Date(op.horaInicio).toLocaleTimeString() : '';
  const contenido = '<div class="op" title="' + horaTooltip + '">' +
                    '<strong>Ord ' + op.id + '</strong><br>' +
                    'Pza: ' + op.parte + '<br>' +
                    'Qty: ' + op.cantidad +
                    '</div>';

  const $div = $(contenido);
  $div.css({
    backgroundColor: color,
    width: width + 'px',
    opacity: isQueue ? 0.5 : 1,
    left: op.horaInicio ? (minutosDesdeInicio(op.horaInicio) * PX_PER_MIN) + 'px' : 0,
    position: 'absolute'
  });
  $div.data('op', op);

  $div.draggable({
    helper: 'clone',
    zIndex: 1000,
    appendTo: 'body',
    revert: 'invalid',
    start: function(e, ui) {
      $(ui.helper).css('opacity', 0.7);
      $(ui.helper).addClass('op');
      $(ui.helper).data('op', op);
    }
  });

  return $div;
}

/**
 * Cada centro tiene su propio queue para primeras operaciones NO despachadas.
 * El queue de cada centro muestra solo las primeras operaciones de cada orden que no han sido despachadas.
 */
function cargarOrdenes() {
  // Limpiar todos los queues por si recargas
  $('.queue-list').empty();
  for (const orden of ordenes) {
    for (let i = 0; i < orden.operaciones.length; i++) {
      const op = orden.operaciones[i];
      op.id = orden.id;
      op.parte = orden.parte;
      op.cantidad = orden.cantidad;
      delete op.horaInicio; // Limpiar previo
    }
    // Primer op visible en el queue del centro correspondiente, si no está asignada
    const primerOp = orden.operaciones[0];
    const id = primerOp.id + '-' + primerOp.centro;
    if (!asignadas.has(id)) {
      const queueList = $(`[data-centro-queue="${primerOp.centro}"] .queue-list`);
      queueList.append(crearOperacion(primerOp, true));
    }
    // Si tiene horaInicio (preprogramada), dibujar en gantt
    for (const op of orden.operaciones) {
      if (op.horaInicio) {
        asignadas.add(op.id + '-' + op.centro);
        $(`[data-centro="${op.centro}"] .timeline`).append(crearOperacion(op, false, true));
      }
    }
  }
}

$(function() {
  if ($('#gantt').length === 0) {
    $('body').append('<div id="gantt"></div>');
  }
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});
