/**
 * almacenamiento.js
 * Capa de persistencia sobre localStorage.
 * Cada cotización se guarda como una entrada con su consecutivo (COT_001, COT_002…),
 * los datos de entrada, los resultados calculados y la fecha. Esto simula "la carpeta
 * con el nombre de la cotización" pedida en las especificaciones: el navegador no puede
 * escribir carpetas en el disco, así que el historial vive en localStorage y el PDF se
 * genera/descarga aparte.
 */

'use strict';

const CLAVE_COTIZACIONES = 'zolaris_cotizaciones';
const CLAVE_CONSECUTIVO = 'zolaris_consecutivo';

/**
 * Lee de forma segura el arreglo de cotizaciones almacenadas.
 * @returns {Array<Object>}
 */
const listarCotizaciones = () => {
  const crudo = localStorage.getItem(CLAVE_COTIZACIONES);
  if (!crudo) {
    return [];
  }
  try {
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? datos : [];
  } catch (error) {
    return [];
  }
};

/**
 * Devuelve el siguiente número consecutivo formateado (ej. "003") y lo reserva.
 * @returns {string}
 */
const siguienteConsecutivo = () => {
  const actual = parseInt(localStorage.getItem(CLAVE_CONSECUTIVO) || '0', 10);
  const proximo = actual + 1;
  localStorage.setItem(CLAVE_CONSECUTIVO, String(proximo));
  return String(proximo).padStart(3, '0');
};

/**
 * Construye un nombre de carpeta/identificador a partir del nombre del cliente,
 * con el mismo estilo de las carpetas existentes (mayúsculas y guiones bajos).
 * @param {string} nombre
 * @returns {string}
 */
const normalizarNombre = (nombre) => {
  return nombre
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita tildes
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

/**
 * Guarda una cotización nueva y devuelve el registro almacenado.
 * @param {Object} resultado salida de calcularCotizacion.
 * @param {string} [imagen] imagen del proyecto en base64 (opcional).
 * @returns {Object} registro guardado (incluye id, consecutivo y fecha).
 */
const guardarCotizacion = (resultado, imagen) => {
  const consecutivo = siguienteConsecutivo();
  const fecha = new Date();
  const carpeta = normalizarNombre(resultado.entrada.nombre);
  const registro = {
    id: 'COT_' + consecutivo + '_' + carpeta + '_' + fecha.getTime(),
    consecutivo: consecutivo,
    carpeta: carpeta,
    codigo: 'COT_' + consecutivo,
    fechaISO: fecha.toISOString(),
    resultado: resultado,
    imagen: imagen || null
  };
  const cotizaciones = listarCotizaciones();
  cotizaciones.unshift(registro); // las más recientes primero
  localStorage.setItem(CLAVE_COTIZACIONES, JSON.stringify(cotizaciones));
  return registro;
};

/**
 * Recupera una cotización por su id.
 * @param {string} id
 * @returns {Object|null}
 */
const obtenerCotizacion = (id) => {
  return listarCotizaciones().find((cot) => cot.id === id) || null;
};

/**
 * Elimina una cotización por su id.
 * @param {string} id
 * @returns {boolean} true si se eliminó algo.
 */
const eliminarCotizacion = (id) => {
  const cotizaciones = listarCotizaciones();
  const restantes = cotizaciones.filter((cot) => cot.id !== id);
  localStorage.setItem(CLAVE_COTIZACIONES, JSON.stringify(restantes));
  return restantes.length !== cotizaciones.length;
};
