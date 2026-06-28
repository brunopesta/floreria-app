// =============================================
//  CONFIGURACIÓN — completar con tus datos
// =============================================
const CONFIG = {
  // 1. Obtenés esto en Google Cloud Console → Credenciales → OAuth 2.0
  CLIENT_ID: '456355412142-33bi98720liq8bldcie5vm19adrdo1a6.apps.googleusercontent.com',

  // 2. Es el ID largo en la URL de tu Google Sheet:
  //    https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
  SPREADSHEET_ID: '1yIN_LHDlc0e5EegaorGoWXWYepJIY7J8djz_JiOxKUY',

  SCOPES: 'https://www.googleapis.com/auth/spreadsheets',

  SHEETS: {
    PRODUCTOS:     'Productos',
    PEDIDOS:       'Pedidos',
    COMPRAS:       'Compras',
    LISTA_COMPRAS: 'Lista de Compras'
  }
};
