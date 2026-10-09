/* ============================================================
   store.js · estado + persistencia (localStorage) + backup JSON
   Sin dependencias externas.
   ============================================================ */
window.Store = (function () {
  'use strict';

  var KEY = 'misvideos.state.v1';
  var PREFS_KEY = 'misvideos.prefs.v1';

  var DEFAULTS = {
    version: 1,
    createdAt: 0,
    lists: [],
    videos: [],
    settings: {
      theme: 'auto',
      autoplay: true,
      autoplayNext: true,
      shuffle: false,
      view: 'grid',
      pauseWhenHidden: false,
      apiKey: '',
      confirmDelete: true,
      createdAt: 0
    }
  };

  /* ---------- utilidades ---------- */
  function uid() {
    return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function now() { return Date.now(); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- carga / guardado ---------- */
  function migrate(raw) {
    var s = raw || {};
    s.version = 1;
    s.lists = Array.isArray(s.lists) ? s.lists : [];
    s.videos = Array.isArray(s.videos) ? s.videos : [];
    s.settings = Object.assign({}, DEFAULTS.settings, s.settings || {});
    // sanea vídeos
    s.videos = s.videos.filter(function (v) { return v && v.id; }).map(function (v) {
      v.id = v.id || uid();
      v.url = v.url || ('https://www.youtube.com/watch?v=' + v.id);
      v.title = v.title || 'Vídeo sin título';
      v.channel = v.channel || 'Desconocido';
      v.thumb = v.thumb || thumb(v.id);
      v.listId = v.listId || (s.lists[0] ? s.lists[0].id : null);
      v.fav = !!v.fav;
      v.watched = !!v.watched;
      v.progress = typeof v.progress === 'number' ? v.progress : 0;
      v.duration = v.duration || 0;
      v.notes = v.notes || '';
      v.tags = Array.isArray(v.tags) ? v.tags : [];
      v.addedAt = v.addedAt || now();
      v.lastPlayed = v.lastPlayed || 0;
      return v;
    });
    s.lists = s.lists.filter(function (l) { return l && l.id; }).map(function (l) {
      l.id = l.id || uid();
      l.name = l.name || 'Sin nombre';
      l.icon = l.icon || '▶';
      l.color = l.color || '#6d5cff';
      l.createdAt = l.createdAt || now();
      return l;
    });
    return s;
  }

  function thumb(videoId, quality) {
    var q = quality || 'hq';
    return 'https://i.ytimg.com/vi/' + videoId + '/' + q + 'default.jpg';
  }

  var state = null;
  var listeners = [];
  var saveTimer = null;
  var storageOK = true;

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { storageOK = false; }
    var s;
    if (raw) {
      try { s = migrate(JSON.parse(raw)); } catch (e) { s = null; }
    }
    if (!s) {
      s = migrate(clone(DEFAULTS));
      s.createdAt = now();
      s.settings.createdAt = now();
    }
    return s;
  }

  state = load();

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](state); } catch (e) { console.error(e); }
    }
  }

  function flush() {
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOK = true;
    } catch (e) {
      storageOK = false;
      console.error('No se pudo guardar', e);
      emit();
      if (window.UI && UI.toast) {
        UI.toast('No se pudo guardar. Exporta una copia de seguridad.', 'err', 6000);
      }
    }
  }

  function save(silent) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 180);
    if (!silent) emit();
    else setTimeout(emit, 200);
  }

  /* ---------- listas ---------- */
  function defaultList() {
    if (!state.lists.length) {
      var l = { id: uid(), name: 'Mis vídeos', icon: '▶', color: '#6d5cff', createdAt: now() };
      state.lists.push(l);
      save();
    }
    return state.lists[0];
  }

  function addList(name, icon, color) {
    var l = { id: uid(), name: name || 'Nueva lista', icon: icon || '▶', color: color || '#6d5cff', createdAt: now() };
    state.lists.push(l);
    save();
    return l;
  }
  function updateList(id, patch) {
    var l = getList(id);
    if (!l) return null;
    Object.assign(l, patch);
    save();
    return l;
  }
  function removeList(id) {
    var i = state.lists.findIndex(function (l) { return l.id === id; });
    if (i < 0) return;
    state.lists.splice(i, 1);
    // vídeos sin lista -> primera disponible
    var fallback = state.lists[0] ? state.lists[0].id : null;
    state.videos.forEach(function (v) { if (v.listId === id) v.listId = fallback; });
    if (!state.lists.length) addList('Mis vídeos');
    save();
  }
  function getList(id) {
    return state.lists.filter(function (l) { return l.id === id; })[0] || null;
  }
  function listVideos(id) {
    return state.videos.filter(function (v) { return v.listId === id; })
      .sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
  }
  function countList(id) {
    var n = 0;
    for (var i = 0; i < state.videos.length; i++) if (state.videos[i].listId === id) n++;
    return n;
  }

  /* ---------- vídeos ---------- */
  function getVideo(id) {
    return state.videos.filter(function (v) { return v.id === id; })[0] || null;
  }
  function hasVideo(ytId) {
    return state.videos.some(function (v) { return v.id === ytId; });
  }
  function addVideos(items, listId) {
    var lid = listId || defaultList().id;
    var added = [], dup = [];
    items.forEach(function (it) {
      if (hasVideo(it.id)) { dup.push(it); return; }
      var v = {
        id: it.id,
        url: it.url || ('https://www.youtube.com/watch?v=' + it.id),
        title: it.title || ('Vídeo ' + it.id),
        channel: it.channel || 'Desconocido',
        thumb: it.thumb || thumb(it.id, it.quality),
        duration: it.duration || 0,
        listId: lid,
        fav: !!it.fav,
        watched: false,
        progress: 0,
        notes: '',
        tags: it.tags || [],
        addedAt: now(),
        lastPlayed: 0
      };
      state.videos.push(v);
      added.push(v);
    });
    if (added.length) save();
    return { added: added, dup: dup };
  }
  function updateVideo(id, patch) {
    var v = getVideo(id);
    if (!v) return null;
    Object.assign(v, patch);
    save();
    return v;
  }
  function removeVideo(id) {
    var i = state.videos.findIndex(function (v) { return v.id === id; });
    if (i < 0) return;
    state.videos.splice(i, 1);
    save();
  }
  function toggleFav(id) {
    var v = getVideo(id);
    if (!v) return;
    v.fav = !v.fav;
    save();
    return v.fav;
  }
  function toggleWatched(id) {
    var v = getVideo(id);
    if (!v) return;
    v.watched = !v.watched;
    save();
    return v.watched;
  }
  function markPlayed(id, progress, duration) {
    var v = getVideo(id);
    if (!v) return;
    v.lastPlayed = now();
    if (typeof progress === 'number' && progress >= 0) v.progress = progress;
    if (duration && !v.duration) v.duration = duration;
    save(true);
  }
  function setSetting(k, val) {
    state.settings[k] = val;
    save();
  }
  function search(q) {
    q = (q || '').toLowerCase().trim();
    if (!q) return [];
    return state.videos.filter(function (v) {
      return (v.title || '').toLowerCase().indexOf(q) > -1 ||
             (v.channel || '').toLowerCase().indexOf(q) > -1 ||
             (v.notes || '').toLowerCase().indexOf(q) > -1 ||
             (v.tags || []).join(' ').toLowerCase().indexOf(q) > -1;
    });
  }
  function favorites() {
    return state.videos.filter(function (v) { return v.fav; })
      .sort(function (a, b) { return (b.lastPlayed || b.addedAt) - (a.lastPlayed || a.addedAt); });
  }
  function unwatched() {
    return state.videos.filter(function (v) { return !v.watched && !v.fav; })
      .sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); });
  }
  function continueWatching() {
    return state.videos.filter(function (v) {
      return v.progress > 0 && (v.duration ? v.progress < v.duration * 0.96 : v.progress > 0);
    }).sort(function (a, b) { return (b.lastPlayed || 0) - (a.lastPlayed || 0); }).slice(0, 12);
  }
  function recent(n) {
    return state.videos.slice().sort(function (a, b) { return (b.addedAt || 0) - (a.addedAt || 0); })
      .slice(0, n || 12);
  }
  function all() { return state.videos; }
  function stats() {
    var total = state.videos.length, seen = 0, fav = 0, sec = 0;
    state.videos.forEach(function (v) {
      if (v.watched) seen++;
      if (v.fav) fav++;
      sec += (v.duration || 0);
    });
    return { total: total, watched: seen, fav: fav, seconds: sec, lists: state.lists.length };
  }

  /* ---------- import / export ---------- */
  function exportData() {
    return JSON.stringify({ app: 'mis-videos', version: 1, exportedAt: now(), data: state }, null, 2);
  }
  function importData(json, mode) {
    var parsed = JSON.parse(json);
    var incoming = parsed.data || parsed;
    incoming = migrate(incoming);
    if (mode === 'replace') {
      state = incoming;
    } else {
      // merge por id de vídeo
      var byId = {};
      state.videos.forEach(function (v) { byId[v.id] = v; });
      incoming.videos.forEach(function (v) {
        if (!byId[v.id]) { state.videos.push(v); byId[v.id] = v; }
      });
      var ids = {};
      state.lists.forEach(function (l) { ids[l.id] = l; });
      incoming.lists.forEach(function (l) { if (!ids[l.id]) { state.lists.push(l); ids[l.id] = l; } });
    }
    save();
    return { videos: state.videos.length, lists: state.lists.length };
  }
  function clearAll() {
    state = migrate(clone(DEFAULTS));
    state.createdAt = now();
    save();
  }

  /* ---------- preferencias independientes (rápido) ---------- */
  var prefs = {
    get: function (k, d) {
      try { var v = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); return k in v ? v[k] : d; }
      catch (e) { return d; }
    },
    set: function (k, v) {
      try {
        var o = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
        o[k] = v;
        localStorage.setItem(PREFS_KEY, JSON.stringify(o));
      } catch (e) {}
    }
  };

  function onChange(fn) { listeners.push(fn); }
  function getState() { return state; }
  function get(k) { return state.settings[k]; }
  function getSettings() { return state.settings; }
  function isStorageOK() { return storageOK; }

  /* primer arranque */
  if (!state.lists.length) defaultList();

  return {
    uid: uid, thumb: thumb, now: now,
    getState: getState, get: get, getSettings: getSettings, set: setSetting,
    onChange: onChange, save: save, isStorageOK: isStorageOK,
    defaultList: defaultList,
    addList: addList, updateList: updateList, removeList: removeList,
    getList: getList, listVideos: listVideos, countList: countList,
    getVideo: getVideo, hasVideo: hasVideo, addVideos: addVideos,
    updateVideo: updateVideo, removeVideo: removeVideo,
    toggleFav: toggleFav, toggleWatched: toggleWatched, markPlayed: markPlayed,
    search: search, favorites: favorites, unwatched: unwatched,
    continueWatching: continueWatching, recent: recent, all: all, stats: stats,
    exportData: exportData, importData: importData, clearAll: clearAll,
    prefs: prefs
  };
})();