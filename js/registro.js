/**
 * Registro central de cotizaciones de ZOLARIS.
 *
 * Cada vez que un asesor genera el PDF, la cotización se anota en el registro central
 * (una Hoja de Google de la cuenta de Zolaris, a través de un script de Google Apps Script).
 * Así quedan todas las cotizaciones en un solo lugar, sin importar desde qué equipo se hagan,
 * y el agente de Seguimiento las pasa a HubSpot.
 *
 * Solo se envían datos comerciales del cliente y el resumen del sistema: nunca contraseñas.
 */

// URL del script publicado ("Implementar como aplicación web"). Vacía = el registro está desactivado.
const REGISTRO_CENTRAL_URL = '';
// Clave sencilla compartida con el script, para descartar envíos que no vengan del cotizador.
const REGISTRO_CENTRAL_CLAVE = 'zolaris-cotizador-2026';

/**
 * Nombre estándar del PDF: PROP_<CLIENTE>_<AAAA-MM-DD>_<CODIGO>.
 * @param {Object} registro registro guardado (con carpeta, codigo y fechaISO).
 * @returns {string}
 */
const nombreArchivoPropuesta = (registro) => {
  const fecha = (registro.fechaISO || new Date().toISOString()).slice(0, 10);
  return 'PROP_' + registro.carpeta + '_' + fecha + '_' + registro.codigo;
};

/**
 * Arma el resumen que se envía al registro central.
 * @param {Object} registro registro guardado.
 * @returns {Object}
 */
const resumenParaRegistro = (registro) => {
  const r = registro.resultado;
  const e = r.entrada;
  const f = r.financiero || {};
  return {
    clave: REGISTRO_CENTRAL_CLAVE,
    codigo: registro.codigo,
    archivo: nombreArchivoPropuesta(registro) + '.pdf',
    carpeta: registro.carpeta,
    fecha: registro.fechaISO,
    asesor: e.asesor || '',
    fuente: e.fuente || '',
    cliente: e.nombre,
    telefono: e.telefono || '',
    correo: e.correo || '',
    ciudad: e.ciudad,
    consumoKwhMes: e.consumo,
    precioKwh: e.precioKwh,
    potenciaKWp: r.potenciaKWp,
    paneles: r.numPaneles,
    valorTotal: r.costos ? r.costos.total : null,
    ahorroAnual: f.ahorroAnual || null,
    bateria: e.incluirBateria ? e.capacidadBateria : null,
    dispositivo: navigator.userAgent.slice(0, 120)
  };
};

/**
 * Envía la cotización al registro central. No bloquea la impresión: si falla, avisa y sigue.
 * @param {Object} registro registro guardado.
 * @returns {Promise<{ok:boolean, carpetaUrl?:string, mensaje?:string}>}
 */
const registrarEnCentral = (registro) => {
  if (!REGISTRO_CENTRAL_URL) {
    return Promise.resolve({ ok: false, mensaje: 'El registro central todavía no está activado.' });
  }
  return fetch(REGISTRO_CENTRAL_URL, {
    method: 'POST',
    // text/plain evita la verificación previa (CORS) que Apps Script no responde.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(resumenParaRegistro(registro))
  })
    .then((respuesta) => respuesta.json())
    .then((datos) => ({ ok: Boolean(datos && datos.ok), carpetaUrl: datos && datos.carpetaUrl, mensaje: datos && datos.mensaje }))
    .catch(() => ({ ok: false, mensaje: 'No se pudo conectar con el registro central. La cotización quedó guardada en este equipo.' }));
};
