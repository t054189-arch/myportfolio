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

  /* --- Mount ------------------------------------------------------------- */

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
    mount: mount,
    disposeAll: disposeAll,
    themeName: themeName
  };
})();
