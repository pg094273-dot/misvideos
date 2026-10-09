/* ============================================================
   youtube.js · parseo de URLs + metadatos (oEmbed) + duración
   ============================================================ */
window.YT = (function () {
  'use strict';

  /* Acepta: watch?v=, youtu.be/, /shorts/, /embed/, /live/, /v/,
     playlist?list=, también el ID suelto o texto con el enlace dentro */
  function extractId(input) {
    if (!input) return null;
    var raw = String(input).trim();

    // ID suelto
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;

    // normaliza protocolo-less
    var url = raw.replace(/^\s+/, '');
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url.replace(/^\/\//, '');

    var re = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /\/shorts\/([A-Za-z0-9_-]{11})/,
      /\/embed\/([A-Za-z0-9_-]{11})/,
      /\/live\/([A-Za-z0-9_-]{11})/,
      /\/v\/([A-Za-z0-9_-]{11})/,
      /\/attribution_link\?.*v%3D([A-Za-z0-9_-]{11})/
    ];
    for (var i = 0; i < re.length; i++) {
      var m = url.match(re[i]);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  function extractListId(input) {
    if (!input) return null;
    var m = String(input).match(/[?&]list=([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  }

  function extractTimestamp(input) {
    var s = String(input || '');
    var m = s.match(/[#&?]t=([0-9]+s?)/i) || s.match(/[?&]start=([0-9]+)/i);
    if (!m) return 0;
    var v = parseInt(m[1], 10);
    return isNaN(v) ? 0 : v;
  }

  function canonical(id) { return 'https://www.youtube.com/watch?v=' + id; }

  /* ---------- Metadatos vía oEmbed (con CORS) ---------- */
  var memo = {};

  function fetchJSON(url, timeout) {
    var ctrl = ('AbortController' in window) ? new AbortController() : null;
    var t = setTimeout(function () { if (ctrl) ctrl.abort(); }, timeout || 9000);
    return fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .finally(function () { clearTimeout(t); });
  }

  function metadata(id, opts) {
    opts = opts || {};
    if (memo[id]) return Promise.resolve(memo[id]);
    var targets = ['https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(canonical(id))];
    // noembed como plan B (a veces oEmbed falla por vídeo privado)
    if (opts.fallback !== false) targets.push('https://noembed.com/embed?url=' + encodeURIComponent(canonical(id)));

    function attempt(i) {
      if (i >= targets.length) {
        return {
          id: id, title: 'Vídeo ' + id, channel: 'YouTube',
          thumb: Store.thumb(id, 'hq'), duration: 0, url: canonical(id), noMeta: true
        };
      }
      return fetchJSON(targets[i]).then(function (d) {
        var res = {
          id: id,
          title: d.title || ('Vídeo ' + id),
          channel: d.author_name || 'YouTube',
          thumb: d.thumbnail_url || Store.thumb(id, 'hq'),
          duration: 0,
          url: canonical(id),
          noMeta: false
        };
        memo[id] = res;
        return res;
      }).catch(function () { return attempt(i + 1); });
    }
    return attempt(0);
  }

  /* ---------- Duración vía la API pública de inorganic (opcional, sin clave) ---------- */
  function durationFromIFrameAPI(id) {
    return new Promise(function (resolve) {
      if (!window.YT || !window.YT.Player) return resolve(0);
      var p = null;
      try {
        p = new YT.Player('yt-dur-probe', {
          videoId: id,
          playerVars: { controls: 0, disablekb: 1, fs: 0, modestbranding: 1 },
          events: {
            onReady: function (e) {
              var d = (e.target && e.target.getDuration) ? e.target.getDuration() : 0;
              setTimeout(function () { try { e.target.destroy(); } catch (x) {} resolve(d || 0); }, 200);
            },
            onError: function () { resolve(0); }
          }
        });
      } catch (e) { resolve(0); }
      setTimeout(function () { try { if (p && p.destroy) p.destroy(); } catch (x) {} resolve(0); }, 9000);
    });
  }

  /* ---------- Duración con clave de API (opcional) ---------- */
  function durationWithKey(id, key) {
    if (!key) return Promise.resolve(0);
    var u = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=' +
      encodeURIComponent(id) + '&key=' + encodeURIComponent(key);
    return fetchJSON(u).then(function (d) {
      var it = d.items && d.items[0];
      if (!it || !it.contentDetails) return 0;
      return isoDuration(it.contentDetails.duration);
    }).catch(function () { return 0; });
  }

  function isoDuration(iso) {
    if (!iso) return 0;
    var m = iso.match(/P(?:([\d.]+)D)?T?(?:([\d.]+)H)?(?:([\d.]+)M)?(?:([\d.]+)S)?/);
    if (!m) return 0;
    return Math.round((+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0));
  }

  /* ---------- Importar una playlist de YouTube (requiere clave API) ---------- */
  function playlistItems(listId, key, onProgress) {
    if (!key) return Promise.reject(new Error('Necesitas una clave de API para importar playlists.'));
    var out = [];
    function page(token) {
      var u = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=' +
        encodeURIComponent(listId) + '&key=' + encodeURIComponent(key) + (token ? '&pageToken=' + token : '');
      return fetchJSON(u).then(function (d) {
        (d.items || []).forEach(function (it) {
          var s = it.snippet || {};
          if (!s.resourceId || !s.resourceId.videoId) return;
          out.push({
            id: s.resourceId.videoId,
            title: s.title || 'Vídeo',
            channel: (it.contentDetails || {} ? '' : '') || (out._chan || 'YouTube'),
            duration: isoDuration(it.contentDetails && it.contentDetails.duration),
            thumb: (s.thumbnails && (s.thumbnails.medium || s.thumbnails.default)) ? (s.thumbnails.medium || s.thumbnails.default).url : Store.thumb(s.resourceId.videoId, 'hq')
          });
        });
        if (onProgress) onProgress(out.length, d.pageInfo ? d.pageInfo.totalResults : out.length);
        if (d.nextPageToken) return page(d.nextPageToken);
        return out;
      });
    }
    return page(null);
  }

  /* ---------- Formato ---------- */
  function fmtDuration(sec) {
    if (!sec || sec < 0) return '—';
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return (h ? h + ':' + pad(m) : m) + ':' + pad(s);
  }
  function fmtDurationShort(sec) {
    if (!sec || sec < 0) return '';
    var h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
    return h ? h + ' h ' + m + ' min' : m + ' min';
  }
  function fmtAgo(ts) {
    if (!ts) return 'nunca';
    var s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'ahora';
    if (s < 3600) return Math.floor(s / 60) + ' min';
    if (s < 86400) return Math.floor(s / 3600) + ' h';
    if (s < 604800) return Math.floor(s / 86400) + ' d';
    if (s < 2629800) return Math.floor(s / 604800) + ' sem';
    return Math.floor(s / 2629800) + ' mes';
  }
  function fmtDate(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  }

  function hostnameOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return ''; }
  }

  return {
    extractId: extractId,
    extractListId: extractListId,
    extractTimestamp: extractTimestamp,
    canonical: canonical,
    metadata: metadata,
    durationWithKey: durationWithKey,
    durationFromIFrameAPI: durationFromIFrameAPI,
    playlistItems: playlistItems,
    fmtDuration: fmtDuration,
    fmtDurationShort: fmtDurationShort,
    fmtAgo: fmtAgo,
    fmtDate: fmtDate,
    hostnameOf: hostnameOf
  };
})();