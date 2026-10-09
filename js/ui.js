/* ============================================================
   ui.js · vistas, tarjetas, modales, componentes
   ============================================================ */
window.UI = (function () {
  'use strict';

  var view, filterBar, chipBox, modalRoot, toastRoot, fab;
  var openCtx = { queue: null, index: 0 };   // cola para el reproductor
  var searchQuery = '';
  var activeListFilter = 'all';

  /* ---------------- iconos ---------------- */
  var I = {
    star: '<path fill="currentColor" d="m12 3.6 2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17l-5.25 2.76 1-5.86L3.5 9.76l5.9-.86L12 3.6Z"/>',
    starFill: '<path fill="currentColor" d="m12 3.6 2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17l-5.25 2.76 1-5.86L3.5 9.76l5.9-.86L12 3.6Z"/>',
    check: '<path fill="currentColor" d="m9.6 16.2-3.8-3.8-1.4 1.4 5.2 5.2L20 8.6 18.6 7.2 9.6 16.2Z"/>',
    checkCircle: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.2 14.6-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7Z"/>',
    more: '<path fill="currentColor" d="M6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/>',
    play: '<path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.72-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z"/>',
    pause: '<path fill="currentColor" d="M7 5h4v14H7V5Zm6 0h4v14h-4V5Z"/>',
    next: '<path fill="currentColor" d="M15 6h2v12h-2V6Zm-1 6L6 18V6l8 6Z"/>',
    prev: '<path fill="currentColor" d="M7 6h2v12H7V6Zm3 6 8-6v12l-8-6Z"/>',
    edit: '<path fill="currentColor" d="M4 17.2V20h2.8l10-10-2.8-2.8-10 10ZM18.7 6.3l1.5-1.5a1 1 0 0 1 1.4 0l.6.6a1 1 0 0 1 0 1.4l-1.5 1.5-2.5-2.5Z"/>',
    trash: '<path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2ZM6 8h12l-1 12.2A2 2 0 0 1 15 22H9a2 2 0 0 1-2-1.8L6 8Z"/>',
    clock: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 10.6 4 2.3-1 1.7-5-2.9V6h2v6.6Z"/>',
    list: '<path fill="currentColor" d="M4 5h3v14H4V5Zm5 0h3v14H9V5Zm5.6 0 3.9 13.2-2.9.86L11.6 5h3Z"/>',
    share: '<path fill="currentColor" d="M14 9V5l7 7-7 7v-4.1C9 14.9 6.2 17 5 20c-.6-4.2 1.3-8 9-11Z"/>',
    external: '<path fill="currentColor" d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14V3ZM5 5h5v2H6v11h11v-4h2v6H5V5Z"/>',
    download: '<path fill="currentColor" d="M11 3h2v9.2l3.6-3.6 1.4 1.4-6 6-6-6 1.4-1.4L11 12.2V3ZM4 19h16v2H4v-2Z"/>',
    upload: '<path fill="currentColor" d="M12 3l6 6-1.4 1.4L13 6.8V16h-2V6.8l-3.6 3.6L6 9l6-6ZM4 19h16v2H4v-2Z"/>',
    moon: '<path fill="currentColor" d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm0-14 2 3h-4l2-3Zm0 16-2-3h4l-2 3ZM4 12l3-2v4l-3-2Zm16 0-3 2v-4l3 2Z"/>',
    sun: '<path fill="currentColor" d="M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-13 1.6 2.6h-3.2L12 4Zm0 19-1.6-2.6h3.2L12 23ZM3 12l2.6-1.6v3.2L3 12Zm18 0-2.6 1.6v-3.2L21 12Z"/>',
    timer: '<path fill="currentColor" d="M9 1h6v2H9V1Zm3 5a8 8 0 1 1-8 8 8 8 0 0 1 8-8Zm-1 3h-2v6l5 2 1-2.6-4-1.6V9Z"/>',
    key: '<path fill="currentColor" d="M14 2a8 8 0 0 0-7.7 10.2L2 16.5V22h5.5l1-1v-2h2v-2h2l1.3-1.3A8 8 0 1 0 14 2Zm3 5a2 2 0 1 1-2-2 2 2 0 0 1 2 2Z"/>',
    info: '<path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z"/>',
    plus: '<path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/>',
    x: '<path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5Z"/>',
    volume: '<path fill="currentColor" d="M4 9h3l4-4v14l-4-4H4V9Zm11.5 3a3.5 3.5 0 0 0-2-3.2v6.4a3.5 3.5 0 0 0 2-3.2Zm-2-7.2v2.1a5.5 5.5 0 0 1 0 10.2v2.1a7.5 7.5 0 0 0 0-14.4Z"/>',
    note: '<path fill="currentColor" d="M4 4h16v12l-4 4H4V4Zm2 2v12h8v-4h4V6H6Zm10 13.5V16h2.5L16 19.5Z"/>',
    link: '<path fill="currentColor" d="M10 13a5 5 0 0 0 7.1 0l2.8-2.8a5 5 0 0 0-7.1-7.1L11.6 4.3l1.4 1.4 1.2-1.2a3 3 0 0 1 4.2 4.2l-2.8 2.8a3 3 0 0 1-4.2 0L10 13Zm4-2a5 5 0 0 0-7.1 0l-2.8 2.8a5 5 0 0 0 7.1 7.1l1.2-1.2-1.4-1.4-1.2 1.2a3 3 0 1 1-4.2-4.2l2.8-2.8a3 3 0 0 1 4.2 0L14 11Z"/>',
    replay: '<path fill="currentColor" d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z"/>'
  };
  function icon(name, size) {
    var s = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" aria-hidden="true">' + (I[name] || '') + '</svg>';
  }

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* De mayor a menor calidad. YouTube responde 404 con una miniatura
     gris de 120x90 cuando no existe, así que no basta con mirar el error:
     una imagen de 120x90 se considera "no disponible". */
  var THUMBS = ['maxresdefault', 'hq720', 'hqdefault', 'sddefault', 'mqdefault', 'default'];
  function thumbUrl(id, i) {
    return 'https://i.ytimg.com/vi/' + id + '/' + (THUMBS[i || 0]) + '.jpg';
  }
  function initThumbs(root) {
    $$('img[data-thumb]', root || document).forEach(function (img) {
      if (img.dataset.thumbBound) return;
      img.dataset.thumbBound = '1';
      var id = img.getAttribute('data-thumb');

      function next(from) {
        var n = from + 1;
        if (n < THUMBS.length) {
          img.setAttribute('data-ti', String(n));
          img.src = thumbUrl(id, n);
        } else {
          img.style.opacity = '0';
          img.style.background = 'var(--surface-2)';
        }
      }
      function accept() {
        // el placeholder de YouTube mide 120x90: no es una miniatura real
        if (img.naturalWidth <= 120 && img.naturalHeight <= 90) {
          next(parseInt(img.getAttribute('data-ti') || '0', 10));
        } else {
          img.classList.add('loaded');
        }
      }
      // los listeners van ANTES de asignar src: una respuesta cacheada
      // puede disparar 'error' de forma síncrona
      img.addEventListener('load', accept);
      img.addEventListener('error', function () {
        next(parseInt(img.getAttribute('data-ti') || '0', 10));
      });
      img.src = img.getAttribute('data-src') ||
                thumbUrl(id, parseInt(img.getAttribute('data-ti') || '0', 10));
    });
  }

  /* ---------------- toasts ---------------- */
  var ICONS = { ok: 'check', err: 'x', info: 'info' };
  function toast(msg, type, ms) {
    if (!toastRoot) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    t.innerHTML = '<span class="ic">' + icon(ICONS[type] || 'info', 13) + '</span><span>' + esc(msg) + '</span>';
    toastRoot.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, ms || 2600);
  }

  /* ---------------- modal ---------------- */
  var openModals = 0;
  function modal(opts) {
    var back = document.createElement('div');
    back.className = 'modal-backdrop';
    var foot = '';
    (opts.buttons || []).forEach(function (b, i) {
      foot += '<button class="btn ' + (b.cls || 'btn-ghost') + '" data-mi="' + i + '">' + esc(b.label) + '</button>';
    });
    back.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || '') + '">' +
        '<div class="modal-grip"></div>' +
        '<div class="modal-head"><h2>' + esc(opts.title || '') + '</h2>' +
          '<button class="icon-btn" data-close aria-label="Cerrar">' + icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' +
        (foot ? '<div class="modal-foot">' + foot + '</div>' : '') +
      '</div>';
    modalRoot.appendChild(back);
    openModals++;
    document.body.style.overflow = 'hidden';

    function close(val) {
      if (!back.parentNode) return;
      back.parentNode.removeChild(back);
      openModals = Math.max(0, openModals - 1);
      if (!openModals) document.body.style.overflow = '';
      if (opts.onClose) opts.onClose(val);
    }

    back.addEventListener('click', function (e) {
      if (e.target === back) close(null);
      if (e.target.closest('[data-close]')) close(null);
    });
    $$('[data-mi]', back).forEach(function (b) {
      b.addEventListener('click', function () {
        var idx = +b.getAttribute('data-mi');
        var res = opts.onButton ? opts.onButton(idx, back, close) : undefined;
        if (res !== false && !(opts.onButton && opts.keepOpen)) close(res);
      });
    });

    if (opts.onMount) opts.onMount(back, close);
    var f = $('[data-autofocus]', back);
    if (f) setTimeout(function () { f.focus(); }, 80);
    return close;
  }

  function confirmBox(title, msg, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = false;
      modal({
        title: title,
        body: '<p style="color:var(--text-dim);font-size:14px">' + esc(msg) + '</p>',
        buttons: [
          { label: 'Cancelar' },
          { label: okLabel || 'Confirmar', cls: danger ? 'btn-danger' : 'btn-primary' }
        ],
        onButton: function (i, back, close) {
          done = true; resolve(i === 1);
        },
        onClose: function () { if (!done) resolve(false); }
      });
    });
  }

  /* ---------------- tarjeta de vídeo ---------------- */
  function videoCard(v, opts) {
    opts = opts || {};
    var pct = v.duration ? Math.min(100, Math.round((v.progress / v.duration) * 100)) : 0;
    var resume = (v.progress > 15 && v.duration && pct < 96) ? pct : 0;
    var dur = v.duration ? YT.fmtDuration(v.duration) : '';
    var left = v.duration && v.duration > 0 ? (v.duration - (v.progress || 0)) : 0;

    return '' +
      '<article class="card" data-vid="' + esc(v.id) + '" tabindex="0">' +
        '<div class="thumb">' +
          '<img data-thumb="' + esc(v.id) + '" alt="" loading="lazy" decoding="async">' +
          (dur ? '<span class="badge">' + dur + '</span>' : '') +
          '<div class="flags">' +
            (v.fav ? '<span class="flag star">★</span>' : '') +
            (v.watched ? '<span class="flag done">✓ visto</span>' : '') +
          '</div>' +
          (resume ? '<div class="resume"><i style="width:' + resume + '%"></i></div>' : '') +
          '<span class="play">' + icon('play', 20) + '</span>' +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-title">' + esc(v.title) + '</div>' +
          '<div class="card-sub">' +
            '<span>' + esc(v.channel) + '</span>' +
            (opts.hideList !== true && v.listId && Store.getList(v.listId)
              ? '<i class="dot"></i><span>' + esc(Store.getList(v.listId).icon + ' ' + Store.getList(v.listId).name) + '</span>' : '') +
            (left > 30 ? '<i class="dot"></i><span class="tagpill">queda ' + YT.fmtDuration(left) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="card-tools">' +
          '<button class="tool ' + (v.fav ? 'on' : '') + '" data-act="fav" title="Favorito" aria-label="Favorito">' + icon('star', 18) + '</button>' +
          '<button class="tool ' + (v.watched ? 'on-done' : '') + '" data-act="watched" title="Marcar como visto" aria-label="Marcar como visto">' + icon('check', 18) + '</button>' +
          '<button class="tool" data-act="more" title="Más opciones" aria-label="Más opciones">' + icon('more', 18) + '</button>' +
        '</div>' +
      '</article>';
  }

  function videoGrid(videos, opts) {
    if (!videos.length) return emptyState(opts && opts.empty);
    var cls = 'grid ' + ((Store.get('view') === 'row') ? 'row' : (Store.get('view') === 'dense' ? 'dense' : ''));
    return '<div class="' + cls + '">' + videos.map(function (v) { return videoCard(v, opts); }).join('') + '</div>';
  }

  function emptyState(cfg) {
    cfg = cfg || {};
    return '<div class="empty">' +
      '<div class="ic">' + icon(cfg.icon || 'play', 30) + '</div>' +
      '<h3>' + esc(cfg.title || 'Nada por aquí todavía') + '</h3>' +
      '<p>' + esc(cfg.text || 'Añade vídeos de YouTube para empezar.') + '</p>' +
      '<button class="btn btn-primary" data-empty-add>' + icon('plus', 16) + ' Añadir vídeos</button>' +
    '</div>';
  }

  function sectionHead(title, count, action) {
    return '<div class="section-head"><h2>' + esc(title) + '</h2>' +
      (count != null ? '<span class="count">' + count + '</span>' : '') +
      '<span class="spacer"></span>' +
      (action ? '<a class="link" href="' + esc(action.href) + '">' + esc(action.label) + '</a>' : '') +
    '</div>';
  }

  /* ---------------- filtros ---------------- */
  function setFilters(items, onPick) {
    if (!filterBar) return;
    if (!items || !items.length) { filterBar.hidden = true; return; }
    filterBar.hidden = false;
    chipBox.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.className = 'chip';
      b.setAttribute('aria-pressed', it.active ? 'true' : 'false');
      b.innerHTML = (it.icon ? '<span>' + esc(it.icon) + '</span>' : '') +
        '<span>' + esc(it.label) + '</span>' + (it.count != null ? '<b>' + it.count + '</b>' : '');
      b.addEventListener('click', function () { onPick(it.id); });
      chipBox.appendChild(b);
    });
  }

  /* ---------------- rutas ---------------- */
  function parseRoute() {
    var h = (location.hash || '#/').replace(/^#/, '');
    var parts = h.split('/').filter(function (x) { return x !== ''; });
    return { name: parts[0] || 'inicio', arg: parts[1] || '', arg2: parts[2] || '' };
  }

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  /* ---------------- vistas ---------------- */
  function viewHome() {
    var st = Store.stats();
    var cw = Store.continueWatching();
    var rec = Store.recent(12);
    var favs = Store.favorites().slice(0, 8);
    var html = '';

    html += '<div class="hero">' +
      '<h1>Tu biblioteca de YouTube</h1>' +
      '<p>Añade enlaces, organízalos en listas y escúchalos en el móvil, incluso con la pantalla bloqueada.</p>' +
      '<div class="hero-stats">' +
        '<div class="hero-stat"><b>' + st.total + '</b><span>Vídeos</span></div>' +
        '<div class="hero-stat"><b>' + st.lists + '</b><span>Listas</span></div>' +
        '<div class="hero-stat"><b>' + esc(YT.fmtDurationShort(st.seconds) || '0 min') + '</b><span>Duración</span></div>' +
        '<div class="hero-stat"><b>' + st.watched + '</b><span>Vistos</span></div>' +
      '</div>' +
    '</div>';

    if (!st.total) {
      html += emptyState({
        title: 'Empieza con tu primer vídeo',
        text: 'Copia un enlace de YouTube y pégalo. También puedes pegar varios enlaces, uno por línea.',
        icon: 'plus'
      });
      return html;
    }

    if (cw.length) {
      html += '<section class="section">' + sectionHead('Continuar viendo', cw.length) +
        '<div class="grid">' + cw.map(function (v) { return videoCard(v, { hideList: true }); }).join('') + '</div></section>';
    }
    if (favs.length) {
      html += '<section class="section">' + sectionHead('Favoritos', favs.length, { href: '#/favoritos', label: 'Ver todos' }) +
        '<div class="grid">' + favs.map(function (v) { return videoCard(v); }).join('') + '</div></section>';
    }
    if (rec.length) {
      html += '<section class="section">' + sectionHead('Añadidos recientemente', rec.length) +
        videoGrid(rec) + '</section>';
    }
    return html;
  }

  function viewLists() {
    var lists = Store.getState().lists.slice().sort(function (a, b) { return a.createdAt - b.createdAt; });
    var total = Store.stats().total;
    var html = '<div class="section-head"><h2>Listas</h2><span class="count">' + lists.length + '</span>' +
      '<span class="spacer"></span><a class="link" href="#" data-new-list>Nueva lista</a></div>';
    if (!lists.length) return html + emptyState({ title: 'Crea tu primera lista', text: 'Agrupa vídeos por tema: música, tutoriales, conferencias, cosas para ver luego…', icon: 'list' });

    html += '<div class="listcards">' + lists.map(function (l) {
      var n = Store.countList(l.id);
      return '<article class="listcard" data-list="' + esc(l.id) + '" tabindex="0" role="button">' +
        '<div class="emoji" style="background:linear-gradient(135deg,' + esc(l.color) + ',' + shade(l.color, 35) + ')">' + esc(l.icon) + '</div>' +
        '<div class="info"><b>' + esc(l.name) + '</b><span>' + n + (n === 1 ? ' vídeo' : ' vídeos') + '</span></div>' +
        '<button class="tool" data-act="list-menu" data-list="' + esc(l.id) + '" aria-label="Opciones">' + icon('more', 18) + '</button>' +
      '</article>';
    }).join('') + '</div>';

    html += '<div class="section" style="margin-top:22px"><div class="callout">' + icon('info', 16) +
      '<div>Tienes <b>' + total + '</b> vídeos guardados. Para mover uno de lista, pulsa los <b>puntos suspensivos (⋯)</b> de su tarjeta y elige la lista de destino.</div></div></div>';
    return html;
  }

  function shade(hex, pct) {
    try {
      var n = parseInt(String(hex).replace('#', ''), 16);
      if (isNaN(n)) return hex;
      var k = pct / 100;
      var r = Math.min(255, Math.round(((n >> 16) & 255) * (1 + k)));
      var g = Math.min(255, Math.round(((n >> 8) & 255) * (1 + k)));
      var b = Math.min(255, Math.round((n & 255) * (1 + k)));
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } catch (e) { return hex; }
  }

  function viewList(id) {
    var l = Store.getList(id);
    if (!l) return emptyState({ title: 'Lista no encontrada', text: 'Puede que se haya borrado.', icon: 'list' });
    var vids = Store.listVideos(id);
    var html = '<div class="section-head">' +
      '<h2>' + esc(l.icon) + ' ' + esc(l.name) + '</h2>' +
      '<span class="count">' + vids.length + '</span><span class="spacer"></span>' +
      '<a class="link" href="#" data-list-menu="' + esc(l.id) + '">Opciones</a></div>';
    if (vids.length) {
      html += '<div class="player-acts" style="margin:0 0 16px">' +
        '<button class="btn btn-primary" data-play-all="' + esc(l.id) + '">' + icon('play', 15) + ' Reproducir todo</button>' +
        '<button class="btn" data-shuffle="' + esc(l.id) + '">' + icon('replay', 15) + ' Aleatorio</button>' +
      '</div>';
    }
    return html + videoGrid(vids, {
      empty: { title: 'Esta lista está vacía', text: 'Añade vídeos y aparecerán aquí.', icon: l.icon }
    });
  }

  function viewFavs() {
    var v = Store.favorites();
    return sectionHead('Favoritos', v.length) + videoGrid(v, {
      empty: { title: 'Sin favoritos', text: 'Pulsa la estrella en un vídeo para guardarlo aquí.', icon: 'star' }
    });
  }

  function viewPending() {
    var v = Store.unwatched();
    return sectionHead('Pendientes', v.length) + videoGrid(v, {
      empty: { title: 'Nada pendiente', text: 'Has visto todo lo que tienes guardado. ¡Enhorabuena!', icon: 'checkCircle' }
    });
  }

  function viewSearch(q) {
    var res = Store.search(q);
    return sectionHead('Resultados', res.length) + videoGrid(res, {
      empty: { title: 'Sin resultados', text: 'No encontramos nada para «' + q + '».', icon: 'note' }
    });
  }

  function viewAll() {
    var v = Store.all().slice().sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
    return sectionHead('Todos los vídeos', v.length) + videoGrid(v, {
      empty: { title: 'Biblioteca vacía', text: 'Añade tu primer enlace de YouTube.', icon: 'play' }
    });
  }

  /* ---------------- vista reproductor ---------------- */
  function viewPlayer(id) {
    var v = Store.getVideo(id);
    if (!v) return emptyState({ title: 'Vídeo no encontrado', text: 'Puede que se haya eliminado.', icon: 'play' });
    var q = (openCtx.queue && openCtx.queue.length) ? openCtx.queue : [v];
    var html = '';

    html += '<div class="stage-spacer"></div>';
    html += '<div class="player-head">' +
      '<button class="icon-btn" data-back aria-label="Volver">' +
        '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M14.7 5.3 8 12l6.7 6.7 1.4-1.4L10.8 12l5.3-5.3z"/></svg></button>' +
      '<div style="min-width:0"><div class="player-title">' + esc(v.title) + '</div>' +
      '<div class="player-author">' + esc(v.channel) + '</div></div></div>';

    html += '<div class="player-acts">' +
      '<button class="btn ' + (v.fav ? 'btn-primary' : '') + '" data-pv="fav">' + icon('star', 15) + ' ' + (v.fav ? 'En favoritos' : 'Favorito') + '</button>' +
      '<button class="btn" data-pv="watched">' + icon('check', 15) + ' ' + (v.watched ? 'Visto' : 'Marcar visto') + '</button>' +
      '<button class="btn" data-pv="edit">' + icon('edit', 15) + ' Editar</button>' +
      '<a class="btn" href="' + esc(v.url) + '" target="_blank" rel="noopener">' + icon('external', 15) + ' YouTube</a>' +
      '<button class="btn" data-pv="share">' + icon('share', 15) + ' Compartir</button>' +
      '<button class="btn" data-pv="sleep">' + icon('timer', 15) + ' <span data-sleep-label>' + (Player.sleepRemaining() ? sleepLabel() : 'Temporizador') + '</span></button>' +
    '</div>';

    html += '<div class="panel"><h3>Notas</h3>' +
      '<textarea class="input sans notes" data-notes placeholder="Ideas, resumen, timestamps… (se guarda solo)">' + esc(v.notes || '') + '</textarea></div>';

    if (q.length > 1) {
      html += '<div class="panel"><h3>En esta lista · ' + q.length + '</h3><div class="stack">' +
        q.map(function (x, i) {
          return '<div class="queue-item ' + (x.id === v.id ? 'current' : '') + '" data-queue="' + i + '">' +
            '<img data-thumb="' + esc(x.id) + '" data-ti="1" alt="" loading="lazy">' +
            '<div class="q"><b>' + esc(x.title) + '</b><span>' + esc(x.channel) + '</span></div>' +
            '<span class="count">' + (x.duration ? YT.fmtDuration(x.duration) : '') + '</span></div>';
        }).join('') + '</div></div>';
    }

    return html;
  }

  function sleepLabel() {
    var ms = Player.sleepRemaining();
    var m = Math.ceil(ms / 60000);
    return '⏱ ' + m + ' min';
  }

  /* ---------------- ajustes ---------------- */
  function switchRow(key, title, desc) {
    return '<div class="switch-row" data-setting="' + key + '" role="button" tabindex="0">' +
      '<span class="switch" role="switch" aria-checked="' + (Store.get(key) ? 'true' : 'false') + '"></span>' +
      '<span class="txt"><b>' + esc(title) + '</b><span>' + esc(desc) + '</span></span></div>';
  }
  function viewSettings() {
    var st = Store.stats();
    var html = '';

    html += '<div class="section-head"><h2>Ajustes</h2></div>';

    html += '<div class="row-card"><h3>Reproducción</h3>' +
      switchRow('autoplay', 'Reproducción automática', 'Empezar solo al abrir un vídeo') +
      switchRow('autoplayNext', 'Siguiente automático', 'Saltar al siguiente vídeo de la lista al terminar') +
      switchRow('pauseWhenHidden', 'Pausar al salir', 'Pausa si sales de la app (no recomendado)') +
      '</div>';

    html += '<div class="row-card"><h3>Apariencia</h3>' +
      '<div class="r"><span class="txt"><b>Tema</b><span>Oscuro, claro o automático</span></span>' +
      '<select class="input" data-select="theme" style="width:auto;min-width:130px">' +
        ['auto', 'dark', 'light'].map(function (t) {
          return '<option value="' + t + '"' + (Store.get('theme') === t ? ' selected' : '') + '>' +
            ({ auto: 'Automático', dark: 'Oscuro', light: 'Claro' })[t] + '</option>';
        }).join('') + '</select></div>' +
      '<div class="r"><span class="txt"><b>Vista de tarjetas</b><span>Cómo se muestran los vídeos</span></span>' +
      '<select class="input" data-select="view" style="width:auto;min-width:130px">' +
        ['grid', 'dense', 'row'].map(function (t) {
          return '<option value="' + t + '"' + (Store.get('view') === t ? ' selected' : '') + '>' +
            ({ grid: 'Normal', dense: 'Compacta', row: 'Lista' })[t] + '</option>';
        }).join('') + '</select></div>' +
      '</div>';

    html += '<div class="row-card"><h3>Tus datos</h3>' +
      '<div class="r"><span class="txt"><b>Vídeos guardados</b><span>' + st.total + ' · ' + st.lists + ' listas · ' + YT.fmtDurationShort(st.seconds) + '</span></span>' +
      '<button class="btn" data-act="backup">' + icon('download', 15) + ' Copia</button></div>' +
      '<div class="r"><span class="txt"><b>Restaurar / importar</b><span>Desde un archivo JSON de copia</span></span>' +
      '<button class="btn" data-act="restore">' + icon('upload', 15) + ' Importar</button></div>' +
      '<div class="r"><span class="txt"><b>Clave de API de YouTube</b><span>Opcional: duraciones reales e importar playlists</span></span>' +
      '<button class="btn" data-act="apikey">' + icon('key', 15) + ' Configurar</button></div>' +
      '<div class="r"><span class="txt"><b>Borrar todo</b><span>Elimina vídeos y listas de este dispositivo</span></span>' +
      '<button class="btn btn-danger" data-act="wipe">' + icon('trash', 15) + ' Borrar</button></div>' +
      '</div>';

    html += '<div class="row-card"><h3>Ayuda</h3>' +
      '<div class="r"><span class="txt"><b>Escuchar con el móvil bloqueado</b><span>Guía paso a paso</span></span>' +
      '<button class="btn" data-act="help">' + icon('info', 15) + ' Ver guía</button></div>' +
      '<div class="r"><span class="txt"><b>Anuncios en los vídeos</b><span>Qué se puede y qué no</span></span>' +
      '<button class="btn" data-act="ads">' + icon('info', 15) + ' Consultar</button></div>' +
      '<div class="r"><span class="txt"><b>Atajos de teclado</b><span>En Mac o con teclado externo</span></span>' +
      '<button class="btn" data-act="shortcuts">Ver</button></div>' +
      '<div class="r"><span class="txt"><b>Acerca de</b><span>Mis Videos · biblioteca personal</span></span></div>' +
      '</div>';

    return html;
  }

  /* ---------------- render principal ---------------- */
  function render() {
    var r = parseRoute();
    var html = '';
    var isPlayer = false;
    searchQuery = '';

    switch (r.name) {
      case 'listas': html = viewLists(); break;
      case 'lista': html = viewList(r.arg); break;
      case 'favoritos': html = viewFavs(); break;
      case 'pendientes': html = viewPending(); break;
      case 'todos': html = viewAll(); break;
      case 'ajustes': html = viewSettings(); break;
      case 'buscar': searchQuery = decodeURIComponent(r.arg || ''); html = viewSearch(searchQuery); break;
      case 'ver': html = viewPlayer(r.arg); isPlayer = true; break;
      default: html = viewHome();
    }

    view.className = 'view' + (isPlayer ? ' player-view' : '');
    view.innerHTML = html;
    initThumbs(view);

    // filtros contextuales
    var lists = Store.getState().lists;
    if (r.name === 'inicio' && lists.length > 1) {
      var al = activeListFilter;
      if (al !== 'all' && !Store.getList(al)) al = activeListFilter = 'all';
      setFilters(
        [{ id: 'all', label: 'Todo', icon: '▦', count: Store.stats().total, active: al === 'all' }].concat(
          lists.slice(0, 8).map(function (l) {
            return { id: l.id, label: l.name, icon: l.icon, count: Store.countList(l.id), active: al === l.id };
          })),
        function (id) { activeListFilter = id; render(); }
      );
      if (al !== 'all') {
        view.insertAdjacentHTML('beforeend',
          '<section class="section">' + sectionHead('Lista · ' + Store.getList(al).name) +
          videoGrid(Store.listVideos(al)) + '</section>');
        initThumbs(view);
      }
    } else setFilters(null);

    if (fab) fab.classList.toggle('hide', isPlayer);
    updateStage(isPlayer, r.name === 'ver' ? r.arg : null);
    syncTabs(r.name);
    syncMiniPlayer();
  }

  function updateStage(on, videoId) {
    var stage = document.getElementById('stage');
    if (!stage) return;
    if (on) {
      stage.classList.add('on');
      stage.classList.remove('parked');
      var v = videoId ? Store.getVideo(videoId) : null;
      if (v && (!Player.current || Player.current.id !== v.id)) {
        var q = (openCtx.queue && openCtx.queue.length) ? openCtx.queue : [v];
        var idx = q.indexOf(v);
        if (idx < 0) { q = [v]; idx = 0; }
        Player.setQueue(q, idx);
        Player.load(v, v.progress > 15 && v.duration ? v.progress : 0, true);
      }
    } else {
      stage.classList.remove('on');
      stage.classList.add('parked');
    }
  }

  function syncTabs(name) {
    var map = { inicio: '/', listas: '/listas', lista: '/listas', favoritos: '/favoritos', pendientes: '/pendientes', ajustes: '/ajustes' };
    $$('.tab').forEach(function (t) {
      var key = (t.getAttribute('data-tab') || '').replace('/', '');
      if (name === key || map[name] === t.getAttribute('data-tab')) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
  }

  /* ---------------- mini reproductor ---------------- */
  function syncMiniPlayer() {
    var mp = document.getElementById('miniplayer');
    if (!mp) return;
    var v = Player.current;
    var r = parseRoute();
    var show = !!v && r.name !== 'ver';
    mp.hidden = !show;
    if (fab) fab.classList.toggle('raised', show && !fab.classList.contains('hide'));
    if (show) {
      var img = document.getElementById('miniThumb');
      img.src = thumbUrl(v.id, 1);
      img.setAttribute('data-thumb', v.id);
      document.getElementById('miniTitle').textContent = v.title;
      document.getElementById('miniSub').textContent = v.channel || '';
    }
  }

  /* ---------------- añadir vídeos ---------------- */
  function addModal() {
    var lists = Store.getState().lists;
    var body =
      '<div class="callout">' + icon('info', 16) +
        '<div>Pega uno o varios enlaces de YouTube (uno por línea). También vale el ID suelto o la URL de una playlist.</div></div>' +
      '<div class="field"><label>Enlaces</label>' +
        '<textarea class="input" data-links placeholder="https://www.youtube.com/watch?v=..." data-autofocus></textarea>' +
        '<span class="hint">Pega y guardamos título, canal y miniatura automáticamente.</span></div>' +
      '<div class="field"><label>Guardar en la lista</label>' +
        '<select class="input" data-list>' + lists.map(function (l) {
          return '<option value="' + esc(l.id) + '"' + (l.id === Store.defaultList().id ? ' selected' : '') + '>' + esc(l.icon + ' ' + l.name) + '</option>';
        }).join('') + '</select></div>' +
      '<div class="progress-line" style="display:none"><i></i></div>' +
      '<div class="log" data-log></div>' +
      '<button class="btn btn-ghost btn-block" data-paste>' + icon('link', 15) + ' Pegar desde el portapapeles</button>';

    modal({
      title: 'Añadir vídeos',
      body: body,
      buttons: [{ label: 'Cancelar' }, { label: 'Añadir', cls: 'btn-primary' }],
      keepOpen: true,
      onMount: function (back) {
        var ta = $('[data-links]', back);
        $('[data-paste]', back).addEventListener('click', function () {
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function (t) {
              ta.value = ta.value ? ta.value + '\n' + t : t;
              ta.focus();
            }).catch(function () { toast('Safari no permite leer el portapapeles aquí. Pega con ⌘/Ctrl+V.', 'err'); });
          } else toast('Usa ⌘V o Ctrl+V para pegar.', 'info');
        });
      },
      onButton: function (i, back, close) {
        if (i !== 1) return;
        var raw = $('[data-links]', back).value || '';
        var listId = $('[data-list]', back).value;
        var btn = $('[data-mi="1"]', back);
        var lines = raw.split(/\s*\n\s*/).map(function (s) { return s.trim(); }).filter(Boolean);
        var items = [], seen = {};
        lines.forEach(function (ln) {
          // separa varios enlaces pegados en una sola línea
          ln.split(/\s+/).forEach(function (part) {
            var id = YT.extractId(part);
            if (id && !seen[id]) { seen[id] = 1; items.push({ id: id, url: YT.canonical(id) }); }
          });
        });
        var plist = YT.extractListId(raw);
        if (!items.length) {
          if (plist) { playlistImport(plist); close(true); return; }
          toast('No detecté ningún enlace de YouTube válido.', 'err');
          return;
        }
        btn.disabled = true;
        btn.textContent = 'Obteniendo datos…';
        var bar = $('.progress-line', back), fill = $('i', bar), log = $('[data-log]', back);
        bar.style.display = 'block';
        var done = 0;
        Promise.all(items.map(function (it) {
          return YT.metadata(it.id).then(function (m) {
            done++;
            fill.style.width = Math.round(done / items.length * 100) + '%';
            return m;
          });
        })).then(function (metas) {
          var res = Store.addVideos(metas, listId);
          close(true);
          if (res.added.length) {
            toast(res.added.length + (res.added.length === 1 ? ' vídeo añadido' : ' vídeos añadidos'), 'ok');
            render();
          } else {
            toast('Todos los vídeos ya estaban en tu biblioteca.', 'info');
          }
          if (res.dup.length) log.innerHTML += '<div class="err">' + res.dup.length + ' ya existían</div>';
        }).catch(function (e) {
          btn.disabled = false; btn.textContent = 'Añadir';
          toast('Error al obtener los datos: ' + e.message, 'err');
        });
      }
    });
  }

  function playlistImport(listId) {
    var key = Store.get('apiKey');
    modal({
      title: 'Importar playlist',
      body: '<div class="callout warn">' + icon('key', 16) +
        '<div>Para leer una playlist de YouTube hace falta una <b>clave de API</b> gratuita. <br>' +
        (key ? 'Ya tienes una clave configurada.' : 'Puedes configurarla en Ajustes → Clave de API.') + '</div></div>' +
        '<div class="field"><label>Enlace o ID de la playlist</label>' +
        '<input class="input" value="' + esc(listId) + '" data-pl readonly></div>',
      buttons: [{ label: 'Cancelar' }, { label: 'Importar', cls: 'btn-primary' }],
      onButton: function (i, back, close) {
        if (i !== 1) return;
        if (!key) { toast('Primero configura una clave de API.', 'err'); return; }
        var bar = $('.progress-line', back);
        YT.playlistItems(listId, key, function (n) { toast('Descargados ' + n + ' vídeos…', 'info', 800); }).then(function (items) {
          Store.addVideos(items, Store.defaultList().id);
          close(true);
          toast(items.length + ' vídeos importados', 'ok');
          go('#/lista/' + Store.defaultList().id);
        }).catch(function (e) { toast(e.message, 'err', 5000); });
      }
    });
  }

  /* ---------------- editar vídeo ---------------- */
  function editVideoModal(vid) {
    var v = Store.getVideo(vid);
    if (!v) return;
    var lists = Store.getState().lists;
    var body =
      '<div class="field"><label>Título</label><input class="input" data-title data-autofocus value="' + esc(v.title) + '"></div>' +
      '<div class="field"><label>Canal</label><input class="input" data-chan value="' + esc(v.channel) + '"></div>' +
      '<div class="field"><label>Etiquetas</label><input class="input" data-tags value="' + esc((v.tags || []).join(', ')) + '" placeholder="música, para luego"></div>' +
      '<div class="field"><label>Lista</label><select class="input" data-list>' + lists.map(function (l) {
        return '<option value="' + esc(l.id) + '"' + (l.id === v.listId ? ' selected' : '') + '>' + esc(l.icon + ' ' + l.name) + '</option>';
      }).join('') + '</select></div>' +
      '<div class="field"><label>Notas</label><textarea class="input sans" data-notes>' + esc(v.notes || '') + '</textarea></div>';

    modal({
      title: 'Editar vídeo',
      body: body,
      buttons: [
        { label: 'Eliminar', cls: 'btn-danger' },
        { label: 'Cancelar' },
        { label: 'Guardar', cls: 'btn-primary' }
      ],
      onButton: function (i, back) {
        if (i === 0) {
          confirmBox('Eliminar vídeo', 'Se quitará de tu biblioteca. ¿Seguro?', 'Eliminar', true).then(function (ok) {
            if (ok) { Store.removeVideo(vid); toast('Vídeo eliminado'); go('#/todos'); render(); }
          });
          return false;
        }
        if (i !== 2) return;
        Store.updateVideo(vid, {
          title: $('[data-title]', back).value.trim() || v.title,
          channel: $('[data-chan]', back).value.trim(),
          tags: $('[data-tags]', back).value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
          listId: $('[data-list]', back).value,
          notes: $('[data-notes]', back).value
        });
        toast('Guardado', 'ok');
        render();
      }
    });
  }

  /* ---------------- menú contextual de vídeo ---------------- */
  function videoMenu(vid, x, y) {
    var v = Store.getVideo(vid);
    if (!v) return;
    var lists = Store.getState().lists;
    var items =
      '<button class="btn btn-primary btn-block" data-m="play">' + icon('play', 15) + ' Reproducir ahora</button>' +
      '<button class="btn btn-block" data-m="fav">' + icon('star', 15) + (v.fav ? ' Quitar de favoritos' : ' Añadir a favoritos') + '</button>' +
      '<button class="btn btn-block" data-m="watched">' + icon('check', 15) + (v.watched ? ' Marcar como no visto' : ' Marcar como visto') + '</button>' +
      '<div class="field" style="margin-top:6px"><label>Mover a la lista</label><div class="picklist">' +
        lists.map(function (l) {
          return '<div class="pick" role="checkbox" aria-checked="' + (l.id === v.listId) + '" data-move="' + esc(l.id) + '">' +
            '<span class="box">' + (l.id === v.listId ? icon('check', 13) : '') + '</span><span>' + esc(l.icon + ' ' + l.name) + '</span></div>';
        }).join('') +
      '</div></div>' +
      '<div class="field"><label>Etiquetas</label><div class="key" style="flex-wrap:wrap">' +
        (v.tags || []).map(function (t) {
          return '<span class="chip" data-tag="' + esc(t) + '">' + esc(t) + ' ✕</span>';
        }).join('') + '<span class="hint">Añádelas editando el vídeo</span></div></div>' +
      '<button class="btn btn-block" data-m="edit">' + icon('edit', 15) + ' Editar detalles</button>' +
      '<a class="btn btn-block" href="' + esc(v.url) + '" target="_blank" rel="noopener">' + icon('external', 15) + ' Abrir en YouTube</a>' +
      '<button class="btn btn-block" data-m="share">' + icon('share', 15) + ' Compartir enlace</button>' +
      '<button class="btn btn-block" data-m="copy">' + icon('link', 15) + ' Copiar enlace</button>' +
      '<button class="btn btn-danger btn-block" data-m="del">' + icon('trash', 15) + ' Eliminar de la biblioteca</button>';

    var close = modal({
      title: 'Opciones del vídeo',
      body: items,
      buttons: [{ label: 'Cerrar' }],
      onMount: function (back) {
        back.addEventListener('click', function (e) {
          var mv = e.target.closest('[data-move]');
          if (mv) {
            Store.updateVideo(vid, { listId: mv.getAttribute('data-move') });
            toast('Movido a ' + Store.getList(mv.getAttribute('data-move')).name, 'ok');
            close();
            render();
            return;
          }
          var b = e.target.closest('[data-m]');
          if (!b) return;
          var a = b.getAttribute('data-m');
          if (a === 'play') { playVideo(vid, null, 0); close(); }
          else if (a === 'fav') { Store.toggleFav(vid); close(); render(); }
          else if (a === 'watched') { Store.toggleWatched(vid); close(); render(); }
          else if (a === 'edit') { editVideoModal(vid); close(); }
          else if (a === 'share') { shareVideo(v); close(); }
          else if (a === 'copy') { copyText(v.url, 'Enlace copiado'); close(); }
          else if (a === 'del') {
            confirmBox('Eliminar vídeo', 'Se quitará de tu biblioteca.', 'Eliminar', true).then(function (ok) {
              if (ok) { Store.removeVideo(vid); toast('Vídeo eliminado'); render(); }
            });
            close();
          }
        });
      }
    });
  }

  /* ---------------- acciones auxiliares ---------------- */
  function copyText(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(function () { toast(msg || 'Copiado', 'ok'); })
        .catch(function () { fallbackCopy(text, msg); });
    } else fallbackCopy(text, msg);
  }
  function fallbackCopy(text, msg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(msg || 'Copiado', 'ok'); }
    catch (e) { toast('No se pudo copiar', 'err'); }
    document.body.removeChild(ta);
  }
  function shareVideo(v) {
    var data = { title: v.title, text: v.title, url: v.url };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else copyText(v.url, 'Enlace copiado');
  }
  function playVideo(vid, queue, index) {
    var v = Store.getVideo(vid);
    if (!v) return;
    var q = queue;
    if (!q || !q.length) {
      q = v.listId ? Store.listVideos(v.listId) : Store.all();
      if (!q.length) q = [v];
    }
    var idx = q.findIndex(function (x) { return x.id === vid; });
    if (idx < 0) { q = [v]; idx = 0; }
    openCtx = { queue: q, index: idx };
    Player.setQueue(q, idx);
    go('#/ver/' + vid);
  }

  /* ---------------- modales de ajustes ---------------- */
  function helpModal() {
    modal({
      title: 'Escuchar con el móvil bloqueado',
      body:
        '<div class="callout warn">' + icon('info', 16) +
          '<div><b>Lo primero que hay que mirar:</b> si el vídeo se para al bloquear, casi siempre es el ' +
          '<b>Modo Ahorro de Energía</b>. iOS corta el audio en segundo plano cuando está activo.</div></div>' +
        '<div class="steps">' +
          '<div class="step"><div><b>Instálalo como app.</b> Abre la web en Safari → <b>Compartir</b> → ' +
            '<b>Añadir a pantalla de inicio</b>. Sin la barra de Safari funciona mucho mejor.</div></div>' +
          '<div class="step"><div><b>Desactiva el Modo Ahorro de Energía.</b> En ' +
            '<b>Ajustes → Batería</b>, desactiva el interruptor. Con él activado, iOS detiene el audio ' +
            'en cuanto bloqueas la pantalla.</div></div>' +
          '<div class="step"><div><b>Reproduce y bloquea.</b> Dale al play y bloquea con el botón lateral o ' +
            'el Face ID. La música sigue sonando.</div></div>' +
          '<div class="step"><div><b>Controles en el candado:</b> verás pausa, saltar y el título del vídeo.</div></div>' +
        '</div>' +
        '<div class="panel"><h3>Si sigue sin sonar</h3><div class="stack">' +
          '<div class="step"><div><b>¿La estás usando como app instalada?</b> Abrirla en una pestaña normal ' +
            'de Safari suele cortar el audio al bloquear.</div></div>' +
          '<div class="step"><div><b>¿El canal permite reproductores incrustados?</b> Algunas señales de TV ' +
            'y ciertos canales los bloquean, y esos vídeos no se pueden oír aquí: pulsa <b>YouTube</b> para ' +
            'abrirlo en la app oficial, donde sí suena en segundo plano.</div></div>' +
        '</div></div>' +
        '<div class="callout">' + icon('timer', 16) +
          '<div>¿Te duermes? Usa el botón <b>Temporizador</b> en la ficha del vídeo: pausa automáticamente a los 15, 30, 45 o 60 minutos, o al terminar el vídeo.</div></div>',
      buttons: [{ label: 'Entendido', cls: 'btn-primary' }]
    });
  }

  /* ---------------- anuncios ---------------- */
  function adsModal() {
    modal({
      title: 'Anuncios en los vídeos',
      body:
        '<div class="callout warn">' + icon('info', 16) +
          '<div><b>Los anuncios los pone YouTube, no esta app.</b> Van dentro del vídeo que tú has ' +
          'añadido, así que esta página no puede quitarlos.</div></div>' +
        '<div class="callout">' + icon('checkCircle', 16) +
          '<div><b>Lo que sí se puede controlar</b> (ya aplicado, no hay más que se pueda hacer):</div></div>' +
        '<div class="steps">' +
          '<div class="step"><div><b>Sin el botón de YouTube</b> ni el logo flotando sobre el vídeo ' +
            '(parámetro <code>modestbranding</code>).</div></div>' +
          '<div class="step"><div><b>Sin vídeos relacionados</b> al terminar, que es donde más estorban ' +
            '(parámetro <code>rel=0</code>).</div></div>' +
          '<div class="step"><div><b>Sin anotaciones</b> ni flechas del creador encima del vídeo ' +
            '(parámetro <code>iv_load_policy=3</code>).</div></div>' +
        '</div>' +
        '<div class="callout">' + icon('info', 16) +
          '<div><b>Sobre los anuncios que salen antes o durante el vídeo:</b> los decide el servidor de ' +
          'YouTube según tu cuenta y el canal. No existe ningún ajuste ni parámetro que los quite desde ' +
          'una web. La única vía que funciona es un bloqueador de anuncios instalado en el dispositivo, ' +
          'pero en iOS suele dejar de actuar en las apps instaladas.</div></div>' +
        '<div class="callout">' + icon('info', 16) +
          '<div><b>Alternativa:</b> si guardas sobre todo <b>música y podcasts</b>, los anuncios son ' +
          'mucho menos frecuentes. El temporizador y los controles de la pantalla de bloqueo funcionan ' +
          'igual de bien.</div></div>',
      buttons: [{ label: 'Entendido', cls: 'btn-primary' }]
    });
  }

  function shortcutsModal() {
    modal({
      title: 'Atajos de teclado',
      body: '<div class="stack">' +
        '<div class="key"><kbd>Espacio</kbd><span>Reproducir / pausar</span></div>' +
        '<div class="key"><kbd>←</kbd><kbd>→</kbd><span>Saltar 5 segundos</span></div>' +
        '<div class="key"><kbd>J</kbd><kbd>L</kbd><span>Saltar 10 segundos atrás / adelante</span></div>' +
        '<div class="key"><kbd>↑</kbd><kbd>↓</kbd><span>Volumen</span></div>' +
        '<div class="key"><kbd>N</kbd><span>Siguiente vídeo de la lista</span></div>' +
        '<div class="key"><kbd>P</kbd><span>Volver al vídeo anterior</span></div>' +
        '<div class="key"><kbd>F</kbd><span>Marcar como favorito</span></div>' +
        '<div class="key"><kbd>K</kbd><span>Añadir vídeos</span></div>' +
        '<div class="key"><kbd>/</kbd><span>Buscar</span></div>' +
        '<div class="key"><kbd>Esc</kbd><span>Cerrar ventana</span></div>' +
        '</div>',
      buttons: [{ label: 'Cerrar' }]
    });
  }

  function apiKeyModal() {
    modal({
      title: 'Clave de API de YouTube (opcional)',
      body: '<div class="callout">' + icon('info', 16) +
        '<div>No es obligatoria. Solo la necesitas para <b>importar playlists</b> y obtener la <b>duración exacta</b> de los vídeos. Se guarda solo en este dispositivo.</div></div>' +
        '<div class="field"><label>Clave</label><input class="input" data-key data-autofocus value="' + esc(Store.get('apiKey') || '') + '" placeholder="AIza..." inputmode="text" autocapitalize="off" autocomplete="off"></div>' +
        '<p class="hint">Cómo conseguirla gratis (2 min): entra en console.cloud.google.com → crea un proyecto → «Activar API de YouTube Data API v3» → «Credenciales» → «Crear credenciales» → «Clave de API».</p>',
      buttons: [{ label: 'Cancelar' }, { label: 'Borrar', cls: 'btn-danger' }, { label: 'Guardar', cls: 'btn-primary' }],
      onButton: function (i, back) {
        if (i === 1) { Store.setSetting('apiKey', ''); toast('Clave borrada'); return; }
        if (i !== 2) return;
        Store.setSetting('apiKey', $('[data-key]', back).value.trim());
        toast('Clave guardada en este dispositivo', 'ok');
      }
    });
  }

  function backupModal() {
    var data = Store.exportData();
    modal({
      title: 'Copia de seguridad',
      body: '<div class="callout">' + icon('info', 16) +
        '<div>Todo se guarda <b>solo en este dispositivo</b>. Si borras los datos de Safari o reinstalas, perderás la biblioteca: descarga una copia de vez en cuando.</div></div>' +
        '<div class="field"><label>Descargar archivo</label><button class="btn btn-primary btn-block" data-dl>' + icon('download', 15) + ' Guardar JSON</button></div>' +
        '<div class="field"><label>Copiar al portapapeles</label><button class="btn btn-block" data-cp>' + icon('link', 15) + ' Copiar texto</button></div>' +
        '<div class="field"><label>Tamaño</label><span class="hint">' + (new Blob([data]).size / 1024).toFixed(1) + ' KB · ' + Store.stats().total + ' vídeos</span></div>',
      buttons: [{ label: 'Cerrar' }],
      onMount: function (back) {
        $('[data-dl]', back).addEventListener('click', function () {
          var blob = new Blob([data], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'mis-videos-' + new Date().toISOString().slice(0, 10) + '.json';
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
          toast('Descarga iniciada', 'ok');
        });
        $('[data-cp]', back).addEventListener('click', function () { copyText(data, 'Copia copiada'); });
      }
    });
  }

  function restoreModal() {
    modal({
      title: 'Importar copia',
      body: '<div class="field"><label>Elige el archivo JSON</label><input class="input" type="file" accept="application/json,.json" data-file></div>' +
        '<div class="field"><label>O pega el contenido</label><textarea class="input" data-text placeholder="{ &quot;app&quot;: &quot;mis-videos&quot; ... }"></textarea></div>' +
        '<div class="callout warn">' + icon('info', 16) + '<div>Se <b>añaden</b> los vídeos que no tengas (no se borra nada de lo que ya tienes).</div></div>',
      buttons: [{ label: 'Cancelar' }, { label: 'Importar', cls: 'btn-primary' }],
      onMount: function (back) {
        $('[data-file]', back).addEventListener('change', function (e) {
          var f = e.target.files[0];
          if (!f) return;
          var fr = new FileReader();
          fr.onload = function () { $('[data-text]', back).value = fr.result; };
          fr.readAsText(f);
        });
      },
      onButton: function (i, back) {
        if (i !== 1) return;
        var txt = $('[data-text]', back).value.trim();
        if (!txt) { toast('Selecciona un archivo o pega el contenido', 'err'); return; }
        try {
          Store.importData(txt, 'merge');
          toast('Copia restaurada', 'ok');
          render();
        } catch (e) { toast('Archivo no válido: ' + e.message, 'err', 5000); }
      }
    });
  }

  function listModal(listId) {
    var lists = Store.getState().lists;
    var cur = listId ? Store.getList(listId) : null;
    modal({
      title: cur ? 'Editar lista' : 'Nueva lista',
      body: '<div class="field"><label>Nombre</label><input class="input" data-name data-autofocus value="' + esc(cur ? cur.name : '') + '" placeholder="Mis favoritos"></div>' +
        '<div class="field"><label>Icono</label><div class="chips" data-emoji>' +
          ['▶', '★', '🎧', '🎸', '📚', '🎓', '💡', '🧠', '🍳', '🏋️', '🎬', '✈️', '💻', '🌱', '❤️', '⚡'].map(function (e) {
            return '<button class="chip" data-emo="' + e + '" aria-pressed="' + ((cur ? cur.icon : '★') === e) + '">' + e + '</button>';
          }).join('') + '</div></div>' +
        '<div class="field"><label>Color</label><input class="input" type="color" data-color value="' + esc(cur ? cur.color : '#6d5cff') + '" style="height:44px;padding:4px"></div>' +
        (lists.length > 1 ? '<button class="btn btn-danger btn-block" data-del>' + icon('trash', 15) + ' Eliminar lista</button>' : ''),
      buttons: [{ label: 'Cancelar' }, { label: 'Guardar', cls: 'btn-primary' }],
      onMount: function (back) {
        var chosen = cur ? cur.icon : '★';
        $('[data-emoji]', back).addEventListener('click', function (e) {
          var b = e.target.closest('[data-emo]');
          if (!b) return;
          chosen = b.getAttribute('data-emo');
          $$('[data-emo]', back).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        });
        $('[data-del]', back).addEventListener('click', function () {
          confirmBox('Eliminar lista', 'Sus vídeos se moverán a la primera lista.', 'Eliminar', true).then(function (ok) {
            if (ok) { Store.removeList(listId); toast('Lista eliminada'); go('#/listas'); render(); }
          });
        });
        back._chosen = function () { return chosen; };
      },
      onButton: function (i, back) {
        if (i !== 1) return;
        var name = $('[data-name]', back).value.trim();
        if (!name) { toast('Ponle un nombre', 'err'); return; }
        var data = { name: name, icon: back._chosen(), color: $('[data-color]', back).value };
        if (cur) Store.updateList(listId, data); else Store.addList(data.name, data.icon, data.color);
        toast(cur ? 'Lista actualizada' : 'Lista creada', 'ok');
        go('#/listas');
        render();
      }
    });
  }

  /* ---------------- init ---------------- */
  function init() {
    view = document.getElementById('view');
    filterBar = document.getElementById('filterBar');
    chipBox = document.getElementById('filterChips');
    modalRoot = document.getElementById('modalRoot');
    toastRoot = document.getElementById('toastRoot');
    fab = document.getElementById('fab');

    // delegación de clics en la vista
    view.addEventListener('click', function (e) {
      var card = e.target.closest('.card');
      var t = e.target.closest('[data-act]');
      if (t && card) {
        e.stopPropagation();
        var act = t.getAttribute('data-act');
        if (act === 'fav') { Store.toggleFav(card.getAttribute('data-vid')); render(); return; }
        if (act === 'watched') { Store.toggleWatched(card.getAttribute('data-vid')); render(); return; }
        if (act === 'more') { videoMenu(card.getAttribute('data-vid')); return; }
      }
      if (card) {
        var vids = $$('.card').map(function (c) { return Store.getVideo(c.getAttribute('data-vid')); }).filter(Boolean);
        playVideo(card.getAttribute('data-vid'), vids, 0);
        return;
      }

      var lcard = e.target.closest('.listcard');
      if (lcard && !e.target.closest('[data-act]')) { go('#/lista/' + lcard.getAttribute('data-list')); return; }
      var lmenu = e.target.closest('[data-list-menu]');
      if (lmenu) { e.preventDefault(); listModal(lmenu.getAttribute('data-list-menu')); return; }
      if (e.target.closest('[data-new-list]')) { e.preventDefault(); listModal(null); return; }
      var pa = e.target.closest('[data-play-all]');
      if (pa) {
        var q1 = Store.listVideos(pa.getAttribute('data-play-all'));
        if (q1.length) playVideo(q1[0].id, q1, 0);
        return;
      }
      var sh = e.target.closest('[data-shuffle]');
      if (sh) {
        var q2 = Store.listVideos(sh.getAttribute('data-shuffle'));
        if (q2.length) {
          for (var i = q2.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = q2[i]; q2[i] = q2[j]; q2[j] = tmp; }
          playVideo(q2[0].id, q2, 0);
        }
        return;
      }
      if (e.target.closest('[data-empty-add]')) { addModal(); return; }
      if (e.target.closest('[data-back]')) { history.length > 1 ? history.back() : go('#/'); return; }

      var qi = e.target.closest('[data-queue]');
      if (qi) {
        var q = openCtx.queue || [];
        Player.playAt(+qi.getAttribute('data-queue'));
        render();
        return;
      }

      var pv = e.target.closest('[data-pv]');
      if (pv) {
        var vid = (parseRoute().arg);
        var a = pv.getAttribute('data-pv');
        if (a === 'fav') { Store.toggleFav(vid); }
        else if (a === 'watched') { Store.toggleWatched(vid); }
        else if (a === 'edit') { editVideoModal(vid); return; }
        else if (a === 'share') { var vv = Store.getVideo(vid); if (vv) shareVideo(vv); return; }
        else if (a === 'sleep') { sleepModal(); return; }
        render();
        return;
      }
      var sel = e.target.closest('select[data-select]');
      if (sel) return;   // gestionado en 'change'
      var sw = e.target.closest('.switch-row');
      if (sw) {
        var key = sw.getAttribute('data-setting');
        Store.setSetting(key, !Store.get(key));
        sw.querySelector('.switch').setAttribute('aria-checked', Store.get(key) ? 'true' : 'false');
        return;
      }
      var act2 = e.target.closest('[data-act]');
      if (act2 && !card) {
        var a2 = act2.getAttribute('data-act');
        if (a2 === 'backup') backupModal();
        else if (a2 === 'restore') restoreModal();
        else if (a2 === 'apikey') apiKeyModal();
        else if (a2 === 'help') helpModal();
        else if (a2 === 'ads') adsModal();
        else if (a2 === 'shortcuts') shortcutsModal();
        else if (a2 === 'wipe') {
          confirmBox('Borrar todo', 'Se eliminarán TODOS tus vídeos y listas de este dispositivo. Exporta una copia antes si quieres conservarlos.', 'Borrar todo', true)
            .then(function (ok) { if (ok) { Store.clearAll(); toast('Biblioteca vaciada'); go('#/'); } });
        } else if (a2 === 'list-menu') listModal(act2.getAttribute('data-list'));
        return;
      }
    });

    // teclado
    view.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var card = e.target.closest('.card');
      if (card) { playVideo(card.getAttribute('data-vid'), null, 0); e.preventDefault(); }
      var lcard = e.target.closest('.listcard');
      if (lcard) { go('#/lista/' + lcard.getAttribute('data-list')); e.preventDefault(); }
    });

    // change en selects
    view.addEventListener('change', function (e) {
      var sel = e.target.closest('select[data-select]');
      if (!sel) return;
      Store.setSetting(sel.getAttribute('data-select'), sel.value);
      if (sel.getAttribute('data-select') === 'theme') applyTheme();
      render();
    });

    // notas del reproductor con autoguardado
    view.addEventListener('blur', function (e) {
      var n = e.target.closest('[data-notes]');
      if (!n) return;
      var vid = parseRoute().arg;
      if (vid) { Store.updateVideo(vid, { notes: n.value }); toast('Notas guardadas', 'ok', 1400); }
    }, true);

    // evita que el zoom de iOS dispare al tocar dos veces
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    var lastTouch = 0;
    document.addEventListener('touchend', function (e) {
      var now = Date.now();
      if (now - lastTouch < 300) e.preventDefault();
      lastTouch = now;
    }, false);

    document.getElementById('fab').addEventListener('click', addModal);
    document.getElementById('addBtn').addEventListener('click', addModal);

    // barra superior
    var si = document.getElementById('searchInput');
    var sc = document.getElementById('searchClear');
    var tmr = null;
    si.addEventListener('input', function () {
      sc.hidden = !si.value;
      clearTimeout(tmr);
      tmr = setTimeout(function () {
        var q = si.value.trim();
        if (q) go('#/buscar/' + encodeURIComponent(q));
        else if (parseRoute().name === 'buscar') go('#/');
      }, 260);
    });
    sc.addEventListener('click', function () { si.value = ''; sc.hidden = true; go('#/'); si.focus(); });
    document.getElementById('themeBtn').addEventListener('click', function () {
      var order = ['auto', 'dark', 'light'];
      var cur = Store.get('theme');
      Store.setSetting('theme', order[(order.indexOf(cur) + 1) % order.length]);
      applyTheme();
      toast('Tema: ' + ({ auto: 'automático', dark: 'oscuro', light: 'claro' })[Store.get('theme')]);
    });

    // mini reproductor
    var mp = document.getElementById('miniplayer');
    document.getElementById('miniPlay').addEventListener('click', function () { Player.toggle(); });
    document.getElementById('miniPrev').addEventListener('click', function () { Player.prev(); });
    document.getElementById('miniNext').addEventListener('click', function () { Player.next(); });
    document.getElementById('miniClose').addEventListener('click', function () {
      Player.pause(); Player.stopAndClear(); syncMiniPlayer();
    });

    Player.on(function (type, data) {
      if (type === 'load') { syncMiniPlayer(); return; }
      if (type === 'state') {
        var playing = data === 'playing';
        var ico = document.getElementById('miniPlayIcon');
        if (ico) ico.innerHTML = playing ? I.pause : I.play;
        if (data === 'ended' && parseRoute().name === 'ver') render();
        return;
      }
      if (type === 'sleep') {
        var lab = $('[data-sleep-label]');
        if (lab && !data) lab.textContent = 'Temporizador';
        return;
      }
      if (type === 'error' && parseRoute().name === 'ver') {
        toast(data, 'err', 5000);
      }
    });

    // A2HS
    var a2 = document.getElementById('a2hs');
    var standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    var dismissed = Store.prefs.get('a2hs-dismissed', false);
    var isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var touchy = (navigator.maxTouchPoints || 0) > 0;
    var narrow = window.matchMedia('(max-width: 820px)').matches;
    if (isiOS && touchy && narrow && !standalone && !dismissed) {
      a2.hidden = false;
      if (!/Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent)) a2.querySelector('#a2hsText').innerHTML = 'Abre esta web en <b>Safari</b> y luego usa <b>Compartir → Añadir a pantalla de inicio</b>.';
    }
    document.getElementById('a2hsClose').addEventListener('click', function () {
      a2.hidden = true;
      Store.prefs.set('a2hs-dismissed', true);
    });

    applyTheme();
  }

  function sleepModal() {
    var opts = [[0, 'Desactivado'], [15, '15 minutos'], [30, '30 minutos'], [45, '45 minutos'], [60, '60 minutos'], [90, '90 minutos'], [120, '2 horas']];
    modal({
      title: 'Temporizador de sueño',
      body: '<div class="field"><label>Se pausa automáticamente en</label><div class="picklist">' +
        opts.map(function (o) {
          var on = Math.round(Player.sleepRemaining() / 60000) === o[0];
          return '<div class="pick" role="checkbox" aria-checked="' + (on ? 'true' : 'false') + '" data-min="' + o[0] + '">' +
            '<span class="box">' + (on ? icon('check', 13) : '') + '</span><span>' + o[1] + '</span></div>';
        }).join('') + '</div></div>' +
        '<div class="callout">' + icon('info', 16) + '<div>Con el temporizador activo el vídeo se detiene solo, pero <b>puede que siga sonando</b> si dejaste otra pestaña con la app de YouTube abierta.</div></div>',
      buttons: [{ label: 'Cerrar' }],
      onMount: function (back) {
        back.addEventListener('click', function (e) {
          var p = e.target.closest('[data-min]');
          if (!p) return;
          Player.sleep(+p.getAttribute('data-min'));
          var m = +p.getAttribute('data-min');
          toast(m ? 'Se pausará en ' + m + ' min' : 'Temporizador desactivado', 'ok');
          render();
        });
      }
    });
  }

  function applyTheme() {
    document.documentElement.setAttribute('data-theme', Store.get('theme') || 'auto');
    var dark = Store.get('theme') === 'dark' ||
      (Store.get('theme') === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var meta = document.getElementById('metaThemeColor');
    if (meta) meta.setAttribute('content', dark ? '#080b16' : '#f4f6fc');
    var btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = dark ? I.sun : I.moon;
  }

  return {
    init: init,
    render: render,
    go: go,
    toast: toast,
    modal: modal,
    confirmBox: confirmBox,
    addModal: addModal,
    helpModal: helpModal,
    adsModal: adsModal,
    listModal: listModal,
    editVideoModal: editVideoModal,
    backupModal: backupModal,
    restoreModal: restoreModal,
    apiKeyModal: apiKeyModal,
    playVideo: playVideo,
    shareVideo: shareVideo,
    copyText: copyText,
    applyTheme: applyTheme,
    parseRoute: parseRoute,
    esc: esc,
    icon: icon,
    initThumbs: initThumbs
  };
})();