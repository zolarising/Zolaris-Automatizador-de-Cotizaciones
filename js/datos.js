/**
 * datos.js
 * Tablas de referencia y constantes de negocio de Zolaris.
 * Todos los valores fueron extraídos directamente del libro "datos_zolaris.xlsm"
 * (hojas: Generación Específica, Costos, INVERSORES, MAIN).
 * Mantener este archivo aislado facilita actualizar precios sin tocar la lógica.
 */

'use strict';

/**
 * Generación específica anual por ciudad [kWh/kWp/año].
 * Fuente: hoja "Generación Específica" (columna C).
 * Agrupada por departamento solo a modo informativo.
 */
const TABLA_GENERACION = {
  'Medellín': 1556.4,
  'Envigado': 1528.5,
  'Rionegro': 1660.0,
  'Cartagena': 1840.0,
  'Marinilla': 1662.9,
  'El Santuario': 1640.2,
  'Santa Elena': 1535.0,
  'Guarne': 1571.9,
  'Copacabana': 1547.0,
  'Girardota': 1577.2,
  'Barbosa': 1546.9,
  'Itagui': 1535.3,
  'Sabaneta': 1506.4,
  'La Estrella': 1499.1,
  'Caldas': 1449.7,
  'El Retiro': 1495.1,
  'La Ceja': 1562.2,
  'La Unión': 1637.0,
  'El Peñol': 1613.9,
  'San Pedro de los Milagros': 1552.5,
  'Bello': 1580.8,
  'Santa Fe de Antioquia': 1620.4,
  'Sopetrán y San Jerónimo': 1614.5,
  'Pasto': 1332.6,
  'Taminango': 1560.3,
  'Chachaguí': 1411.5,
  'Bogotá': 1391.6,
  'Cali': 1503.3,
  'Yumbo': 1493.3,
  'Popayan': 1410.0,
  'Pereira': 1449.7,
  'Carmen del Viboral': 1571.9,
  'Tulua': 1503.3
};

/**
 * Valor de generación usado cuando la ciudad no está en la tabla.
 * Promedio conservador empleado para ubicaciones no listadas.
 */
const GENERACION_POR_DEFECTO = 1500.0;

/**
 * Tipos de techo disponibles (hoja Cot, campo "Tipo de techo").
 */
const TIPOS_DE_TECHO = ['Barro', 'Otro'];

/**
 * Constantes de cálculo. Referencias entre paréntesis = celda del Excel.
 */
const CONSTANTES = {
  POTENCIA_PANEL_W: 730,            // Costos!B11  (panel ZN SHINE 730 Wp)
  PRECIO_PANEL_COP: 465000,         // Costos!C11
  COSTO_ESTRUCTURA_BASE: 12026616,  // Costos!D26  (instalación eléctrica / estructura)
  COSTO_MONITOREO_BASE: 6153360,    // Costos!D40  (sistema de monitoreo)
  FACTOR_INSTALACION: 1.5,          // ×1.5 aplicado a paneles, estructura y monitoreo
  PCT_INGENIERIA: 60,               // MAIN G10  (Ingeniería, Utilidad) %
  PCT_MANO_OBRA: 5,                 // MAIN G11  (Mano de obra) %
  PCT_COMISION: 5,                  // MAIN G12  (Comisión) %
  FACTOR_PERDIDAS_ANUAL: 0.003456,  // MAIN G2   (ajuste consumo anual)
  HORAS_SOL_PICO: 3.9,              // MAIN G5   (gsheet: 30*3.9*0.95*0.9)
  EFICIENCIA_INVERSOR: 0.95,        // MAIN G5
  EFICIENCIA_ARRAY: 0.90,           // MAIN G5
  MARGEN_FUTURO: 1.2,               // MAIN G5   (20% de crecimiento proyectado)
  DIAS_MES: 30,                     // MAIN G5
  FACTOR_VENTA_EXCEDENTES: 0.5,     // MAIN G18  (tarifa de venta = 50% de compra)
  PCT_BENEFICIO_TRIBUTARIO: 0.40,   // Cot L23 (40% deducible, como en datos_zolaris)
  AREA_POR_PANEL_M2: 3.09,          // COT PDF C6
  FACTOR_CO2: 0.53,                 // MAIN C15 (CO2/año = 0.53 × producción anual)
  FACTOR_ARBOLES_DIV: 27            // MAIN C16 (árboles = CO2 / 27)
};

/**
 * Parámetros financieros por defecto (editables desde el formulario).
 * Tomados de las cotizaciones reales de Zolaris.
 */
const PARAMETROS_DEFECTO = {
  tarifaVentaExcedentes: 412,   // COP/kWh pagados por excedentes inyectados a la red
  incrementoTarifa: 5.5,        // % de incremento anual de la tarifa de energía
  inflacion: 4.3,               // % de inflación proyectada
  degradacionAnual: 0.4,        // % de degradación anual de los paneles
  aniosProyeccion: 25,          // horizonte de la proyección (tabla de flujo a 25 años)
  // --- Leasing (hoja SIMULADOR CREDITO) ---
  teaLeasing: 15,               // % Tasa Efectiva Anual del crédito leasing
  plazoLeasingAnios: 2.5,       // años del crédito leasing
  pagoInicialLeasing: 30        // % de pago inicial del leasing
};

/**
 * Datos comerciales fijos de la empresa (aparecen en el PDF).
 */
const EMPRESA = {
  razonSocial: 'ZOLARIS INGENIERÍA',
  ciudadOrigen: 'Pasto, Nariño',
  gerente: 'LUIS GABRIEL ZAMBRANO',
  cargoGerente: 'GERENTE',
  telefono: '+57 3104021083',
  correo: 'zolarisingenieria@gmail.com',
  instagram: '@zolarisingenieria',
  cuentaBanco: 'Bancolombia',
  cuentaTipo: 'Cuenta de ahorros',
  cuentaNumero: '61700005612',
  tiempoEntrega: '70 Días una vez realizada la orden de compra con el anticipo.',
  // Forma de pago (página 8)
  formaPago: [
    '20% - Anticipo',
    '40% - Montaje de módulos fotovoltaicos',
    '30% - Entrega proyecto',
    '10% - Legalización RETIE'
  ]
};

/**
 * Textos fijos de las diapositivas de marketing (no dependen del cliente).
 */
const TEXTOS_PDF = {
  // Página 2: galería de proyectos realizados (etiquetas reales).
  galeria: [
    'EDIFICIO PALERMO - 20 kW', 'CASINO RIO - 30.6 kW', 'CASA RIO NEGRO 12.4 kW',
    'FAMILIA LOPEZ - 5 kW', 'EDIFICIO SANTORINI 65.7 kW', 'FINCA LA ESPERANZA - 5.8 kW',
    'CASA BRICEÑO - 20.7 kW', 'SUBESTACION BUCHELLI - 20 kW', 'FINCA PASIZARA - 14.6 kW'
  ],
  // Página 3: marketing (la factura sube).
  marketingTitulo: 'LA FACTURA DE ENERGÍA SIEMPRE SUBE, ¿QUÉ DECIDES HACER?',
  marketingPuntos: [
    'ASÍ CRECE TU FACTURA SIN ZOLARIS',
    'EN 10 AÑOS, TU FACTURA AUMENTA EN UN 70 %',
    'CON ZOLARIS, INVIERTES EN TU PROPIO AHORRO'
  ],
  // Página 5: marcas/garantías.
  marcas: ['LONGi Solar', 'HUAWEI', 'ZNSHINE SOLAR', 'LIVOLTEK', 'Trina Solar', 'GOODWE'],
  garantiasTecnologia: [
    'Garantía 12 años por defecto de fábrica en paneles e inversores',
    'Garantía por degradación lineal a 25 años no mayor al 15%',
    '1 Año de Garantía de instalación, siempre que se mantengan las mismas condiciones'
  ],
  // Página 8: lo que incluye tu sistema solar (4 bloques fijos).
  incluye: [
    { titulo: 'Seguridad & Garantía', puntos: [
      '25 años de vida útil paneles',
      '12 años garantía de fábrica inversor y paneles',
      '1 año garantía instalación',
      'Mantenimiento gratuito año 1'
    ] },
    { titulo: 'Beneficios Tributarios', puntos: [
      '50% deducción de renta',
      'Depreciación acelerada',
      'Exento de IVA y aranceles'
    ] },
    { titulo: 'Instalación & Soporte', puntos: [
      'Instalación certificada RETIE',
      'Cumplimiento de plazos garantizado',
      'Legalización con operador de red',
      'Sistema Monitoreo remoto'
    ] }
  ]
};

/**
 * Componentes con su descripción para la página de tecnología (página 5).
 * Las cantidades de "1" son fijas; paneles e inversor se calculan.
 */
const COMPONENTES_TECNOLOGIA = [
  { descripcion: 'Paneles solares ZN SHINE - 730 Wp', clave: 'paneles' },
  { descripcion: 'Inversor de string', clave: 'inversor' },
  { descripcion: 'Sistema de monitoreo remoto', clave: 'uno' },
  { descripcion: 'Ingeniería y logística', clave: 'uno' },
  { descripcion: 'Instalación de sistema fotovoltaico', clave: 'uno' },
  { descripcion: 'Estructura fija en aluminio', clave: 'uno' },
  { descripcion: 'Medidor bidireccional', clave: 'uno' }
];

/**
 * Catálogo de inversores ordenado por potencia ascendente.
 * Cada entrada: [potenciaTotal_kW, costoTotal_COP, mppt].
 * Fuente: hoja "INVERSORES" (columnas A, B, E).
 * Se usa con búsqueda aproximada (equivalente a VLOOKUP(...;VERDADERO)):
 * se toma la mayor potencia que no supere la potencia calculada.
 */
const INVERSORES = [[1.5,1557500,1],[1.6,1403200,1],[3.1,2960700,2],[3.3,1616600,1],[4.8,3174100,2],[4.9,3019800,2],[6.0,2440000,2],[6.4,4577300,3],[7.5,3997500,3],[7.6,3843200,3],[7.7,2853000,2],[9.1,5400700,4],[9.2,4410500,3],[9.3,4056600,3],[9.3,4256200,3],[10.0,4400000,3],[10.8,5614100,4],[10.8,5813700,4],[10.9,5459800,4],[11.0,4469600,3],[11.5,5957500,4],[11.6,5803200,4],[12.4,7017300,5],[12.5,6027100,4],[12.6,5872800,4],[13.1,7360700,5],[13.3,6016600,4],[13.7,5293000,4],[14.1,7430300,5],[14.8,7574100,5],[14.9,7419800,5],[15.2,6850500,5],[15.3,6696200,5],[16.0,6840000,5],[16.4,8977300,6],[16.8,8253700,6],[17.0,6909600,5],[17.5,8397500,6],[17.6,8243200,6],[17.7,7253000,5],[18.5,8467100,6],[18.6,8312800,6],[19.1,9800700,7],[19.2,8810500,6],[19.3,8456600,6],[19.3,8656200,6],[20.0,7500000,8],[20.1,9870300,7],[20.8,10014100,7],[20.8,10213700,7],[20.9,9859800,7],[21.0,8869600,6],[22.4,11417300,8],[22.5,10427100,7],[22.6,10272800,7],[23.7,9693000,7],[24.1,11830300,8],[25.0,9138000,8],[25.2,11250500,8],[25.3,11096200,8],[26.8,12653700,9],[27.0,11309600,8],[28.5,12867100,9],[28.6,12712800,9],[30.0,9604000,8],[30.1,14270300,10],[36.0,15100000,12],[40.0,14583000,12],[45.0,16638000,16],[50.0,15425000,12],[50.0,17104000,16],[55.0,18742000,16],[56.0,22600000,20],[60.0,22083000,20],[60.0,22910448,12],[61.0,24238000,20],[65.0,23721000,20],[66.0,24704000,20],[70.0,24187000,20],[70.0,22925000,20],[75.0,18646000,12],[75.0,24563000,20],[75.0,26242000,24],[76.0,29683000,24],[80.0,25029000,20],[81.0,31738000,28],[85.0,31221000,28],[86.0,32204000,28],[86.0,30525000,24],[90.0,30008000,24],[90.0,31687000,28],[91.0,33842000,28],[95.0,32063000,28],[95.0,33325000,28],[95.0,26146000,20],[96.0,37183000,32],[100.0,33500000,20],[100.0,32529000,28],[100.0,27784000,20],[101.0,38821000,32],[105.0,34167000,28],[105.0,28250000,20],[106.0,38025000,32],[106.0,39287000,32],[110.0,37508000,32],[111.0,41342000,36],[111.0,33746000,24],[111.0,39663000,32],[115.0,39146000,32],[115.0,40825000,36],[115.0,33229000,24],[116.0,40129000,32],[120.0,39612000,32],[120.0,35284000,28],[121.0,46321000,40],[125.0,41667000,36],[125.0,34071000,24],[125.0,35750000,28],[126.0,45108000,36],[126.0,46787000,40],[130.0,37388000,28],[131.0,41246000,32],[131.0,47163000,40],[131.0,48425000,40],[135.0,40729000,32],[135.0,46646000,40],[136.0,42884000,32],[136.0,47629000,40],[140.0,47112000,40],[140.0,42367000,32],[141.0,49267000,40],[141.0,43350000,32],[145.0,48750000,40],[145.0,41571000,32],[145.0,42833000,32],[146.0,52608000,44],[150.0,44888000,36],[150.0,43209000,32],[151.0,48329000,36],[151.0,54246000,44],[151.0,55925000,48],[155.0,43675000,32],[156.0,54712000,44],[156.0,50384000,40],[160.0,49867000,40],[160.0,56410448,32],[161.0,50850000,40],[161.0,49171000,36],[161.0,56767000,48],[165.0,56250000,48],[165.0,48654000,36],[165.0,50333000,40],[166.0,52488000,40],[170.0,51971000,40],[170.0,50709000,40],[171.0,55829000,44],[171.0,61746000,52],[175.0,51175000,40],[176.0,57467000,44],[176.0,62212000,52],[180.0,52813000,40],[181.0,56671000,44],[181.0,57933000,44],[181.0,63850000,52],[185.0,56154000,44],[186.0,59988000,48],[186.0,58309000,44],[190.0,59471000,48],[190.0,57792000,44],[191.0,58775000,44],[195.0,58258000,44],[196.0,64967000,52],[200.0,60313000,48],[201.0,71350000,60],[201.0,65433000,52],[201.0,63754000,48],[206.0,67071000,52],[206.0,65809000,52],[210.0,65292000,52],[211.0,66275000,52],[215.0,65758000,52],[216.0,67913000,52],[220.0,67396000,52],[221.0,71254000,56],[226.0,72892000,56],[226.0,74571000,60],[231.0,73358000,56],[236.0,75413000,60],[240.0,74896000,60],[246.0,80392000,64],[251.0,80858000,64],[256.0,82496000,64],[276.0,89996000,72],[330.0,65000000,30],[390.0,87910448,42],[430.0,98500000,50],[490.0,121410448,62]];

/**
 * Componentes que aparecen siempre en el desglose del PDF de cotización.
 * Fuente: hoja "COT PDF" (columna B). La cantidad se calcula en tiempo de ejecución.
 */
const COMPONENTES_BASE = [
  { descripcion: 'Paneles solares ZN SHINE - 730 Wp', clave: 'paneles' },
  { descripcion: 'Inversor(es) de string', clave: 'inversor' },
  { descripcion: 'Sistema de monitoreo remoto', clave: 'unidad' },
  { descripcion: 'Ingeniería y logística', clave: 'unidad' },
  { descripcion: 'Instalación de sistema fotovoltaico', clave: 'unidad' },
  { descripcion: 'Estructura fija en aluminio', clave: 'unidad' },
  { descripcion: 'Medidor bifásico bidireccional', clave: 'unidad' },
  { descripcion: 'Certificación RETIE', clave: 'unidad' }
];
