/**
 * app.js
 * Punto de entrada de la aplicación. Conecta el formulario, el motor de cálculo,
 * el almacenamiento y la capa de presentación una vez cargado el DOM.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Estado: última cotización calculada (aún no guardada) o abierta del historial.
  let cotizacionActual = null;   // resultado de calcularCotizacion
  let registroActual = null;     // registro guardado (si proviene del historial)
  let imagenProyecto = null;     // imagen del proyecto en base64 (opcional)

  // Referencias a las secciones y controles.
  const seccionFormulario = document.getElementById('seccionFormulario');
  const seccionResultado = document.getElementById('seccionResultado');
  const seccionHistorial = document.getElementById('seccionHistorial');
  const formulario = document.getElementById('formularioCotizacion');
  const botonGuardar = document.getElementById('botonGuardar');

  // Inicializar selects.
  llenarSelectCiudades();
  llenarSelectTechos();

  /* ----------------- Carga de imagen del proyecto ----------------- */

  const campoImagen = document.getElementById('campoImagen');
  const vistaPrevia = document.getElementById('vistaPreviaImagen');
  const imagenPrevia = document.getElementById('imagenPrevia');

  campoImagen.addEventListener('change', () => {
    const archivo = campoImagen.files && campoImagen.files[0];
    if (!archivo) {
      return;
    }
    if (!archivo.type.startsWith('image/')) {
      mostrarAviso('El archivo debe ser una imagen.', 'error');
      campoImagen.value = '';
      return;
    }
    const lector = new FileReader();
    lector.addEventListener('load', () => {
      imagenProyecto = lector.result;
      imagenPrevia.setAttribute('src', imagenProyecto);
      vistaPrevia.classList.remove('oculto');
    });
    lector.readAsDataURL(archivo);
  });

  document.getElementById('botonQuitarImagen').addEventListener('click', (evento) => {
    evento.preventDefault();
    imagenProyecto = null;
    campoImagen.value = '';
    imagenPrevia.removeAttribute('src');
    vistaPrevia.classList.add('oculto');
  });

  /** Muestra una sección y oculta las demás (o varias a la vez). */
  const mostrarSecciones = (visibles) => {
    [seccionFormulario, seccionResultado, seccionHistorial].forEach((s) => {
      s.classList.toggle('oculto', !visibles.includes(s));
    });
  };

  /** Refresca el historial con sus manejadores de abrir/eliminar. */
  const refrescarHistorial = () => {
    renderHistorial(abrirDelHistorial, confirmarEliminar);
  };

  /** Abre una cotización guardada en el panel de resultados. */
  const abrirDelHistorial = (registro) => {
    cotizacionActual = registro.resultado;
    registroActual = registro;
    imagenProyecto = registro.imagen || null;
    renderResultado(registro.resultado);
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Cotización guardada';
    mostrarSecciones([seccionResultado]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Pide confirmación y elimina una cotización del historial. */
  const confirmarEliminar = (registro) => {
    abrirModal(
      'Eliminar cotización',
      '¿Seguro que deseas eliminar ' + registro.codigo + ' de ' + registro.resultado.entrada.nombre + '?',
      () => {
        eliminarCotizacion(registro.id);
        refrescarHistorial();
        mostrarAviso('Cotización eliminada.', 'info');
      }
    );
  };

  /* ----------------- Eventos de navegación ----------------- */

  const navNueva = document.getElementById('navNueva');
  const navHistorial = document.getElementById('navHistorial');

  /** Marca visualmente el botón de navegación activo. */
  const marcarNav = (activo) => {
    navNueva.classList.toggle('boton--activo', activo === navNueva);
    navHistorial.classList.toggle('boton--activo', activo === navHistorial);
  };

  navNueva.addEventListener('click', (evento) => {
    evento.preventDefault();
    marcarNav(navNueva);
    mostrarSecciones([seccionFormulario]);
  });

  navHistorial.addEventListener('click', (evento) => {
    evento.preventDefault();
    marcarNav(navHistorial);
    refrescarHistorial();
    mostrarSecciones([seccionHistorial]);
  });

  /* ----------------- Cálculo de la cotización ----------------- */

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const entrada = leerFormulario(formulario);
    if (!entrada) {
      mostrarAviso('Revisa los campos marcados en rojo.', 'error');
      return;
    }
    cotizacionActual = calcularCotizacion(entrada);
    registroActual = null;
    renderResultado(cotizacionActual);
    botonGuardar.disabled = false;
    botonGuardar.textContent = 'Guardar cotización';
    mostrarSecciones([seccionFormulario, seccionResultado]);
    document.getElementById('seccionResultado').scrollIntoView({ behavior: 'smooth' });
  });

  /* ----------------- Acciones sobre el resultado ----------------- */

  botonGuardar.addEventListener('click', (evento) => {
    evento.preventDefault();
    if (!cotizacionActual) {
      return;
    }
    registroActual = guardarCotizacion(cotizacionActual, imagenProyecto);
    botonGuardar.disabled = true;
    botonGuardar.textContent = 'Cotización guardada';
    mostrarAviso('Cotización ' + registroActual.codigo + ' guardada en el historial.', 'exito');
  });

  document.getElementById('botonImprimir').addEventListener('click', (evento) => {
    evento.preventDefault();
    if (!cotizacionActual) {
      return;
    }
    const codigo = registroActual ? registroActual.codigo : 'PRECOTIZACIÓN';
    const fechaISO = registroActual ? registroActual.fechaISO : new Date().toISOString();
    prepararHojaPdf(cotizacionActual, codigo, fechaISO, imagenProyecto);
    window.print();
  });

  document.getElementById('botonNueva').addEventListener('click', (evento) => {
    evento.preventDefault();
    formulario.reset();
    limpiarErrores(formulario);
    cotizacionActual = null;
    registroActual = null;
    imagenProyecto = null;
    imagenPrevia.removeAttribute('src');
    vistaPrevia.classList.add('oculto');
    mostrarSecciones([seccionFormulario]);
  });

  // Empezar siempre en el formulario.
  mostrarSecciones([seccionFormulario]);
});
