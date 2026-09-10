/* ==========================================================================
   Bloom — the gahwa log, data layer
   ==========================================================================
   This module is the only thing that touches the most private table in the
   database, so a few rules are built into its shape rather than left to
   whoever calls it:

     - every request carries the customer's own access token, and the
       server decides what comes back. There is no "all logs" call here to
       misuse, because row-level security would refuse it anyway;
     - nothing is cached in localStorage. A diary of where someone was and
       who with does not get left in browser storage where the next person
       to open the laptop can read it. The page holds it in memory for as
       long as the tab is open, and that is all;
     - the browser is never asked where it is. There is no geolocation
       call in this file and there is nowhere in the schema to put one. A
       place is a name the customer chose;
     - deleting means deleting. deleteEverything() removes the photos
       through the Storage API first and then the rows, and there is no
       tombstone, no "deleted" flag and no copy kept anywhere.
   ========================================================================== */

var Gahwa = (function () {
  'use strict';

  var BUCKET = 'gahwa-photos';

  function conf() { return window.BLOOM || {}; }
  function ready() { return !!(conf().url && conf().key && window.fetch && Auth.userId()); }

  /* --- talking to PostgREST as the signed-in customer ------------------ */

  function call(path, opts) {
    opts = opts || {};
    return Auth.token().then(function (token) {
      if (!token) return Promise.reject(new Error('signed out'));
      var headers = {
        apikey: conf().key,
        Authorization: 'Bearer ' + token,
        Accept: 'application/json'
      };
      if (opts.body) headers['Content-Type'] = 'application/json';
      if (opts.prefer) headers.Prefer = opts.prefer;

      return fetch(conf().url + path, {
        method: opts.method || 'GET',
        headers: headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined
      }).then(function (res) {
        if (res.status === 204) return null;
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
          if (!res.ok) {
            var why = (data && (data.message || data.hint)) || ('HTTP ' + res.status);
            throw new Error(why);
          }
          return data;
        });
      });
    });
  }

  function rest(query, opts) { return call('/rest/v1/' + query, opts); }

  /* --- reading ---------------------------------------------------------- */

  /* One round trip for everything the page opens with. Promise.all rather
     than a chain, because five sequential requests is five times the
     latency for no reason — and the page is meant to feel instant. */
  function load(limit) {
    if (!ready()) return Promise.reject(new Error('not signed in'));
    return Promise.all([
      rest('v_gahwa_summary?select=*'),
      rest('v_gahwa_streak?select=*'),
      rest('v_gahwa_places?select=*&order=visits.desc,last_visit.desc'),
      rest('v_gahwa_people?select=*&order=cups.desc,last_time.desc'),
      entries(limit || 400),
      savedPlaces()
    ]).then(function (r) {
      return {
        summary: (r[0] && r[0][0]) || null,
        streak:  (r[1] && r[1][0]) || null,
        places:  r[2] || [],
        people:  r[3] || [],
        entries: r[4] || [],
        saved:   r[5] || []
      };
    });
  }

  /* The place name is embedded rather than fetched separately: PostgREST
     follows the place_id foreign key, so one request returns each entry
     with the place it happened at. */
  function entries(limit) {
    return rest('gahwa_logs?select=*,place:places(id,name,kind,area)' +
                '&order=had_at.desc&limit=' + (limit || 400));
  }

  function savedPlaces() {
    return rest('places?select=id,user_id,name,kind,area&order=name.asc');
  }

  /* --- writing ---------------------------------------------------------- */

  /* Only `drink` is required by the schema and only the rating is asked
     for by the sheet, so everything else is omitted when empty rather
     than written as an empty string. A blank note should be absent, not
     stored as ''. */
  function addEntry(entry) {
    var uid = Auth.userId();
    if (!uid) return Promise.reject(new Error('not signed in'));

    var row = {
      user_id: uid,
      drink: entry.drink || 'V60',
      company: entry.company || [],
      company_kind: entry.companyKind || 'alone'
    };
    if (entry.hadAt)      row.had_at = entry.hadAt;
    if (entry.placeId)    row.place_id = entry.placeId;
    if (entry.placeNote)  row.place_note = entry.placeNote;
    if (entry.rating)     row.rating = entry.rating;
    if (entry.note)       row.note = entry.note;
    if (entry.productId)  row.product_id = entry.productId;
    if (entry.doseG)      row.dose_g = entry.doseG;
    if (entry.photoPath)  row.photo_path = entry.photoPath;

    return rest('gahwa_logs?select=*,place:places(id,name,kind,area)', {
      method: 'POST', body: row, prefer: 'return=representation'
    }).then(function (rows) { return rows && rows[0]; });
  }

  function updateEntry(id, patch) {
    return rest('gahwa_logs?id=eq.' + encodeURIComponent(id) +
                '&select=*,place:places(id,name,kind,area)',
      { method: 'PATCH', body: patch, prefer: 'return=representation' })
      .then(function (rows) { return rows && rows[0]; });
  }

  /* Remove the photo first: if the row goes and the file does not, the
     picture is still sitting in storage with nothing pointing at it. */
  function deleteEntry(id, photoPath) {
    var first = photoPath ? removePhotos([photoPath]).catch(function () { return null; })
                          : Promise.resolve(null);
    return first.then(function () {
      return rest('gahwa_logs?id=eq.' + encodeURIComponent(id), { method: 'DELETE' });
    });
  }

  /* A new place, created by typing a name the customer has not used
     before. Saved against them, never shared — only the shop's own
     branches are shared, and those come from a migration. */
  function addPlace(name, kind, area) {
    var uid = Auth.userId();
    if (!uid) return Promise.reject(new Error('not signed in'));
    var row = { user_id: uid, name: String(name).trim(), kind: kind || 'other_cafe' };
    if (area) row.area = area;
    return rest('places?select=id,user_id,name,kind,area', {
      method: 'POST', body: row, prefer: 'return=representation'
    }).then(function (rows) { return rows && rows[0]; });
  }

  /* --- photos ----------------------------------------------------------- */

  /* Every path begins with the customer's own id, which is what the
     storage policy checks. The bucket is private, so this path is not a
     URL and cannot be opened by anyone — including whoever guesses it. */
  function photoKey(file) {
    var ext = (file.name || '').split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'heic'].indexOf(ext) === -1) ext = 'jpg';
    return Auth.userId() + '/' + Date.now() + '-' +
           Math.random().toString(36).slice(2, 8) + '.' + ext;
  }

  function uploadPhoto(file) {
    if (!ready()) return Promise.reject(new Error('not signed in'));
    var key = photoKey(file);
    return Auth.token().then(function (token) {
      return fetch(conf().url + '/storage/v1/object/' + BUCKET + '/' + key, {
        method: 'POST',
        headers: {
          apikey: conf().key,
          Authorization: 'Bearer ' + token,
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'false'
        },
        body: file
      }).then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error(t || res.status); });
        return key;
      });
    });
  }

  /* A short-lived signed URL, minted per view. Nothing durable is handed
     out, so a screenshot of the address bar stops working within the
     hour and there is no permanent link to forward. */
  function photoUrl(path, seconds) {
    if (!path) return Promise.resolve(null);
    return call('/storage/v1/object/sign/' + BUCKET + '/' + path, {
      method: 'POST', body: { expiresIn: seconds || 900 }
    }).then(function (r) {
      return r && r.signedURL ? conf().url + '/storage/v1' + r.signedURL.replace(/^\/?/, '/') : null;
    });
  }

  function removePhotos(paths) {
    if (!paths || !paths.length) return Promise.resolve(null);
    return call('/storage/v1/object/' + BUCKET, {
      method: 'DELETE', body: { prefixes: paths }
    });
  }

  /* --- taking it away with you ------------------------------------------ */

  /* A log a person cannot get out of the site is a log they are renting,
     not keeping. Both formats are built from the same rows: JSON for
     anything that will be read by a program, CSV for a spreadsheet. */
  function exportRows() {
    return entries(100000);
  }

  function toJSON(rows) {
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      note: 'Your Bloom gahwa log. Yours to keep, move or delete.',
      entries: rows.map(function (r) {
        return {
          had_at: r.had_at,
          place: r.place ? r.place.name : (r.place_note || null),
          place_kind: r.place ? r.place.kind : null,
          area: r.place ? r.place.area : null,
          company: r.company || [],
          company_kind: r.company_kind,
          rating: r.rating,
          drink: r.drink,
          bloom_bean: r.product_id || null,
          dose_g: r.dose_g,
          note: r.note,
          photo: r.photo_path ? 'private, not included in this file' : null
        };
      })
    }, null, 2);
  }

  var CSV_HEAD = ['date', 'time', 'place', 'place_kind', 'area', 'company',
                  'company_kind', 'rating', 'drink', 'bloom_bean', 'dose_g', 'note'];

  function csvCell(value) {
    if (value === null || value === undefined) return '';
    var s = String(value);
    /* A leading =, +, - or @ makes a spreadsheet treat the cell as a
       formula. Someone's note starting with "-- best cup yet" should not
       become an expression, so prefix a quote. */
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCSV(rows) {
    var out = [CSV_HEAD.join(',')];
    rows.forEach(function (r) {
      var when = new Date(r.had_at);
      out.push([
        when.toISOString().slice(0, 10),
        when.toTimeString().slice(0, 5),
        r.place ? r.place.name : (r.place_note || ''),
        r.place ? r.place.kind : '',
        r.place ? (r.place.area || '') : '',
        (r.company || []).join(' · '),
        r.company_kind,
        r.rating === null || r.rating === undefined ? '' : r.rating,
        r.drink,
        r.product_id || '',
        r.dose_g === null || r.dose_g === undefined ? '' : r.dose_g,
        r.note || ''
      ].map(csvCell).join(','));
    });
    /* A byte-order mark, written as an escape so it is visible in the
       source rather than an invisible character someone deletes by
       accident. Without it Excel reads the Arabic notes as mojibake. */
    return '\uFEFF' + out.join('\r\n') + '\r\n';
  }

  /* --- deleting all of it ----------------------------------------------- */

  /* Photos through the Storage API first, then the rows. Files are deleted
     by asking storage to remove them, not by deleting their database row,
     because the latter leaves the bytes behind. Returns what it removed so
     the interface can say so plainly rather than just claiming success. */
  function deleteEverything() {
    if (!ready()) return Promise.reject(new Error('not signed in'));
    return entries(100000).then(function (rows) {
      var photos = rows.map(function (r) { return r.photo_path; })
                       .filter(function (p) { return !!p; });
      return removePhotos(photos).then(function () {
        return { photos: photos.length };
      }, function (err) {
        /* Say so rather than pretending. The rows still go — a customer
           who asked for deletion gets deletion — but they are told a
           photo may have survived, and the log page will show it as
           missing rather than silently fine. */
        return { photos: photos.length, photoError: err.message };
      }).then(function (result) {
        result.entries = rows.length;
        return rest('gahwa_logs?user_id=eq.' + encodeURIComponent(Auth.userId()),
                    { method: 'DELETE' }).then(function () { return result; });
      });
    });
  }

  /* Places are kept: they are not sensitive on their own — a list of café
     names with no visits attached says nothing about anyone — and losing
     them means retyping every one if the customer starts logging again.
     deletePlaces() exists for someone who wants those gone too. */
  function deletePlaces() {
    return rest('places?user_id=eq.' + encodeURIComponent(Auth.userId()),
                { method: 'DELETE' });
  }

  /* --- what the bag tracker needs -------------------------------------- */

  /* Doses brewed from one bean since the customer last ordered it. This is
     the only place the log touches the shop, and it only ever reads. */
  function bagUsage(productId) {
    if (!ready()) return Promise.resolve(null);
    return rest('orders?select=placed_at,order_items!inner(product_id)' +
                '&order_items.product_id=eq.' + encodeURIComponent(productId) +
                '&order=placed_at.desc&limit=1')
      .then(function (orders) {
        var since = orders && orders[0] ? orders[0].placed_at : null;
        var q = 'gahwa_logs?select=dose_g,had_at&product_id=eq.' +
                encodeURIComponent(productId) + '&dose_g=not.is.null';
        if (since) q += '&had_at=gte.' + encodeURIComponent(since);
        return rest(q).then(function (rows) {
          var grams = 0;
          (rows || []).forEach(function (r) { grams += Number(r.dose_g) || 0; });
          return { since: since, cups: (rows || []).length, grams: Math.round(grams * 10) / 10 };
        });
      }, function () { return null; });
  }

  return {
    ready: ready,
    load: load,
    entries: entries,
    savedPlaces: savedPlaces,
    addEntry: addEntry,
    updateEntry: updateEntry,
    deleteEntry: deleteEntry,
    addPlace: addPlace,
    uploadPhoto: uploadPhoto,
    photoUrl: photoUrl,
    exportRows: exportRows,
    toJSON: toJSON,
    toCSV: toCSV,
    deleteEverything: deleteEverything,
    deletePlaces: deletePlaces,
    bagUsage: bagUsage
  };
})();
