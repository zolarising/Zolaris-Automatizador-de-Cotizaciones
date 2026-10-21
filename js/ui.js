/**
 * ui.js
 * Capa de presentación: construye el DOM (siempre con createElement/appendChild,
 * nunca innerHTML), valida el formulario, muestra resultados e historial, gestiona
 * los avisos tipo "toast", el modal de confirmación y la vista imprimible del PDF.
 */

'use strict';

/* ====================== Utilidades de formato ====================== */

/** Formatea un número como moneda colombiana (COP) sin decimales. */
const formatoMoneda = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Math.round(valor));
};

/** Formatea un número con separador de miles y los decimales indicados. */
const formatoNumero = (valor, decimales = 0) => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales
  }).format(valor);
};

/** Formatea una fecha ISO a un texto legible en español. */
const formatoFecha = (fechaISO) => {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/* ====================== Helpers de creación de DOM ====================== */

/**
 * Crea un elemento con clases, texto y atributos opcionales.
 * @param {string} etiqueta
 * @param {Object} [opciones]
 * @returns {HTMLElement}
 */
const crear = (etiqueta, opciones = {}) => {
  const el = document.createElement(etiqueta);
  if (opciones.clase) {
    el.className = opciones.clase;
  }
  if (opciones.texto !== undefined) {
    el.textContent = opciones.texto;
  }
  if (opciones.atributos) {
    Object.entries(opciones.atributos).forEach(([k, v]) => el.setAttribute(k, v));
  }
  return el;
};

/** Crea una fila <tr> con celdas (concepto, valor) para una tabla. */
const crearFila = (concepto, valor, claseFila) => {
  const tr = crear('tr', { clase: claseFila || '' });
  tr.appendChild(crear('td', { texto: concepto }));
  tr.appendChild(crear('td', { texto: valor }));
  return tr;
};

/** Vacía un nodo eliminando todos sus hijos. */
const vaciar = (nodo) => {
  while (nodo.firstChild) {
    nodo.removeChild(nodo.firstChild);
  }
};

/* ====================== Avisos (toasts) ====================== */

/**
 * Muestra un aviso temporal en pantalla.
 * @param {string} mensaje
 * @param {('info'|'exito'|'error')} [tipo]
 */
const mostrarAviso = (mensaje, tipo = 'info') => {
  const contenedor = document.getElementById('contenedorAvisos');
  const aviso = crear('div', { clase: 'aviso aviso--' + tipo, texto: mensaje });
  contenedor.appendChild(aviso);
  window.setTimeout(() => {
    if (aviso.parentNode) {
      aviso.parentNode.removeChild(aviso);
    }
  }, 4000);
};

/* ====================== Modal de confirmación ====================== */

/**
 * Abre el modal de confirmación con estilo de marca.
 * @param {string} titulo
 * @param {string} mensaje
 * @param {Function} alConfirmar callback que se ejecuta si el usuario acepta.
 */
const abrirModal = (titulo, mensaje, alConfirmar) => {
  const modal = document.getElementById('modal');
  document.getElementById('modalTitulo').textContent = titulo;
  document.getElementById('modalMensaje').textContent = mensaje;

  const botonConfirmar = document.getElementById('modalConfirmar');
  const botonCancelar = document.getElementById('modalCancelar');

  const cerrar = () => {
    modal.classList.add('oculto');
    botonConfirmar.removeEventListener('click', manejarConfirmar);
    botonCancelar.removeEventListener('click', cerrar);
  };

  const manejarConfirmar = () => {
    cerrar();
    alConfirmar();
  };

  botonConfirmar.addEventListener('click', manejarConfirmar);
  botonCancelar.addEventListener('click', cerrar);
  modal.classList.remove('oculto');
};

/* ====================== Inicialización de selects ====================== */

/** Rellena el select de ciudades a partir de la tabla de generación. */
const llenarSelectCiudades = () => {
  const select = document.getElementById('campoCiudad');
  Object.keys(TABLA_GENERACION).sort((a, b) => a.localeCompare(b, 'es')).forEach((ciudad) => {
    select.appendChild(crear('option', { texto: ciudad, atributos: { value: ciudad } }));
  });
};

/** Rellena el select de tipos de techo. */
const llenarSelectTechos = () => {
  const select = document.getElementById('campoTecho');
  TIPOS_DE_TECHO.forEach((techo) => {
    select.appendChild(crear('option', { texto: techo, atributos: { value: techo } }));
  });
};

/* ====================== Validación del formulario ====================== */

/** Limpia los mensajes de error de todos los campos. */
const limpiarErrores = (formulario) => {
  formulario.querySelectorAll('.campo__error').forEach((el) => { el.textContent = ''; });
  formulario.querySelectorAll('.campo__entrada').forEach((el) => {
    el.classList.remove('campo__entrada--invalido');
  });
};

/** Marca un campo con un mensaje de error. */
const marcarError = (formulario, nombreCampo, mensaje) => {
  const error = formulario.querySelector('[data-error-de="' + nombreCampo + '"]');
  if (error) {
    error.textContent = mensaje;
  }
  const entrada = formulario.elements[nombreCampo];
  if (entrada) {
    entrada.classList.add('campo__entrada--invalido');
  }
};

/**
 * Lee y valida el formulario. Devuelve los datos de entrada o null si hay errores.
 * @param {HTMLFormElement} formulario
 * @returns {Object|null}
 */
const leerFormulario = (formulario) => {
  limpiarErrores(formulario);
  let valido = true;

  const nombre = formulario.elements.nombre.value.trim();
  const ciudad = formulario.elements.ciudad.value;
  const tipoTecho = formulario.elements.tipoTecho.value;
  const consumo = parseFloat(formulario.elements.consumo.value);
  const porcentaje = parseFloat(formulario.elements.porcentaje.value);
  const precioKwh = parseFloat(formulario.elements.precioKwh.value);
  const descuento = parseFloat(formulario.elements.descuento.value);

  if (!nombre) {
    marcarError(formulario, 'nombre', 'Indica el nombre del cliente.');
    valido = false;
  }
  if (!ciudad) {
    marcarError(formulario, 'ciudad', 'Selecciona una ciudad.');
    valido = false;
  }
  if (!tipoTecho) {
    marcarError(formulario, 'tipoTecho', 'Selecciona el tipo de techo.');
    valido = false;
  }
  if (!Number.isFinite(consumo) || consumo <= 0) {
    marcarError(formulario, 'consumo', 'El consumo debe ser un número mayor que cero.');
    valido = false;
  }
  if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 300) {
    marcarError(formulario, 'porcentaje', 'El porcentaje debe estar entre 1 y 300.');
    valido = false;
  }
  if (!Number.isFinite(precioKwh) || precioKwh <= 0) {
    marcarError(formulario, 'precioKwh', 'El precio del kWh debe ser mayor que cero.');
    valido = false;
  }
  if (!Number.isFinite(descuento)) {
    marcarError(formulario, 'descuento', 'El descuento debe ser un número.');
    valido = false;
  }

  // Respaldo de energía (batería) — opcional, no afecta el cálculo de costos.
  const incluirBateria = formulario.elements.incluirBateria.checked;
  const capacidadBateria = parseFloat(formulario.elements.capacidadBateria.value);
  if (incluirBateria && (!Number.isFinite(capacidadBateria) || capacidadBateria <= 0)) {
    marcarError(formulario, 'capacidadBateria', 'La capacidad de la batería debe ser mayor que cero.');
    valido = false;
  }

  // Parámetros financieros avanzados (tienen valor por defecto en el HTML).
  const pagoInicialLeasing = parseFloat(formulario.elements.pagoInicialLeasing.value);
  const plazoLeasingAnios = parseFloat(formulario.elements.plazoLeasingAnios.value);
  const parametros = {
    tarifaVentaExcedentes: parseFloat(formulario.elements.tarifaVentaExcedentes.value),
    incrementoTarifa: parseFloat(formulario.elements.incrementoTarifa.value),
    inflacion: parseFloat(formulario.elements.inflacion.value),
    degradacionAnual: parseFloat(formulario.elements.degradacionAnual.value),
    pagoInicialLeasing: pagoInicialLeasing,
    plazoLeasingAnios: plazoLeasingAnios
  };
  // Si alguno quedó vacío o inválido, se omite para usar el valor por defecto del cálculo.
  Object.keys(parametros).forEach((k) => {
    if (!Number.isFinite(parametros[k])) {
      delete parametros[k];
    }
  });

  // Validación específica del leasing (solo si el usuario los completó).
  if (Number.isFinite(pagoInicialLeasing) && (pagoInicialLeasing < 0 || pagoInicialLeasing >= 100)) {
    marcarError(formulario, 'pagoInicialLeasing', 'El pago inicial debe estar entre 0 y 99.');
    valido = false;
  }
  if (Number.isFinite(plazoLeasingAnios) && plazoLeasingAnios <= 0) {
    marcarError(formulario, 'plazoLeasingAnios', 'El tiempo de crédito debe ser mayor que cero.');
    valido = false;
  }

  if (!valido) {
    return null;
  }
  return {
    nombre, ciudad, tipoTecho, consumo, porcentaje, precioKwh, descuento, parametros,
    incluirBateria, capacidadBateria: incluirBateria ? capacidadBateria : null
  };
};

/* ====================== Render de resultados (pantalla) ====================== */

/**
 * Construye y muestra el panel de resultados en pantalla.
 * @param {Object} resultado salida de calcularCotizacion.
 */
const renderResultado = (resultado) => {
  const contenedor = document.getElementById('contenedorResultado');
  vaciar(contenedor);

  const f = resultado.financiero;

  // Tarjeta: características del sistema
  const tarjetaSistema = crear('div', { clase: 'tarjeta' });
  tarjetaSistema.appendChild(crear('h3', { clase: 'tarjeta__titulo', texto: 'Características del sistema' }));
  const tablaSistema = crear('table', { clase: 'tabla' });
  const cuerpoSistema = crear('tbody');
  cuerpoSistema.appendChild(crearFila('Capacidad instalada', formatoNumero(resultado.potenciaKWp, 1) + ' kWp'));
  cuerpoSistema.appendChild(crearFila('Número de paneles (730 Wp)', formatoNumero(resultado.numPaneles) + ' uds'));
  cuerpoSistema.appendChild(crearFila('Potencia de inversores', formatoNumero(resultado.inversor.potencia, 1) + ' kW'));
  cuerpoSistema.appendChild(crearFila('Área estimada del sistema', formatoNumero(resultado.areaSistema, 2) + ' m²'));
  cuerpoSistema.appendChild(crearFila('Producción anual esperada', formatoNumero(resultado.produccionAnual) + ' kWh'));
  cuerpoSistema.appendChild(crearFila('Excedentes anuales', formatoNumero(resultado.excedentes) + ' kWh'));
  cuerpoSistema.appendChild(crearFila('Sustitución de CO₂ al año', formatoNumero(resultado.co2Anual, 1) + ' kg'));
  tablaSistema.appendChild(cuerpoSistema);
  tarjetaSistema.appendChild(tablaSistema);

  // Tarjeta: análisis financiero
  const tarjetaFinanzas = crear('div', { clase: 'tarjeta' });
  tarjetaFinanzas.appendChild(crear('h3', { clase: 'tarjeta__titulo', texto: 'Análisis de costos e ingresos' }));
  const tablaFinanzas = crear('table', { clase: 'tabla' });
  const cuerpoFinanzas = crear('tbody');
  cuerpoFinanzas.appendChild(crearFila('Ahorro mensual', formatoMoneda(f.ahorroMensual)));
  cuerpoFinanzas.appendChild(crearFila('Ingreso mensual por excedentes', formatoMoneda(f.ingresoMensual)));
  cuerpoFinanzas.appendChild(crearFila('Ahorro anual estimado', formatoMoneda(f.ahorroAnual)));
  cuerpoFinanzas.appendChild(crearFila('Beneficios tributarios', formatoMoneda(f.beneficioTributario)));
  cuerpoFinanzas.appendChild(crearFila('Retorno de la inversión', formatoNumero(f.payback) + ' años'));
  cuerpoFinanzas.appendChild(crearFila('Total del proyecto', formatoMoneda(resultado.costos.total), 'tabla__destacado'));
  tablaFinanzas.appendChild(cuerpoFinanzas);
  tarjetaFinanzas.appendChild(tablaFinanzas);

  contenedor.appendChild(tarjetaSistema);
  contenedor.appendChild(tarjetaFinanzas);
};

/* ====================== Render del historial ====================== */

/** Construye y muestra el historial de cotizaciones guardadas. */
const renderHistorial = (alAbrir, alEliminar) => {
  const contenedor = document.getElementById('contenedorHistorial');
  vaciar(contenedor);

  const cotizaciones = listarCotizaciones();
  if (cotizaciones.length === 0) {
    contenedor.appendChild(crear('p', {
      clase: 'historial__vacio',
      texto: 'Aún no hay cotizaciones guardadas.'
    }));
    return;
  }

  cotizaciones.forEach((registro) => {
    const tarjeta = crear('article', { clase: 'tarjeta-historial' });

    const info = crear('div', { clase: 'tarjeta-historial__info' });
    info.appendChild(crear('span', {
      clase: 'tarjeta-historial__nombre',
      texto: registro.codigo + ' · ' + registro.resultado.entrada.nombre
    }));
    info.appendChild(crear('span', {
      clase: 'tarjeta-historial__meta',
      texto: registro.resultado.entrada.ciudad + ' · ' + formatoFecha(registro.fechaISO)
        + ' · ' + formatoMoneda(registro.resultado.costos.total)
    }));

    const acciones = crear('div', { clase: 'tarjeta-historial__acciones' });
    const botonAbrir = crear('button', {
      clase: 'boton boton--secundario',
      texto: 'Abrir',
      atributos: { type: 'button' }
    });
    botonAbrir.addEventListener('click', () => alAbrir(registro));
    const botonBorrar = crear('button', {
      clase: 'boton boton--peligro',
      texto: 'Eliminar',
      atributos: { type: 'button' }
    });
    botonBorrar.addEventListener('click', () => alEliminar(registro));

    acciones.appendChild(botonAbrir);
    acciones.appendChild(botonBorrar);

    tarjeta.appendChild(info);
    tarjeta.appendChild(acciones);
    contenedor.appendChild(tarjeta);
  });
};

/* ====================== Vista imprimible (PDF) ====================== */
/* Diseño Zolaris 2026: documento continuo (no diapositivas 16:9), con
   cifra dominante por sección, gráficas SVG de marca construidas a partir
   del resultado real de calcularCotizacion, y cierre con llamada a la
   acción. Reemplaza la réplica del pptm original — mismo contrato de
   datos (objeto `resultado`), mismo disparador (botón «Generar PDF» +
   window.print()), mismo contenedor (#hojaPdf). */

const REC = 'recursos/'; // carpeta de imágenes reales
const NS_SVG = 'http://www.w3.org/2000/svg';

/** Formatea un porcentaje con los decimales indicados (es-CO). */
const formatoPorcentaje = (valor, decimales = 1) => formatoNumero(valor, decimales) + '%';

/** Crea un elemento SVG con atributos. */
const svgEl = (etiqueta, atributos = {}) => {
  const el = document.createElementNS(NS_SVG, etiqueta);
  Object.entries(atributos).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
};

/** Crea un <img> de recurso con clase. */
const imgRec = (archivo, clase) =>
  crear('img', { clase: clase || '', atributos: { src: REC + archivo, alt: '' } });

/**
 * Espera a que todas las <img> dentro de un contenedor terminen de cargar
 * (o fallen). #hojaPdf se rellena con más de 15 imágenes reales justo antes
 * de imprimir; sin esta espera, window.print() puede abrirse antes de que el
 * navegador termine de descargarlas y el PDF sale con las imágenes en blanco.
 * @param {HTMLElement} contenedor
 * @returns {Promise<void>}
 */
const esperarImagenesCargadas = (contenedor) => {
  const pendientes = Array.from(contenedor.querySelectorAll('img')).filter((img) => !img.complete);
  if (pendientes.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(pendientes.map((img) => new Promise((resolver) => {
    img.addEventListener('load', resolver, { once: true });
    img.addEventListener('error', resolver, { once: true });
  }))).then(() => undefined);
};

/**
 * Crea una sección de la hoja PDF, clara u oscura, con foto de fondo real opcional.
 * @param {string} numero
 * @param {string} eyebrow
 * @param {string} titulo
 * @param {boolean} oscura
 * @param {string} [foto] archivo en recursos/ para usar como fondo (solo con oscura=true).
 */
const pdfSeccion = (numero, eyebrow, titulo, oscura, foto) => {
  const clases = ['pdf-section'];
  if (oscura) { clases.push('pdf-dark'); }
  if (oscura && foto) { clases.push('pdf-photo'); }
  const sec = crear('section', { clase: clases.join(' ') });
  if (oscura && foto) {
    sec.style.backgroundImage = 'url("' + REC + foto + '")';
  }
  sec.appendChild(crear('div', { clase: 'pdf-section-eyebrow', texto: numero + ' · ' + eyebrow }));
  sec.appendChild(crear('h2', { clase: 'pdf-section-title', texto: titulo }));
  return sec;
};

/** Crea una tabla concepto/valor de dos columnas con clase de marca. */
const pdfTabla = (encabezados, filas, claseExtra) => {
  const wrap = crear('div', { clase: 'pdf-table-wrap' });
  const tabla = crear('table', { clase: 'pdf-tabla' + (claseExtra ? ' ' + claseExtra : '') });
  const thead = crear('thead');
  const trh = crear('tr');
  encabezados.forEach((h) => trh.appendChild(crear('th', { texto: h })));
  thead.appendChild(trh);
  const tbody = crear('tbody');
  filas.forEach((fila) => {
    const tr = crear('tr', { clase: fila.total ? 'pdf-total-row' : '' });
    fila.celdas.forEach((c, i) => {
      const td = crear('td', { texto: c, clase: i > 0 ? 'pdf-num' + (fila.fuerte && i === fila.celdas.length - 1 ? ' pdf-strong' : '') : '' });
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tabla.appendChild(thead);
  tabla.appendChild(tbody);
  wrap.appendChild(tabla);
  return wrap;
};

/**
 * Gráfica de comparación "gasto acumulado" — sin Zolaris (creciendo con el
 * incremento anual de tarifa) vs con Zolaris (inversión única, plana).
 * @param {number} ahorroAnual valor del año 1 (proxy del gasto evitado).
 * @param {number} costoTotal inversión total (compra directa).
 * @param {number} incrementoPct % de incremento anual de tarifa (parámetro del formulario).
 * @returns {{svg:SVGElement, anioCruce:number|null}}
 */
const graficoComparacion = (ahorroAnual, costoTotal, incrementoPct) => {
  const w = 640;
  const h = 145;
  const margenInferior = 24;
  const alto = h - margenInferior;
  const incr = incrementoPct / 100;
  const puntos = [[0, 0]];
  let acum = 0;
  for (let anio = 1; anio <= 10; anio += 1) {
    acum += ahorroAnual * Math.pow(1 + incr, anio - 1);
    puntos.push([anio, acum]);
  }
  const maxV = Math.max(puntos[puntos.length - 1][1], costoTotal) || 1;
  const escalaX = (anio) => (anio / 10) * w;
  const escalaY = (valor) => alto - (valor / maxV) * alto;

  const svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h });
  svg.appendChild(svgEl('line', {
    x1: 0, y1: alto, x2: w, y2: alto, stroke: 'var(--pdf-line)', 'stroke-width': 1
  }));
  const lineaRoja = svgEl('polyline', {
    points: puntos.map((p) => escalaX(p[0]) + ',' + escalaY(p[1])).join(' '),
    fill: 'none', stroke: 'var(--pdf-bad)', 'stroke-width': 3,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  });
  svg.appendChild(lineaRoja);
  const yNaranja = escalaY(Math.min(costoTotal, maxV));
  svg.appendChild(svgEl('line', {
    x1: 0, y1: yNaranja, x2: w, y2: yNaranja, stroke: 'var(--pdf-orange)',
    'stroke-width': 3, 'stroke-linecap': 'round'
  }));

  /* Eje X — años */
  for (let anio = 0; anio <= 10; anio += 1) {
    const x = escalaX(anio);
    svg.appendChild(svgEl('line', {
      x1: x, y1: alto, x2: x, y2: alto + 4, stroke: 'var(--pdf-gray)', 'stroke-width': 1
    }));
    svg.appendChild(svgEl('text', {
      x: x, y: alto + 18, 'font-size': 11, fill: 'var(--pdf-gray)',
      'text-anchor': anio === 10 ? 'end' : (anio === 0 ? 'start' : 'middle')
    })).textContent = anio === 0 ? 'Hoy' : 'Año ' + anio;
  }

  let anioCruce = null;
  let acumCruce = 0;
  for (let anio = 1; anio <= 10; anio += 1) {
    const previo = acumCruce;
    acumCruce += ahorroAnual * Math.pow(1 + incr, anio - 1);
    if (acumCruce >= costoTotal && previo < costoTotal) {
      const frac = (costoTotal - previo) / (acumCruce - previo);
      anioCruce = (anio - 1) + frac;
      break;
    }
  }
  if (anioCruce !== null) {
    svg.appendChild(svgEl('circle', {
      cx: escalaX(anioCruce), cy: yNaranja, r: 5, fill: 'var(--pdf-orange)'
    }));
  }
  return { svg, anioCruce };
};

/**
 * Gráfica de área "flujo acumulado" del leasing, primeros 10 años, con ejes y
 * un marcador en el año en que termina la cuota (momento clave: de ahí en
 * adelante el flujo acelera porque ya no hay pago mensual).
 * @param {Array} flujoLeasing salida de calcularCotizacion (financiero.flujoLeasing), en millones COP.
 * @param {number} plazoLeasingAnios años del crédito (cuando termina la cuota).
 * @returns {SVGElement}
 */
const graficoFlujoLeasing = (flujoLeasing, plazoLeasingAnios) => {
  const w = 640;
  const h = 165;
  const margen = { top: 12, right: 14, bottom: 26, left: 50 };
  const anchoUtil = w - margen.left - margen.right;
  const altoUtil = h - margen.top - margen.bottom;

  const primeros10 = flujoLeasing.slice(0, 10);
  const picoV = Math.max.apply(null, primeros10.map((f) => f.acumulado)) || 1;
  const paso = picoV <= 100 ? 25 : (picoV <= 400 ? 100 : 200);
  const maxV = Math.ceil(picoV / paso) * paso;
  const puntos = [[0, 0]].concat(primeros10.map((f) => [f.anio, Math.max(0, f.acumulado)]));
  const escalaX = (anio) => margen.left + (anio / 10) * anchoUtil;
  const escalaY = (valor) => margen.top + altoUtil - (valor / maxV) * altoUtil;
  const yBase = margen.top + altoUtil;
  const coords = puntos.map((p) => escalaX(p[0]) + ',' + escalaY(p[1]));

  const svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h });

  /* Cuadrícula y eje Y ($ millones) */
  const pasosY = 4;
  for (let i = 0; i <= pasosY; i += 1) {
    const valor = (maxV / pasosY) * i;
    const y = escalaY(valor);
    svg.appendChild(svgEl('line', {
      x1: margen.left, y1: y, x2: w - margen.right, y2: y, stroke: 'var(--pdf-line)', 'stroke-width': 1
    }));
    svg.appendChild(svgEl('text', {
      x: margen.left - 8, y: y + 4, 'font-size': 10.5, fill: 'var(--pdf-gray)', 'text-anchor': 'end'
    })).textContent = '$' + formatoNumero(valor, 0) + 'M';
  }

  /* Marcador del fin de cuota (momento en que el flujo acelera) */
  if (plazoLeasingAnios > 0 && plazoLeasingAnios < 10) {
    const xPlazo = escalaX(plazoLeasingAnios);
    svg.appendChild(svgEl('line', {
      x1: xPlazo, y1: margen.top, x2: xPlazo, y2: yBase,
      stroke: 'var(--pdf-navy)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4', opacity: 0.55
    }));
    svg.appendChild(svgEl('text', {
      x: xPlazo + 6, y: margen.top + 10, 'font-size': 10.5, fill: 'var(--pdf-navy)', 'font-weight': 700
    })).textContent = 'Cuota termina';
  }

  const poligono = svgEl('polygon', {
    points: coords.join(' ') + ' ' + escalaX(10) + ',' + yBase + ' ' + escalaX(0) + ',' + yBase,
    fill: 'var(--pdf-orange)', opacity: 0.16
  });
  svg.appendChild(poligono);
  svg.appendChild(svgEl('polyline', {
    points: coords.join(' '), fill: 'none', stroke: 'var(--pdf-orange)',
    'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }));
  const ultimo = puntos[puntos.length - 1];
  svg.appendChild(svgEl('circle', {
    cx: escalaX(ultimo[0]), cy: escalaY(ultimo[1]), r: 4.5, fill: 'var(--pdf-navy)'
  }));
  svg.appendChild(svgEl('text', {
    x: escalaX(ultimo[0]) - 8, y: escalaY(ultimo[1]) - 10, 'font-size': 11, 'font-weight': 800,
    fill: 'var(--pdf-navy)', 'text-anchor': 'end'
  })).textContent = '$' + formatoNumero(ultimo[1], 0) + 'M';

  /* Eje X — años */
  [0, 2, 4, 6, 8, 10].forEach((anio) => {
    const x = escalaX(anio);
    svg.appendChild(svgEl('line', {
      x1: x, y1: yBase, x2: x, y2: yBase + 4, stroke: 'var(--pdf-gray)', 'stroke-width': 1
    }));
    svg.appendChild(svgEl('text', {
      x, y: yBase + 17, 'font-size': 10.5, fill: 'var(--pdf-gray)',
      'text-anchor': anio === 10 ? 'end' : (anio === 0 ? 'start' : 'middle')
    })).textContent = anio === 0 ? 'Hoy' : 'Año ' + anio;
  });

  return svg;
};

/**
 * Dibuja una dádona (donut) SVG a partir de segmentos {valor, color}.
 * @param {Array<{valor:number, color:string}>} segmentos
 * @returns {SVGElement}
 */
const crearDonut = (segmentos) => {
  const size = 160;
  const radio = 62;
  const grosor = 24;
  const circ = 2 * Math.PI * radio;
  const total = segmentos.reduce((acc, s) => acc + s.valor, 0) || 1;
  const svg = svgEl('svg', { viewBox: '0 0 ' + size + ' ' + size, width: '100%', height: '100%' });
  const grupo = svgEl('g', { transform: 'rotate(-90 ' + (size / 2) + ' ' + (size / 2) + ')' });
  grupo.appendChild(svgEl('circle', {
    cx: size / 2, cy: size / 2, r: radio, fill: 'none', stroke: 'var(--pdf-line)', 'stroke-width': grosor
  }));
  const segmentosValidos = segmentos.filter((s) => s.valor > 0);
  const gap = segmentosValidos.length > 1 ? 3 : 0;
  let acumulado = 0;
  segmentosValidos.forEach((seg) => {
    const largo = Math.max(0, (seg.valor / total) * circ - gap);
    grupo.appendChild(svgEl('circle', {
      cx: size / 2, cy: size / 2, r: radio, fill: 'none', stroke: seg.color, 'stroke-width': grosor,
      'stroke-dasharray': largo + ' ' + (circ - largo),
      'stroke-dashoffset': -acumulado,
      'stroke-linecap': segmentosValidos.length > 1 ? 'round' : 'butt'
    }));
    acumulado += (seg.valor / total) * circ;
  });
  svg.appendChild(grupo);
  return svg;
};

/**
 * Construye una tarjeta con dádona + leyenda, estilo "generación/consumo de energía".
 * @param {string} icono emoji o símbolo corto.
 * @param {string} titulo
 * @param {string} subtitulo
 * @param {Array<{etiqueta:string, valor:number, color:string}>} segmentos
 * @param {string} centroPct texto grande del centro (ej. "100%").
 * @param {string} centroLbl texto pequeño bajo el porcentaje.
 * @param {string} totalTexto texto grande bajo la dádona (ej. "2.182 kWh/mes").
 * @param {string} totalSub
 * @returns {HTMLElement}
 */
const pdfDonutCard = (icono, titulo, subtitulo, segmentos, centroPct, centroLbl, totalTexto, totalSub) => {
  const card = crear('div', { clase: 'pdf-donut-card' });
  const head = crear('div', { clase: 'pdf-donut-card-head' });
  head.appendChild(document.createTextNode(icono + ' ' + titulo));
  card.appendChild(head);
  card.appendChild(crear('div', { clase: 'pdf-donut-card-sub', texto: subtitulo }));
  const wrap = crear('div', { clase: 'pdf-donut-wrap' });
  wrap.appendChild(crearDonut(segmentos.map((s) => ({ valor: s.valor, color: s.color }))));
  const centro = crear('div', { clase: 'pdf-donut-center' });
  centro.appendChild(crear('div', { clase: 'pct', texto: centroPct }));
  centro.appendChild(crear('div', { clase: 'lbl', texto: centroLbl }));
  wrap.appendChild(centro);
  card.appendChild(wrap);
  const total = crear('div', { clase: 'pdf-donut-total', texto: totalTexto });
  total.appendChild(crear('span', { texto: totalSub }));
  card.appendChild(total);
  const legend = crear('div', { clase: 'pdf-donut-legend' });
  const totalValor = segmentos.reduce((acc, s) => acc + s.valor, 0) || 1;
  segmentos.forEach((seg) => {
    const row = crear('div', { clase: 'row' });
    const dot = crear('span', { clase: 'dot' });
    dot.style.background = seg.color;
    row.appendChild(dot);
    row.appendChild(crear('span', { clase: 'lbl', texto: seg.etiqueta }));
    const pct = Math.round((seg.valor / totalValor) * 100);
    row.appendChild(crear('span', { clase: 'val', texto: formatoNumero(seg.valor, 0) + ' kWh (' + pct + '%)' }));
    legend.appendChild(row);
  });
  card.appendChild(legend);
  return card;
};

/**
 * Ondulación determinística (suma de senos) que le da a una curva una apariencia
 * natural — nubes pasajeras en la generación, hábitos de uso en el consumo — en vez
 * de una línea perfectamente lisa. No es ruido aleatorio: mismo perfil siempre.
 * @param {number} t hora del día.
 * @param {number} fase desplazamiento para que dos curvas no onden igual.
 * @returns {number} factor multiplicativo alrededor de 0 (típicamente ±0.12).
 */
const ondulacion = (t, fase) => (
  0.05 * Math.sin((2 * Math.PI * t) / 2.3 + fase)
  + 0.035 * Math.sin((2 * Math.PI * t) / 0.9 + fase * 1.7)
  + 0.02 * Math.sin((2 * Math.PI * t) / 1.5 + fase * 2.3)
);

/**
 * Peso horario típico de consumo (0-23h, promedio del arreglo ≈ 1.0): bajo en la
 * madrugada, sube en el día y pica en la noche (cocción, iluminación, climatización).
 * Es un perfil de uso típico —no una medición del cliente—, ya que la factura solo
 * registra el consumo mensual total, no el detalle hora a hora.
 */
const PESO_CONSUMO_HORA = [
  0.55, 0.5, 0.48, 0.48, 0.5, 0.55, 0.7, 0.85, 0.95, 1.0, 1.05, 1.1,
  1.15, 1.1, 1.05, 1.0, 1.05, 1.15, 1.45, 1.6, 1.55, 1.35, 1.05, 0.75
];

/**
 * Curva de generación solar vs. consumo en un día típico, con ejes reales y
 * variación natural (ninguna de las dos es una línea perfecta).
 * La generación sigue el comportamiento físico real de la irradiancia solar en un día
 * despejado (sube desde el amanecer, pico al mediodía, baja al atardecer), escalada a
 * la potencia instalada real del sistema (potenciaKWp), con la variabilidad típica de
 * nubosidad. El consumo se distribuye a partir del promedio horario real del cliente
 * (consumoMensual/días/horas) usando un perfil de uso típico (bajo de noche, alto en
 * la noche temprana) — la factura no registra el detalle hora a hora, así que esto es
 * ilustrativo, pero el total del día sí corresponde a tu consumo real.
 * @param {number} potenciaKWp
 * @param {number} consumoPromedioHora kWh promedio por hora (consumoMensual×12/365/24).
 * @returns {SVGElement}
 */
const graficoCurvaDiaria = (potenciaKWp, consumoPromedioHora) => {
  const w = 640;
  const h = 260;
  const margen = { top: 14, right: 14, bottom: 34, left: 46 };
  const anchoUtil = w - margen.left - margen.right;
  const altoUtil = h - margen.top - margen.bottom;

  const pesoProm = PESO_CONSUMO_HORA.reduce((a, b) => a + b, 0) / 24;
  const pesoConsumo = (hh) => {
    const i0 = Math.floor(hh) % 24;
    const i1 = (i0 + 1) % 24;
    const frac = hh - Math.floor(hh);
    const w0 = PESO_CONSUMO_HORA[i0];
    const w1 = PESO_CONSUMO_HORA[i1];
    return (w0 + (w1 - w0) * frac) / pesoProm; // normalizado: promedio diario = 1.0
  };

  const horas = [];
  for (let hh = 0; hh <= 24; hh += 0.25) { horas.push(hh); }

  const generacion = (hh) => {
    if (hh < 6 || hh > 18) return 0;
    const x = (hh - 6) / 12; // 0..1
    const envolvente = Math.pow(Math.sin(Math.PI * x), 1.35);
    return Math.max(0, potenciaKWp * envolvente * (1 + ondulacion(hh, 0.4) * envolvente));
  };
  const consumo = (hh) => Math.max(0, consumoPromedioHora * pesoConsumo(hh) * (1 + ondulacion(hh, 2.1) * 0.4));

  const puntosGen = horas.map((hh) => [hh, generacion(hh)]);
  const puntosCon = horas.map((hh) => [hh, consumo(hh)]);
  const picoV = Math.max.apply(null, puntosGen.concat(puntosCon).map((p) => p[1])) || 1;
  // Techo del eje Y redondeado a un múltiplo "limpio" para que las marcas sean legibles.
  const paso = picoV <= 5 ? 1 : (picoV <= 10 ? 2 : (picoV <= 25 ? 5 : 10));
  const maxV = Math.ceil((picoV * 1.15) / paso) * paso;
  const escalaX = (hh) => margen.left + (hh / 24) * anchoUtil;
  const escalaY = (v) => margen.top + altoUtil - (v / maxV) * altoUtil;

  const svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: h });

  /* Cuadrícula y eje Y (kW) */
  const pasosY = 4;
  for (let i = 0; i <= pasosY; i += 1) {
    const valor = (maxV / pasosY) * i;
    const y = escalaY(valor);
    svg.appendChild(svgEl('line', {
      x1: margen.left, y1: y, x2: w - margen.right, y2: y,
      stroke: 'var(--pdf-line)', 'stroke-width': 1
    }));
    svg.appendChild(svgEl('text', {
      x: margen.left - 8, y: y + 4, 'font-size': 11, fill: 'var(--pdf-gray)', 'text-anchor': 'end'
    })).textContent = formatoNumero(valor, valor < 10 ? 1 : 0);
  }
  svg.appendChild(svgEl('text', {
    x: 4, y: margen.top - 2, 'font-size': 10, fill: 'var(--pdf-gray)', 'text-anchor': 'start',
    'font-weight': 700
  })).textContent = 'kW';
  svg.appendChild(svgEl('line', {
    x1: margen.left, y1: margen.top, x2: margen.left, y2: h - margen.bottom,
    stroke: 'var(--pdf-line)', 'stroke-width': 1
  }));
  svg.appendChild(svgEl('line', {
    x1: margen.left, y1: h - margen.bottom, x2: w - margen.right, y2: h - margen.bottom,
    stroke: 'var(--pdf-line)', 'stroke-width': 1
  }));

  const yBase = h - margen.bottom;
  const coordsGen = puntosGen.map((p) => escalaX(p[0]) + ',' + escalaY(p[1]));
  const coordsCon = puntosCon.map((p) => escalaX(p[0]) + ',' + escalaY(p[1]));

  // Área de autoconsumo = min(generación, consumo) punto a punto; excedente = generación por encima del consumo.
  const coordsAuto = puntosGen.map((p, i) => escalaX(p[0]) + ',' + escalaY(Math.min(p[1], puntosCon[i][1])));
  svg.appendChild(svgEl('polygon', {
    points: coordsAuto.join(' ') + ' ' + escalaX(24) + ',' + yBase + ' ' + escalaX(0) + ',' + yBase,
    fill: 'var(--pdf-navy)', opacity: 0.18
  }));
  const coordsExc = puntosGen.map((p, i) => escalaX(p[0]) + ',' + escalaY(Math.max(p[1], puntosCon[i][1])));
  svg.appendChild(svgEl('polygon', {
    points: coordsGen.join(' ') + ' ' + coordsExc.slice().reverse().join(' '),
    fill: 'var(--pdf-orange)', opacity: 0.22
  }));
  svg.appendChild(svgEl('polygon', {
    points: coordsCon.join(' ') + ' ' + escalaX(24) + ',' + yBase + ' ' + escalaX(0) + ',' + yBase,
    fill: 'var(--pdf-gray)', opacity: 0.08
  }));
  svg.appendChild(svgEl('polyline', {
    points: coordsGen.join(' '), fill: 'none', stroke: 'var(--pdf-orange)',
    'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }));
  svg.appendChild(svgEl('polyline', {
    points: coordsCon.join(' '), fill: 'none', stroke: 'var(--pdf-navy)',
    'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }));

  /* Eje X (hora del día) */
  [0, 6, 12, 18, 24].forEach((hh) => {
    const x = escalaX(hh);
    svg.appendChild(svgEl('line', {
      x1: x, y1: yBase, x2: x, y2: yBase + 4, stroke: 'var(--pdf-gray)', 'stroke-width': 1
    }));
    svg.appendChild(svgEl('text', {
      x: x, y: yBase + 18, 'font-size': 11, fill: 'var(--pdf-gray)',
      'text-anchor': hh === 24 ? 'end' : (hh === 0 ? 'start' : 'middle')
    })).textContent = formatoNumero(hh, 0) + ':00';
  });
  svg.appendChild(svgEl('text', {
    x: w - margen.right, y: h - 2, 'font-size': 10, fill: 'var(--pdf-gray)', 'text-anchor': 'end',
    'font-weight': 700
  })).textContent = 'Hora del día';

  return svg;
};

/**
 * Rellena la hoja imprimible (#hojaPdf) con el diseño Zolaris 2026.
 * @param {Object} r resultado de calcularCotizacion.
 * @param {string} [codigo]
 * @param {string} [fechaISO]
 * @param {string} [imagen] imagen del proyecto (data URL); si falta, se usa la foto por defecto.
 */
const prepararHojaPdf = (r, codigo, fechaISO, imagen) => {
  const hoja = document.getElementById('hojaPdf');
  vaciar(hoja);

  const e = r.entrada;
  const c = r.costos;
  const f = r.financiero;
  const p = r.parametros;
  const fecha = formatoFecha(fechaISO || new Date().toISOString());
  const cli = e.nombre;
  const M = (cop) => '$' + formatoNumero(cop / 1e6, 2) + 'M';
  const M0 = (cop) => '$' + formatoNumero(cop / 1e6, 0) + 'M';

  const pagina = crear('div', { clase: 'pdf-page' });

  /* ---------- HERO ---------- */
  const hero = crear('div', { clase: 'pdf-hero' });
  hero.style.backgroundImage = 'url("' + (imagen || (REC + 'portada-default.jpg')) + '")';
  const heroTop = crear('div', { clase: 'pdf-hero-top' });
  heroTop.appendChild(imgRec('logo-blanco.png'));
  const heroMeta = crear('div', { clase: 'pdf-hero-meta' });
  if (codigo) {
    heroMeta.appendChild(crear('div', { clase: 'pdf-ref-tag', texto: codigo }));
  }
  ['Medellín, Antioquia', fecha, EMPRESA.correo, EMPRESA.telefono].forEach((linea) => {
    heroMeta.appendChild(crear('div', { texto: linea }));
  });
  heroTop.appendChild(heroMeta);
  hero.appendChild(heroTop);

  const heroBody = crear('div', { clase: 'pdf-hero-body' });
  const heroCard = crear('div', { clase: 'pdf-hero-card' });
  heroCard.appendChild(crear('span', { clase: 'pdf-eyebrow', texto: 'Propuesta comercial · Energía solar inteligente' }));
  heroCard.appendChild(crear('h1', { clase: 'pdf-hero-title', texto: 'Energía Solar Inteligente para ' + cli }));
  const headline = crear('div', { clase: 'pdf-hero-headline' });
  headline.appendChild(crear('div', { clase: 'num', texto: M(f.ahorroAnual) }));
  headline.appendChild(crear('div', { clase: 'lbl', texto: 'de ahorro proyectado cada año — desde el primer día de operación.' }));
  heroCard.appendChild(headline);
  const heroChips = crear('div', { clase: 'pdf-hero-chips' });
  [
    [formatoNumero(r.potenciaKWp, 1) + ' kWp', 'Potencia instalada'],
    [formatoNumero(r.numPaneles), 'Paneles'],
    [formatoNumero(f.paybackCompra) + ' años', 'Retorno estimado']
  ].forEach(([valor, etq]) => {
    const chip = crear('div', { clase: 'pdf-chip' });
    chip.appendChild(crear('b', { texto: valor }));
    chip.appendChild(crear('span', { texto: etq }));
    heroChips.appendChild(chip);
  });
  heroCard.appendChild(heroChips);
  heroBody.appendChild(heroCard);
  hero.appendChild(heroBody);
  pagina.appendChild(hero);

  const contenido = crear('div', { clase: 'pdf-content' });

  /* ---------- 01 · Experiencia Zolaris (portafolio, primero) ---------- */
  const s0 = pdfSeccion('01', 'Experiencia Zolaris', 'Proyectos reales, ya instalados y en operación', false);
  s0.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'Antes de hablar de tu proyecto, esto es lo que ya hemos construido — la misma ingeniería y el mismo equipo detrás de más de 45 sistemas solares en Colombia.'
  }));
  const statsExp = crear('div', { clase: 'pdf-stat-grid' });
  [
    ['🏗️', '+45', 'Proyectos instalados'],
    ['⚡', '+500 kWp', 'Capacidad acumulada'],
    ['🏆', '125 kW', 'Proyecto más grande (sur de Colombia)']
  ].forEach(([ico, v, l]) => {
    const sc = crear('div', { clase: 'pdf-stat-card' });
    sc.appendChild(crear('div', { clase: 'ico', texto: ico }));
    sc.appendChild(crear('div', { clase: 'val', texto: v }));
    sc.appendChild(crear('div', { clase: 'lbl', texto: l }));
    statsExp.appendChild(sc);
  });
  s0.appendChild(statsExp);
  const portfolioGrid = crear('div', { clase: 'pdf-portfolio-grid' });
  for (let i = 1; i <= 15; i += 1) {
    const card = crear('div', { clase: 'pcard' });
    card.appendChild(imgRec('gal' + i + '.jpg'));
    card.appendChild(crear('div', { clase: 'lbl', texto: TEXTOS_PDF.galeria[i - 1] }));
    portfolioGrid.appendChild(card);
  }
  s0.appendChild(portfolioGrid);
  contenido.appendChild(s0);

  /* ---------- 02 · El impacto en tu factura ---------- */
  const s2 = pdfSeccion('02', 'El impacto en tu factura', 'La diferencia se ve en pocos años, no en 25', false);
  s2.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'Cada año que pasa sin energía solar, tu factura sube. Con Zolaris, pagas una vez y el gasto se detiene — la comparación acumulada lo dice todo.'
  }));
  const chartCard1 = crear('div', { clase: 'pdf-card' });
  chartCard1.appendChild(crear('div', { clase: 'pdf-card-n', texto: 'GASTO ACUMULADO EN ENERGÍA — 10 AÑOS' }));
  const { svg: svgComp, anioCruce } = graficoComparacion(f.ahorroAnual, c.total, p.incrementoTarifa);
  chartCard1.appendChild(svgComp);
  const legend1 = crear('div', { clase: 'pdf-support-chips' });
  const sc1 = crear('div', { clase: 'sc' });
  sc1.appendChild(crear('b', { texto: 'Sin Zolaris', atributos: {} }));
  sc1.querySelector('b').style.color = 'var(--pdf-bad)';
  sc1.appendChild(crear('span', { texto: 'Factura creciendo ' + formatoPorcentaje(p.incrementoTarifa) + '/año' }));
  const sc2 = crear('div', { clase: 'sc' });
  const bCon = crear('b', { texto: 'Con Zolaris' });
  bCon.style.color = 'var(--pdf-orange)';
  sc2.appendChild(bCon);
  sc2.appendChild(crear('span', {
    texto: anioCruce !== null
      ? 'Punto de equilibrio ≈ año ' + formatoNumero(anioCruce, 1)
      : 'Inversión única, sin factura después'
  }));
  legend1.appendChild(sc1);
  legend1.appendChild(sc2);
  chartCard1.appendChild(legend1);
  s2.appendChild(chartCard1);
  contenido.appendChild(s2);

  /* ---------- 03 · Antes y después (mockup de factura) ---------- */
  const s3 = pdfSeccion('03', 'Antes y después', 'La misma factura que conoces — con un número distinto', false);
  s3.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'Simulación ilustrativa de tu recibo de energía, con y sin sistema solar, usando tus propios datos de consumo.'
  }));
  const compare = crear('div', { clase: 'pdf-compare2' });
  const antes = crear('div', { clase: 'pdf-paycard' });
  antes.appendChild(crear('h3', { texto: 'Factura de energía · Antes' }));
  [['Consumo del período', formatoNumero(e.consumo) + ' kWh'], ['Tarifa', '$' + formatoNumero(e.precioKwh) + '/kWh']]
    .forEach(([k, v]) => {
      const row = crear('div', { clase: 'row' });
      row.appendChild(crear('span', { texto: k }));
      row.appendChild(crear('b', { texto: v }));
      antes.appendChild(row);
    });
  const rowTotalAntes = crear('div', { clase: 'row hi-row' });
  rowTotalAntes.appendChild(crear('span', { texto: 'Valor a pagar' }));
  // Factura real sin solar: consumo × tarifa. No debe incluir ingresoMensual (venta de
  // excedentes) — ese ingreso solo existe si ya tienes el sistema instalado.
  const bTotalAntes = crear('b', { texto: formatoMoneda(e.consumo * e.precioKwh) });
  bTotalAntes.style.color = 'var(--pdf-bad)';
  rowTotalAntes.appendChild(bTotalAntes);
  antes.appendChild(rowTotalAntes);

  const consumoNoSuplido = Math.max(0, e.consumo - r.produccionMensual);
  const valorNoSuplido = consumoNoSuplido * e.precioKwh;

  const despues = crear('div', { clase: 'pdf-paycard hi' });
  despues.appendChild(crear('h3', { texto: 'Factura de energía · Con Zolaris' }));
  [['Consumo del período', formatoNumero(e.consumo) + ' kWh'], ['Cubierto por tu sistema solar', formatoPorcentaje(r.coberturaFacturaPct, 0)]]
    .forEach(([k, v]) => {
      const row = crear('div', { clase: 'row' });
      row.appendChild(crear('span', { texto: k }));
      row.appendChild(crear('b', { texto: v }));
      despues.appendChild(row);
    });
  if (consumoNoSuplido > 0) {
    const rowResto = crear('div', { clase: 'row' });
    rowResto.appendChild(crear('span', { texto: 'Consumo tomado de la red' }));
    rowResto.appendChild(crear('b', { texto: formatoNumero(consumoNoSuplido, 0) + ' kWh' }));
    despues.appendChild(rowResto);
  }
  const rowTotalDespues = crear('div', { clase: 'row hi-row' });
  rowTotalDespues.appendChild(crear('span', { texto: 'Valor a pagar' }));
  rowTotalDespues.appendChild(crear('b', { texto: valorNoSuplido > 0 ? formatoMoneda(valorNoSuplido) : '$0' }));
  despues.appendChild(rowTotalDespues);

  compare.appendChild(antes);
  compare.appendChild(despues);
  s3.appendChild(compare);
  s3.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'Simulación ilustrativa — el valor real puede variar según excedentes y cargos fijos del operador de red.',
    atributos: { style: 'text-align:center; margin-top:1.6rem; font-size:1.25rem;' }
  }));
  contenido.appendChild(s3);

  /* ---------- 04 · Tu sistema en números ---------- */
  const s4 = pdfSeccion('04', 'Tu sistema, en números', 'Dimensionado exactamente para tu consumo', false);
  const gridSistema = crear('div', { clase: 'pdf-stat-grid' });
  [
    ['⚡', formatoNumero(r.potenciaKWp, 1) + ' kWp', 'Potencia instalada'],
    ['🔆', formatoNumero(r.numPaneles), 'Paneles ZN Shine 730 Wp'],
    ['📐', formatoNumero(r.areaSistema, 1) + ' m²', 'Área del sistema']
  ].forEach(([ico, v, l]) => {
    const card = crear('div', { clase: 'pdf-stat-card' });
    card.appendChild(crear('div', { clase: 'ico', texto: ico }));
    card.appendChild(crear('div', { clase: 'val', texto: v }));
    card.appendChild(crear('div', { clase: 'lbl', texto: l }));
    gridSistema.appendChild(card);
  });
  s4.appendChild(gridSistema);
  const notaGarantia = crear('div', { clase: 'pdf-box' });
  notaGarantia.appendChild(crear('p', {
    atributos: { style: 'text-align:left; margin:0; font-size:1.32rem; color:var(--pdf-gray);' },
    texto: '🛡️ 12 años de garantía de fábrica en paneles e inversores, más 1 año de garantía de instalación — y el primer año de mantenimiento va por cuenta de Zolaris, sin costo.'
  }));
  s4.appendChild(notaGarantia);
  contenido.appendChild(s4);

  /* ---------- 06 · Cómo se reparte tu energía ---------- */
  const s45 = pdfSeccion('05', 'Cómo se reparte tu energía', '¿Qué pasa con cada kWh que produces?', false);
  const produccionMensual = r.produccionMensual;
  const consumoMensual = e.consumo;
  const autoconsumo = Math.min(produccionMensual, consumoMensual);
  const excedenteMensual = Math.max(0, produccionMensual - consumoMensual);
  const deficitMensual = Math.max(0, consumoMensual - produccionMensual);
  s45.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: excedenteMensual > 0
      ? 'Tu sistema está dimensionado para generar más de lo que consumes hoy — el excedente no se pierde, se vende a la red.'
      : 'Tu sistema cubre ' + formatoPorcentaje(r.coberturaFacturaPct, 0) + ' de tu consumo — el resto lo sigues tomando de la red normalmente, sin quedarte sin energía.'
  }));

  const donutGrid = crear('div', { clase: 'pdf-donut-grid' });
  const coberturaPct = Math.round((produccionMensual / consumoMensual) * 100);
  donutGrid.appendChild(pdfDonutCard(
    '☀️', 'Generación de energía', 'Uso de la energía que produces',
    excedenteMensual > 0
      ? [
        { etiqueta: 'Autoconsumo', valor: autoconsumo, color: 'var(--pdf-navy)' },
        { etiqueta: 'Excedente — se vende a la red', valor: excedenteMensual, color: 'var(--pdf-orange)' }
      ]
      : [{ etiqueta: 'Autoconsumo', valor: autoconsumo, color: 'var(--pdf-navy)' }],
    formatoPorcentaje(coberturaPct, 0), 'cobertura solar de tu consumo',
    formatoNumero(produccionMensual, 0) + ' kWh/mes', 'Energía total generada'
  ));
  donutGrid.appendChild(pdfDonutCard(
    '🔌', 'Consumo de energía', 'Fuente de la energía que consumes',
    deficitMensual > 0
      ? [
        { etiqueta: 'Desde tu sistema solar', valor: autoconsumo, color: 'var(--pdf-orange)' },
        { etiqueta: 'Desde la red', valor: deficitMensual, color: 'var(--pdf-gray)' }
      ]
      : [{ etiqueta: 'Desde tu sistema solar', valor: autoconsumo, color: 'var(--pdf-orange)' }],
    deficitMensual > 0 ? formatoPorcentaje(Math.round((autoconsumo / consumoMensual) * 100), 0) : '100%',
    'de tu consumo cubierto',
    formatoNumero(consumoMensual, 0) + ' kWh/mes', 'Consumo total'
  ));
  s45.appendChild(donutGrid);

  if (excedenteMensual > 0) {
    const boxExc = crear('div', { clase: 'pdf-box warn' });
    boxExc.appendChild(crear('span', { clase: 'tag', texto: 'Ingreso adicional' }));
    boxExc.appendChild(crear('p', {
      texto: 'Ese excedente (' + formatoNumero(excedenteMensual, 0) + ' kWh/mes) se vende a la red a aproximadamente la mitad de tu tarifa actual, generando ' + formatoMoneda(f.ingresoMensual) + ' adicionales cada mes — ya incluidos en tu ahorro anual.'
    }));
    s45.appendChild(boxExc);
  } else {
    const boxDef = crear('div', { clase: 'pdf-box' });
    boxDef.appendChild(crear('p', {
      atributos: { style: 'text-align:left; margin:0; font-size:1.35rem; color:var(--pdf-gray);' },
      texto: 'Este escenario prioriza un sistema más compacto en vez de generar excedentes. Si prefieres cubrir el 100% (o más) de tu consumo y empezar a vender excedentes, ajusta el "Porcentaje a suplir" del formulario.'
    }));
    s45.appendChild(boxDef);
  }
  contenido.appendChild(s45);

  /* ---------- 09 · Tu día típico ---------- */
  const sDia = pdfSeccion('06', 'Tu día típico', 'Así se comportan generación y consumo en un día promedio', false);
  sDia.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'El sol no reparte energía parejo durante el día — sube desde el amanecer, llega a su punto más alto al mediodía y baja hasta el atardecer. Así se cruza esa curva real de generación con tu consumo.'
  }));
  const diaCard = crear('div', { clase: 'pdf-card' });
  diaCard.appendChild(crear('div', { clase: 'pdf-card-n', texto: 'GENERACIÓN VS. CONSUMO — DÍA PROMEDIO (kW)' }));
  const consumoPromedioHora = (consumoMensual * 12) / 365 / 24;
  diaCard.appendChild(graficoCurvaDiaria(r.potenciaKWp, consumoPromedioHora));
  const legendDia = crear('div', { clase: 'pdf-daily-legend' });
  [
    ['var(--pdf-orange)', 'Generación solar'],
    ['var(--pdf-navy)', 'Consumo típico'],
    ['rgba(27,58,92,0.35)', 'Autoconsumo directo'],
    ['rgba(245,130,31,0.4)', 'Excedente (mediodía)']
  ].forEach(([color, texto]) => {
    const span = crear('span', {});
    const i = crear('i');
    i.style.background = color;
    span.appendChild(i);
    span.appendChild(document.createTextNode(texto));
    legendDia.appendChild(span);
  });
  diaCard.appendChild(legendDia);
  sDia.appendChild(diaCard);
  sDia.appendChild(crear('p', {
    atributos: { style: 'text-align:left; margin-top:1.2rem; font-size:1.2rem; color:var(--pdf-gray);' },
    texto: 'Generación calculada con la potencia real instalada de tu sistema (' + formatoNumero(r.potenciaKWp, 1) + ' kWp) sobre el comportamiento de la irradiancia solar en un día despejado, con la variabilidad típica de nubosidad. El consumo parte de tu promedio horario real (tu consumo mensual repartido entre días y horas) distribuido con un perfil de uso típico — más bajo de madrugada, más alto en la noche — ya que la factura no registra el detalle hora a hora. El total del día sí corresponde a tu consumo real.'
  }));
  contenido.appendChild(sDia);

  /* ---------- 08 · Cuánto ahorras ---------- */
  const s5 = pdfSeccion('07', 'Cuánto ahorras', 'Una cifra que lo resume todo', true, 'fondo3.jpg');
  s5.style.breakBefore = 'page';
  s5.style.pageBreakBefore = 'always';
  const headlineAhorro = crear('div', { clase: 'pdf-headline-number' });
  const numAhorro = crear('div', { clase: 'num' });
  numAhorro.appendChild(document.createTextNode(M(f.ahorroAnual).replace('M', '')));
  numAhorro.appendChild(crear('span', { clase: 'unit', texto: 'M / año' }));
  headlineAhorro.appendChild(numAhorro);
  headlineAhorro.appendChild(crear('div', {
    clase: 'desc',
    texto: 'Ahorro proyectado, cubriendo el ' + formatoPorcentaje(r.coberturaFacturaPct, 0) + ' de tu factura anual desde el primer año de operación.'
  }));
  s5.appendChild(headlineAhorro);
  const chipsAhorro = crear('div', { clase: 'pdf-support-chips' });
  [
    [formatoNumero(f.paybackCompra) + ' años', 'Retorno de inversión'],
    [formatoPorcentaje(f.tirCompra * 100, 1), 'Tasa interna de retorno'],
    [M0(f.beneficioTributario), 'Beneficios tributarios'],
    [formatoNumero(r.co2Anual, 0) + ' kg', 'CO₂ evitado/año']
  ].forEach(([v, l]) => {
    const sc = crear('div', { clase: 'sc' });
    sc.appendChild(crear('b', { texto: v }));
    sc.appendChild(crear('span', { texto: l }));
    chipsAhorro.appendChild(sc);
  });
  s5.appendChild(chipsAhorro);
  contenido.appendChild(s5);

  /* ---------- 06 · Tecnología ---------- */
  const s6 = pdfSeccion('08', 'Tecnología que puedes confiar', 'Todo lo que incluye tu sistema, en detalle', false);
  const checklistTec = crear('div', { clase: 'pdf-checklist' });
  const itemsTecnologia = [
    ['☀️', 'Panel solar monocristalino ZN SHINE 730 Wp', '× ' + formatoNumero(r.numPaneles)],
    ['⚡', 'Inversor(es) de string — ' + r.inversor.mppt + ' MPPT, ' + formatoNumero(r.inversor.potencia, 1) + ' kW instalados', '× ' + formatoNumero(r.inversor.unidades)]
  ];
  if (r.entrada.incluirBateria) {
    itemsTecnologia.push([
      '🔋',
      'Respaldo de energía — batería de litio (LiFePO4) de ' + formatoNumero(r.entrada.capacidadBateria, 1) + ' kWh, compatible con tu inversor · incluida sin costo adicional',
      ''
    ]);
  }
  itemsTecnologia.push(
    ['🔧', 'Estructura fija en aluminio — anclaje certificado, adaptado a tu tipo de techo', ''],
    ['📡', 'Sistema de monitoreo remoto — producción en tiempo real desde app o PC', ''],
    ['🔌', 'Medidor bifásico bidireccional — trámite ante el operador de red (CREG 174) incluido', ''],
    ['🧵', 'Cableado solar, tablero de protecciones DC/AC y accesorios de instalación', ''],
    ['👷', 'Ingeniería, instalación y puesta en marcha — equipo certificado RETIE', ''],
    ['🌱', 'Equivale a ' + formatoNumero(r.arbolesAnual, 0) + ' árboles en CO₂ evitado cada año', '']
  );
  itemsTecnologia.forEach(([ico, txt, qty]) => {
    const row = crear('div', { clase: 'item' });
    row.appendChild(crear('div', { clase: 'ico', texto: ico }));
    const txtWrap = crear('div', { clase: 'txt' });
    txtWrap.appendChild(document.createTextNode(txt + (qty ? ' ' : '')));
    if (qty) { txtWrap.appendChild(crear('span', { clase: 'qty', texto: qty })); }
    row.appendChild(txtWrap);
    checklistTec.appendChild(row);
  });
  s6.appendChild(checklistTec);
  const marcasRow = crear('div', { clase: 'pdf-brand-row' });
  for (let i = 1; i <= 6; i += 1) { marcasRow.appendChild(imgRec('marca' + i + '.png')); }
  s6.appendChild(marcasRow);
  contenido.appendChild(s6);

  /* ---------- 07 · Cómo lo pagas ---------- */
  const s7 = pdfSeccion('09', 'Cómo lo pagas', 'Compra directa o leasing — tú eliges', false);
  const pagoGrid = crear('div', { clase: 'pdf-compare2' });
  const compraCard = crear('div', { clase: 'pdf-paycard' });
  compraCard.appendChild(crear('h3', { texto: 'Compra directa' }));
  [
    ['Costo total', formatoMoneda(c.total)],
    ['TIR', formatoPorcentaje(f.tirCompra * 100, 1)]
  ].forEach(([k, v]) => {
    const row = crear('div', { clase: 'row' });
    row.appendChild(crear('span', { texto: k }));
    row.appendChild(crear('b', { texto: v }));
    compraCard.appendChild(row);
  });
  const rowRetorno = crear('div', { clase: 'row hi-row' });
  rowRetorno.appendChild(crear('span', { texto: 'Retorno' }));
  rowRetorno.appendChild(crear('b', { texto: formatoNumero(f.paybackCompra) + ' años' }));
  compraCard.appendChild(rowRetorno);

  const leasingCard = crear('div', { clase: 'pdf-paycard hi' });
  leasingCard.appendChild(crear('h3', { texto: 'Leasing Zolaris' }));
  [
    ['Pago inicial', formatoMoneda(f.pagoInicial)],
    ['Plazo', formatoNumero(p.plazoLeasingAnios, 1) + ' años']
  ].forEach(([k, v]) => {
    const row = crear('div', { clase: 'row' });
    row.appendChild(crear('span', { texto: k }));
    row.appendChild(crear('b', { texto: v }));
    leasingCard.appendChild(row);
  });
  const rowCuota = crear('div', { clase: 'row hi-row' });
  rowCuota.appendChild(crear('span', { texto: 'Cuota mensual' }));
  rowCuota.appendChild(crear('b', { texto: formatoMoneda(f.cuotaMensualLeasing) }));
  leasingCard.appendChild(rowCuota);

  pagoGrid.appendChild(compraCard);
  pagoGrid.appendChild(leasingCard);
  s7.appendChild(pagoGrid);
  contenido.appendChild(s7);

  /* ---------- 08 · Leasing en el tiempo ---------- */
  const s8 = pdfSeccion('10', 'Leasing en el tiempo', 'El sol trabaja para ti, incluso mientras pagas tu cuota', false);
  const chartCard2 = crear('div', { clase: 'pdf-card' });
  chartCard2.appendChild(crear('div', { clase: 'pdf-card-n', texto: 'FLUJO ACUMULADO — PRIMEROS 10 AÑOS' }));
  chartCard2.appendChild(graficoFlujoLeasing(f.flujoLeasing, p.plazoLeasingAnios));
  s8.appendChild(chartCard2);
  const filasLeasing = f.flujoLeasing.slice(0, 5).map((fl) => ({
    celdas: [
      String(fl.anio),
      fl.cuota === 0 ? '$0' : '-' + M(Math.abs(fl.cuota) * 1e6),
      M(fl.ahorro * 1e6),
      M(fl.flujoNeto * 1e6)
    ]
  }));
  s8.appendChild(pdfTabla(['Año', 'Cuota', 'Ahorro en energía', 'Flujo neto'], filasLeasing));
  contenido.appendChild(s8);

  /* ---------- 09 · Impacto ambiental ---------- */
  const sAmb = pdfSeccion('11', 'Impacto ambiental', 'Tu huella positiva en el planeta', true);
  sAmb.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'Cada kWh solar que generas evita emisiones que tu factura eléctrica normalmente traería consigo.'
  }));
  const impactGrid = crear('div', { clase: 'pdf-impact-grid' });
  [
    ['☁️', formatoNumero(r.co2Anual / 1000, 2) + ' ton', 'CO₂ evitado / año'],
    ['🚗', formatoNumero(r.kmEvitadosAnual, 0) + ' km', 'km evitados / año'],
    ['🌱', formatoNumero(r.numPaneles, 0), 'árboles nativos sembrados']
  ].forEach(([ico, val, lbl]) => {
    const card = crear('div', { clase: 'pdf-impact-card' });
    card.appendChild(crear('div', { clase: 'ico', texto: ico }));
    card.appendChild(crear('div', { clase: 'val', texto: val }));
    card.appendChild(crear('div', { clase: 'lbl', texto: lbl }));
    impactGrid.appendChild(card);
  });
  sAmb.appendChild(impactGrid);
  const notaImpacto = crear('div', { clase: 'pdf-impact-note' });
  notaImpacto.appendChild(document.createTextNode('Con la compra de tu sistema se siembran '));
  notaImpacto.appendChild(crear('b', { texto: formatoNumero(r.numPaneles, 0) + ' árboles nativos' }));
  notaImpacto.appendChild(document.createTextNode(' asociados a tu proyecto — recibes el certificado a tu nombre.'));
  sAmb.appendChild(notaImpacto);
  contenido.appendChild(sAmb);

  /* ---------- 10 · Lo que incluye ---------- */
  const s9 = pdfSeccion('12', 'Lo que incluye tu sistema solar', 'Seguridad, respaldo y cumplimiento normativo', false);
  const incluyeGrid = crear('div', { clase: 'pdf-grid3' });
  TEXTOS_PDF.incluye.forEach((bloque) => {
    const card = crear('div', { clase: 'pdf-card' });
    card.appendChild(crear('h4', { texto: bloque.titulo }));
    const ul = crear('ul', { atributos: { style: 'margin:0.6rem 0 0; padding-left:1.6rem;' } });
    bloque.puntos.forEach((pt) => ul.appendChild(crear('li', { texto: pt, atributos: { style: 'font-size:1.3rem; color:var(--pdf-gray); margin-bottom:0.4rem;' } })));
    card.appendChild(ul);
    incluyeGrid.appendChild(card);
  });
  s9.appendChild(incluyeGrid);
  const pagoBox = crear('div', { clase: 'pdf-card' });
  pagoBox.appendChild(crear('div', { clase: 'pdf-card-n', texto: 'FORMA DE PAGO' }));
  const paySteps = crear('div', { clase: 'pdf-pay-steps' });
  EMPRESA.formaPago.forEach((paso, i) => {
    const ps = crear('div', { clase: 'ps' + (i === 0 ? ' hi' : '') });
    ps.appendChild(crear('div', { clase: 'dot', texto: paso.pct }));
    ps.appendChild(crear('div', { clase: 'lbl', texto: paso.label }));
    paySteps.appendChild(ps);
  });
  pagoBox.appendChild(paySteps);
  const payNote = crear('div', { clase: 'pdf-pay-note' });
  payNote.appendChild(document.createTextNode('⏱ Tiempo de entrega: '));
  payNote.appendChild(crear('b', { texto: EMPRESA.tiempoEntrega }));
  pagoBox.appendChild(payNote);
  s9.appendChild(pagoBox);
  contenido.appendChild(s9);

  /* ---------- 11 · Por qué decidir ahora (comparte fondo con el cierre) ---------- */
  const s10 = pdfSeccion('13', 'Por qué decidir ahora', 'Cada mes de espera tiene un precio', true, 'fondo8.jpg');
  s10.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'No es una cifra hipotética — es tu propio ahorro anual, dividido en el tiempo que tardes en decidir.'
  }));
  const ahorroMes = f.ahorroAnual / 12;
  const headlineMes = crear('div', { clase: 'pdf-headline-number' });
  const numMes = crear('div', { clase: 'num' });
  numMes.appendChild(document.createTextNode(M(ahorroMes).replace('M', '')));
  numMes.appendChild(crear('span', { clase: 'unit', texto: 'M / mes' }));
  headlineMes.appendChild(numMes);
  headlineMes.appendChild(crear('div', {
    clase: 'desc',
    texto: 'Es lo que dejas de ahorrar por cada mes que la instalación no ha comenzado.'
  }));
  s10.appendChild(headlineMes);
  const chipsEspera = crear('div', { clase: 'pdf-support-chips' });
  [3, 6, 12].forEach((meses) => {
    const sc = crear('div', { clase: 'sc' });
    const b = crear('b', { texto: M0(ahorroMes * meses) });
    if (meses === 12) { b.style.color = 'var(--pdf-orange)'; }
    sc.appendChild(b);
    sc.appendChild(crear('span', { texto: 'Perdidos en ' + meses + ' meses de espera' }));
    chipsEspera.appendChild(sc);
  });
  s10.appendChild(chipsEspera);

  /* ---------- Cierre (mismo bloque y fondo que "Por qué decidir ahora") ---------- */
  const cta = crear('div', { clase: 'pdf-cta-box' });
  cta.appendChild(crear('h2', { texto: 'Avancemos con tu proyecto, ' + cli }));
  cta.appendChild(crear('p', { texto: 'Esta propuesta tiene una vigencia de 30 días calendario a partir de su fecha de emisión.' }));
  const pasos = crear('div', { clase: 'pdf-cta-steps' });
  [
    ['PASO 1', 'Confirmas la modalidad (compra o leasing)'],
    ['PASO 2', 'Firmas y realizas el anticipo'],
    ['PASO 3', 'Instalamos en ' + EMPRESA.tiempoEntrega.split('.')[0]]
  ].forEach(([n, t]) => {
    const st = crear('div', { clase: 'st' });
    st.appendChild(crear('div', { clase: 'n', texto: n }));
    st.appendChild(crear('div', { clase: 't', texto: t }));
    pasos.appendChild(st);
  });
  cta.appendChild(pasos);
  const firmas = crear('div', { clase: 'pdf-sign-grid' });
  const firmaCliente = crear('div', { clase: 'pdf-sign-line' });
  firmaCliente.appendChild(crear('strong', { texto: cli }));
  firmaCliente.appendChild(document.createTextNode('Cliente'));
  const firmaZolaris = crear('div', { clase: 'pdf-sign-line' });
  firmaZolaris.appendChild(crear('strong', { texto: EMPRESA.gerente }));
  firmaZolaris.appendChild(document.createTextNode(EMPRESA.cargoGerente + ' · Zolaris S.A.S.'));
  firmas.appendChild(firmaCliente);
  firmas.appendChild(firmaZolaris);
  cta.appendChild(firmas);
  s10.appendChild(cta);
  contenido.appendChild(s10);

  pagina.appendChild(contenido);

  const footer = crear('div', { clase: 'pdf-footer' });
  footer.appendChild(crear('div', { texto: EMPRESA.razonSocial + ' · ' + EMPRESA.correo + ' · ' + EMPRESA.telefono }));
  pagina.appendChild(footer);

  const marca = crear('div', { clase: 'pdf-watermark' });
  marca.appendChild(imgRec('logo-blanco.png'));
  const marcaDatos = crear('div', { clase: 'datos' });
  marcaDatos.appendChild(crear('span', { texto: EMPRESA.telefono }));
  marcaDatos.appendChild(crear('span', { texto: EMPRESA.instagram }));
  marca.appendChild(marcaDatos);
  hoja.appendChild(marca);

  hoja.appendChild(pagina);
};
