/* ============================================
   PARTICLES — Interactive constellation hero
   Vanilla Canvas, ~60 particles, mouse reactive
   ============================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var particles = [];
  var mouse = { x: null, y: null };
  var animId = null;
  var isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;
  var PARTICLE_COUNT = isMobile ? 25 : 55;
  var CONNECT_DIST = isMobile ? 100 : 150;
  var MOUSE_RADIUS = 120;

  function resize() {
    var section = canvas.parentElement;
    canvas.width = section.offsetWidth;
    canvas.height = section.offsetHeight;
  }

  function Particle() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.radius = Math.random() * 2 + 0.8;
    // Mix of violet and blue-night tones
    var colors = [
      'rgba(143, 95, 255, ',   // violet
      'rgba(177, 138, 255, ',  // violet-light
      'rgba(26, 26, 62, ',     // blue-night (subtle)
      'rgba(106, 63, 220, ',   // violet-dark
    ];
    this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = Math.random() * 0.5 + 0.3;
  }

  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce at boundaries
    if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
    if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

    // Mouse repulsion
    if (mouse.x !== null) {
      var dx = this.x - mouse.x;
      var dy = this.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS) {
        var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.015;
        this.vx += dx * force;
        this.vy += dy * force;
      }
    }

    // Speed limit
    var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1.2) {
      this.vx *= 0.98;
      this.vy *= 0.98;
    }
  };

  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.colorBase + this.alpha + ')';
    ctx.fill();
  };

  function init() {
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          var opacity = (1 - dist / CONNECT_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(143, 95, 255, ' + opacity + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    drawConnections();
    animId = requestAnimationFrame(animate);
  }

  // Mouse tracking (relative to canvas)
  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  // Resize handler
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      isMobile = window.innerWidth < 768;
      PARTICLE_COUNT = isMobile ? 25 : 55;
      CONNECT_DIST = isMobile ? 100 : 150;
      resize();
      init();
    }, 200);
  });

  // Start only if not reduced-motion
  if (!isReduced) {
    resize();
    init();
    animate();
  } else {
    // Static fallback: just set canvas size for layout
    resize();
  }
})();
