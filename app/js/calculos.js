/**
 * calculos.js
 * Motor de cálculo de la cotización solar.
 * Replica fielmente las fórmulas de "datos_zolaris" (Google Sheet: hojas MAIN, Cot y COT PDF).
 * La función principal `calcularCotizacion` es pura: recibe los datos de entrada y
 * devuelve un objeto con todos los resultados, sin tocar el DOM ni el almacenamiento.
 */

'use strict';

/**
 * Cuota fija de un crédito (equivalente a la función PMT de Excel).
 * @param {number} tasa tasa de interés por periodo.
 * @param {number} nper número de periodos.
 * @param {number} vp valor presente (monto financiado).
 * @returns {number} cuota por periodo.
 */
const pmt = (tasa, nper, vp) => {
  if (tasa === 0) {
    return vp / nper;
  }
  return (vp * tasa) / (1 - Math.pow(1 + tasa, -nper));
};

/**
 * Tasa interna de retorno de un flujo de caja (equivalente a IRR de Excel).
 * Usa bisección sobre un rango amplio para garantizar convergencia.
 * @param {number[]} flujos flujo de caja (índice 0 = inversión, normalmente negativa).
 * @returns {number} TIR por periodo (fracción), o NaN si no converge.
 */
const irr = (flujos) => {
  const vpn = (tasa) => flujos.reduce((acc, f, i) => acc + f / Math.pow(1 + tasa, i), 0);
  let bajo = -0.9;
  let alto = 1.5;
  let vBajo = vpn(bajo);
  let vAlto = vpn(alto);
  if (vBajo * vAlto > 0) {
    return NaN; // sin cambio de signo en el rango
  }
  for (let i = 0; i < 200; i += 1) {
    const medio = (bajo + alto) / 2;
    const vMedio = vpn(medio);
    if (Math.abs(vMedio) < 1) {
      return medio;
    }
    if (vBajo * vMedio < 0) {
      alto = medio;
      vAlto = vMedio;
    } else {
      bajo = medio;
      vBajo = vMedio;
    }
  }
  return (bajo + alto) / 2;
};

/**
 * Busca en el catálogo de inversores la mayor potencia que no supere la potencia
 * calculada. Equivale a la función VLOOKUP(valor; tabla; col; VERDADERO) de Excel.
 * @param {number} potenciaKWp potencia instalada calculada.
 * @returns {{potencia:number, costoTotal:number, mppt:number}}
 */
const buscarInversor = (potenciaKWp) => {
  let elegido = INVERSORES[0];
  for (const fila of INVERSORES) {
    if (fila[0] <= potenciaKWp) {
      elegido = fila;
    } else {
      break;
    }
  }
  return { potencia: elegido[0], costoTotal: elegido[1], mppt: elegido[2] };
};

/**
 * Obtiene la generación específica de una ciudad o el valor por defecto.
 * @param {string} ciudad
 * @returns {number} kWh/kWp/año
 */
const obtenerGeneracion = (ciudad) => {
  if (Object.prototype.hasOwnProperty.call(TABLA_GENERACION, ciudad)) {
    return TABLA_GENERACION[ciudad];
  }
  return GENERACION_POR_DEFECTO;
};

/**
 * Redondea a un número fijo de decimales (equivalente a ROUND de Excel).
 * @param {number} valor
 * @param {number} decimales
 * @returns {number}
 */
const redondear = (valor, decimales) => {
  const factor = Math.pow(10, decimales);
  return Math.round(valor * factor) / factor;
};

/**
 * Calcula la cotización completa a partir de los datos de entrada.
 * @param {Object} entrada
 * @param {string} entrada.nombre        Nombre del cliente.
 * @param {string} entrada.ciudad        Ciudad del proyecto.
 * @param {number} entrada.consumo       Consumo promedio [kWh/mes].
 * @param {string} entrada.tipoTecho     Tipo de techo.
 * @param {number} entrada.porcentaje    Porcentaje a suplir (0 a 100).
 * @param {number} entrada.precioKwh     Tarifa de energía [COP/kWh].
 * @param {number} entrada.descuento     Descuento (negativo, ej. -10 = 10% de rebaja).
 * @param {Object} [entrada.parametros]   Parámetros financieros (ver PARAMETROS_DEFECTO).
 * @returns {Object} resultado con todas las magnitudes de la cotización.
 */
const calcularCotizacion = (entrada) => {
  const C = CONSTANTES;
  const parametros = { ...PARAMETROS_DEFECTO, ...(entrada.parametros || {}) };
  const consumo = entrada.consumo;
  const pctSuplir = entrada.porcentaje / 100; // el Excel usa fracción (0 a 1)

  // --- Generación y dimensionamiento (hoja MAIN) ---
  const consumoAnual = (consumo * 12) - (consumo * 12 * C.FACTOR_PERDIDAS_ANUAL); // G2
  const potenciaKWp = redondear(
    (consumo * C.MARGEN_FUTURO)
      / (C.DIAS_MES * C.HORAS_SOL_PICO * C.EFICIENCIA_INVERSOR * C.EFICIENCIA_ARRAY)
      * pctSuplir,
    1
  ); // G5  =ROUND((C5*1.2)/(30*4.5*0.95*0.9)*C7, 1)
  const numPaneles = Math.ceil((potenciaKWp * 1000) / C.POTENCIA_PANEL_W); // G6
  const generacionEspecifica = obtenerGeneracion(entrada.ciudad);
  const produccionAnual = generacionEspecifica * potenciaKWp; // G3
  const excedentes = Math.max(0, produccionAnual - (consumo * 12)); // G4
  const inversor = buscarInversor(potenciaKWp); // G8

  // --- Costos (hoja MAIN, columna I, acumulativos) ---
  const costoPaneles = C.PRECIO_PANEL_COP * numPaneles * C.FACTOR_INSTALACION; // I6
  const costoElectrica = C.COSTO_ESTRUCTURA_BASE * C.FACTOR_INSTALACION;       // I7
  const costoInversor = inversor.costoTotal;                                   // I8 (costo/kW × kW)
  const costoMonitoreo = C.COSTO_MONITOREO_BASE * C.FACTOR_INSTALACION;        // I9

  const baseComponentes = costoPaneles + costoElectrica + costoInversor + costoMonitoreo;
  const ingenieria = baseComponentes * (C.PCT_INGENIERIA / 100);              // I10
  const manoObra = (baseComponentes + ingenieria) * (C.PCT_MANO_OBRA / 100);  // I11
  const comision = (baseComponentes + ingenieria + manoObra) * (C.PCT_COMISION / 100); // I12

  const subtotal = baseComponentes + ingenieria + manoObra + comision;        // I13
  const descuentoCop = -subtotal * (entrada.descuento / 100);                 // I14
  const totalProyecto = subtotal + descuentoCop;                              // I15

  // --- Análisis financiero (hojas MAIN y Cot) ---
  const ahorroMensual = (consumoAnual / 12) * entrada.precioKwh;              // G17
  const ingresoMensual = (excedentes / 12) * entrada.precioKwh * C.FACTOR_VENTA_EXCEDENTES; // G18
  const beneficioTributario = totalProyecto * C.PCT_BENEFICIO_TRIBUTARIO;     // Cot L23
  const payback = Math.ceil(
    totalProyecto / (ahorroMensual + ingresoMensual + beneficioTributario)
  ); // G20

  // --- Datos de presentación ---
  const areaSistema = numPaneles * C.AREA_POR_PANEL_M2; // C6
  const produccionMensual = produccionAnual / 12;       // C7
  const ahorroAnual = (ahorroMensual + ingresoMensual) * 12; // F8
  const co2Anual = produccionAnual * C.FACTOR_CO2;        // MAIN C15 = 0.53 × producción
  const arbolesAnual = co2Anual / C.FACTOR_ARBOLES_DIV;   // MAIN C16 = CO2 / 27
  const consumoMensualSuplido = (produccionAnual / 12); // [kWh/mes] que cubre el sistema

  // --- Simulador financiero (hoja SIMULADOR CREDITO) ---
  const incremento = parametros.incrementoTarifa / 100;
  const degradacion = parametros.degradacionAnual / 100;
  const crecimientoNeto = (1 + incremento) * (1 - degradacion) - 1;

  // Compra directa: TIR sobre flujo de 25 años (año 0 = -inversión; años 1..25 = ahorro creciente).
  const flujoCompra = [-totalProyecto];
  for (let i = 0; i < parametros.aniosProyeccion; i += 1) {
    flujoCompra.push(ahorroAnual * Math.pow(1 + crecimientoNeto, i));
  }
  const tirCompra = irr(flujoCompra); // fracción anual

  // Leasing: TEA, plazo y pago inicial.
  const teaLeasing = parametros.teaLeasing / 100;
  const tasaMensual = Math.pow(1 + teaLeasing, 1 / 12) - 1;
  const mesesLeasing = Math.round(parametros.plazoLeasingAnios * 12);
  const pagoInicial = totalProyecto * (parametros.pagoInicialLeasing / 100);
  const montoFinanciado = totalProyecto - pagoInicial;
  const cuotaMensualLeasing = pmt(tasaMensual, mesesLeasing, montoFinanciado);
  const cuotaAnualLeasing = cuotaMensualLeasing * 12;

  // Tabla de flujo del leasing a 25 años (en millones de COP, como en la cotización).
  const aniosCredito = parametros.plazoLeasingAnios;
  const flujoLeasing = [];
  let acumulado = 0;
  for (let anio = 1; anio <= parametros.aniosProyeccion; anio += 1) {
    // Cuota: se paga durante los años de crédito (proporcional al último año parcial).
    let cuota = 0;
    if (anio <= Math.floor(aniosCredito)) {
      cuota = -cuotaAnualLeasing;
    } else if (anio === Math.ceil(aniosCredito) && aniosCredito % 1 !== 0) {
      cuota = -cuotaAnualLeasing * (aniosCredito % 1);
    }
    const ahorro = ahorroAnual * Math.pow(1 + crecimientoNeto, anio - 1);
    const flujoNeto = cuota + ahorro;
    acumulado += flujoNeto;
    flujoLeasing.push({
      anio,
      cuota: cuota / 1e6,
      ahorro: ahorro / 1e6,
      flujoNeto: flujoNeto / 1e6,
      acumulado: acumulado / 1e6
    });
  }

  // Payback simple (años en que el flujo acumulado de compra se vuelve positivo).
  let paybackCompra = parametros.aniosProyeccion;
  let acumCompra = -totalProyecto;
  for (let i = 1; i < flujoCompra.length; i += 1) {
    acumCompra += flujoCompra[i];
    if (acumCompra >= 0) { paybackCompra = i; break; }
  }

  return {
    entrada: { ...entrada },
    parametros,
    generacionEspecifica,
    consumoAnual,
    produccionAnual,
    produccionMensual,
    consumoMensualSuplido,
    excedentes,
    potenciaKWp,
    numPaneles,
    inversor,
    areaSistema,
    co2Anual,
    arbolesAnual,
    costos: {
      paneles: costoPaneles,
      electrica: costoElectrica,
      inversor: costoInversor,
      monitoreo: costoMonitoreo,
      ingenieria,
      manoObra,
      comision,
      subtotal,
      descuento: descuentoCop,
      total: totalProyecto
    },
    financiero: {
      ahorroMensual,
      ingresoMensual,
      ahorroAnual,
      beneficioTributario,
      payback,
      paybackCompra,
      tirCompra,
      pagoInicial,
      cuotaMensualLeasing,
      mesesLeasing,
      flujoLeasing
    }
  };
};
