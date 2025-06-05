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
const HOURS = 24;
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
				console.log('[i] : '+ i +' receta[i] : '+receta[i] );
				//se agrega afuera para probar
				recetaIndex = i;
         if (ordenes.find(o => o.id === op.id).operaciones.indexOf(op) === count) {
           // recetaIndex = i; break;
		   break;
          } 
          count++;
        }
      }

      if (op.centro !== centro) return;

      let dropDate;
      if (recetaIndex > 0) {
        console.log('RECETA INDEX: '+ recetaIndex +' >0');
        const prevCentro = receta[recetaIndex - 1];
        const prevOp = findOperacion(op.id, prevCentro, recetaIndex-1);
        if (!prevOp || !prevOp.horaInicio) {
          alert('Primero debes despachar la operación anterior: ' + prevCentro);
          return;
        }
        const prevStart = new Date(prevOp.horaInicio);
        const minStart = new Date(prevStart.getTime() + prevOp.duracion * 60000);

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
	      nuevaHoraInicio= new Date(fin);
	      nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
              traslapes.push(fin);
              console.log(' (nuevaHoraInicio < fin) && (nuevaHoraFin > ini) nuevaHoraInicio: ' + nuevaHoraInicio   + ' nuevaHoraFin: '+ nuevaHoraFin);
            }
          }
        });

        if (traslapes.length > 0) {
          //const maxFin = new Date(Math.max.apply(null, traslapes));
          //nuevaHoraInicio = maxFin;
          //nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
          console.log(' (traslapes.length'+ traslapes.length +' > 0)  nuevaHoraInicio: ' + nuevaHoraInicio   + ' nuevaHoraFin: '+ nuevaHoraFin);
        }
        dropDate = nuevaHoraInicio;
        op.horaInicio = dropDate.toISOString();
      } else {
          console.log('RECETA INDEX: '+ recetaIndex +' WORKING ON ELSE');
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
              console.log(' (nuevaHoraInicio < fin) && (nuevaHoraFin > ini) nuevaHoraInicio: ' + nuevaHoraInicio   + ' nuevaHoraFin: '+ nuevaHoraFin);
            }
          }
        });

        if (traslapes.length > 0) {
          const maxFin = new Date(Math.max.apply(null, traslapes));
          nuevaHoraInicio = maxFin;
          nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + op.duracion * 60000);
          console.log(' (traslapes.length '+traslapes.length +' > 0)  nuevaHoraInicio: ' + nuevaHoraInicio   + ' nuevaHoraFin: '+ nuevaHoraFin);
        }
        dropDate = nuevaHoraInicio;
		console.log('dropDate: '+dropDate);
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

function programarSiguientes(op, recetaIndex) {

	console.log('id: '+ op.id +' entrando a programarSiguientes recetaIndex '+ recetaIndex );
  const orden = ordenes.find(o => o.id === op.id);
  const receta = partes[op.parte].receta;
  let prevOp = op;
  for (let i = recetaIndex + 1; i < receta.length; i++) {
    const nextCentro = receta[i];
    const nextOp = findOperacion(op.id, nextCentro, i);
    
	//console.log('nextCentro: '+ nextCentro+' nextOp: ' + nextOp.centro);
	if (!nextOp) break;
	console.log('sigue dentro de  programarSiguientes  y asigna variables');
    const prevStart = new Date(prevOp.horaInicio);
    const minStart = new Date(prevStart.getTime() + prevOp.duracion * 60000);

    let nuevaHoraInicio = minStart;
    let nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + nextOp.duracion * 60000);
    let traslapes = [];
    $(`[data-centro="${nextCentro}"] .timeline .op`).each(function() {
      const opExistente = $(this).data('op');
      if (
        opExistente &&
        opExistente.id !== nextOp.id
      ) {
	const ini = new Date(opExistente.horaInicio);
        const fin = new Date(ini.getTime() + opExistente.duracion * 60000);
		console.log('id: '+ opExistente.id +' ini: ' +ini +' fin: '+fin);
        if ((nuevaHoraInicio < fin) && (nuevaHoraFin > ini)) {
                traslapes.push(fin);
		//  nuevaHoraInicio = new Date(fin); 
		//  nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + nextOp.duracion * 60000);
		console.log(' (nuevaHoraInicio < fin) && (nuevaHoraFin > ini) nuevaHoraInicio: ' + nuevaHoraInicio   + ' nuevaHoraFin: '+ nuevaHoraFin);
        }
      }
    });
    if (traslapes.length > 0) {
        const maxFin = new Date(Math.max.apply(null, traslapes));
	  nuevaHoraInicio = maxFin;
	  console.log('programarSiguientes traslapes.length '+ traslapes.length +'> 0 '+ nuevaHoraInicio);
      nuevaHoraFin = new Date(nuevaHoraInicio.getTime() + nextOp.duracion * 60000);
    }
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
  const horaTooltip = op.horaInicio ? 'Inicio: ' + new Date(op.horaInicio).toLocaleTimeString() : '';
  const contenido = '<div class="op" title="' + horaTooltip + '">' +
                    '<strong>Ord ' + op.id + '</strong><br>' +
                    'Pza: ' + op.parte + '<br>' +
                    'Qty: ' + op.cantidad +
                    '</div>';
  const $div = $(contenido);
  if (isQueue) {
    $div.css({ 
	    backgroundColor: color,
	    opacity: 0.80,
	    marginBottom: '8px',
	    position: 'static',
	    width: '60px', 
	    minWidth: '50px',
	    maxWidth: '60px',
	    height: '40px', // match CSS
	    boxShadow: '0 2px 8px #0002' });
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
      $(ui.helper).addClass('op').css({'opacity': 0.7 , 'width': width +'px'});
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
