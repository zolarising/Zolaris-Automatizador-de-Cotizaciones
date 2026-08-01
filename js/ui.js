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
  if (!Number.isFinite(porcentaje) || porcentaje <= 0 || porcentaje > 100) {
    marcarError(formulario, 'porcentaje', 'El porcentaje debe estar entre 1 y 100.');
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
  return { nombre, ciudad, tipoTecho, consumo, porcentaje, precioKwh, descuento, parametros };
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

/** Crea una sección de la hoja PDF, clara u oscura. */
const pdfSeccion = (numero, eyebrow, titulo, oscura) => {
  const sec = crear('section', { clase: 'pdf-section' + (oscura ? ' pdf-dark' : '') });
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
  const h = 220;
  const incr = incrementoPct / 100;
  const puntos = [[0, 0]];
  let acum = 0;
  for (let anio = 1; anio <= 10; anio += 1) {
    acum += ahorroAnual * Math.pow(1 + incr, anio - 1);
    puntos.push([anio, acum]);
  }
  const maxV = Math.max(puntos[puntos.length - 1][1], costoTotal) || 1;
  const escalaX = (anio) => (anio / 10) * w;
  const escalaY = (valor) => h - (valor / maxV) * h;

  const svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: 220 });
  svg.appendChild(svgEl('line', {
    x1: 0, y1: h, x2: w, y2: h, stroke: 'var(--pdf-line)', 'stroke-width': 1
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
 * Gráfica de área "flujo acumulado" del leasing, primeros 10 años.
 * @param {Array} flujoLeasing salida de calcularCotizacion (financiero.flujoLeasing), en millones COP.
 * @returns {SVGElement}
 */
const graficoFlujoLeasing = (flujoLeasing) => {
  const w = 640;
  const h = 220;
  const primeros10 = flujoLeasing.slice(0, 10);
  const maxV = Math.max.apply(null, primeros10.map((f) => f.acumulado)) || 1;
  const puntos = [[0, 0]].concat(primeros10.map((f) => [f.anio, Math.max(0, f.acumulado)]));
  const escalaX = (anio) => (anio / 10) * w;
  const escalaY = (valor) => h - (valor / maxV) * h;
  const coords = puntos.map((p) => escalaX(p[0]) + ',' + escalaY(p[1]));

  const svg = svgEl('svg', { viewBox: '0 0 ' + w + ' ' + h, width: '100%', height: 220 });
  const poligono = svgEl('polygon', {
    points: coords.join(' ') + ' ' + w + ',' + h + ' 0,' + h,
    fill: 'var(--pdf-orange)', opacity: 0.15
  });
  svg.appendChild(poligono);
  svg.appendChild(svgEl('polyline', {
    points: coords.join(' '), fill: 'none', stroke: 'var(--pdf-orange)',
    'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
  }));
  const ultimo = puntos[puntos.length - 1];
  svg.appendChild(svgEl('circle', {
    cx: escalaX(ultimo[0]), cy: escalaY(ultimo[1]), r: 5, fill: 'var(--pdf-navy)'
  }));
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
  ['Medellín, Antioquia', fecha, EMPRESA.correo, EMPRESA.telefono].forEach((linea) => {
    heroMeta.appendChild(crear('div', { texto: linea }));
  });
  heroTop.appendChild(heroMeta);
  hero.appendChild(heroTop);

  const heroBody = crear('div', { clase: 'pdf-hero-body' });
  heroBody.appendChild(crear('span', { clase: 'pdf-eyebrow', texto: 'Propuesta comercial · Energía solar inteligente' }));
  heroBody.appendChild(crear('h1', { clase: 'pdf-hero-title', texto: 'Energía Solar Inteligente para ' + cli }));
  const headline = crear('div', { clase: 'pdf-hero-headline' });
  headline.appendChild(crear('div', { clase: 'num', texto: M(f.ahorroAnual) }));
  headline.appendChild(crear('div', { clase: 'lbl', texto: 'de ahorro proyectado cada año — desde el primer día de operación.' }));
  heroBody.appendChild(headline);
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
  heroBody.appendChild(heroChips);
  hero.appendChild(heroBody);
  pagina.appendChild(hero);

  const contenido = crear('div', { clase: 'pdf-content' });

  /* ---------- 01 · Composición de la factura (ilustrativo) ---------- */
  const s1 = pdfSeccion('01', 'Antes de hablar de ahorro', '¿De qué está hecha tu factura hoy?', false);
  s1.appendChild(crear('p', {
    clase: 'pdf-lead',
    texto: 'La tarifa regulada de energía en Colombia se construye con varios cargos — no todos desaparecen con paneles solares, pero el más grande sí.'
  }));
  const compCard = crear('div', { clase: 'pdf-card' });
  compCard.appendChild(crear('div', { clase: 'pdf-card-n', texto: 'ESTRUCTURA APROXIMADA DE LA TARIFA (COMPONENTES CREG)' }));
  const compGrid = crear('div', { clase: 'pdf-grid3' });
  [
    ['Generación — 42%', 'Es lo que tu sistema solar reemplaza.'],
    ['Distribución — 27%', 'Cargo por transporte en la red local.'],
    ['Comercialización, pérdidas, transmisión y otros — 31%', 'Se mantienen aunque generes tu propia energía.']
  ].forEach(([t, d]) => {
    const card = crear('div', { clase: 'pdf-card' });
    card.appendChild(crear('h4', { texto: t }));
    card.appendChild(crear('p', { texto: d }));
    compGrid.appendChild(card);
  });
  s1.appendChild(compGrid);
  contenido.appendChild(s1);

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
  const bTotalAntes = crear('b', { texto: formatoMoneda(f.ahorroMensual + f.ingresoMensual) });
  bTotalAntes.style.color = 'var(--pdf-bad)';
  rowTotalAntes.appendChild(bTotalAntes);
  antes.appendChild(rowTotalAntes);

  const despues = crear('div', { clase: 'pdf-paycard hi' });
  despues.appendChild(crear('h3', { texto: 'Factura de energía · Con Zolaris' }));
  [['Consumo del período', formatoNumero(e.consumo) + ' kWh'], ['Cubierto por tu sistema solar', formatoPorcentaje(e.porcentaje, 0)]]
    .forEach(([k, v]) => {
      const row = crear('div', { clase: 'row' });
      row.appendChild(crear('span', { texto: k }));
      row.appendChild(crear('b', { texto: v }));
      despues.appendChild(row);
    });
  const rowTotalDespues = crear('div', { clase: 'row hi-row' });
  rowTotalDespues.appendChild(crear('span', { texto: 'Valor a pagar' }));
  rowTotalDespues.appendChild(crear('b', { texto: '$0' }));
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
  const gridSistema = crear('div', { clase: 'pdf-grid3' });
  [
    [formatoNumero(r.potenciaKWp, 1) + ' kWp', 'Potencia instalada'],
    [formatoNumero(r.numPaneles), 'Paneles ZN Shine 730 Wp'],
    [formatoNumero(r.areaSistema, 1) + ' m²', 'Área del sistema']
  ].forEach(([v, l]) => {
    const card = crear('div', { clase: 'pdf-card' });
    card.appendChild(crear('div', { clase: 'pdf-card-n', texto: '☀' }));
    card.appendChild(crear('h4', { texto: v }));
    card.appendChild(crear('p', { texto: l }));
    gridSistema.appendChild(card);
  });
  s4.appendChild(gridSistema);
  contenido.appendChild(s4);

  /* ---------- 05 · Cuánto ahorras ---------- */
  const s5 = pdfSeccion('05', 'Cuánto ahorras', 'Una cifra que lo resume todo', true);
  const headlineAhorro = crear('div', { clase: 'pdf-headline-number' });
  const numAhorro = crear('div', { clase: 'num' });
  numAhorro.appendChild(document.createTextNode(M(f.ahorroAnual).replace('M', '')));
  numAhorro.appendChild(crear('span', { clase: 'unit', texto: 'M / año' }));
  headlineAhorro.appendChild(numAhorro);
  headlineAhorro.appendChild(crear('div', {
    clase: 'desc',
    texto: 'Ahorro proyectado, cubriendo el ' + formatoPorcentaje(e.porcentaje, 0) + ' de tu factura anual desde el primer año de operación.'
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
  const s6 = pdfSeccion('06', 'Tecnología que puedes confiar', 'Equipos premium, garantías reales', false);
  const filasTec = COMPONENTES_BASE.map((comp) => {
    let cant = '1';
    if (comp.clave === 'paneles') { cant = formatoNumero(r.numPaneles); }
    return { celdas: [comp.descripcion, cant] };
  });
  s6.appendChild(pdfTabla(['Descripción', 'Unidades'], filasTec));
  const marcasRow = crear('div', { clase: 'pdf-brand-row' });
  for (let i = 1; i <= 6; i += 1) { marcasRow.appendChild(imgRec('marca' + i + '.png')); }
  s6.appendChild(marcasRow);
  contenido.appendChild(s6);

  /* ---------- 07 · Cómo lo pagas ---------- */
  const s7 = pdfSeccion('07', 'Cómo lo pagas', 'Compra directa o leasing — tú eliges', false);
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
  const s8 = pdfSeccion('08', 'Leasing en el tiempo', 'El sol trabaja para ti, incluso mientras pagas tu cuota', false);
  const chartCard2 = crear('div', { clase: 'pdf-card' });
  chartCard2.appendChild(crear('div', { clase: 'pdf-card-n', texto: 'FLUJO ACUMULADO — PRIMEROS 10 AÑOS' }));
  chartCard2.appendChild(graficoFlujoLeasing(f.flujoLeasing));
  s8.appendChild(chartCard2);
  const filasLeasing = f.flujoLeasing.map((fl) => ({
    celdas: [
      String(fl.anio),
      fl.cuota === 0 ? '$0' : '-' + M(Math.abs(fl.cuota) * 1e6),
      M(fl.ahorro * 1e6),
      M(fl.flujoNeto * 1e6)
    ]
  }));
  s8.appendChild(pdfTabla(['Año', 'Cuota', 'Ahorro en energía', 'Flujo neto'], filasLeasing));
  contenido.appendChild(s8);

  /* ---------- 09 · Lo que incluye ---------- */
  const s9 = pdfSeccion('09', 'Lo que incluye tu sistema solar', 'Seguridad, respaldo y cumplimiento normativo', false);
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
  const pagoBox = crear('div', { clase: 'pdf-box' });
  pagoBox.appendChild(crear('h4', { texto: 'Forma de pago', atributos: { style: 'color:var(--pdf-navy); font-size:1.4rem; margin-bottom:0.8rem;' } }));
  EMPRESA.formaPago.forEach((linea) => pagoBox.appendChild(crear('p', { texto: linea, atributos: { style: 'margin:0 0 0.4rem; text-align:left; font-size:1.3rem;' } })));
  pagoBox.appendChild(crear('p', {
    texto: 'Tiempo de entrega: ' + EMPRESA.tiempoEntrega,
    atributos: { style: 'margin-top:0.8rem; text-align:left; font-size:1.3rem; color:var(--pdf-gray);' }
  }));
  s9.appendChild(pagoBox);
  contenido.appendChild(s9);

  /* ---------- 10 · Por qué decidir ahora ---------- */
  const s10 = pdfSeccion('10', 'Por qué decidir ahora', 'Cada mes de espera tiene un precio', true);
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
  contenido.appendChild(s10);

  /* ---------- 11 · Respaldo real ---------- */
  const s11 = pdfSeccion('11', 'Respaldo real', 'Más de 45 proyectos ya instalados', false);
  const portfolioGrid = crear('div', { clase: 'pdf-portfolio-grid' });
  for (let i = 1; i <= 6; i += 1) {
    const card = crear('div', { clase: 'pcard' });
    card.appendChild(imgRec('gal' + i + '.jpg'));
    card.appendChild(crear('div', { clase: 'lbl', texto: TEXTOS_PDF.galeria[i - 1] }));
    portfolioGrid.appendChild(card);
  }
  s11.appendChild(portfolioGrid);
  contenido.appendChild(s11);

  /* ---------- Cierre ---------- */
  const sCierre = crear('section', { clase: 'pdf-section' });
  const cta = crear('div', { clase: 'pdf-cta-box' });
  cta.appendChild(crear('h2', { texto: '¿Avanzamos con tu proyecto, ' + cli + '?' }));
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
  sCierre.appendChild(cta);
  contenido.appendChild(sCierre);

  pagina.appendChild(contenido);

  const footer = crear('div', { clase: 'pdf-footer' });
  footer.appendChild(crear('div', { texto: EMPRESA.razonSocial + ' · ' + EMPRESA.correo + ' · ' + EMPRESA.telefono }));
  pagina.appendChild(footer);

  hoja.appendChild(pagina);
};
