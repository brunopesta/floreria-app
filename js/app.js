// =============================================
//  APP — lógica principal
// =============================================

let productos    = [];
let tokenClient  = null;
let floresUnicas = [];       // nombres únicos de flores, ordenados
let tamaniosPorFlor = {};    // { "ROSA": ["Grande", "Chica"], ... }

// Estado: clave = nombre de la flor (ej. "ROSA", "CLAVEL")
const stockState  = new Map(); // nombre → { qty, colorIdx, tamanioIdx, precio }
const pedidoState = new Map(); // nombre → { qty, colorIdx, tamanioIdx }

// Balance
let balanceOffset = 0;       // 0 = semana actual, -1 = semana pasada, etc.
let _balanceData  = null;    // caché { compras, pedidos }

// Estadísticas
let _estData      = null;    // caché { compras, pedidos }
let _chartFlores  = null;
let _chartPrecio  = null;

// ===== COLORES DISPONIBLES =====
const COLORES = [
  { nombre: 'Blanco',    hex: '#ffffff', borde: true },
  { nombre: 'Rojo',      hex: '#e11d48' },
  { nombre: 'Azul',      hex: '#2563eb' },
  { nombre: 'Amarillo',  hex: '#fbbf24' },
  { nombre: 'Naranja',   hex: '#f97316' },
  { nombre: 'Rosado',    hex: '#fda4af' },
  { nombre: 'Violeta',   hex: '#7c3aed' },
  { nombre: 'Lila',      hex: '#c084fc' },
  { nombre: 'Verde',     hex: '#16a34a' },
  { nombre: 'Bordó',     hex: '#9f1239' },
  { nombre: 'Multicolor', gradient: true },
  { nombre: 'Rendevú',   hex: '#d946ef' },
  { nombre: 'Celeste',   hex: '#38bdf8' },
  { nombre: 'Salmón',    hex: '#fb923c' },
  { nombre: 'Coral',     hex: '#f87171' },
];

// ===== FOTOS — Wikimedia Commons =====
const FLORES_FOTOS = {
  'ALELI':       'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Matthiola_incana6.jpg/330px-Matthiola_incana6.jpg',
  'ASTROMELIA':  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Alstroemeria_aurantiaca.jpg/330px-Alstroemeria_aurantiaca.jpg',
  'CEBOLLA':     'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/PurpleBallFlower.JPG/330px-PurpleBallFlower.JPG',
  'CICA':        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Cycas_inflorescence.jpg/330px-Cycas_inflorescence.jpg',
  'CLAVEL':      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/W_carnation4051.jpg/330px-W_carnation4051.jpg',
  'CRISANTEMO':  'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Chrysanthemum_nangkingense.jpg/330px-Chrysanthemum_nangkingense.jpg',
  'ESTATI':      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Tema_Nezahat_Gokyigit_Park_1060783_20080513133708.JPG/330px-Tema_Nezahat_Gokyigit_Park_1060783_20080513133708.JPG',
  'EUCALIPTO':   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Eucalyptus_globulus_subsp._maidenii.jpg/330px-Eucalyptus_globulus_subsp._maidenii.jpg',
  'FIDEO':       'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Asparagus_setaceus_Leaves_2760px.jpg/330px-Asparagus_setaceus_Leaves_2760px.jpg',
  'GERBERA':     'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Gerbera_jamesonii_%28Asteraceae%29.jpg/330px-Gerbera_jamesonii_%28Asteraceae%29.jpg',
  'GIPSOFILA':   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Gypsophila_repens_-_close-up_%28aka%29.jpg/330px-Gypsophila_repens_-_close-up_%28aka%29.jpg',
  'HELECHO':     'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Boston_Fern_%282873392811%29.png/330px-Boston_Fern_%282873392811%29.png',
  'LILIUM':      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Lilium_candidum_1.jpg/330px-Lilium_candidum_1.jpg',
  'LISIANTHUS':  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Lisianthus_2025.jpg/330px-Lisianthus_2025.jpg',
  'MANZANILLA':  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Kamomillasaunio_%28Matricaria_recutita%29.JPG/330px-Kamomillasaunio_%28Matricaria_recutita%29.JPG',
  'MARGARITA':   'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Bellis_perennis_sl1.jpg/330px-Bellis_perennis_sl1.jpg',
  'OTOME':       'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Gypsophila_repens_-_close-up_%28aka%29.jpg/330px-Gypsophila_repens_-_close-up_%28aka%29.jpg',
  'PLUMOSO':     'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Asparagus_setaceus_Leaves_2760px.jpg/330px-Asparagus_setaceus_Leaves_2760px.jpg',
  'POLARI':      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Anemone-coronaria-2016-Zachi-Evenor.jpg/330px-Anemone-coronaria-2016-Zachi-Evenor.jpg',
  'PUMITA':      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Limonium_perezii_3.jpg/330px-Limonium_perezii_3.jpg',
  'ROSA':        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rosa_rubiginosa_1.jpg/330px-Rosa_rubiginosa_1.jpg',
  'SAN VICENTE': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/IMG_0029-Trachelium_caeruleum.jpg/330px-IMG_0029-Trachelium_caeruleum.jpg',
  'SECO':        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Tema_Nezahat_Gokyigit_Park_1060783_20080513133708.JPG/330px-Tema_Nezahat_Gokyigit_Park_1060783_20080513133708.JPG',
  'SEICO':       'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Tema_Nezahat_Gokyigit_Park_1060783_20080513133708.JPG/330px-Tema_Nezahat_Gokyigit_Park_1060783_20080513133708.JPG',
  'SPRAY':       'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rosa_rubiginosa_1.jpg/330px-Rosa_rubiginosa_1.jpg',
};

// ===== HELPERS DE FECHA =====

function formatFecha(date) {
  return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
}

function parseFecha(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return new Date(Date.UTC(1899, 11, 30) + val * 86400000);
  }
  const s = String(val).trim();
  if (!s) return null;
  if (/^\d+(\.\d+)?$/.test(s)) {
    return new Date(Date.UTC(1899, 11, 30) + parseFloat(s) * 86400000);
  }
  const p = s.split('/');
  if (p.length === 3) return new Date(+p[2], +p[1] - 1, +p[0]);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
  return null;
}

function getSemana() {
  const hoy  = new Date();
  const dia  = hoy.getDay();
  const desL = dia === 0 ? 6 : dia - 1;
  const lunes = new Date(hoy); lunes.setDate(hoy.getDate() - desL); lunes.setHours(0,0,0,0);
  const dom   = new Date(lunes); dom.setDate(lunes.getDate() + 6); dom.setHours(23,59,59,999);
  return { lunes, dom };
}

function esSemanaActual(fechaStr) {
  const d = parseFecha(fechaStr);
  if (!d || isNaN(d)) return false;
  const { lunes, dom } = getSemana();
  return d >= lunes && d <= dom;
}

function labelSemana() {
  const { lunes, dom } = getSemana();
  return `Semana: ${formatFecha(lunes)} al ${formatFecha(dom)}`;
}

function hoyStr() { return formatFecha(new Date()); }

// ===== UI HELPERS =====

let toastTimer;
function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className   = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3500);
}

function showOverlay(msg = 'Guardando...') {
  document.getElementById('overlay-msg').textContent = msg;
  document.getElementById('loading-overlay').style.display = 'flex';
}
function hideOverlay() { document.getElementById('loading-overlay').style.display = 'none'; }

// ===== NAVEGACIÓN =====

function irA(pantalla) {
  document.querySelectorAll('.pantalla').forEach(s => s.classList.remove('activa'));
  const el = document.getElementById(`pantalla-${pantalla}`);
  if (el) { el.classList.add('activa'); window.scrollTo(0,0); }

  if (pantalla === 'crear-stock')  iniciarCrearStock();
  if (pantalla === 'crear-pedido') iniciarCrearPedido();
  if (pantalla === 'ver-stock')    cargarVerStock();
  if (pantalla === 'ver-pedidos')  cargarVerPedidos();
  if (pantalla === 'balance')      cargarBalance();
  if (pantalla === 'estadisticas') cargarEstadisticas();
}

document.querySelectorAll('[data-ir]').forEach(btn => {
  btn.addEventListener('click', () => irA(btn.dataset.ir));
});

// ===== AUTENTICACIÓN =====

function initAuth() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope:     CONFIG.SCOPES,
    callback:  resp => {
      if (resp.error) {
        if (resp.error !== 'user_logged_out' && resp.error !== 'access_denied' && resp.error !== 'popup_closed_by_user') {
          toast('No se pudo iniciar sesión.', true);
        }
        return;
      }
      setAccessToken(resp.access_token);
      localStorage.setItem('flores_logueado', '1');
      irA('menu');
    }
  });

  // Si ya se logueó antes, intenta entrar automáticamente sin mostrar nada
  if (localStorage.getItem('flores_logueado')) {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

document.getElementById('btn-login').addEventListener('click', () => {
  if (!window.google) { toast('Cargando... esperá un momento', true); return; }
  tokenClient.requestAccessToken({ prompt: '' });
});

document.getElementById('btn-salir').addEventListener('click', () => {
  const t = getAccessToken();
  if (t) google.accounts.oauth2.revoke(t, () => {});
  setAccessToken(null);
  localStorage.removeItem('flores_logueado');
  productos = [];
  floresUnicas = [];
  tamaniosPorFlor = {};
  stockState.clear();
  pedidoState.clear();
  _balanceData = null;
  _estData     = null;
  balanceOffset = 0;
  destroyCharts();
  irA('login');
});

document.addEventListener('auth:expired', () => {
  toast('Sesión expirada. Iniciá sesión de nuevo.', true);
  setTimeout(() => irA('login'), 1500);
});

// ===== CARGA DE PRODUCTOS =====

async function asegurarProductos() {
  if (productos.length > 0) return;
  showOverlay('Cargando flores...');
  try {
    productos = await getProductos();

    // Calcular flores únicas y tamaños disponibles por flor
    const nombresSet = new Set();
    const tamsMap    = {};
    productos.forEach(p => {
      nombresSet.add(p.producto);
      if (p.tamanio && p.tamanio.toLowerCase() !== 'único' && p.tamanio !== '') {
        if (!tamsMap[p.producto]) tamsMap[p.producto] = new Set();
        tamsMap[p.producto].add(p.tamanio);
      }
    });
    floresUnicas = [...nombresSet].sort();
    floresUnicas.forEach(nombre => {
      tamaniosPorFlor[nombre] = tamsMap[nombre] ? [...tamsMap[nombre]] : [];
    });

    // Inicializar estados (no sobreescribir si ya tienen datos)
    floresUnicas.forEach(nombre => {
      if (!stockState.has(nombre))  stockState.set(nombre, { qty: 0, colorIdx: 0, tamanioIdx: 0, precio: '' });
      if (!pedidoState.has(nombre)) pedidoState.set(nombre, { qty: 0, colorIdx: 0, tamanioIdx: 0 });
    });
  } finally {
    hideOverlay();
  }
}

// ===== HELPERS DE RENDERIZADO =====

function colorDotHtml(color) {
  if (color.gradient) {
    return `<span class="color-dot multicolor"></span>`;
  }
  const borde = color.borde ? 'border:1.5px solid #b0c8b8;' : '';
  return `<span class="color-dot" style="background:${color.hex};${borde}"></span>`;
}

function fotoHtml(nombreFlor) {
  const url     = FLORES_FOTOS[nombreFlor];
  const inicial = nombreFlor.charAt(0);
  if (url) {
    return `<img class="card-foto" src="${url}" alt="${nombreFlor}"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span class="card-foto-fb" style="display:none">${inicial}</span>`;
  }
  return `<span class="card-foto-fb">${inicial}</span>`;
}

function florCardHtml(nombre, state, showPrecio) {
  const color  = COLORES[state.colorIdx] || COLORES[0];
  const tams   = tamaniosPorFlor[nombre] || [];
  const hasTam = tams.length > 1;
  const tam    = hasTam ? (tams[state.tamanioIdx] || tams[0]) : null;
  const activa = state.qty > 0 ? 'activa' : '';

  return `
    <div class="flor-card ${activa}" data-nombre="${nombre}">
      <div class="card-foto-wrap">${fotoHtml(nombre)}</div>
      <div class="card-nombre">${nombre}</div>

      <div class="card-contador">
        <button class="btn-menos" data-nombre="${nombre}">−</button>
        <span class="card-num">${state.qty}</span>
        <button class="btn-mas"  data-nombre="${nombre}">+</button>
      </div>

      <div class="card-selector card-color-selector">
        <button class="btn-prev-color" data-nombre="${nombre}">‹</button>
        <div class="selector-valor">
          ${colorDotHtml(color)}
          <span class="color-nombre">${color.nombre}</span>
        </div>
        <button class="btn-next-color" data-nombre="${nombre}">›</button>
      </div>

      ${hasTam ? `
      <div class="card-selector card-tam-selector">
        <button class="btn-prev-tam" data-nombre="${nombre}">‹</button>
        <div class="selector-valor">
          <span class="tam-nombre">${tam}</span>
        </div>
        <button class="btn-next-tam" data-nombre="${nombre}">›</button>
      </div>` : ''}

      ${showPrecio ? `
      <div class="card-precio-wrap">
        <span class="card-precio-simbolo">$</span>
        <input type="number" class="card-precio" data-nombre="${nombre}"
          value="${state.precio}" placeholder="precio"
          min="0" step="0.01" inputmode="decimal">
      </div>` : ''}
    </div>`;
}

function renderFloresGrid(containerId, stateMap, showPrecio) {
  const el = document.getElementById(containerId);
  el.innerHTML = floresUnicas.map(nombre => {
    const state = stateMap.get(nombre) || { qty: 0, colorIdx: 0, tamanioIdx: 0, precio: '' };
    return florCardHtml(nombre, state, showPrecio);
  }).join('');
}

// ===== ACTUALIZACIONES PARCIALES DE TARJETA =====

function getCard(containerId, nombre) {
  return document.querySelector(`#${containerId} [data-nombre="${nombre}"]`);
}

function updateCardQty(containerId, nombre, qty) {
  const card = getCard(containerId, nombre);
  if (!card) return;
  card.querySelector('.card-num').textContent = qty;
  card.classList.toggle('activa', qty > 0);
}

function updateCardColor(containerId, nombre, colorIdx) {
  const card  = getCard(containerId, nombre);
  if (!card) return;
  const color = COLORES[colorIdx] || COLORES[0];
  const sv    = card.querySelector('.card-color-selector .selector-valor');
  if (sv) sv.innerHTML = `${colorDotHtml(color)}<span class="color-nombre">${color.nombre}</span>`;
}

function updateCardTamanio(containerId, nombre, tamanioIdx) {
  const card = getCard(containerId, nombre);
  if (!card) return;
  const tams = tamaniosPorFlor[nombre] || [];
  const el   = card.querySelector('.tam-nombre');
  if (el && tams.length > 1) el.textContent = tams[tamanioIdx] || tams[0];
}

// ===== RESUMEN =====

function actualizarResumen(resumenId, stateMap) {
  let flores = 0, total = 0;
  stateMap.forEach(s => {
    if (s.qty > 0) {
      flores++;
      total += s.qty * (parseFloat(s.precio) || 0);
    }
  });
  const txt = flores === 0
    ? '0 flores — Total: $0,00'
    : `${flores} flor${flores > 1 ? 'es' : ''} — Total: $${total.toFixed(2).replace('.', ',')}`;
  document.getElementById(resumenId).textContent = txt;
}

function actualizarResumenPedido() {
  const precio = parseFloat(document.getElementById('input-precio-venta').value) || 0;
  let flores = 0, total = 0;
  pedidoState.forEach(s => {
    if (s.qty > 0) { flores++; total += s.qty * precio; }
  });
  const txt = flores === 0
    ? '0 flores — Total: $0,00'
    : `${flores} flor${flores > 1 ? 'es' : ''} — Total: $${total.toFixed(2).replace('.', ',')}`;
  document.getElementById('pedido-resumen').textContent = txt;
}

// ===== EVENT DELEGATION =====

function bindFloresGrid(containerId, stateMap, resumenFn) {
  const el = document.getElementById(containerId);

  el.addEventListener('click', e => {
    const btnMas   = e.target.closest('.btn-mas[data-nombre]');
    const btnMenos = e.target.closest('.btn-menos[data-nombre]');
    const btnPrevC = e.target.closest('.btn-prev-color[data-nombre]');
    const btnNextC = e.target.closest('.btn-next-color[data-nombre]');
    const btnPrevT = e.target.closest('.btn-prev-tam[data-nombre]');
    const btnNextT = e.target.closest('.btn-next-tam[data-nombre]');

    const btn = btnMas || btnMenos || btnPrevC || btnNextC || btnPrevT || btnNextT;
    if (!btn) return;

    const nombre = btn.dataset.nombre;
    const s = stateMap.get(nombre);
    if (!s) return;

    if (btnMas)   { s.qty++; updateCardQty(containerId, nombre, s.qty); }
    if (btnMenos) { s.qty = Math.max(0, s.qty - 1); updateCardQty(containerId, nombre, s.qty); }

    if (btnPrevC) {
      s.colorIdx = (s.colorIdx - 1 + COLORES.length) % COLORES.length;
      updateCardColor(containerId, nombre, s.colorIdx);
    }
    if (btnNextC) {
      s.colorIdx = (s.colorIdx + 1) % COLORES.length;
      updateCardColor(containerId, nombre, s.colorIdx);
    }

    if (btnPrevT) {
      const tams = tamaniosPorFlor[nombre] || [];
      if (tams.length > 1) {
        s.tamanioIdx = (s.tamanioIdx - 1 + tams.length) % tams.length;
        updateCardTamanio(containerId, nombre, s.tamanioIdx);
      }
    }
    if (btnNextT) {
      const tams = tamaniosPorFlor[nombre] || [];
      if (tams.length > 1) {
        s.tamanioIdx = (s.tamanioIdx + 1) % tams.length;
        updateCardTamanio(containerId, nombre, s.tamanioIdx);
      }
    }

    resumenFn();
  });

  el.addEventListener('change', e => {
    const input = e.target.closest('.card-precio[data-nombre]');
    if (!input) return;
    const s = stateMap.get(input.dataset.nombre);
    if (s) { s.precio = input.value; resumenFn(); }
  });
}

// ===== LISTA COMPACTA PEDIDO =====

function florRowHtml(nombre, state) {
  const color  = COLORES[state.colorIdx] || COLORES[0];
  const activa = state.qty > 0 ? 'activa' : '';
  return `
    <div class="flor-row ${activa}" data-nombre="${nombre}">
      <span class="flor-row-nombre">${nombre}</span>
      <div class="flor-row-color card-color-selector">
        <button class="btn-prev-color" data-nombre="${nombre}">‹</button>
        <div class="selector-valor">
          ${colorDotHtml(color)}
          <span class="color-nombre">${color.nombre}</span>
        </div>
        <button class="btn-next-color" data-nombre="${nombre}">›</button>
      </div>
      <div class="card-contador">
        <button class="btn-menos" data-nombre="${nombre}">−</button>
        <span class="card-num">${state.qty}</span>
        <button class="btn-mas"  data-nombre="${nombre}">+</button>
      </div>
    </div>`;
}

function renderPedidoLista() {
  const el     = document.getElementById('lista-pedido');
  const filtro = (document.getElementById('input-buscar-flor')?.value || '').toLowerCase().trim();
  const flores = filtro
    ? floresUnicas.filter(n => n.toLowerCase().includes(filtro))
    : floresUnicas;

  if (flores.length === 0) {
    el.innerHTML = '<p class="lista-cargando">Sin resultados</p>';
    return;
  }
  el.innerHTML = flores.map(nombre => {
    const state = pedidoState.get(nombre) || { qty: 0, colorIdx: 0, tamanioIdx: 0 };
    return florRowHtml(nombre, state);
  }).join('');
}

// ===== PANTALLA: CREAR STOCK =====

async function iniciarCrearStock() {
  await asegurarProductos();
  renderFloresGrid('grid-stock', stockState, true);
  actualizarResumen('stock-resumen', stockState);
}

document.getElementById('btn-guardar-stock').addEventListener('click', async () => {
  const filas = [];
  const fecha = hoyStr();

  floresUnicas.forEach(nombre => {
    const s = stockState.get(nombre);
    if (!s || s.qty === 0) return;
    const precio = parseFloat(s.precio) || 0;
    const color  = (COLORES[s.colorIdx] || COLORES[0]).nombre;
    const tams   = tamaniosPorFlor[nombre] || [];
    const tam    = tams.length > 1 ? (tams[s.tamanioIdx] || tams[0]) : '';
    const total  = +(s.qty * precio).toFixed(2);
    // FECHA | PRODUCTO | COLOR | TAMAÑO | PROVEEDOR | CANTIDAD | PRECIO UNITARIO | TOTAL
    filas.push([fecha, nombre, color, tam, '', s.qty, precio, total]);
  });

  if (filas.length === 0) return toast('Agregá al menos una flor con cantidad > 0', true);

  const sinPrecio = filas.filter(f => f[6] === 0).length;
  if (sinPrecio > 0) return toast(`${sinPrecio} flor${sinPrecio > 1 ? 'es sin' : ' sin'} precio — completalo antes de guardar.`, true);

  try {
    showOverlay('Guardando compra...');
    await appendCompras(filas);
    toast(`✓ Compra guardada — ${filas.length} flor${filas.length > 1 ? 'es' : ''}`);
    floresUnicas.forEach(n => stockState.set(n, { qty: 0, colorIdx: 0, tamanioIdx: 0, precio: '' }));
    renderFloresGrid('grid-stock', stockState, true);
    actualizarResumen('stock-resumen', stockState);
  } catch (e) {
    toast('Error al guardar: ' + e.message, true);
  } finally {
    hideOverlay();
  }
});

// ===== PANTALLA: VER STOCK =====

async function cargarVerStock() {
  const el = document.getElementById('ver-stock-contenido');
  document.getElementById('ver-stock-semana').textContent = labelSemana();
  el.innerHTML = '<p class="estado-msg">⏳ Cargando...</p>';

  try {
    const [compras, pedidos] = await Promise.all([getAllCompras(), getAllPedidos()]);

    const semC = compras.filter(c => esSemanaActual(c.fecha));
    const semP = pedidos.filter(p => esSemanaActual(p.fecha));

    const mapa = {};
    semC.forEach(c => {
      const k = `${c.producto}|||${c.color}|||${c.tamanio}`;
      if (!mapa[k]) mapa[k] = { producto: c.producto, color: c.color, tamanio: c.tamanio, comprado: 0, pedido: 0, totalPagado: 0, rowIndices: [], pedidoRowIndices: [] };
      mapa[k].comprado    += c.cantidad;
      mapa[k].totalPagado += c.total;
      mapa[k].rowIndices.push(c.rowIndex);
    });
    semP.forEach(p => {
      const k = `${p.producto}|||${p.color}|||${p.tamanio}`;
      if (!mapa[k]) mapa[k] = { producto: p.producto, color: p.color, tamanio: p.tamanio, comprado: 0, pedido: 0, totalPagado: 0, rowIndices: [], pedidoRowIndices: [] };
      mapa[k].pedido += p.cantidad;
      mapa[k].pedidoRowIndices.push(p.rowIndex);
    });

    const items = Object.values(mapa).filter(i => i.comprado > 0 || i.pedido > 0);

    if (items.length === 0) {
      el.innerHTML = '<p class="estado-msg">No hay movimiento esta semana</p>';
      return;
    }

    const totalGastado = items.reduce((s, i) => s + i.totalPagado, 0);

    let html = `
      <div class="stock-total-box">
        <div class="stock-total-label">Total gastado en compras esta semana</div>
        <div class="stock-total-valor">$${totalGastado.toFixed(2).replace('.', ',')}</div>
      </div>`;

    items.sort((a, b) => a.producto.localeCompare(b.producto)).forEach(item => {
      const tam      = (item.tamanio && item.tamanio.toLowerCase() !== 'único') ? ` ${item.tamanio}` : '';
      const variante = `${item.color}${tam}`;
      const diff     = item.comprado - item.pedido;
      let resultHtml = '';
      if      (diff > 0)          resultHtml = `<span class="stock-resultado sobra">✅ Te sobran ${diff}</span>`;
      else if (diff < 0)          resultHtml = `<span class="stock-resultado falta">🔴 Te faltan ${Math.abs(diff)}</span>`;
      else if (item.comprado > 0) resultHtml = `<span class="stock-resultado justo">✔ Justo</span>`;

      const url     = FLORES_FOTOS[item.producto];
      const inicial = item.producto.charAt(0);
      const foto    = url
        ? `<img class="card-foto" src="${url}" alt="${item.producto}" style="width:44px;height:44px"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <span class="card-foto-fb" style="display:none;width:44px;height:44px;font-size:18px">${inicial}</span>`
        : `<span class="card-foto-fb" style="width:44px;height:44px;font-size:18px">${inicial}</span>`;

      html += `
        <div class="stock-card">
          <div class="stock-card-foto"><div class="card-foto-wrap" style="width:44px;height:44px">${foto}</div></div>
          <div class="stock-card-info">
            <div class="stock-card-nombre">${item.producto}</div>
            <div class="stock-card-variante">${variante}</div>
            <div class="stock-linea">✅ Compré: <strong>${item.comprado}</strong></div>
            <div class="stock-linea">📋 Pedidos: <strong>${item.pedido}</strong></div>
            ${resultHtml}
            <button class="btn-eliminar-stock"
              data-rows="${item.rowIndices.join(',')}"
              data-pedido-rows="${item.pedidoRowIndices.join(',')}">✕ Eliminar</button>
          </div>
        </div>`;
    });

    el.innerHTML = html;

    // Botones de eliminar — dos taps para confirmar
    el.querySelectorAll('.btn-eliminar-stock').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!btn.classList.contains('confirmando')) {
          btn.classList.add('confirmando');
          btn.textContent = '¿Confirmar?';
          setTimeout(() => {
            if (btn.classList.contains('confirmando')) {
              btn.classList.remove('confirmando');
              btn.textContent = '✕ Eliminar';
            }
          }, 3000);
          return;
        }
        const rowIndices       = btn.dataset.rows.split(',').map(Number).filter(Boolean);
        const pedidoRowIndices = btn.dataset.pedidoRows.split(',').map(Number).filter(Boolean);
        btn.disabled = true;
        showOverlay('Eliminando...');
        try {
          await Promise.all([
            rowIndices.length       > 0 ? limpiarFilasCompra(rowIndices)       : Promise.resolve(),
            pedidoRowIndices.length > 0 ? limpiarFilasPedido(pedidoRowIndices) : Promise.resolve(),
          ]);
          _balanceData = null; // invalida caché de balance
          toast('✓ Eliminado');
          await cargarVerStock();
        } catch (e) {
          toast('Error: ' + e.message, true);
          btn.disabled = false;
        } finally {
          hideOverlay();
        }
      });
    });
  } catch (e) {
    el.innerHTML = `<p class="estado-msg error">⚠️ ${e.message}</p>`;
  }
}

// ===== PANTALLA: CREAR PEDIDO =====

async function iniciarCrearPedido() {
  await asegurarProductos();
  const buscador = document.getElementById('input-buscar-flor');
  if (buscador) { buscador.value = ''; buscador.oninput = () => renderPedidoLista(); }
  renderPedidoLista();
  actualizarResumenPedido();
}

document.getElementById('btn-guardar-pedido').addEventListener('click', async () => {
  const cliente     = document.getElementById('input-cliente').value.trim();
  const precioVenta = parseFloat(document.getElementById('input-precio-venta').value) || 0;

  if (!cliente)          return toast('Ingresá el nombre del cliente', true);
  if (precioVenta === 0) return toast('Ingresá el precio de venta', true);

  const filas = [];
  const fecha = hoyStr();

  floresUnicas.forEach(nombre => {
    const s = pedidoState.get(nombre);
    if (!s || s.qty === 0) return;
    const color = (COLORES[s.colorIdx] || COLORES[0]).nombre;
    const tams  = tamaniosPorFlor[nombre] || [];
    const tam   = tams.length > 1 ? (tams[s.tamanioIdx] || tams[0]) : '';
    const total = +(s.qty * precioVenta).toFixed(2);
    // FECHA | CLIENTE | PRODUCTO | COLOR | TAMAÑO | CANTIDAD | PRECIO VENTA | TOTAL | ENTREGADO
    filas.push([fecha, cliente, nombre, color, tam, s.qty, precioVenta, total, '']);
  });

  if (filas.length === 0) return toast('Seleccioná al menos una flor con cantidad > 0', true);

  try {
    showOverlay('Guardando pedido...');
    await appendPedidos(filas);
    toast(`✓ Pedido de ${cliente} guardado — ${filas.length} flor${filas.length > 1 ? 'es' : ''}`);
    document.getElementById('input-cliente').value = '';
    document.getElementById('input-precio-venta').value = '';
    floresUnicas.forEach(n => pedidoState.set(n, { qty: 0, colorIdx: 0, tamanioIdx: 0 }));
    renderPedidoLista();
    actualizarResumenPedido();
  } catch (e) {
    toast('Error al guardar: ' + e.message, true);
  } finally {
    hideOverlay();
  }
});

// ===== PANTALLA: VER PEDIDOS =====

async function cargarVerPedidos() {
  const el          = document.getElementById('ver-pedidos-contenido');
  const resumenWrap = document.getElementById('ver-pedidos-resumen-wrap');
  document.getElementById('ver-pedidos-semana').textContent = labelSemana();
  el.innerHTML = '<p class="estado-msg">⏳ Cargando...</p>';
  resumenWrap.style.display = 'none';

  try {
    const pedidos = await getAllPedidos();
    const semana  = pedidos.filter(p => esSemanaActual(p.fecha));

    if (semana.length === 0) {
      el.innerHTML = '<p class="estado-msg">No hay pedidos esta semana</p>';
      return;
    }

    const porCliente = {};
    semana.forEach(p => {
      if (!porCliente[p.cliente]) porCliente[p.cliente] = [];
      porCliente[p.cliente].push(p);
    });

    el.innerHTML = Object.entries(porCliente).map(([cliente, items]) => {
      const listos       = items.filter(i => i.entregado === 'Sí').length;
      const completo     = listos === items.length;
      const totalCliente = items.reduce((s, i) => s + i.total, 0);
      return `
        <div class="cliente-card">
          <div class="cliente-card-header">
            <span class="cliente-card-nombre">${cliente}</span>
            <span class="badge-estado ${completo ? 'completo' : ''}">${listos}/${items.length} entregados</span>
          </div>
          ${items.map(item => {
            const tam       = (item.tamanio && item.tamanio.toLowerCase() !== 'único') ? ` ${item.tamanio}` : '';
            const entregado = item.entregado === 'Sí';
            return `
              <div class="pedido-row ${entregado ? 'entregado' : ''}">
                <div class="pedido-row-info">
                  <div class="pedido-row-nombre">${item.producto} ${item.color}${tam}</div>
                  <div class="pedido-row-detalle">${item.cantidad} unid. · $${item.precioVenta.toFixed(2)} c/u</div>
                </div>
                <div class="pedido-row-acciones">
                  <button class="btn-entregar ${entregado ? 'listo' : ''}"
                    data-row="${item.rowIndex}" data-estado="${entregado ? '1' : '0'}">
                    ${entregado ? '✓ Listo' : 'Entregar'}
                  </button>
                  <button class="btn-borrar-pedido" data-row="${item.rowIndex}">✕</button>
                </div>
              </div>`;
          }).join('')}
          <div class="cliente-card-total">Total: $${totalCliente.toFixed(2).replace('.', ',')}</div>
        </div>`;
    }).join('');

    el.querySelectorAll('.btn-entregar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const rowIndex  = +btn.dataset.row;
        const estaListo = btn.dataset.estado === '1';
        const orig = btn.textContent;
        btn.disabled = true; btn.textContent = '...';
        try {
          await marcarEntregado(rowIndex, !estaListo);
          await cargarVerPedidos();
        } catch (e) {
          toast('Error: ' + e.message, true);
          btn.disabled = false; btn.textContent = orig;
        }
      });
    });

    el.querySelectorAll('.btn-borrar-pedido').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!btn.classList.contains('confirmando')) {
          btn.classList.add('confirmando');
          btn.textContent = '¿Borrar?';
          setTimeout(() => {
            if (btn.classList.contains('confirmando')) {
              btn.classList.remove('confirmando');
              btn.textContent = '✕';
            }
          }, 3000);
          return;
        }
        const rowIndex = +btn.dataset.row;
        btn.disabled = true;
        showOverlay('Eliminando...');
        try {
          await limpiarFilasPedido([rowIndex]);
          toast('✓ Pedido eliminado');
          await cargarVerPedidos();
        } catch (e) {
          toast('Error: ' + e.message, true);
          btn.disabled = false;
        } finally {
          hideOverlay();
        }
      });
    });

    const agrupado = {};
    semana.forEach(p => {
      const tam = (p.tamanio && p.tamanio.toLowerCase() !== 'único') ? p.tamanio : '';
      const k   = `${p.producto}|||${p.color}|||${tam}`;
      if (!agrupado[k]) agrupado[k] = { producto: p.producto, color: p.color, tamanio: tam, cantidad: 0 };
      agrupado[k].cantidad += p.cantidad;
    });

    const resumenItems = Object.values(agrupado).sort((a, b) => a.producto.localeCompare(b.producto));
    document.getElementById('ver-pedidos-resumen').innerHTML = resumenItems.map(r => {
      const tam = r.tamanio ? ` ${r.tamanio}` : '';
      return `
        <div class="resumen-card">
          <div class="resumen-card-nombre">${r.producto} ${r.color}${tam}</div>
          <div class="resumen-card-qty">${r.cantidad} unidades pedidas</div>
        </div>`;
    }).join('');
    resumenWrap.style.display = 'block';

  } catch (e) {
    el.innerHTML = `<p class="estado-msg error">⚠️ ${e.message}</p>`;
  }
}

document.getElementById('btn-refrescar-stock').addEventListener('click', cargarVerStock);

// ===== HELPERS DE SEMANA (BALANCE / ESTADÍSTICAS) =====

function getSemanaOffset(offset) {
  const hoy  = new Date();
  const dia  = hoy.getDay();
  const desL = dia === 0 ? 6 : dia - 1;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - desL + offset * 7);
  lunes.setHours(0, 0, 0, 0);
  const dom = new Date(lunes);
  dom.setDate(lunes.getDate() + 6);
  dom.setHours(23, 59, 59, 999);
  return { lunes, dom };
}

function esSemana(fechaStr, lunes, dom) {
  const d = parseFecha(fechaStr);
  if (!d || isNaN(d.getTime())) return false;
  return d >= lunes && d <= dom;
}

// Devuelve "DD/MM/YYYY" del lunes de la semana a la que pertenece fechaStr
function getSemanaKey(fechaStr) {
  const d = parseFecha(fechaStr);
  if (!d || isNaN(d.getTime())) return null;
  const dia  = d.getDay();
  const desL = dia === 0 ? 6 : dia - 1;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - desL);
  lunes.setHours(0, 0, 0, 0);
  return formatFecha(lunes);
}

function labelBalanceSemana() {
  if (balanceOffset === 0) return 'Esta semana';
  if (balanceOffset === -1) return 'Semana pasada';
  const { lunes, dom } = getSemanaOffset(balanceOffset);
  return `${formatFecha(lunes)} — ${formatFecha(dom)}`;
}

function actualizarLabelBalance() {
  document.getElementById('bal-semana-label').textContent = labelBalanceSemana();
  document.getElementById('btn-bal-sig').disabled = balanceOffset >= 0;
}

// ===== PANTALLA: BALANCE =====

async function cargarBalance() {
  actualizarLabelBalance();
  const el = document.getElementById('balance-contenido');
  el.innerHTML = '<p class="estado-msg">⏳ Cargando...</p>';

  try {
    if (!_balanceData) {
      showOverlay('Cargando datos...');
      const [compras, pedidos] = await Promise.all([getAllCompras(), getAllPedidos()]);
      _balanceData = { compras, pedidos };
      hideOverlay();
    }

    const { lunes, dom } = getSemanaOffset(balanceOffset);
    const semC = _balanceData.compras.filter(c => esSemana(c.fecha, lunes, dom));
    const semP = _balanceData.pedidos.filter(p => esSemana(p.fecha, lunes, dom));

    if (semC.length === 0 && semP.length === 0) {
      el.innerHTML = '<p class="estado-msg">Sin datos para esta semana</p>';
      return;
    }

    // ── Vendido por cliente ──
    const porCliente = {};
    semP.forEach(p => {
      if (!porCliente[p.cliente]) porCliente[p.cliente] = { total: 0, items: [] };
      porCliente[p.cliente].total += p.total;
      porCliente[p.cliente].items.push(p);
    });
    const totalVendido = semP.reduce((s, p) => s + p.total, 0);
    const totalGastado = semC.reduce((s, c) => s + c.total, 0);
    const ganancia     = totalVendido - totalGastado;

    let html = '';

    // Sección 1: Lo que vendiste
    html += `<div class="seccion-titulo">💰 Lo que vendiste</div>`;
    if (Object.keys(porCliente).length === 0) {
      html += `<p class="lista-vacia">Sin ventas esta semana</p>`;
    } else {
      html += `<div class="bal-seccion-card">`;
      Object.entries(porCliente).forEach(([cliente, data], idx) => {
        html += `
          <div class="bal-cliente-row" data-idx="${idx}">
            <span class="bal-cliente-nombre">${cliente}</span>
            <span class="bal-cliente-total">$${data.total.toFixed(2).replace('.', ',')}</span>
            <span class="bal-toggle">▾</span>
          </div>
          <div class="bal-cliente-detalle" id="bal-det-${idx}" style="display:none">
            ${data.items.map(item => {
              const tam = (item.tamanio && item.tamanio.toLowerCase() !== 'único') ? ` ${item.tamanio}` : '';
              return `<div class="bal-item-row">
                <span>${item.producto} ${item.color}${tam} ×${item.cantidad}</span>
                <span>$${item.total.toFixed(2).replace('.', ',')}</span>
              </div>`;
            }).join('')}
          </div>`;
      });
      html += `<div class="bal-total-row">
        <span>TOTAL VENDIDO</span>
        <span>$${totalVendido.toFixed(2).replace('.', ',')}</span>
      </div></div>`;
    }

    // Sección 2: Lo que gastaste
    html += `<div class="seccion-titulo" style="margin-top:18px">🛒 Lo que gastaste</div>`;
    if (semC.length === 0) {
      html += `<p class="lista-vacia">Sin compras esta semana</p>`;
    } else {
      html += `<div class="bal-seccion-card">`;
      semC.forEach(c => {
        const tam = (c.tamanio && c.tamanio.toLowerCase() !== 'único') ? ` ${c.tamanio}` : '';
        html += `<div class="bal-gasto-row">
          <span>${c.producto} ${c.color}${tam} ×${c.cantidad}</span>
          <span>$${c.total.toFixed(2).replace('.', ',')}</span>
        </div>`;
      });
      html += `<div class="bal-total-row">
        <span>TOTAL GASTADO</span>
        <span>$${totalGastado.toFixed(2).replace('.', ',')}</span>
      </div></div>`;
    }

    // Sección 3: Ganancia neta
    const ganColor = ganancia >= 0 ? 'var(--verde)' : 'var(--rojo)';
    html += `
      <div class="seccion-titulo" style="margin-top:18px">✅ Ganancia neta</div>
      <div class="bal-ganancia-box">
        <div class="bal-gan-linea">
          <span>Total vendido</span>
          <span>$${totalVendido.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="bal-gan-linea">
          <span>Total gastado</span>
          <span>−$${totalGastado.toFixed(2).replace('.', ',')}</span>
        </div>
        <div class="bal-gan-resultado" style="color:${ganColor}">
          <span>GANANCIA</span>
          <span>$${ganancia.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>`;

    el.innerHTML = html;

    // Expandir/colapsar clientes
    el.querySelectorAll('.bal-cliente-row').forEach(row => {
      row.addEventListener('click', () => {
        const det = document.getElementById(`bal-det-${row.dataset.idx}`);
        const tog = row.querySelector('.bal-toggle');
        const abriendo = det.style.display === 'none';
        det.style.display = abriendo ? 'block' : 'none';
        tog.textContent   = abriendo ? '▴' : '▾';
      });
    });

  } catch (e) {
    hideOverlay();
    el.innerHTML = `<p class="estado-msg error">⚠️ ${e.message}</p>`;
  }
}

// ===== PANTALLA: ESTADÍSTICAS =====

function destroyCharts() {
  if (_chartFlores) { _chartFlores.destroy(); _chartFlores = null; }
  if (_chartPrecio) { _chartPrecio.destroy(); _chartPrecio = null; }
}

function renderizarChartPrecio(compras, flor) {
  if (_chartPrecio) { _chartPrecio.destroy(); _chartPrecio = null; }

  const emptyEl  = document.getElementById('chart-precio-empty');
  const canvasEl = document.getElementById('chart-precio');
  if (!emptyEl || !canvasEl) return;

  const porSemana = {};
  compras.filter(c => c.producto === flor).forEach(c => {
    const k = getSemanaKey(c.fecha);
    if (!k) return;
    if (!porSemana[k]) porSemana[k] = { suma: 0, cnt: 0 };
    porSemana[k].suma += c.precioUnitario;
    porSemana[k].cnt++;
  });
  const semanas = Object.keys(porSemana).sort();

  if (semanas.length === 0) {
    emptyEl.style.display  = 'block';
    canvasEl.style.display = 'none';
    return;
  }
  emptyEl.style.display  = 'none';
  canvasEl.style.display = 'block';

  const precios = semanas.map(k => +(porSemana[k].suma / porSemana[k].cnt).toFixed(2));
  const labels  = semanas.map(s => s.substring(0, 5)); // DD/MM

  _chartPrecio = new Chart(canvasEl.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: precios,
        borderColor: '#2E5339',
        backgroundColor: 'rgba(46,83,57,0.08)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#2E5339',
        pointRadius: 5,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#4a6050' } },
        y: {
          beginAtZero: false,
          ticks: { color: '#4a6050', callback: v => '$' + v }
        }
      }
    }
  });
}

async function cargarEstadisticas() {
  destroyCharts();
  const el = document.getElementById('estadisticas-contenido');
  el.innerHTML = '<p class="estado-msg">⏳ Cargando...</p>';

  try {
    // Cargar catálogo de flores si todavía no está en memoria
    await asegurarProductos();

    if (!_estData) {
      showOverlay('Cargando datos...');
      const [compras, pedidos] = await Promise.all([getAllCompras(), getAllPedidos()]);
      _estData = { compras, pedidos };
      hideOverlay();
    }

    const { compras, pedidos } = _estData;

    if (pedidos.length === 0 && compras.length === 0) {
      el.innerHTML = '<p class="estado-msg">Sin datos suficientes todavía</p>';
      return;
    }

    // ── Flores más vendidas ──
    const porFlor = {};
    pedidos.forEach(p => {
      if (!porFlor[p.producto]) porFlor[p.producto] = 0;
      porFlor[p.producto] += p.cantidad;
    });
    const ranking = Object.entries(porFlor).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // ── Dropdown: todas las flores del catálogo (hoja Productos) ──
    const florInicial = floresUnicas[0] || '';

    // ── Resumen general ──
    const allSemanas = new Set(
      [...compras.map(c => getSemanaKey(c.fecha)), ...pedidos.map(p => getSemanaKey(p.fecha))].filter(Boolean)
    );

    const ventasPorSem = {};
    pedidos.forEach(p => {
      const k = getSemanaKey(p.fecha); if (!k) return;
      if (!ventasPorSem[k]) ventasPorSem[k] = { total: 0, cant: 0 };
      ventasPorSem[k].total += p.total;
      ventasPorSem[k].cant  += p.cantidad;
    });
    const comprasPorSem = {};
    compras.forEach(c => {
      const k = getSemanaKey(c.fecha); if (!k) return;
      if (!comprasPorSem[k]) comprasPorSem[k] = 0;
      comprasPorSem[k] += c.total;
    });

    let mejorSemKey = '—'; let mejorGan = null;
    let semMasVentasKey = '—'; let masVentas = 0;
    Object.entries(ventasPorSem).forEach(([k, v]) => {
      if (v.cant > masVentas) { masVentas = v.cant; semMasVentasKey = k; }
      const g = v.total - (comprasPorSem[k] || 0);
      if (mejorGan === null || g > mejorGan) { mejorGan = g; mejorSemKey = k; }
    });

    // ── Build HTML ──
    let html = `
      <div class="seccion-titulo">🏆 Flores más vendidas</div>
      <div class="est-card">
        ${ranking.length === 0
          ? `<p class="est-sin-datos">Sin ventas registradas</p>`
          : `<canvas id="chart-flores" height="260"></canvas>`}
      </div>

      <div class="seccion-titulo" style="margin-top:18px">📈 Evolución de precios</div>
      <div class="est-card">
        ${floresUnicas.length === 0
          ? `<p class="est-sin-datos">Sin flores en el catálogo</p>`
          : `<select id="sel-flor-precio" class="est-select">
              ${floresUnicas.map(f => `<option value="${f}">${f}</option>`).join('')}
            </select>
            <p class="est-sin-datos" id="chart-precio-empty" style="display:none">Sin datos de precio</p>
            <canvas id="chart-precio" height="200"></canvas>`}
      </div>

      <div class="seccion-titulo" style="margin-top:18px">📋 Resumen general</div>
      <div class="est-resumen-card">
        <div class="est-res-item">
          <span class="est-res-label">Semanas registradas</span>
          <span class="est-res-valor">${allSemanas.size}</span>
        </div>
        <div class="est-res-item">
          <span class="est-res-label">Flor más vendida</span>
          <span class="est-res-valor">${ranking[0]?.[0] || '—'}</span>
        </div>
        <div class="est-res-item">
          <span class="est-res-label">Semana más activa</span>
          <span class="est-res-valor">${semMasVentasKey !== '—' ? semMasVentasKey.substring(0,5) : '—'}</span>
        </div>
        <div class="est-res-item">
          <span class="est-res-label">Mejor semana (ganancia)</span>
          <span class="est-res-valor">${mejorGan !== null ? '$' + mejorGan.toFixed(2).replace('.', ',') : '—'}</span>
        </div>
      </div>`;

    el.innerHTML = html;

    // Chart flores más vendidas
    if (ranking.length > 0) {
      _chartFlores = new Chart(document.getElementById('chart-flores').getContext('2d'), {
        type: 'bar',
        data: {
          labels: ranking.map(r => r[0]),
          datasets: [{
            data: ranking.map(r => r[1]),
            backgroundColor: '#2E5339',
            borderRadius: 4,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { color: '#4a6050' } },
            y: { ticks: { color: '#1a2e20', font: { weight: 'bold' } } }
          }
        }
      });
    }

    // Chart precio
    if (florInicial) {
      renderizarChartPrecio(compras, florInicial);
      document.getElementById('sel-flor-precio')?.addEventListener('change', e => {
        renderizarChartPrecio(compras, e.target.value);
      });
    }

  } catch (e) {
    hideOverlay();
    el.innerHTML = `<p class="estado-msg error">⚠️ ${e.message}</p>`;
  }
}

// ===== INIT =====
window.addEventListener('load', () => {
  bindFloresGrid('grid-stock',  stockState,  () => actualizarResumen('stock-resumen', stockState));
  bindFloresGrid('lista-pedido', pedidoState, actualizarResumenPedido);

  document.getElementById('input-precio-venta').addEventListener('input', actualizarResumenPedido);

  // Navegación de semanas — Balance
  document.getElementById('btn-bal-ant').addEventListener('click', () => {
    balanceOffset--;
    cargarBalance();
  });
  document.getElementById('btn-bal-sig').addEventListener('click', () => {
    if (balanceOffset >= 0) return;
    balanceOffset++;
    cargarBalance();
  });

  // Refrescar — Balance y Estadísticas
  document.getElementById('btn-refrescar-balance').addEventListener('click', () => {
    _balanceData = null;
    cargarBalance();
  });
  document.getElementById('btn-refrescar-est').addEventListener('click', () => {
    _estData = null;
    destroyCharts();
    cargarEstadisticas();
  });

  const esperar = setInterval(() => {
    if (window.google?.accounts) { clearInterval(esperar); initAuth(); }
  }, 100);
  setTimeout(() => clearInterval(esperar), 10000);
});
