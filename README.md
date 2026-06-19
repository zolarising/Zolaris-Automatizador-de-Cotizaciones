# Zolaris · Automatizador de Cotizaciones

Aplicación web para generar cotizaciones de sistemas de energía solar
fotovoltaica de **Zolaris**, de forma rápida y con un diseño profesional listo
para enviar al cliente.

## Características

- **Cálculo automático** de la propuesta solar a partir del consumo del cliente:
  potencia instalada, número de paneles, producción anual, ahorros, retorno de
  la inversión, CO₂ evitado y simulación financiera (compra directa y leasing).
- **Cotización en PDF** con el diseño oficial de Zalaris (8 diapositivas:
  portada, galería, datos técnicos, tecnología, modelos de negocio, etc.).
- **Imagen del proyecto** opcional: se puede subir una foto del lugar con los
  paneles para incrustarla en la portada y la página técnica.
- **Historial** de cotizaciones guardado localmente en el navegador.

## Tecnología

HTML5, CSS3 y JavaScript puro (sin dependencias externas ni frameworks).

## Uso

1. Abre `app/index.html` en un navegador.
2. Completa los datos del cliente y pulsa **Calcular cotización**.
3. Revisa el resultado y pulsa **Generar PDF**. En el diálogo de impresión:
   elige *Guardar como PDF*, orientación **horizontal** y activa
   **«Gráficos en segundo plano»** para conservar fondos y colores.

## Estructura

```
app/
├── index.html        Estructura de la aplicación
├── css/estilos.css   Estilos de la interfaz y del PDF
├── js/
│   ├── datos.js          Tablas y constantes (generación por ciudad, costos…)
│   ├── calculos.js       Motor de cálculo de la cotización
│   ├── almacenamiento.js Historial en localStorage
│   ├── ui.js             Render de la interfaz y del PDF
│   └── app.js            Punto de entrada
└── recursos/         Logos, fotos e iconos del diseño
```
