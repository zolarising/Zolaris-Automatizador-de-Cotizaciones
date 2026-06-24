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
/* Réplica fiel de la plantilla "COTIZACIONES ZOLARIS.pptm": 8 diapositivas
   16:9 con las imágenes y logos reales (carpeta app/recursos), colocados en las
   mismas posiciones que el PowerPoint original. */

const REC = 'recursos/'; // carpeta de imágenes reales

/** Crea un <img> de recurso con clase. */
const imgRec = (archivo, clase) =>
  crear('img', { clase: clase || '', atributos: { src: REC + archivo, alt: '' } });

/** Crea una capa absoluta posicionada en % (left/top/width opcionales). */
const capa = (clase, estilos) => {
  const el = crear('div', { clase: 'capa' + (clase ? ' ' + clase : '') });
  Object.entries(estilos || {}).forEach(([k, v]) => { el.style[k] = v; });
  return el;
};

/** Crea una diapositiva 16:9. */
const crearDiapo = () => crear('div', { clase: 'diapo' });

/** Logo común arriba-derecha (páginas 4-7). */
const logoSuperior = () => {
  const cont = crear('div', { clase: 'logo-sup' });
  cont.appendChild(imgRec('logo-color.png'));
  return cont;
};

/** Banda de título azul redondeada. */
const tituloBanda = (texto) => crear('div', { clase: 'titulo-banda', texto: texto });

/** Tabla concepto/valor con clase base y cabecera opcional. */
const tablaCV = (claseTabla, claseCab, tituloCab, filas) => {
  const tabla = crear('table', { clase: claseTabla });
  const tbody = crear('tbody');
  if (tituloCab) {
    const trc = crear('tr', { clase: claseCab });
    const td = crear('td', { texto: tituloCab });
    td.setAttribute('colspan', '2');
    trc.appendChild(td);
    tbody.appendChild(trc);
  }
  filas.forEach((f) => tbody.appendChild(crearFila(f[0], f[1])));
  tabla.appendChild(tbody);
  return tabla;
};

/** Gráfico de barras (alturas en %) con clase y clase de barra por signo. */
const barras = (clase, valores) => {
  const cont = crear('div', { clase: clase });
  const maximo = Math.max.apply(null, valores.map(Math.abs)) || 1;
  valores.forEach((v) => {
    const b = crear('div', { clase: v < 0 ? 'barra barra--neg' : 'barra' });
    b.style.height = Math.max(2, Math.abs(v) / maximo * 100) + '%';
    cont.appendChild(b);
  });
  return cont;
};

/**
 * Rellena la hoja imprimible (#hojaPdf) con las 8 diapositivas, replicando la
 * plantilla oficial con sus imágenes reales.
 * @param {Object} r resultado de calcularCotizacion.
 * @param {string} [codigo]
 * @param {string} [fechaISO]
 * @param {string} [imagen] imagen IA del proyecto (data URL); si falta, se usan
 *   las fotos por defecto de la plantilla.
 */
const prepararHojaPdf = (r, codigo, fechaISO, imagen) => {
  const hoja = document.getElementById('hojaPdf');
  vaciar(hoja);

  const e = r.entrada;
  const c = r.costos;
  const f = r.financiero;
  const p = r.parametros;
  const fecha = formatoFecha(fechaISO || new Date().toISOString());
  const cli = e.nombre.toUpperCase();
  const M = (cop) => '$' + formatoNumero(cop / 1e6, 1) + ' M';

  /* ---------- Diapositiva 1: PORTADA ---------- */
  const d1 = crearDiapo();
  // Fondo: imagen IA del cliente o foto por defecto.
  if (imagen) {
    d1.appendChild(crear('img', { clase: 'fondo-completo', atributos: { src: imagen, alt: '' } }));
  } else {
    d1.appendChild(imgRec('portada-default.jpg', 'fondo-completo'));
  }
  d1.appendChild(crear('div', { clase: 'velo' }));
  const logoP = crear('div', { clase: 'portada-logo' });
  logoP.appendChild(imgRec('logo-blanco.png'));
  d1.appendChild(logoP);
  d1.appendChild(crear('div', {
    clase: 'portada-txt portada-titulo',
    texto: 'ENERGÍA SOLAR INTELIGENTE PARA ' + cli
  }));
  d1.appendChild(crear('div', { clase: 'portada-txt portada-ahorro', texto: 'AHORRO REAL DESDE EL PRIMER DÍA' }));
  d1.appendChild(crear('div', {
    clase: 'portada-txt portada-datos',
    texto: formatoNumero(r.potenciaKWp, 2) + ' kWp - ' + formatoNumero(r.numPaneles)
      + ' PANELES - ' + formatoNumero(r.produccionMensual) + ' kWh/mes'
  }));
  const contactoP = crear('div', { clase: 'portada-contacto' });
  contactoP.appendChild(crear('div', { texto: "Medellin, Antioquia" }));
  contactoP.appendChild(crear('div', { texto: fecha }));
  contactoP.appendChild(crear('div', { texto: EMPRESA.correo }));
  contactoP.appendChild(crear('div', { texto: EMPRESA.telefono }));
  d1.appendChild(contactoP);
  hoja.appendChild(d1);

  /* ---------- Diapositiva 2: GALERÍA DE PROYECTOS ---------- */
  const d2 = crearDiapo();
  const grid = crear('div', { clase: 'galeria-grid' });
  for (let i = 1; i <= 9; i += 1) {
    const celda = crear('div', { clase: 'galeria-celda' });
    celda.appendChild(imgRec('gal' + i + '.jpg'));
    celda.appendChild(crear('span', { clase: 'galeria-etq', texto: TEXTOS_PDF.galeria[i - 1] }));
    grid.appendChild(celda);
  }
  d2.appendChild(grid);
  hoja.appendChild(d2);

  /* ---------- Diapositiva 3: MARKETING ---------- */
  const d3 = crearDiapo();
  d3.appendChild(imgRec('fondo3.jpg', 'fondo-completo'));
  d3.appendChild(crear('div', { clase: 'velo' }));
  d3.appendChild(crear('div', { clase: 'mkt-titulo', texto: TEXTOS_PDF.marketingTitulo }));
  const mktLista = crear('ul', { clase: 'mkt-lista' });
  TEXTOS_PDF.marketingPuntos.forEach((t) => mktLista.appendChild(crear('li', { texto: t })));
  d3.appendChild(mktLista);
  const alturas = [];
  for (let i = 0; i < 12; i += 1) { alturas.push(15 + i * 7); }
  d3.appendChild(barras('mkt-grafico', alturas));
  hoja.appendChild(d3);

  /* ---------- Diapositiva 4: TÉCNICA ---------- */
  const d4 = crearDiapo();
  d4.appendChild(logoSuperior());
  d4.appendChild(crear('div', { clase: 'tec-proyecto', texto: 'PROYECTO ' + cli }));
  d4.appendChild(crear('div', {
    clase: 'tec-sub',
    texto: 'Sistema Solar Fotovoltaico de ' + formatoNumero(r.potenciaKWp, 2)
      + ' kWp · Cubre el ' + formatoNumero(e.porcentaje) + ' % de tu factura anual'
  }));
  // Imagen del proyecto (IA del cliente o foto por defecto).
  if (imagen) {
    d4.appendChild(crear('img', { clase: 'tec-imagen', atributos: { src: imagen, alt: '' } }));
  } else {
    d4.appendChild(imgRec('tecnica-default.jpg', 'tec-imagen'));
  }
  // Tabla "Información y proyecciones".
  const tablaTec = tablaCV('tec-tabla', 'tec-tabla__cab', 'Información y proyecciones', [
    ['Capacidad instalada [kWp]', formatoNumero(r.potenciaKWp, 1)],
    ['Número de paneles', formatoNumero(r.numPaneles)],
    ['Área del sistema [m2]', formatoNumero(r.areaSistema, 2)],
    ['Producción mensual [kWh]', formatoNumero(r.produccionMensual)],
    ['Producción mensual [COP]', formatoMoneda(f.ahorroMensual + f.ingresoMensual)]
  ]);
  d4.appendChild(tablaTec);
  d4.appendChild(crear('div', { clase: 'tec-titulo-der', texto: 'Información y proyecciones' }));
  // Iconos + valores en dos columnas. left/top en % de la diapositiva.
  // Columna izquierda: icono 50.5%, valor 55.5%. Columna derecha: icono 74.5%, valor 79.5%.
  const items = [
    // [iconoArchivo, valor, leftIcono%, topIcono%, leftValor%, topValor%]
    ['icono1.png', formatoNumero(r.produccionAnual) + ' kWh', 50.5, 30, 55.5, 31.5],
    ['icono2.png', formatoNumero(f.paybackCompra) + ' años', 50.5, 44, 55.5, 45.5],
    ['icono3.png', 'Excedentes $' + formatoNumero(p.tarifaVentaExcedentes) + '/kWh', 50.5, 58, 55.5, 59.5],
    ['icono5.png', 'Tarifa actual $' + formatoNumero(e.precioKwh) + '/kWh', 50.5, 72, 55.5, 73.5],
    ['icono5.png', 'Consumo ' + formatoNumero(e.consumo) + ' kWh/mes', 74.5, 30, 79.5, 31.5],
    ['icono6.png', 'Ahorro anual ' + M(f.ahorroAnual), 74.5, 44, 79.5, 45.5],
    ['icono7.png', 'Sustitución CO₂ ' + formatoNumero(r.co2Anual, 0) + ' kg', 74.5, 58, 79.5, 59.5],
    ['icono8.png', formatoNumero(r.arbolesAnual, 0) + ' Árboles', 74.5, 72, 79.5, 73.5]
  ];
  items.forEach((it) => {
    const ico = capa('tec-icono', { left: it[2] + '%', top: it[3] + '%' });
    ico.appendChild(imgRec(it[0]));
    d4.appendChild(ico);
    const val = capa('tec-valor', { left: it[4] + '%', top: it[5] + '%' });
    val.textContent = it[1];
    d4.appendChild(val);
  });
  hoja.appendChild(d4);

  /* ---------- Diapositiva 5: TECNOLOGÍA Y CONFIANZA ---------- */
  const d5 = crearDiapo();
  d5.appendChild(logoSuperior());
  d5.appendChild(tituloBanda('TECNOLOGÍA Y CONFIANZA'));
  d5.appendChild(crear('div', {
    clase: 'tecno-sub',
    texto: 'Sistema Solar Fotovoltaico de ' + formatoNumero(r.potenciaKWp, 2) + ' kWp'
  }));
  const filasTecno = COMPONENTES_TECNOLOGIA.map((comp) => {
    let cant = '1';
    if (comp.clave === 'paneles') { cant = formatoNumero(r.numPaneles); }
    const desc = comp.clave === 'inversor'
      ? 'Inversor de ' + formatoNumero(r.inversor.potencia, 1) + ' kW'
      : comp.descripcion;
    return [desc, cant];
  });
  d5.appendChild(tablaCV('tecno-tabla', 'tecno-tabla__cab', 'Descripción / Unidades', filasTecno));
  // Fotos del panel y del inversor (arriba-derecha, como en el original).
  const panelImg = capa('tecno-equipo tecno-equipo--panel', {});
  panelImg.appendChild(imgRec('panel.png'));
  d5.appendChild(panelImg);
  const invImg = capa('tecno-equipo tecno-equipo--inversor', {});
  invImg.appendChild(imgRec('inversor.png'));
  d5.appendChild(invImg);
  // Logos de marcas (debajo de las fotos de equipos).
  const marcas = crear('div', { clase: 'tecno-marcas' });
  for (let i = 1; i <= 6; i += 1) { marcas.appendChild(imgRec('marca' + i + '.png')); }
  d5.appendChild(marcas);
  const garT = crear('div', { clase: 'tecno-garantias' });
  TEXTOS_PDF.garantiasTecnologia.forEach((g) => garT.appendChild(crear('div', { texto: g })));
  d5.appendChild(garT);
  hoja.appendChild(d5);

  /* ---------- Diapositiva 6: MODELOS DE NEGOCIO ---------- */
  const d6 = crearDiapo();
  d6.appendChild(logoSuperior());
  d6.appendChild(tituloBanda('Modelos de negocio'));
  d6.appendChild(tablaCV('neg-tabla neg-tabla--compra', 'neg-tabla__cab', 'Compra directa', [
    ['Costo total del Proyecto', formatoMoneda(c.total)],
    ['Tasa interna de Retorno', formatoNumero(f.tirCompra * 100, 1) + '%'],
    ['Retorno a la inversión [Años]', formatoNumero(f.paybackCompra)],
    ['Beneficios Tributarios', formatoMoneda(f.beneficioTributario)]
  ]));
  d6.appendChild(tablaCV('neg-tabla neg-tabla--leasing', 'neg-tabla__cab', 'Leasing', [
    ['Costo total del Proyecto', formatoMoneda(c.total)],
    ['Pago Inicial', formatoMoneda(f.pagoInicial)],
    ['Tiempo crédito (Años)', formatoNumero(p.plazoLeasingAnios, 1)],
    ['Tasa de crédito', formatoNumero(p.teaLeasing, 1) + '%'],
    ['Cuota fija mensual', formatoMoneda(f.cuotaMensualLeasing)]
  ]));
  // Gráficos de flujo acumulado.
  let accCompra = -c.total / 1e6;
  const fCompra = f.flujoLeasing.map((x) => { accCompra += x.ahorro; return accCompra; });
  d6.appendChild(barras('neg-grafico neg-grafico--compra', fCompra));
  d6.appendChild(barras('neg-grafico neg-grafico--leasing', f.flujoLeasing.map((x) => x.acumulado)));
  d6.appendChild(crear('div', { clase: 'neg-pie neg-pie--compra', texto: 'Invierte una vez, y a partir del año 3, todo es ganancia.' }));
  d6.appendChild(crear('div', { clase: 'neg-pie neg-pie--leasing', texto: 'El sol trabaja para ti, incluso mientras pagas tu cuota.' }));
  hoja.appendChild(d6);

  /* ---------- Diapositiva 7: LO QUE INCLUYE ---------- */
  const d7 = crearDiapo();
  d7.appendChild(logoSuperior());
  d7.appendChild(tituloBanda('Lo que incluye tu sistema solar'));
  // Cuatro bloques en posiciones del pptm.
  const posBloques = [
    { left: '10.3%', top: '16%', width: '38%' },   // Seguridad
    { left: '57.1%', top: '16%', width: '30%' },   // Beneficios
    { left: '57.1%', top: '47%', width: '35%' },   // Instalación
    { left: '10.3%', top: '47%', width: '40%' }    // Forma de pago
  ];
  TEXTOS_PDF.incluye.forEach((bloque, i) => {
    const b = capa('inc-bloque', posBloques[i]);
    b.appendChild(crear('h4', { texto: bloque.titulo }));
    const ul = crear('ul');
    bloque.puntos.forEach((pt) => ul.appendChild(crear('li', { texto: pt })));
    b.appendChild(ul);
    d7.appendChild(b);
  });
  // Bloque forma de pago (4º).
  const pago = capa('inc-bloque', posBloques[3]);
  pago.appendChild(crear('h4', { texto: 'Forma de pago' }));
  EMPRESA.formaPago.forEach((linea) => pago.appendChild(crear('div', { texto: linea })));
  pago.appendChild(crear('div', { texto: ' ' }));
  pago.appendChild(crear('div', { texto: EMPRESA.cuentaBanco }));
  pago.appendChild(crear('div', { texto: EMPRESA.cuentaTipo + ' ' + EMPRESA.cuentaNumero }));
  d7.appendChild(pago);
  d7.appendChild(crear('div', { clase: 'inc-entrega', texto: 'Tiempo de entrega: ' + EMPRESA.tiempoEntrega }));
  hoja.appendChild(d7);

  /* ---------- Diapositiva 8: GRACIAS ---------- */
  const d8 = crearDiapo();
  d8.appendChild(imgRec('fondo8.jpg', 'fondo-completo'));
  d8.appendChild(crear('div', { clase: 'velo' }));
  const logoG = crear('div', { clase: 'gracias-logo' });
  logoG.appendChild(imgRec('logo-blanco.png'));
  d8.appendChild(logoG);
  const tarj = crear('div', { clase: 'gracias-tarjeta' });
  tarj.appendChild(crear('div', { clase: 'gracias-titulo', texto: 'Gracias' }));
  tarj.appendChild(crear('div', { clase: 'gracias-nombre', texto: EMPRESA.gerente }));
  tarj.appendChild(crear('div', { clase: 'gracias-cargo', texto: EMPRESA.cargoGerente }));
  const contG = crear('div', { clase: 'gracias-contacto' });
  contG.appendChild(crear('div', { texto: EMPRESA.telefono }));
  contG.appendChild(crear('div', { texto: EMPRESA.instagram }));
  tarj.appendChild(contG);
  d8.appendChild(tarj);
  hoja.appendChild(d8);
};

