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

function crearCentro(nombre) {
  const div = $('<div class="centro" data-centro="' + nombre + '">' +
                  '<div class="centro-label">' + nombre + '</div>' +
                  '<div class="timeline"></div>' +
                '</div>');
  $('#gantt').append(div);

  const lineaTiempo = div.find('.timeline');
  for (let h = 0; h < 24; h++) {
    const hora = new Date(START_TIME.getTime() + h * 60 * 60000);
    const left = h * 60 * PX_PER_MIN;
    lineaTiempo.append('<div class="hora" style="left: ' + left + 'px">' + hora.getHours() + ':00</div>');
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

      // Validación: para operaciones subsecuentes, no permitir programar antes de horaFinal + GAP_MINUTES
      if (index > 0) {
        const prevCentro = receta[index - 1];
        const prevOp = findOperacion(op.id, prevCentro);
        if (!prevOp || !prevOp.horaInicio) {
          alert('Primero debes despachar la operación anterior: ' + prevCentro);
          return;
        }
        const prevStart = new Date(prevOp.horaInicio);
        const prevEnd = new Date(prevStart.getTime() + prevOp.duracion * 60000);
        const minStart = new Date(prevEnd.getTime() + GAP_MINUTES * 60000);

        // Calcular hora del drop
        const left = event.pageX - $(this).offset().left - 0; // 80px centro-label, quitar lo del centro
        const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
        const dropDate = new Date(START_TIME.getTime() + dropMin * 60000);

        if (dropDate < minStart) {
          alert("No puedes programar antes de " + minStart.toLocaleTimeString() + " (15 min después de la operación previa)");
          return;
        }
        op.horaInicio = dropDate.toISOString();
      } else {
        // Primera operación: libre
        const left = event.pageX - $(this).offset().left - 0;
        const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
        const dropDate = new Date(START_TIME.getTime() + dropMin * 60000);
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

      // Remove from queue or previous timeline
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

/**
 * Programa automáticamente las operaciones subsecuentes a partir de la que se acaba de agendar.
 */
function programarSiguientes(op) {
  const receta = partes[op.parte].receta;
  let prevOp = op;
  for (let i = receta.indexOf(op.centro) + 1; i < receta.length; i++) {
    const nextCentro = receta[i];
    const nextOp = findOperacion(op.id, nextCentro);
    if (!nextOp) break;
    // Hora de inicio: hora final anterior + GAP_MINUTES
    const prevStart = new Date(prevOp.horaInicio);
    const prevEnd = new Date(prevStart.getTime() + prevOp.duracion * 60000);
    const minStart = new Date(prevEnd.getTime() + GAP_MINUTES * 60000);
    nextOp.horaInicio = minStart.toISOString();
    asignadas.add(nextOp.id + '-' + nextOp.centro);

    // Pintar en Gantt
    const centroDiv = $(`[data-centro="${nextOp.centro}"] .timeline`);
    // Eliminar cualquier op previa
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
  const id = op.id + '-' + op.centro;
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

  // Solo permitir drag si está en el queue o en Gantt (para mover)
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
 * Solo la primer operación de cada orden va al queue.
 */
function cargarOrdenes() {
  for (const orden of ordenes) {
    for (let i = 0; i < orden.operaciones.length; i++) {
      const op = orden.operaciones[i];
      op.id = orden.id;
      op.parte = orden.parte;
      op.cantidad = orden.cantidad;
      delete op.horaInicio; // Limpiar previo
    }
    // Primer op visible en queue si no está asignada
    const primerOp = orden.operaciones[0];
    const id = primerOp.id + '-' + primerOp.centro;
    if (!asignadas.has(id)) {
      $('.queue').append(crearOperacion(primerOp, true));
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
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});
