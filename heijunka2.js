const CENTROS = [
  { wc: '7411', nombre: 'SMT Line_1: 1 Module single Reel' },
  { wc: '7412', nombre: 'SMT Line_2: 3 Module single Reel' },
  { wc: '7413', nombre: 'SMT Line_3: 1 Module Dual  Reel' },
  { wc: '7414', nombre: 'SMT Line_4: 4 Modules Dual  Reel' },
  { wc: '7415', nombre: 'SMT Line_5: 3 Modules Dual  Reel' },
  { wc: '7416', nombre: 'SMT Line_6: 3 Modules Dual  Reel' },
  { wc: '7417', nombre: 'SMT Line_7: 3 Modules  single Reel' },
  { wc: '7457', nombre: 'SMT Line_8: 3 Modules  single Reel' }
];
const START_TIME = new Date('2024-01-01T06:30:00');
const PX_PER_MIN = 1;
const GAP_MINUTES = 15;

// Las recetas deben usarse con los WC (códigos) como nombres de centro de trabajo
const partes = {
  'PZA-A': { color: '#E74C3C', receta: ['7411', '7416'] },
  'PZA-B': { color: '#3498DB', receta: ['7412', '7417'] },
  'PZA-C': { color: '#2ECC71', receta: ['7414', '7414'] }
};

const ordenes = [
  { id: 1001, parte: 'PZA-A', cantidad: 100, operaciones: [
    { centro: '7411', duracion: 60, horaInicio: '2024-01-01T06:30:00' },
    { centro: '7416', duracion: 300 }
  ]},
  { id: 1002, parte: 'PZA-B', cantidad: 800, operaciones: [
    { centro: '7412', duracion: 50 },
    { centro: '7417', duracion: 135 }
  ]},
  { id: 1003, parte: 'PZA-C', cantidad: 1400, operaciones: [
    { centro: '7414', duracion: 45 },
    { centro: '7414', duracion: 180 }
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

// Crea la estructura visual de cada centro y su timeline SOLAMENTE (no queue aquí)
function crearCentro(centroObj) {
  const nombre = centroObj.nombre;
  const wc = centroObj.wc;
  const div = $(`
    <div class="centro" data-centro="${wc}" style="margin-bottom:32px;">
      <div class="centro-label">${wc}
      <div class="timeline" style="position: relative; height: 100px; background: #f8f8f8; margin-bottom: 10px;"></div>
      </div>
    </div>
  `);
  $('#gantt-timelines').append(div);

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
      console.log("Drop event fired", event, ui);
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
        let propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);

        if (propuestaDropDate < minStart) {
          propuestaDropDate = minStart;
        }

        // AJUSTE POR TRASLAPE
        let nuevaHoraInicio = propuestaDropDate;
        let nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
        let traslapes = [];

        $(`[data-centro="${centro}"] .timeline .op`).each(function() {
          const opExistente = $(this).data('op');
          if (
            opExistente &&
            opExistente.id !== op.id // permitir reubicar la misma orden
          ) {
            const ini = new Date(opExistente.horaInicio);
            const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
            if ((nuevaHoraInicio < fin) && (nuevaHoraFin > ini)) {
              traslapes.push(fin);
            }
          }
        });

        if (traslapes.length > 0) {
          // Si hay traslapes, programa la orden al final del mayor fin de los traslapes
          const maxFin = new Date(Math.max.apply(null, traslapes));
          nuevaHoraInicio = maxFin;
          nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
        }
        dropDate = nuevaHoraInicio;
        op.horaInicio = dropDate.toISOString();
      } else {
        // Primera operación: libre
        const left = event.pageX - $(this).offset().left;
        const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
        let propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);

        // AJUSTE POR TRASLAPE
        let nuevaHoraInicio = propuestaDropDate;
        let nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
        let traslapes = [];

        $(`[data-centro="${centro}"] .timeline .op`).each(function() {
          const opExistente = $(this).data('op');
          if (
            opExistente &&
            opExistente.id !== op.id
          ) {
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

      programarSiguientes(op);
     /* // Si es la primer operación, programar automáticamente el resto
      if (index === 0) {
        programarSiguientes(op);
      }*/
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
    const minStart = new Date(prevStart.getTime() + prevOp.duracion * 60000);
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
  $div.addClass('op');
  // Si es queue, posición estática. Si es Gantt, posición absoluta (alineado por left).
  if (isQueue) {
    $div.css({
      backgroundColor: color,
      opacity: 0.5,
      marginBottom: '8px',
      position: 'static',
      width: width + 'px',
    });
  } else {
    $div.css({
      backgroundColor: color,
      width: width + 'px',
      opacity: 1,
      left: op.horaInicio ? (minutosDesdeInicio(op.horaInicio) * PX_PER_MIN) + 'px' : 0,
      position: 'absolute',

    });
  }
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
 * Los queues de primeras operaciones van alineados a la izquierda, uno por cada centro.
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
  // Estructura: un #gantt-main que contiene #gantt-queues y #gantt-timelines alineados horizontalmente
  if ($('#gantt-main').length === 0) {
    $('body').append('<div id="gantt-main" style="display: flex; align-items: flex-start; gap: 32px;"><div id="gantt-queues"></div><div id="gantt-timelines" style="flex:1"></div></div>');
  }
  // Crear los queues a la izquierda
  for (const centro of CENTROS) {
    const wc2 = centro.wc;
    const name2 = centro.nombre;
    if ($(`[data-centro-queue="${wc2}"]`).length === 0) {
      $('#gantt-queues').append(`
        <div class="queue-centro" data-centro-queue="${wc2}" style="min-width: 140px; margin-bottom:16px; background: #f2f6fa; border-radius: 6px; border: 1px solid #b3c9e2; padding: 4px 0 7px 0; min-height: 80px; box-sizing: border-box; box-shadow: 1px 2px 5px #0002;">
          <div class="queue-title" style="font-size: 12px; text-align: center; margin-bottom: 4px; color: #444; font-weight: bold; letter-spacing: 1px;">Queue ${wc2}</div>
          <div class="queue-list" style="display:flex; flex-direction:column; gap:8px; align-items:stretch; padding:2px 4px;"></div>
        </div>
      `);
    }
  }
  // Crear los centros/timelines a la derecha
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});
