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
const PX_PER_MIN = 2;
const GAP_MINUTES = 15;

const partes = {
  'PZA-A': { color: '#E74C3C', receta: ['7411', '7416'] },
  'PZA-B': { color: '#3498DB', receta: ['7412', '7417'] },
  'PZA-C': { color: '#2ECC71', receta: ['7414', '7414'] }
};

const ordenes = [
  { id: 1001, parte: 'PZA-A', cantidad: 100, operaciones: [
    { centro: '7411', duracion: 60 },
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
  if(!fechaStr) return 0;
  const fecha = new Date(fechaStr);
  return (fecha - START_TIME) / 60000;
}

function crearCentro(centroObj) {
  const wc = centroObj.wc;
  const nombre = centroObj.nombre;
  const div = $(`
    <div class="centro" data-centro="${wc}" style="margin-bottom:32px;">
      <div class="centro-label">${wc} - ${nombre}</div>
      <div class="timeline"></div>
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

      // Programa al inicio donde lo suelta
      const left = event.pageX - $(this).offset().left;
      const dropMin = Math.max(0, Math.round(left / PX_PER_MIN));
      let propuestaDropDate = new Date(START_TIME.getTime() + dropMin * 60000);
      op.horaInicio = propuestaDropDate.toISOString();

      // Elimina si ya existía la misma op en el timeline
      $(this).find('.op').each(function() {
        const dataOp = $(this).data('op');
        if (dataOp && dataOp.id === op.id && dataOp.centro === op.centro) $(this).remove();
      });

      ui.draggable.remove();
      const newOpDiv = crearOperacion(op, false, true); // inGantt = true
      $(this).append(newOpDiv);
    }
  });
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
  for (const centroObj of CENTROS) {
    if ($(`[data-centro-queue="${centroObj.wc}"]`).length === 0) {
      $('#gantt-queues').append(`
        <div class="queue-centro" data-centro-queue="${centroObj.wc}" style="min-width: 140px; margin-bottom:16px; background: #f2f6fa; border-radius: 6px; border: 1px solid #b3c9e2; padding: 4px 0 7px 0; min-height: 80px; box-sizing: border-box; box-shadow: 1px 2px 5px #0002;">
          <div class="queue-title" style="font-size: 12px; text-align: center; margin-bottom: 4px; color: #444; font-weight: bold; letter-spacing: 1px;">Queue ${centroObj.wc} - ${centroObj.nombre}</div>
          <div class="queue-list" style="display:flex; flex-direction:column; gap:8px; align-items:stretch; padding:2px 4px;"></div>
        </div>
      `);
    }
  }
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});
