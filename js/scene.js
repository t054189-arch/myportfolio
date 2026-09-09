/* ==========================================================================
   Bloom — the 3D layer
   ==========================================================================
   One module, three uses: a slowly turning rig behind the login card, a
   scroll-driven hero on the home page, and a drag-to-rotate viewer in the
   product gallery.

   Everything is built from primitives — cones, cylinders, tori, spheres.
   No external model files, so there is nothing extra to download.

   Rules this file keeps:
     - if THREE is missing or the WebGL context fails, mount() returns null
       and the caller draws a flat SVG instead. The shop stays shoppable.
     - the render loop is paused whenever the canvas is off-screen.
     - geometries, materials and the renderer are disposed on page unload.
     - under prefers-reduced-motion the scene renders one still frame and
       then stops.
   ========================================================================== */

var Scene = (function () {

  var instances = [];
  var unloadBound = false;

  /* --- Capability check -------------------------------------------------- */

  function supported() {
    if (!window.THREE) return false;
    try {
      var probe = document.createElement('canvas');
      var gl = probe.getContext('webgl') || probe.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* --- Palette and lighting ---------------------------------------------
     Object colours are fixed (a cream cone is cream in both themes); the
     lights are what follow the theme, so dark mode reads as a dim room
     rather than an inverted photograph.
     ---------------------------------------------------------------------- */

  var C = {
    cream:  0xF2ECE1,
    brass:  0x9B7433,
    coffee: 0x4A2C1B,
    bean:   0x3B281C,
    glass:  0xEBE1D0,
    steel:  0xB9AE9E,
    dark:   0x2A211A,
    clay:   0xAC5334,
    leaf:   0x57683F
  };

  var LIGHTS = {
    light: { hemiSky: 0xF4EEE3, hemiGround: 0x2A1A12, hemiInt: 0.80,
             keyColor: 0xFFE7C4, keyInt: 1.15,
             fillColor: 0x9FB183, fillInt: 0.40 },
    dark:  { hemiSky: 0xD6C5B1, hemiGround: 0x16100D, hemiInt: 0.52,
             keyColor: 0xFFDFAE, keyInt: 1.00,
             fillColor: 0xA3B583, fillInt: 0.34 }
  };

  function themeName() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') return attr;
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }

  /* --- Material helpers -------------------------------------------------- */

  function standard(color, opts) {
    var settings = {
      color: color,
      roughness: opts && opts.roughness !== undefined ? opts.roughness : 0.6,
      metalness: opts && opts.metalness !== undefined ? opts.metalness : 0.05
    };
    if (opts && opts.side) settings.side = opts.side;
    if (opts && opts.opacity !== undefined) {
      settings.transparent = true;
      settings.opacity = opts.opacity;
    }
    if (opts && opts.flatShading) settings.flatShading = true;
    return new THREE.MeshStandardMaterial(settings);
  }

  function mesh(geometry, material, x, y, z) {
    var m = new THREE.Mesh(geometry, material);
    m.position.set(x || 0, y || 0, z || 0);
    return m;
  }

  /* A flat ring, used for the rim and the brass rib rings. */
  function ring(radius, tube, material, y, segments) {
    var m = mesh(new THREE.TorusGeometry(radius, tube, 10, segments || 48), material, 0, y, 0);
    m.rotation.x = Math.PI / 2;
    return m;
  }

  /* --- Build: the V60 rig, the signature object -------------------------- */

  function buildV60(config) {
    /* On the full-screen login scene the beans orbit wider, so they sweep
       clear of the sign-in card instead of hiding behind it. */
    var spread = (config && config.beanSpread) || 1;
    var group = new THREE.Group();
    var beans = [];

    var creamMat = standard(C.cream, { roughness: 0.55, side: THREE.DoubleSide });
    var brassMat = standard(C.brass, { roughness: 0.35, metalness: 0.65 });
    var glassMat = standard(C.glass, { roughness: 0.15, metalness: 0.05, opacity: 0.26 });
    var coffeeMat = standard(C.coffee, { roughness: 0.35 });
    var beanMat = standard(C.bean, { roughness: 0.7 });

    /* Cone, opened upward: rotating PI on X puts the wide end on top. With
       the group offset below, the rim lands at y 1.1 and the apex at -0.4. */
    var cone = mesh(new THREE.ConeGeometry(1.15, 1.5, 60, 1, true), creamMat, 0, 0.35, 0);
    cone.rotation.x = Math.PI;
    group.add(cone);

    /* Rim, then the three brass rib rings down the wall. */
    group.add(ring(1.15, 0.05, creamMat, 1.10, 64));
    group.add(ring(0.95, 0.018, brassMat, 0.85));
    group.add(ring(0.62, 0.018, brassMat, 0.45));
    group.add(ring(0.32, 0.018, brassMat, 0.10));

    /* Server: open glass cylinder, a disc for the base. */
    var server = mesh(new THREE.CylinderGeometry(0.95, 0.82, 1.35, 48, 1, true), glassMat, 0, -1.30, 0);
    group.add(server);
    group.add(mesh(new THREE.CylinderGeometry(0.83, 0.83, 0.06, 48), glassMat, 0, -1.99, 0));
    group.add(ring(0.95, 0.035, glassMat, -0.63, 48));

    /* The brew itself. */
    group.add(mesh(new THREE.CylinderGeometry(0.87, 0.80, 0.60, 48), coffeeMat, 0, -1.66, 0));

    /* Eighteen beans, orbiting on their own radii and bobbing on a sine. */
    var beanGeometry = new THREE.SphereGeometry(0.1, 12, 10);
    for (var i = 0; i < 18; i++) {
      var bean = new THREE.Mesh(beanGeometry, beanMat);
      bean.scale.set(1, 0.6, 0.78);
      bean.userData = {
        radius: (1.45 + Math.random() * 0.6) * spread,
        angle: Math.random() * Math.PI * 2,
        speed: 0.12 + Math.random() * 0.22,
        baseY: -0.6 + Math.random() * 2.0,
        bob: 0.08 + Math.random() * 0.14,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.6
      };
      beans.push(bean);
      group.add(bean);
    }

    group.position.y = 0.35;
    return { group: group, beans: beans, focus: -0.15 };
  }

  /* --- Build: a hand grinder --------------------------------------------- */

  function buildGrinder() {
    var group = new THREE.Group();
    var bodyMat = standard(C.steel, { roughness: 0.4, metalness: 0.5 });
    var woodMat = standard(0x8A6A4B, { roughness: 0.75 });
    var brassMat = standard(C.brass, { roughness: 0.35, metalness: 0.65 });

    group.add(mesh(new THREE.CylinderGeometry(0.62, 0.58, 1.7, 48), bodyMat, 0, -0.3, 0));
    group.add(mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 48), brassMat, 0, 0.58, 0));
    /* hopper */
    var hopper = mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.5, 48, 1, true), bodyMat, 0, 0.85, 0);
    hopper.material = standard(C.steel, { roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide });
    group.add(hopper);
    /* crank shaft, arm and knob */
    group.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 16), brassMat, 0, 1.35, 0));
    var arm = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 16), brassMat, 0.3, 1.72, 0);
    arm.rotation.z = Math.PI / 2;
    group.add(arm);
    group.add(mesh(new THREE.SphereGeometry(0.13, 20, 16), woodMat, 0.6, 1.72, 0));
    /* grounds catch */
    group.add(mesh(new THREE.CylinderGeometry(0.58, 0.5, 0.5, 48), woodMat, 0, -1.35, 0));
    return { group: group, beans: [], focus: 0 };
  }

  /* --- Build: a gooseneck kettle ----------------------------------------- */

  function buildKettle() {
    var group = new THREE.Group();
    var steelMat = standard(C.steel, { roughness: 0.3, metalness: 0.6 });
    var darkMat = standard(C.dark, { roughness: 0.6 });

    group.add(mesh(new THREE.CylinderGeometry(0.85, 0.78, 1.25, 48), steelMat, 0, -0.3, 0));
    group.add(mesh(new THREE.CylinderGeometry(0.6, 0.85, 0.22, 48), steelMat, 0, 0.43, 0));
    group.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 32), darkMat, 0, 0.58, 0));
    group.add(mesh(new THREE.SphereGeometry(0.1, 16, 12), darkMat, 0, 0.66, 0));

    /* Gooseneck: a quarter torus rising out of the body, then a downturn. */
    var neck = mesh(new THREE.TorusGeometry(0.72, 0.075, 14, 40, Math.PI * 0.95), steelMat, 0.5, 0.1, 0);
    neck.rotation.z = -Math.PI * 0.08;
    group.add(neck);
    var spout = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.42, 16), steelMat, 1.24, 0.5, 0);
    spout.rotation.z = -0.5;
    group.add(spout);

    /* Handle. */
    var handle = mesh(new THREE.TorusGeometry(0.42, 0.055, 12, 32, Math.PI * 1.1), darkMat, -0.95, -0.15, 0);
    handle.rotation.z = -Math.PI / 2.1;
    group.add(handle);

    group.add(mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.07, 48), darkMat, 0, -0.96, 0));
    return { group: group, beans: [], focus: 0 };
  }

  /* --- Build: a digital scale -------------------------------------------- */

  function buildScale() {
    var group = new THREE.Group();
    var caseMat = standard(C.dark, { roughness: 0.65 });
    var padMat = standard(C.steel, { roughness: 0.35, metalness: 0.45 });
    var screenMat = standard(0x1D2A1B, { roughness: 0.25 });
    var leafMat = standard(C.leaf, { roughness: 0.5 });

    group.add(mesh(new THREE.BoxGeometry(2.5, 0.28, 1.9), caseMat, 0, -0.2, 0));
    group.add(mesh(new THREE.BoxGeometry(2.3, 0.06, 1.7), padMat, 0, -0.03, 0));
    group.add(mesh(new THREE.BoxGeometry(0.95, 0.02, 0.42), screenMat, -0.65, 0.01, 0.62));
    /* two little readout bars, so it reads as a scale mid-weigh */
    group.add(mesh(new THREE.BoxGeometry(0.42, 0.03, 0.07), leafMat, -0.78, 0.03, 0.62));
    group.add(mesh(new THREE.BoxGeometry(0.16, 0.03, 0.07), leafMat, -0.44, 0.03, 0.62));
    /* a small cup of grounds on the pad */
    group.add(mesh(new THREE.CylinderGeometry(0.44, 0.36, 0.42, 40, 1, true),
                   standard(C.cream, { roughness: 0.55, side: THREE.DoubleSide }), 0.45, 0.21, 0));
    group.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 40), standard(C.bean, { roughness: 0.8 }), 0.45, 0.38, 0));
    return { group: group, beans: [], focus: 0 };
  }

  /* --- Build: an espresso machine ---------------------------------------- */

  function buildEspresso() {
    var group = new THREE.Group();
    var bodyMat = standard(C.steel, { roughness: 0.3, metalness: 0.55 });
    var darkMat = standard(C.dark, { roughness: 0.6 });
    var brassMat = standard(C.brass, { roughness: 0.35, metalness: 0.65 });
    var creamMat = standard(C.cream, { roughness: 0.5 });

    group.add(mesh(new THREE.BoxGeometry(2.1, 1.5, 1.5), bodyMat, 0, 0.35, 0));
    group.add(mesh(new THREE.BoxGeometry(2.2, 0.12, 1.6), darkMat, 0, -0.46, 0));
    /* group head and portafilter */
    group.add(mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.3, 32), darkMat, 0, -0.28, 0.9));
    group.add(mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.22, 32), bodyMat, 0, -0.5, 0.9));
    var handle = mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6, 16), darkMat, 0, -0.5, 1.42);
    handle.rotation.x = Math.PI / 2;
    group.add(handle);
    /* steam wand */
    var wand = mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.9, 16), bodyMat, 0.9, -0.25, 0.7);
    wand.rotation.z = 0.35;
    group.add(wand);
    /* pressure gauge and a switch */
    group.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 32), brassMat, -0.62, 0.62, 0.76));
    group.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 24), darkMat, 0.5, 0.62, 0.76));
    /* the cup underneath */
    group.add(mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.3, 32), creamMat, 0, -0.25, 0.9));
    group.add(mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.04, 32), standard(C.coffee, { roughness: 0.3 }), 0, -0.12, 0.9));
    return { group: group, beans: [], focus: 0.1 };
  }

  var BUILDS = {
    v60: buildV60,
    grinder: buildGrinder,
    kettle: buildKettle,
    scale: buildScale,
    espresso: buildEspresso
  };


  /* ======================================================================
     THE ROOM
     ======================================================================
     One continuous space the visitor moves through. Every page is a camera
     station in the same room, not a new scene: the camera position is
     handed forward through sessionStorage, so a navigation reads as the
     room turning rather than a page reloading.
     ====================================================================== */

  /* Colours come out of the stylesheet so tokens stay the single source. */
  function cssHex(token, fallback) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    var m = /^#([0-9a-f]{6})$/i.exec(raw);
    if (m) return parseInt(m[1], 16);
    m = /^#([0-9a-f]{3})$/i.exec(raw);
    if (m) return parseInt(m[1].replace(/(.)/g, '$1$1'), 16);
    return fallback;
  }

  /* Parse the easing token so the JS flight and the CSS transitions cannot
     drift apart, then evaluate it by bisection. */
  function bezierFromToken(token) {
    var raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    var nums = raw.replace(/[^0-9.,\-]/g, '').split(',').map(Number);
    var p = nums.length === 4 && nums.every(function (n) { return isFinite(n); })
      ? nums : [0.6, 0, 0.25, 1];

    return function (t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      var lo = 0, hi = 1, mid = t, x;
      function bez(a, b, u) {
        var v = 1 - u;
        return 3 * v * v * u * a + 3 * v * u * u * b + u * u * u;
      }
      for (var i = 0; i < 18; i++) {
        mid = (lo + hi) / 2;
        x = bez(p[0], p[2], mid);
        if (x < t) lo = mid; else hi = mid;
      }
      return bez(p[1], p[3], mid);
    };
  }

  /* Where each page stands in the room. */
  var STATIONS = {
    login:        { x: 0,    y: -0.6, z: 4.2, ry: 0 },
    index:        { x: 0,    y: 0,    z: 8,   ry: 0 },
    beans:        { x: -3.5, y: 0,    z: 8,   ry: 0.209 },   /*  12deg */
    tools:        { x: 3.5,  y: 0,    z: 8,   ry: -0.209 },  /* -12deg */
    machines:     { x: 3.5,  y: 1.2,  z: 8,   ry: -0.209 },
    product:      { x: 0,    y: 0,    z: 5,   ry: 0 },
    cart:         { x: 0,    y: 2.5,  z: 7,   ry: 0 },
    /* Not in the brief's table, so these two keep the room coherent:
       the guides sit just off centre, the cafe faces the bean shelf. */
    'brew-guides': { x: -1.2, y: 0.4, z: 7.2, ry: 0.07 },
    cafe:          { x: -2.5, y: 0.8, z: 7.6, ry: 0.13 }
  };

  var CAM_KEY = 'bloom.camera';

  function readCamera() {
    try {
      var raw = window.sessionStorage.getItem(CAM_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      return (c && isFinite(c.x) && isFinite(c.y) && isFinite(c.z)) ? c : null;
    } catch (e) {
      return null;
    }
  }

  function writeCamera(camera) {
    try {
      window.sessionStorage.setItem(CAM_KEY, JSON.stringify({
        x: camera.position.x, y: camera.position.y, z: camera.position.z,
        ry: camera.rotation.y
      }));
    } catch (e) { /* private mode: the room simply starts fresh */ }
  }

  /* Build the room into #bgfx. Returns null if WebGL is unavailable, and
     the two CSS gradients carry the background on their own. */
  function room(canvas, options) {
    if (!supported() || !canvas) return null;

    var opts = options || {};
    var stationName = STATIONS[opts.station] ? opts.station : 'index';
    var renderer;

    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 60);

    var hemi = new THREE.HemisphereLight(0xF6EFE3, 0x302016, 0.9);
    var key = new THREE.DirectionalLight(0xFFE7C4, 0.8);
    key.position.set(2, 4, 5);
    scene.add(hemi, key);

    /* Far beans dissolve into the ground colour instead of cluttering. */
    scene.fog = new THREE.Fog(cssHex('--paper', 0xF4EEE3), 6, 26);

    /* --- the bean field: 54 ellipsoids on three depth tiers ------------
       Exactly three materials, one per tier. The opacity split is what
       reads as depth, so it is worth more than any extra geometry. */
    var TIERS = [
      { z: -6,   opacity: 0.52 },
      { z: -2.8, opacity: 0.30 },
      { z: 0.4,  opacity: 0.16 }
    ];
    var beanColor = cssHex('--scene-bean', 0x3B281C);
    var tierMaterials = TIERS.map(function (tier) {
      return new THREE.MeshStandardMaterial({
        color: beanColor,
        roughness: 0.75,
        metalness: 0.05,
        transparent: true,
        opacity: tier.opacity,
        fog: true
      });
    });

    var beanGeometry = new THREE.SphereGeometry(0.12, 12, 10);
    var beans = [];
    for (var i = 0; i < 54; i++) {
      var tier = i % 3;
      var bean = new THREE.Mesh(beanGeometry, tierMaterials[tier]);
      bean.scale.set(1, 0.6, 0.78);
      bean.position.set(
        -8 + Math.random() * 16,
        -5.5 + Math.random() * 11,
        TIERS[tier].z + (Math.random() - 0.5) * 0.6
      );
      bean.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      bean.userData = {
        rise: 0.014 + Math.random() * 0.05,      /* 0.014 - 0.064 per frame */
        seed: Math.random() * Math.PI * 2,
        spin: 0.002 + Math.random() * 0.006
      };
      beans.push(bean);
      scene.add(bean);
    }

    /* --- theme: recolour the three materials in place, never rebuild --- */
    function applyTheme() {
      var color = cssHex('--scene-bean', 0x3B281C);
      for (var m = 0; m < tierMaterials.length; m++) tierMaterials[m].color.setHex(color);
      if (scene.fog) scene.fog.color.setHex(cssHex('--paper', 0xF4EEE3));
      draw();
    }

    /* --- camera: the pointer gives parallax, the station gives place --- */
    var station = STATIONS[stationName];
    var pointer = { x: 0, y: 0 };
    var parallax = { x: 0, y: 0 };

    /* Where the flight starts: exactly where the last page left off, or
       1.5 units back on a first visit. */
    var stored = readCamera();
    var from = stored || { x: station.x, y: station.y, z: station.z + 1.5, ry: station.ry };
    var flight = { t: 0, ms: 700, active: true, ease: bezierFromToken('--e-in-out') };

    camera.position.set(from.x, from.y, from.z);

    function placeCamera(fraction) {
      var e = flight.ease(fraction);
      var cx = from.x + (station.x - from.x) * e;
      var cy = from.y + (station.y - from.y) * e;
      var cz = from.z + (station.z - from.z) * e;
      var ry = (from.ry || 0) + (station.ry - (from.ry || 0)) * e;

      camera.position.set(cx + parallax.x, cy + parallax.y, cz);
      camera.lookAt(0, 0, 0);
      if (ry) camera.rotateY(ry);
    }

    function onPointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    function size() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }

    function draw() { renderer.render(scene, camera); }

    /* --- the loop ---------------------------------------------------- */
    var frame = 0;
    var running = false;
    var still = reducedMotion();
    var startedAt = 0;
    var frameCount = 0;

    /* Adaptive density. The brief says to cut beans before anything else
       if the room cannot hold its frame rate — so rather than guessing a
       number for every device, measure the first two seconds on the real
       machine and thin the field only if it is actually struggling. Never
       adds beans back, so it cannot oscillate. */
    var tune = { since: 0, frames: 0, checks: 0, shown: beans.length };

    function autoTune(now) {
      if (tune.checks >= 2 || reducedMotion()) return;
      if (!tune.since) { tune.since = now; tune.frames = 0; return; }
      tune.frames++;
      var elapsed = now - tune.since;
      if (elapsed < 2000) return;

      var measured = tune.frames * 1000 / elapsed;
      tune.checks++;
      tune.since = now;
      tune.frames = 0;

      if (measured >= 40 || tune.shown <= 18) { tune.checks = 2; return; }
      tune.shown = tune.checks === 1 ? Math.round(beans.length / 2) : 18;
      for (var i = 0; i < beans.length; i++) beans[i].visible = i < tune.shown;
    }

    function tick(now) {
      frame = window.requestAnimationFrame(tick);
      frameCount++;
      if (!startedAt) startedAt = now;
      autoTune(now);

      /* pointer parallax, lerped so it glides */
      parallax.x += (pointer.x * 0.35 - parallax.x) * 0.06;
      parallax.y += (-pointer.y * 0.25 - parallax.y) * 0.06;

      if (flight.active) {
        flight.t = Math.min((now - startedAt) / flight.ms, 1);
        if (flight.t >= 1) flight.active = false;
      }
      placeCamera(flight.active ? flight.t : 1);

      var t = now / 1000;
      for (var i = 0; i < beans.length; i++) {
        var b = beans[i];
        var d = b.userData;
        b.position.y += d.rise;
        b.position.x += Math.sin(t * 0.5 + d.seed) * 0.0015;
        b.rotation.y += d.spin;
        /* wrap below the frame, never mid-view */
        if (b.position.y > 6) {
          b.position.y = -6;
          b.position.x = -8 + Math.random() * 16;
        }
      }

      draw();
    }

    function start() {
      if (running || still) return;
      running = true;
      startedAt = 0;
      frame = window.requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    }

    /* Pause when the canvas is off-screen. It is fixed to the viewport, so
       this fires when the tab is hidden or the element is removed. */
    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) start(); else stop();
      }, { threshold: 0.01 });
      io.observe(canvas);
    }

    var onResize = function () { size(); draw(); };
    window.addEventListener('resize', onResize);
    document.addEventListener('bloom:theme', applyTheme);

    /* The OS preference can change while the page is open. */
    var osDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    if (osDark && osDark.addEventListener) osDark.addEventListener('change', applyTheme);

    size();
    placeCamera(0);
    draw();

    if (still) {
      /* One still frame at the station, then nothing moves. */
      flight.active = false;
      placeCamera(1);
      draw();
    } else if (!io) {
      start();
    }

    /* Hand the camera to the next page before this one goes away. */
    function handOff() { writeCamera(camera); }
    window.addEventListener('pagehide', handOff);

    function dispose() {
      stop();
      handOff();
      if (io) io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pagehide', handOff);
      document.removeEventListener('bloom:theme', applyTheme);
      if (osDark && osDark.removeEventListener) osDark.removeEventListener('change', applyTheme);

      beanGeometry.dispose();
      tierMaterials.forEach(function (m) { m.dispose(); });
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
    }

    /* Begin the flight to another station without navigating yet — the
       page transition calls this so the room is already turning while the
       old view fades out. */
    function flyTo(name) {
      if (!STATIONS[name] || still) return;
      from = {
        x: camera.position.x - parallax.x,
        y: camera.position.y - parallax.y,
        z: camera.position.z,
        ry: station.ry
      };
      station = STATIONS[name];
      flight.t = 0;
      flight.active = true;
      startedAt = 0;
    }

    /* Measured frames per second, for the performance report. */
    function fps(windowMs) {
      var ms = windowMs || 1000;
      var before = frameCount;
      return new Promise(function (resolve) {
        window.setTimeout(function () {
          resolve(Math.round((frameCount - before) * 1000 / ms));
        }, ms);
      });
    }

    var instance = {
      dispose: dispose, start: start, stop: stop, flyTo: flyTo, fps: fps,
      applyTheme: applyTheme,
      camera: camera,
      beans: beans,            /* exposed so density can be measured and tuned */
      beanCount: beans.length,
      visibleBeans: function () { return tune.shown; },
      isRunning: function () { return running; }
    };
    instances.push(instance);

    if (!unloadBound) {
      unloadBound = true;
      window.addEventListener('pagehide', disposeAll);
    }
    return instance;
  }

  /* --- Mount: the foreground rig ----------------------------------------- */

  function mount(host, options) {
    if (!supported()) return null;

    var opts = options || {};
    var build = BUILDS[opts.model] || BUILDS.v60;
    var mode = opts.mode || 'auto';

    var canvas, renderer;
    try {
      canvas = host.tagName === 'CANVAS' ? host : document.createElement('canvas');
      if (canvas !== host) {
        host.innerHTML = '';
        host.appendChild(canvas);
      }
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) {
      /* Context creation can fail even when the probe passed — blocklisted
         drivers, too many live contexts. Let the caller fall back. */
      if (host.tagName !== 'CANVAS') host.innerHTML = '';
      return null;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    /* Without sRGB output the cream reads as mud. */
    if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

    var lights = {
      hemi: new THREE.HemisphereLight(0xF4EEE3, 0x2A1A12, 0.8),
      key: new THREE.DirectionalLight(0xFFE7C4, 1.15),
      fill: new THREE.DirectionalLight(0x9FB183, 0.4)
    };
    lights.key.position.set(3.4, 5, 4.2);
    lights.fill.position.set(-4, 1.2, -3);
    scene.add(lights.hemi, lights.key, lights.fill);

    var built = build({ beanSpread: mode === 'auto' ? 2.1 : 1 });
    scene.add(built.group);

    /* The scene follows the theme through its lights, not its materials. */
    function applyTheme() {
      var set = LIGHTS[themeName()] || LIGHTS.light;
      lights.hemi.color.setHex(set.hemiSky);
      lights.hemi.groundColor.setHex(set.hemiGround);
      lights.hemi.intensity = set.hemiInt;
      lights.key.color.setHex(set.keyColor);
      lights.key.intensity = set.keyInt;
      lights.fill.color.setHex(set.fillColor);
      lights.fill.intensity = set.fillInt;
      draw();
    }

    /* --- camera framing per mode --- */
    var FRAME = {
      auto:   { y: 2.6, z: 6.6 },   /* looking down into the cone         */
      scroll: { y: 2.4, z: 7.4 },   /* hero: eases down toward the cup    */
      drag:   { y: 1.7, z: 7.0 }    /* product viewer, a smaller canvas   */
    };
    /* Named framing, not `start` — that would shadow the loop's start(). */
    var framing = FRAME[mode] || FRAME.auto;
    var view = {
      current: { y: framing.y, z: framing.z, rotY: 0 },
      target:  { y: framing.y, z: framing.z, rotY: 0 }
    };

    function size() {
      var w = host.clientWidth || canvas.clientWidth || 1;
      var h = host.clientHeight || canvas.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }

    function draw() {
      camera.position.set(0, view.current.y, view.current.z);
      camera.lookAt(0, built.focus, 0);
      renderer.render(scene, camera);
    }

    /* --- interaction: drag to rotate, clamped --- */
    var drag = { active: false, x: 0, y: 0, idleAt: 0 };

    if (mode === 'drag') {
      host.classList.add('scene-drag');
      canvas.addEventListener('pointerdown', function (event) {
        drag.active = true;
        drag.x = event.clientX;
        drag.y = event.clientY;
        canvas.setPointerCapture && canvas.setPointerCapture(event.pointerId);
      });
      canvas.addEventListener('pointermove', function (event) {
        if (!drag.active) return;
        var dx = event.clientX - drag.x;
        var dy = event.clientY - drag.y;
        drag.x = event.clientX;
        drag.y = event.clientY;
        built.group.rotation.y += dx * 0.008;
        built.group.rotation.x = Math.max(-0.35, Math.min(0.55, built.group.rotation.x + dy * 0.006));
      });
      function endDrag() {
        drag.active = false;
        drag.idleAt = performance.now();
      }
      canvas.addEventListener('pointerup', endDrag);
      canvas.addEventListener('pointercancel', endDrag);
      canvas.addEventListener('pointerleave', endDrag);
    }

    /* --- scroll-driven hero: never move the camera from the event --- */
    function onScroll() {
      var span = Math.max(window.innerHeight * 2, 1);
      var p = Math.min(Math.max(window.scrollY / span, 0), 1);
      view.target.y = FRAME.scroll.y - p * 2.4;   /* eases down toward the cup */
      view.target.z = FRAME.scroll.z - p * 1.9;
      view.target.rotY = p * Math.PI * 0.55;
    }
    if (mode === 'scroll') {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* --- the loop --- */
    var frame = 0;
    var running = false;
    var visible = true;
    var last = 0;
    var still = reducedMotion();

    function tick(now) {
      frame = window.requestAnimationFrame(tick);
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;

      /* lerp toward the scroll target so the camera never judders */
      view.current.y += (view.target.y - view.current.y) * 0.08;
      view.current.z += (view.target.z - view.current.z) * 0.08;
      view.current.rotY += (view.target.rotY - view.current.rotY) * 0.08;

      if (mode === 'scroll') {
        built.group.rotation.y = view.current.rotY;
      } else if (mode === 'auto') {
        built.group.rotation.y += dt * 0.22;
      } else if (mode === 'drag' && !drag.active && now - drag.idleAt > 2500) {
        built.group.rotation.y += dt * 0.14;
      }

      for (var i = 0; i < built.beans.length; i++) {
        var bean = built.beans[i];
        var d = bean.userData;
        d.angle += dt * d.speed;
        bean.position.set(
          Math.cos(d.angle) * d.radius,
          d.baseY + Math.sin(now / 1000 * 0.8 + d.phase) * d.bob,
          Math.sin(d.angle) * d.radius
        );
        bean.rotation.y += dt * d.spin;
      }

      draw();
    }

    function start() {
      if (running || still) return;
      running = true;
      last = 0;
      frame = window.requestAnimationFrame(tick);
    }

    function stop() {
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    }

    /* Pause whenever the canvas is off-screen — no GPU work for a scene
       nobody is looking at. */
    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.01 });
      io.observe(host);
    } else {
      start();
    }

    var onResize = function () { size(); draw(); };
    window.addEventListener('resize', onResize);
    document.addEventListener('bloom:theme', applyTheme);

    size();
    applyTheme();
    draw();
    if (still) {
      /* One still frame, then nothing moves. */
      stop();
    } else if (!io) {
      start();
    }

    /* --- teardown --------------------------------------------------------
       Walk the scene and release every geometry and material, then the
       renderer's own GL resources. */
    function dispose() {
      stop();
      if (io) io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('bloom:theme', applyTheme);

      scene.traverse(function (object) {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(function (m) { m.dispose(); });
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
    }

    var instance = {
      canvas: canvas,
      dispose: dispose,
      start: start,
      stop: stop,
      applyTheme: applyTheme,
      isRunning: function () { return running; }
    };
    instances.push(instance);

    if (!unloadBound) {
      unloadBound = true;
      window.addEventListener('pagehide', disposeAll);
    }

    return instance;
  }

  function disposeAll() {
    while (instances.length) instances.pop().dispose();
  }

  return {
    supported: supported,
    room: room,
    stations: STATIONS,
    mount: mount,
    disposeAll: disposeAll,
    themeName: themeName
  };
})();
