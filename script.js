
const centros = ['wc1','wc2','wc3','wc4','wc5','wc6','wc7','wc8'];
const cargaCentro = {};
const agenda = {};
const lanes = {};

function getColor(material) {
  const hash = material.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return `hsl(${hash % 360}, 70%, 70%)`;
}

function siguienteEspacioDisponible(bloques, desde, duracion) {
  bloques.sort((a, b) => a.inicio - b.inicio);
  let t = desde;
  for (let bloque of bloques) {
    if (t + duracion <= bloque.inicio) return t;
    if (t >= bloque.inicio && t < bloque.fin) t = bloque.fin;
  }
  return t;
}

function crearLanes() {
  const container = document.body;
  centros.forEach(wc => {
    cargaCentro[wc] = 0;
    agenda[wc] = [];
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.dataset.wc = wc;

    const label = document.createElement('div');
    label.className = 'lane-label';
    label.innerText = wc;
    lane.appendChild(label);
    container.appendChild(lane);
    lanes[wc] = lane;
  });
}

function nivelar(ordenes) {
  ordenes.forEach(orden => {
    let finAnterior = 0;
    orden.operaciones.forEach(op => {
      const wc = op.wc;
      const duracion = op.duracion;
      let inicioTentativo = Math.max(finAnterior, cargaCentro[wc]);
      inicioTentativo = siguienteEspacioDisponible(agenda[wc], inicioTentativo, duracion);

      const top = inicioTentativo * 2;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerText = `${orden.material}\n${op.op}`;
      card.style.top = `${top}px';
      card.style.background = getColor(orden.material);
      card.setAttribute('draggable', true);

      enableDrag(card);
      lanes[wc].appendChild(card);

      const fin = inicioTentativo + duracion;
      agenda[wc].push({ inicio: inicioTentativo, fin });
      cargaCentro[wc] = fin;
      finAnterior = fin;
    });
  });
}

function enableDrag(card) {
  let offsetY = 0;

  card.addEventListener('dragstart', e => {
    offsetY = e.offsetY;
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: Date.now(),
      html: card.outerHTML,
      offsetY: offsetY
    }));
  });

  card.addEventListener('touchstart', e => {
    e.target.dataset.dragging = 'true';
    offsetY = e.touches[0].clientY - e.target.getBoundingClientRect().top;
  });

  card.addEventListener('touchmove', e => {
    const touch = e.touches[0];
    const el = e.target;
    el.style.top = (touch.clientY - offsetY) + 'px';
  });

  card.addEventListener('touchend', e => {
    e.target.dataset.dragging = 'false';
  });
}

function enableDrop() {
  Object.values(lanes).forEach(lane => {
    lane.addEventListener('dragover', e => e.preventDefault());

    lane.addEventListener('drop', e => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const dropY = e.offsetY - data.offsetY;
      const newCard = document.createElement('div');
      newCard.className = 'card';
      newCard.innerHTML = data.html.match(/<div[^>]*>(.*?)<\/div>/s)[1];
      newCard.style.top = dropY + 'px';
      newCard.style.background = data.html.match(/background: (.*?);/)[1];
      enableDrag(newCard);
      lane.appendChild(newCard);
    });
  });
}

function simularMejorDistribucion(ordenes) {
  limpiar();
  nivelar(ordenes);
  enableDrop();
}

function limpiar() {
  Object.values(lanes).forEach(lane => lane.innerHTML = '<div class="lane-label">' + lane.dataset.wc + '</div>');
  centros.forEach(wc => {
    cargaCentro[wc] = 0;
    agenda[wc] = [];
  });
}

crearLanes();
enableDrop();

const ordenes = [
  {
    material: 'PZA-A',
    cantidad: 200,
    programa: 'ProgX',
    pcb_panel: 4,
    operaciones: [
      { op: 'P&P', wc: 'wc1', duracion: 12, qty: 200, remaining_qty: 200 },
      { op: 'AOI', wc: 'wc4', duracion: 8, qty: 200, remaining_qty: 200 }
    ]
  },
  {
    material: 'PZA-B',
    cantidad: 100,
    programa: 'ProgY',
    pcb_panel: 2,
    operaciones: [
      { op: 'P&P', wc: 'wc2', duracion: 10, qty: 100, remaining_qty: 100 },
      { op: 'AOI', wc: 'wc4', duracion: 6, qty: 100, remaining_qty: 100 }
    ]
  }
];

simularMejorDistribucion(ordenes);
