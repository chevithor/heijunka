
const CENTROS = ['Corte', 'Soldadura', 'Pintura'];
const START_TIME = new Date('2024-01-01T06:30:00');
const PX_PER_MIN = 2;

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
    drop: function(event, ui) {
      const op = ui.helper.data('op');
      const centro = $(this).closest('.centro').data('centro');

      const receta = partes[op.parte].receta;
      const index = receta.indexOf(op.centro);

      if (op.centro !== centro) return;
      if (asignadas.has(op.id + '-' + op.centro)) return;

      if (index > 0) {
        const prev = receta[index - 1];
        if (!asignadas.has(op.id + '-' + prev)) {
          alert('Primero debes despachar la operación anterior: ' + prev);
          return;
        }
      }

      const left = ui.offset.left - $(this).offset().left;
      const startMin = Math.round(left / PX_PER_MIN);
      const startDate = new Date(START_TIME.getTime() + startMin * 60000);
      op.horaInicio = startDate.toISOString();

      asignadas.add(op.id + '-' + op.centro);
      $(this).append(crearOperacion(op));
      ui.helper.remove();
    }
  });
}

function crearOperacion(op, isQueue = false) {
  const receta = partes[op.parte].receta;
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
    left: op.horaInicio ? (minutosDesdeInicio(op.horaInicio) * PX_PER_MIN) + 'px' : 0
  });

  $div.data('op', op);

  if (!asignadas.has(id)) {
    $div.draggable({ helper: 'clone', zIndex: 1000 });
  }

  return $div;
}

function cargarOrdenes() {
  for (const orden of ordenes) {
    for (const op of orden.operaciones) {
      op.id = orden.id;
      op.parte = orden.parte;
      op.cantidad = orden.cantidad;

      const id = op.id + '-' + op.centro;
      if (op.horaInicio) {
        asignadas.add(id);
        $(`[data-centro="\${op.centro}"] .timeline`).append(crearOperacion(op));
      } else if (partes[op.parte].receta.indexOf(op.centro) === 0) {
        // Solo la primera operaciÃ³n va a la queue
        $('.queue').append(crearOperacion(op, true));
      }
    }
  }
}

$(function() {
  CENTROS.forEach(crearCentro);
  cargarOrdenes();
});
