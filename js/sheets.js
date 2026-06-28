// =============================================
//  GOOGLE SHEETS API — capa de acceso a datos
// =============================================

const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
let _accessToken = null;

function setAccessToken(token) {
  _accessToken = token;
}

function getAccessToken() {
  return _accessToken;
}

function authHeaders() {
  return {
    'Authorization': `Bearer ${_accessToken}`,
    'Content-Type': 'application/json'
  };
}

async function apiRequest(url, options = {}) {
  const res = await fetch(url, { ...options, headers: authHeaders() });
  if (res.status === 401) {
    document.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Sesión expirada. Iniciá sesión de nuevo.');
  }
  if (!res.ok) {
    let msg = `Error ${res.status}`;
    try { const e = await res.json(); msg = e.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function sheetsGet(range) {
  // UNFORMATTED_VALUE: fechas vuelven como número serial de Sheets (no como string formateado)
  const url = `${SHEETS_BASE}/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`;
  return apiRequest(url);
}

async function sheetsAppend(range, values) {
  // RAW preserva los strings exactamente (fechas no se convierten a serial de Sheets)
  const url = `${SHEETS_BASE}/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  return apiRequest(url, { method: 'POST', body: JSON.stringify({ values }) });
}

async function sheetsUpdate(range, values) {
  const url = `${SHEETS_BASE}/${CONFIG.SPREADSHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  return apiRequest(url, { method: 'PUT', body: JSON.stringify({ values }) });
}

// ---- Productos ----
// Devuelve array de { id, producto, color, tamanio, notas }
// El sheet tiene: fila 1 = título, fila 2 = vacía, fila 3 = encabezados, fila 4+ = datos
async function getProductos() {
  const data = await sheetsGet(`${CONFIG.SHEETS.PRODUCTOS}!A4:E`);
  return (data.values || []).map(r => ({
    id:       r[0] || '',
    producto: (r[1] || '').trim(),
    color:    (r[2] || '').trim(),
    tamanio:  (r[3] || '').trim(),
    notas:    r[4] || ''
  })).filter(p => p.producto);
}

// ---- Pedidos ----
// Agrega filas al sheet Pedidos
// Formato: [FECHA, CLIENTE, PRODUCTO, COLOR, TAMAÑO, CANTIDAD, PRECIO VENTA, TOTAL, ENTREGADO]
async function appendPedidos(rows) {
  return sheetsAppend(`${CONFIG.SHEETS.PEDIDOS}!A:I`, rows);
}

// Devuelve todos los pedidos con rowIndex (número de fila en el sheet, 1-based)
// El sheet tiene: fila 1 = título, fila 2 = vacía, fila 3 = encabezados, fila 4+ = datos
async function getAllPedidos() {
  const data = await sheetsGet(`${CONFIG.SHEETS.PEDIDOS}!A3:I`);
  const rows = data.values || [];
  if (rows.length <= 1) return []; // solo el encabezado, sin datos
  return rows.slice(1).map((r, i) => ({
    rowIndex:    i + 4, // fila 3 = encabezado, datos empiezan en fila 4
    fecha:       r[0] || '',
    cliente:     r[1] || '',
    producto:    r[2] || '',
    color:       r[3] || '',
    tamanio:     r[4] || '',
    cantidad:    parseInt(r[5]) || 0,
    precioVenta: parseFloat(r[6]) || 0,
    total:       parseFloat(r[7]) || 0,
    entregado:   r[8] || ''
  })).filter(p => p.cliente);
}

// Marca / desmarca la columna ENTREGADO (columna I) para una fila
async function marcarEntregado(rowIndex, entregado) {
  return sheetsUpdate(`${CONFIG.SHEETS.PEDIDOS}!I${rowIndex}`, [[entregado ? 'Sí' : '']]);
}

// Borra el contenido de las filas de pedido indicadas
async function limpiarFilasPedido(rowIndices) {
  await Promise.all(
    rowIndices.map(ri =>
      sheetsUpdate(`${CONFIG.SHEETS.PEDIDOS}!A${ri}:I${ri}`, [['','','','','','','','','']])
    )
  );
}

// ---- Compras ----
// Agrega múltiples filas a la hoja Compras de una sola vez
// Formato fila: [FECHA, PRODUCTO, COLOR, TAMAÑO, PROVEEDOR, CANTIDAD, PRECIO UNITARIO, TOTAL]
async function appendCompras(rows) {
  return sheetsAppend(`${CONFIG.SHEETS.COMPRAS}!A:H`, rows);
}

// Devuelve todas las compras registradas con rowIndex (número de fila en el sheet, 1-based)
// El sheet tiene: fila 1 = título, fila 2 = vacía, fila 3 = encabezados, fila 4+ = datos
async function getAllCompras() {
  const data = await sheetsGet(`${CONFIG.SHEETS.COMPRAS}!A3:H`);
  const rows = data.values || [];
  if (rows.length <= 1) return [];
  return rows.slice(1).map((r, i) => ({
    rowIndex:       i + 4,
    fecha:          r[0] || '',
    producto:       r[1] || '',
    color:          r[2] || '',
    tamanio:        r[3] || '',
    proveedor:      r[4] || '',
    cantidad:       parseInt(r[5]) || 0,
    precioUnitario: parseFloat(r[6]) || 0,
    total:          parseFloat(r[7]) || 0,
  })).filter(c => c.producto);
}

// Borra el contenido de las filas indicadas (las deja vacías, filter las ignora en futuros loads)
async function limpiarFilasCompra(rowIndices) {
  await Promise.all(
    rowIndices.map(ri =>
      sheetsUpdate(`${CONFIG.SHEETS.COMPRAS}!A${ri}:H${ri}`, [['','','','','','','','']])
    )
  );
}
