/* ============================================================
   app.js · arranque, enrutado, atajos globales, SW
   ============================================================ */
(function () {
  'use strict';

  var started = false;

  function boot() {
    if (started) return;
    started = true;

    // tema antes de pintar (evita parpadeo)
    try {
      document.documentElement.setAttribute('data-theme', Store.get('theme') || 'auto');
    } catch (e) {}

    Player.init({ apiKey: Store.get('apiKey') });
    UI.init();

    if (!location.hash) location.hash = '#/';
    window.addEventListener('hashchange', UI.render);
    UI.render();

    // Abierta con doble clic (file://): el origen vale "null" y YouTube
    // rechaza el vídeo con el error 153. Mejor avisar que fallar en silencio.
    var esArchivo = location.protocol === 'file:';
    if (esArchivo) {
      setTimeout(function () { avisoArchivoLocal(); }, 350);
    }

    // primer uso
    if (!esArchivo && Store.stats().total === 0 && !Store.prefs.get('welcomed', false)) {
      setTimeout(function () {
        UI.helpModal();
        Store.prefs.set('welcomed', true);
      }, 700);
    }

    globalKeys();
    registerSW();
    keepAwake();

    Store.onChange(function () { /* la UI se refresca explícitamente */ });
  }

  /* ---------- aviso al abrir con doble clic ---------- */
  function avisoArchivoLocal() {
    if (!window.UI || !UI.modal) return;
    var esMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    UI.modal({
      title: 'Abre la app desde el lanzador',
      body:
        '<div class="callout warn">' + UI.icon('info', 16) +
          '<div>Estás viendo la app como <b>archivo local</b> (protocolo <code>file://</code>). ' +
          'En ese modo el origen de la página no existe y <b>YouTube rechaza todos los vídeos con el error 153</b>. ' +
          'No es un fallo de la app: es que YouTube exige una dirección web real.</div></div>' +
        '<div class="steps">' +
          '<div class="step"><div><b>' + (esMac ? 'Doble clic en «Abrir Mis Videos.command»' : 'Doble clic en «Abrir Mis Videos.bat»') + '</b>' +
            ' dentro de la carpeta <code>mis-videos-iphone</code>. Se abrirá una ventana con un servidor; deja esa ventana abierta.</div></div>' +
          '<div class="step"><div>O, más sencillo en Mac: en Safari ve a <b>Archivo → Abrir…</b> y selecciona la <b>carpeta</b> ' +
            '<code>mis-videos-iphone</code> (no el fichero). Safari la sirve por http y todo funciona.</div></div>' +
          '<div class="step"><div>También funciona <b>subiendo la carpeta a GitHub Pages</b>, que es como se usará en el iPhone.</div></div>' +
        '</div>' +
        '<div class="callout">' + UI.icon('info', 16) +
          '<div>Mientras tanto puedes <b>añadir vídeos, crear listas y organizarlo todo</b>: esos datos se guardan igual. ' +
          'Solo falla la reproducción.</div></div>',
      buttons: [
        { label: 'Abrir la carpeta con el lanzador' },
        { label: 'Entendido, seguir así' }
      ],
      onButton: function (i) {
        if (i !== 0) return;
        // una web no puede lanzar procesos: se lo decimos al usuario
        UI.toast('Haz doble clic en el fichero del lanzador de la carpeta', 'info', 6000);
      }
    });
  }

  /* ---------- atajos de teclado ---------- */
  function globalKeys() {
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
        if (e.key === 'Escape') e.target.blur();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      var k = e.key.toLowerCase();
      if (e.key === '/') { e.preventDefault(); document.getElementById('searchInput').focus(); return; }
      if (e.key === ' ') { e.preventDefault(); Player.toggle(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); Player.skip(e.shiftKey ? -30 : -5); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); Player.skip(e.shiftKey ? 30 : 5); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); bumpVolume(0.08); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); bumpVolume(-0.08); return; }
      if (k === 'j') { Player.skip(-10); return; }
      if (k === 'l') { Player.skip(10); return; }
      if (k === 'n') { Player.next(); return; }
      if (k === 'p') { Player.prev(); return; }
      if (k === 'f') {
        var r = UI.parseRoute();
        if (r.name === 'ver') { Store.toggleFav(r.arg); UI.render(); }
        return;
      }
      if (k === 'k') { e.preventDefault(); UI.addModal(); return; }
      if (e.key === 'Escape') {
        var bk = document.querySelector('.modal-backdrop');
        if (bk) { bk.parentNode.removeChild(bk); document.body.style.overflow = ''; return; }
        if (UI.parseRoute().name === 'ver') history.length > 1 ? history.back() : UI.go('#/');
      }
    });
  }

  function bumpVolume(d) {
    var v = Store.prefs.get('volume', 1);
    v = Math.max(0, Math.min(1, v + d));
    Store.prefs.set('volume', v);
    Player.setVolume(v);
    UI.toast('Volumen ' + Math.round(v * 100) + '%', 'info', 900);
  }

  /* ---------- mantener pantalla encendida mientras se reproduce ---------- */
  function keepAwake() {
    var lock = null;
    function request() {
      if (!('wakeLock' in navigator)) return;
      navigator.wakeLock.request('screen').then(function (l) {
        lock = l;
        l.addEventListener('release', function () { lock = null; });
      }).catch(function () {});
    }
    function release() {
      if (lock) { lock.release().catch(function () {}); lock = null; }
    }
    Player.on(function (type, data) {
      if (type === 'state') {
        if (data === 'playing') request(); else release();
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && Player.current) request();
    });
  }

  /* ---------- Service Worker (offline + instalable) ---------- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        console.warn('SW no registrado:', err.message);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();