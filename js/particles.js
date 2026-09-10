/* ============================================
   PARTICLES — Interactive Constellation Hero
   Max quality particle physics & eco-tier aware
   ============================================ */

(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var particles = [];
  var mouse = { x: null, y: null };
  var animId = null;
  var isHeroVisible = true;
  var isMobile = window.innerWidth < 768;
  var PARTICLE_COUNT = isMobile ? 32 : 65;
  var CONNECT_DIST = isMobile ? 110 : 160;
  var MOUSE_RADIUS = 130;

  function isTurbo() {
    return document.documentElement.getAttribute('data-perf') !== 'eco';
  }

  function resize() {
    var section = canvas.parentElement;
    if (!section) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = section.offsetWidth * dpr;
    canvas.height = section.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = section.offsetWidth + 'px';
    canvas.style.height = section.offsetHeight + 'px';
  }

  function Particle(w, h) {
    this.w = w;
    this.h = h;
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.45;
    this.vy = (Math.random() - 0.5) * 0.45;
    this.radius = Math.random() * 2.2 + 0.8;
    
    // Pure violet and night-sky slate tones
    var colors = [
      'rgba(143, 95, 255, ',   // violet
      'rgba(177, 138, 255, ',  // violet-light
      'rgba(106, 63, 220, ',   // violet-dark
      'rgba(134, 134, 160, '   // slate silver
    ];
    this.colorBase = colors[Math.floor(Math.random() * colors.length)];
    this.alpha = Math.random() * 0.55 + 0.35;
  }

  Particle.prototype.update = function (w, h) {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce at boundaries
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;

    // Mouse repulsion / attraction
    if (mouse.x !== null && mouse.y !== null) {
      var dx = this.x - mouse.x;
      var dy = this.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS) {
        var force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.022;
        this.vx += dx * force;
        this.vy += dy * force;
      }
    }

    // Velocity dampening
    var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > 1.3) {
      this.vx *= 0.97;
      this.vy *= 0.97;
    }
  };

  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.colorBase + this.alpha + ')';
    ctx.shadowColor = this.colorBase + '0.6)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  function initParticles() {
    var section = canvas.parentElement;
    var w = section ? section.offsetWidth : window.innerWidth;
    var h = section ? section.offsetHeight : window.innerHeight;
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle(w, h));
    }
  }

  function drawConnections() {
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECT_DIST) {
          var opacity = (1 - dist / CONNECT_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(143, 95, 255, ' + opacity + ')';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    if (!isTurbo() || !isHeroVisible) {
      animId = null;
      return;
    }

    var section = canvas.parentElement;
    var w = section ? section.offsetWidth : window.innerWidth;
    var h = section ? section.offsetHeight : window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    for (var i = 0; i < particles.length; i++) {
      particles[i].update(w, h);
      particles[i].draw();
    }

    drawConnections();
    animId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!animId && isTurbo() && isHeroVisible) {
      animId = requestAnimationFrame(animate);
    }
  }

  function stopAnimation() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  // Mouse tracking relative to canvas
  canvas.addEventListener('mousemove', function (e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', function () {
    mouse.x = null;
    mouse.y = null;
  });

  // Touch tracking for mobile
  canvas.addEventListener('touchmove', function (e) {
    if (e.touches.length > 0) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', function () {
    mouse.x = null;
    mouse.y = null;
  });

  // Resize handler
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      isMobile = window.innerWidth < 768;
      PARTICLE_COUNT = isMobile ? 32 : 65;
      CONNECT_DIST = isMobile ? 110 : 160;
      resize();
      initParticles();
      if (isTurbo() && isHeroVisible) {
        startAnimation();
      }
    }, 150);
  });

  // Listen for performance tier changes
  window.addEventListener('perftierchange', function (e) {
    if (e.detail && e.detail.tier === 'eco') {
      stopAnimation();
      var section = canvas.parentElement;
      var w = section ? section.offsetWidth : window.innerWidth;
      var h = section ? section.offsetHeight : window.innerHeight;
      ctx.clearRect(0, 0, w, h);
    } else {
      resize();
      if (particles.length === 0) initParticles();
      startAnimation();
    }
  });

  // IntersectionObserver to pause loop when hero is offscreen
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        isHeroVisible = entry.isIntersecting;
        if (isHeroVisible && isTurbo()) {
          startAnimation();
        } else {
          stopAnimation();
        }
      });
    }, { threshold: 0.05 });

    var heroSection = document.getElementById('hero');
    if (heroSection) observer.observe(heroSection);
  }

  // Initialization
  resize();
  initParticles();
  if (isTurbo()) {
    startAnimation();
  }
})();
