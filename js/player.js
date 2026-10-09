/* ============================================================
   player.js · reproductor YouTube (IFrame API) + MediaSession
   Objetivo: que el audio siga sonando con el móvil bloqueado y
   aparezcan los controles en la pantalla de bloqueo de iOS.
   ============================================================ */
window.Player = (function () {
  'use strict';

  var apiPromise = null;
  var yt = null;            // YT.Player
  var host = null;          // nodo donde vive el iframe
  var stage = null;
  var current = null;       // vídeo actual
  var queue = [];           // lista de reproducción (objetos vídeo)
  var qIndex = -1;
  var apiKey = '';
  var listeners = [];
  var progressTimer = null;
  var sleepTimer = null;
  var sleepUntil = 0;
  var lastSave = 0;

  /* ---------- carga perezosa de la IFrame API ---------- */
  function loadApi() {
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      if (window.YT && window.YT.Player) return resolve(window.YT);
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (prev) { try { prev(); } catch (e) {} }
        resolve(window.YT);
      };
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.async = true;
      s.onerror = function () { reject(new Error('No se pudo cargar el reproductor de YouTube')); };
      document.head.appendChild(s);
      setTimeout(function () {
        if (!window.YT || !window.YT.Player) reject(new Error('Timeout del reproductor'));
      }, 15000);
    });
    return apiPromise;
  }

  /* ---------- configuración del reproductor ----------
     El error 153 aparece cuando YouTube no recibe un Referer válido o
     el parámetro `origin` no cuadra con el origen real de la página.
     Causas habituales:
       · abrir el HTML con file://  -> location.origin === "null"
       · Privacy tools / proxies que borran la cabecera Referer
       · GitHub Pages en subruta + widget_referrer redundante

     Se prueban por orden: primero las que conservan la JS API (y con ella
     los controles de la pantalla de bloqueo) y, solo si todas fallan, se cae
     a un <iframe> simple. Ese último camino sí reproduce, pero pierde los
     controles del candado y el punto de reanudación.
  */
  var STRATEGIES = [
    { api: true, host: 'https://www.youtube-nocookie.com', origin: true,  widget: false },
    { api: true, host: 'https://www.youtube-nocookie.com', origin: false, widget: false },
    { api: true, host: 'https://www.youtube.com',         origin: true,  widget: true  },
    { api: false }
  ];
  var LAST = STRATEGIES.length - 1;
  var strategyIdx = 0;
  /* Última estrategia que funcionó. Evita que un solo vídeo problemático
     deje la app degradada en modo iframe simple para siempre. */
  var bestIdx = 0;
  var plainIframe = null;

  /* `origin` solo si de verdad existe: con file:// vale "null" y rompe el embed */
  function validOrigin() {
    var o = '';
    try { o = window.location.origin || ''; } catch (e) { return null; }
    if (!o || o === 'null' || o === 'file://') return null;
    if (!/^https?:\/\//.test(o)) return null;
    return o.replace(/\/+$/, '');
  }

  function destroyPlayer() {
    plainIframe = null;
    if (!yt) return;
    try { yt.destroy(); } catch (e) {}
    yt = null;
    ready = false;
    host.innerHTML = '';
  }

  function ensurePlayer(forceIndex) {
    if (typeof forceIndex === 'number') strategyIdx = forceIndex;
    if (yt || plainIframe) return;
    var s = STRATEGIES[strategyIdx];
    if (!s.api) return buildPlainIframe();

    host.innerHTML = '';
    var div = document.createElement('div');
    div.id = 'yt-frame';
    div.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    host.appendChild(div);

    var pv = {
      autoplay: 0,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      cc_load_policy: 0,
      enablejsapi: 1
    };
    var org = validOrigin();
    if (s.origin && org) pv.origin = org;
    if (s.widget && org) pv.widget_referrer = location.href;

    yt = new YT.Player('yt-frame', {
      host: s.host,
      playerVars: pv,
      events: {
        onReady: onReady,
        onStateChange: onStateChange,
        onError: onError
      }
    });
  }

  /* Reproductor básico: sin JS API, se vale con los controles nativos */
  function buildPlainIframe() {
    host.innerHTML = '';
    var f = document.createElement('iframe');
    f.id = 'yt-plain';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; web-share';
    f.allowFullscreen = true;
    f.setAttribute('referrerpolicy', 'origin-when-cross-origin');
    f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;';
    host.appendChild(f);
    plainIframe = f;
    if (current) {
      f.src = 'https://www.youtube.com/embed/' + current.id +
              '?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3';
      emit('ready');
      emit('plainmode', true);
      emit('state', 'playing');
    }
    return f;
  }

  var ready = false;
  var pending = null;   // vídeo que se quiere cargar mientras no está listo
  var seekTarget = 0;   // posición a la que saltar al terminar de cargar

  function onReady(e) {
    /* El constructor devuelve un objeto provisional: la API real llega
       en e.target. Sin esta línea, `yt` sigue siendo el marcador de
       posición y cueVideoById/playVideo nunca llegan a YouTube
       (el player se queda vacío -> error 2 "ID de vídeo inválido"). */
    if (e && e.target) yt = e.target;
    ready = true;
    emit('ready');
    if (pending) {
      var p = pending; pending = null;
      load(p.video, p.startAt, true);
    }
  }

  function onStateChange(e) {
    var st = e.data;

    /* Pendiente: saltar al punto en que se quedó. loadVideoById no admite
       posición inicial, así que la aplicamos nosotros. Solo cuando el
       player ya conoce la duración: si se salta antes, YouTube lo ignora
       en silencio y el vídeo arranca desde el principio. */
    if (seekTarget > 0 && yt && ready) applyPendingSeek();

    if (st === YT.PlayerState.PLAYING) {
      /* esta configuración funciona: no volveremos a degradar por debajo */
      if (strategyIdx < bestIdx) bestIdx = strategyIdx;
      startTicker();
      updateMediaSession();
      emit('state', 'playing');
      maybeAutoplay();
    } else if (st === YT.PlayerState.PAUSED) {
      stopTicker(true);
      updateMediaSession();
      emit('state', 'paused');
    } else if (st === YT.PlayerState.ENDED) {
      stopTicker(true);
      updateMediaSession();
      emit('state', 'ended');
      onEnded();
    } else if (st === YT.PlayerState.BUFFERING) {
      emit('state', 'buffering');
    } else if (st === YT.PlayerState.UNSTARTED) {
      stopTicker(true);
      emit('state', 'unstarted');
    }
    if (sleepUntil && Date.now() >= sleepUntil) pause();
  }

  function onEnded() {
    if (sleepUntil) { sleepUntil = 0; emit('sleep', 0); }
    if (Store.get('autoplayNext') && qIndex >= 0 && qIndex < queue.length - 1) {
      next(true);
    }
  }

  /* Errores que dependen del entorno (no del vídeo): reintentamos con la
     siguiente estrategia antes de rendirlnos. */
  var RETRYABLE = [153, 5];

  function onError(e) {
    var code = e.data;
    var retryable = RETRYABLE.indexOf(code) !== -1;

    if (retryable && strategyIdx < LAST) {
      var keepVideo = current, keepStart = 0;
      try { if (yt && ready) keepStart = yt.getCurrentTime(); } catch (x) {}
      strategyIdx += 1;
      destroyPlayer();
      ensurePlayer();
      if (current) {
        // buildPlainIframe ya carga el vídeo actual; la API encola para onReady
        if (!plainIframe) {
          pending = { video: keepVideo, startAt: keepStart };
          if (ready) { var p = pending; pending = null; load(p.video, p.startAt, true); }
        }
      }
      emit('retry', code);
      return;
    }

    if (retryable) {
      emit('error', 'YouTube ha bloqueado la reproducción incrustada de este vídeo. Ábrelo en la app de YouTube con el botón «YouTube».');
      if (window.UI && UI.toast) UI.toast('YouTube bloquea este vídeo aquí. Ábrelo en YouTube.', 'err', 6000);
      return;
    }

    var codes = {
      2: 'ID de vídeo inválido.',
      5: 'Este vídeo no se puede reproducir en un player embebido.',
      100: 'Este vídeo ya no está disponible.',
      101: 'El propietario no permite reproducirlo fuera de YouTube.',
      150: 'El propietario no permite reproducirlo fuera de YouTube.',
      153: 'No se pudo verificar el origen de la reproducción (error 153 de YouTube).'
    };
    var msg = codes[code] || 'No se pudo reproducir el vídeo (' + code + ').';
    emit('error', msg);
    if (window.UI && UI.toast) UI.toast(msg, 'err', 5000);
  }

  /* Salta a la posición pendiente cuando el player ya conoce la duración.
       Si se hace antes, YouTube lo ignora y el vídeo arranca de cero. */
  function applyPendingSeek() {
    if (seekTarget <= 0 || !yt || !ready) return;
    var dur = 0;
    try { dur = yt.getDuration() || 0; } catch (x) {}
    if (dur <= 0) return;
    var to = Math.min(seekTarget, Math.max(0, dur - 5));
    seekTarget = 0;
    try { yt.seekTo(to, true); } catch (x) { seekTarget = to; }
  }

  /* ---------- carga / control ---------- */
  function load(video, startAt, autoplay) {
    if (!video) return;
    ensurePlayer();
    current = video;
    pending = null;

    if (plainIframe) {
      // modo iframe simple: recargamos el src con el vídeo pedido
      plainIframe.src = 'https://www.youtube.com/embed/' + video.id +
        '?autoplay=' + (autoplay ? 1 : 0) + '&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3' +
        (startAt ? '&start=' + Math.floor(startAt) : '');
      updateMediaSession();
      emit('load', video);
      emit('state', autoplay ? 'playing' : 'paused');
      return;
    }

    if (!ready) { pending = { video: video, startAt: startAt }; return; }

    /* Importante: hay que usar loadVideoById, NO cueVideoById.
       cueVideoById + playVideo hace que YouTube rechace la petición
       (error 2 "ID de vídeo inválido" y, según el caso, 153 al validar
       el origen). loadVideoById carga y arranca de forma fiable.
       No admite posición inicial: la aplicamos al buscar en el player. */
    seekTarget = (startAt && startAt > 0) ? Math.floor(startAt) : 0;
    try {
      yt.loadVideoById(video.id);
      if (autoplay) play();
    } catch (err) {
      emit('error', String(err));
    }
    updateMediaSession();
    emit('load', video);
    /* OJO: no se pone el progreso a 0 aquí. Ese era el punto de reanudación
       guardado; si se limpia al abrir, "continuar viendo" deja de funcionar. */
  }

  function play() {
    // en modo iframe simple el control lo pone el propio YouTube
    if (plainIframe) {
      if (plainIframe.contentWindow) {
        try { plainIframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*'); } catch (e) {}
      }
      return;
    }
    if (!yt) return;
    try { yt.playVideo(); } catch (e) {}
  }
  function pause() {
    if (plainIframe) {
      if (plainIframe.contentWindow) {
        try { plainIframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); } catch (e) {}
      }
      return;
    }
    if (!yt) return;
    try { yt.pauseVideo(); } catch (e) {}
  }
  function toggle() {
    if (plainIframe) { if (current) play(); return; }
    if (!yt) { if (current) play(); return; }
    try {
      var st = yt.getPlayerState();
      if (st === YT.PlayerState.PLAYING) pause();
      else play();
    } catch (e) {}
  }
  function seekTo(sec) {
    if (plainIframe) {
      try { plainIframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[' + sec + ',true]}', '*'); } catch (e) {}
      return;
    }
    if (!yt || !ready) return;
    try { yt.seekTo(sec, true); } catch (e) {}
  }
  function skip(delta) {
    if (plainIframe) return;
    if (!yt || !ready) return;
    try { seekTo(Math.max(0, yt.getCurrentTime() + delta)); } catch (e) {}
  }
  function setVolume(v) {
    if (plainIframe) {
      try { plainIframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[' + Math.round(v * 100) + ']}', '*'); } catch (e) {}
      return;
    }
    if (!yt || !ready) return;
    try { yt.setVolume(Math.max(0, Math.min(100, Math.round(v * 100)))); } catch (e) {}
  }
  function stopAndClear() {
    if (plainIframe) {
      try { plainIframe.src = 'about:blank'; } catch (e) {}
      plainIframe = null;
      host.innerHTML = '';
    }
    if (yt && ready) { try { yt.stopVideo(); } catch (e) {} }
    current = null; queue = []; qIndex = -1;
    stopTicker(false);
    if (navigator.mediaSession) {
      try { navigator.mediaSession.metadata = null; navigator.mediaSession.playbackState = 'none'; } catch (e) {}
    }
    emit('load', null);
  }

  /* ---------- cola ---------- */
  function setQueue(items, index) {
    queue = items || [];
    qIndex = index == null ? -1 : index;
    emit('queue', queue);
  }
  function queueSnapshot() { return { list: queue, index: qIndex, current: current }; }
  function playAt(i, startAt) {
    if (i < 0 || i >= queue.length) return;
    qIndex = i;
    load(queue[i], startAt, true);
    emit('queue', queue);
  }
  function next(auto) {
    if (qIndex < 0) return;
    if (qIndex < queue.length - 1) playAt(qIndex + 1);
    else emit('end');
  }
  function prev() {
    if (!yt || !ready) return;
    var t = yt.getCurrentTime();
    if (t > 5) { seekTo(0); return; }
    if (qIndex > 0) playAt(qIndex - 1);
    else seekTo(0);
  }
  function maybeAutoplay() { /* la lógica real está en onEnded */ }

  function shuffleQueue() {
    if (queue.length < 2) return;
    var cur = qIndex >= 0 ? queue[qIndex] : null;
    for (var i = queue.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = queue[i]; queue[i] = queue[j]; queue[j] = t;
    }
    if (cur) qIndex = queue.indexOf(cur);
  }

  /* ---------- progreso persistido ---------- */
  function startTicker() {
    if (progressTimer) return;
    progressTimer = setInterval(function () {
      var st = { t: 0, d: 0, rate: 1 };
      if (yt && ready) {
        try {
          st.t = yt.getCurrentTime();
          st.d = yt.getDuration();
          if (yt.getPlaybackRate) st.rate = yt.getPlaybackRate();
        } catch (e) {}
      }
      if (current) {
        if (st.d > 0 && Math.abs(current.duration - st.d) > 0.5) Store.updateVideo(current.id, { duration: st.d });
        if (st.d > 0) setPosition(st.t, st.d, st.rate);
      }
      applyPendingSeek();
      emit('tick', st);
      // guardado periódico del punto de reanudación
      if (Date.now() - lastSave > 8000) {
        lastSave = Date.now();
        if (current) Store.markPlayed(current.id, Math.floor(st.t), Math.floor(st.d));
      }
      if (sleepUntil && Date.now() >= sleepUntil) { pause(); sleepUntil = 0; emit('sleep', 0); }
    }, 1000);
  }
  function stopTicker(save) {
    if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
    if (save && yt && ready && current) {
      try {
        var t = yt.getCurrentTime(), d = yt.getDuration();
        Store.markPlayed(current.id, Math.floor(t), Math.floor(d));
      } catch (e) {}
    }
  }

  /* ---------- MediaSession (pantalla de bloqueo iOS) ---------- */
  var artworkBase = '';
  function setPosition(t, d, rate) {
    if (!navigator.mediaSession || !navigator.mediaSession.setPositionState) return;
    if (!d || d <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: d,
        position: Math.max(0, Math.min(t, d)),
        playbackRate: rate || 1
      });
    } catch (e) {}
  }

  function updateMediaSession() {
    if (!navigator.mediaSession) return;
    try {
      if (!current) { navigator.mediaSession.metadata = null; return; }
      var hq = Store.thumb(current.id, 'hq');
      var sd = Store.thumb(current.id, 'sd');
      var max = Store.thumb(current.id, 'max');
      var art = [
        { src: hq, sizes: '480x360', type: 'image/jpeg' },
        { src: sd, sizes: '640x480', type: 'image/jpeg' },
        { src: max, sizes: '1280x720', type: 'image/jpeg' }
      ];
      var list = current.listId ? Store.getList(current.listId) : null;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.channel || 'YouTube',
        album: list ? list.name : 'Mis Videos',
        artwork: art
      });
      var playing = yt && ready && yt.getPlayerState && yt.getPlayerState() === 1;
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    } catch (e) {}
  }

  function initMediaSessionHandlers() {
    if (!navigator.mediaSession) return;
    var bind = function (action, fn) {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) {}
    };
    bind('play', function () { play(); });
    bind('pause', function () { pause(); });
    bind('stop', function () { pause(); });
    bind('seekbackward', function (d) { skip(-(d && d.seekOffset || 10)); });
    bind('seekforward', function (d) { skip(d && d.seekOffset || 10); });
    bind('seekto', function (d) { if (d && typeof d.seekTime === 'number') seekTo(d.seekTime); });
    bind('previoustrack', function () { prev(); });
    bind('nexttrack', function () { next(); });
    try {
      navigator.mediaSession.setActionHandler('skipad', undefined);
      navigator.mediaSession.setActionHandler('skipbackward', undefined);
    } catch (e) {}
  }

  /* ---------- temporizador de sueño ---------- */
  function sleep(minutes) {
    clearTimeout(sleepTimer);
    if (!minutes) { sleepUntil = 0; emit('sleep', 0); return; }
    sleepUntil = Date.now() + minutes * 60000;
    emit('sleep', sleepUntil);
    sleepTimer = setTimeout(function () {
      pause();
      sleepUntil = 0;
      emit('sleep', 0);
      if (window.UI && UI.toast) UI.toast('Temporizador: reproducción pausada', 'ok');
    }, minutes * 60000);
  }
  function sleepRemaining() { return sleepUntil ? Math.max(0, sleepUntil - Date.now()) : 0; }

  /* ---------- eventos ---------- */
  function on(fn) { listeners.push(fn); }
  function emit(type, data) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](type, data); } catch (e) { console.error(e); }
    }
  }

  /* ---------- init ---------- */
  function init(opts) {
    opts = opts || {};
    stage = document.getElementById('stage');
    host = document.getElementById('ytHost');
    apiKey = opts.apiKey || Store.get('apiKey') || '';
    initMediaSessionHandlers();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && Store.get('pauseWhenHidden')) pause();
    });
    window.addEventListener('pagehide', function () { stopTicker(true); });

    loadApi().then(function () {
      // no creamos el player hasta el primer uso: aligerar el arranque
      emit('api', true);
    }).catch(function (e) { emit('error', e.message); });

    // sonda de duración oculta (offline de metadatos)
    var probe = document.createElement('div');
    probe.id = 'yt-dur-probe';
    probe.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;';
    document.body.appendChild(probe);
  }

  

  return {
    init: init,
    loadApi: loadApi,
    load: load,
    play: play,
    pause: pause,
    toggle: toggle,
    seekTo: seekTo,
    skip: skip,
    setVolume: setVolume,
    stopAndClear: stopAndClear,
    setQueue: setQueue,
    queueSnapshot: queueSnapshot,
    playAt: playAt,
    next: next,
    prev: prev,
    shuffleQueue: shuffleQueue,
    sleep: sleep,
    sleepRemaining: sleepRemaining,
    on: on,
    get current() { return current; },
    get isReady() { return ready; }
  };
})();