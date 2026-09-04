// All entry points run AFTER the first paint (double rAF) so the initial
// critical task stays tiny — that protects FCP/LCP on real devices.
function bootPortfolio() {
  (function () {
  var canvas = document.getElementById("wallpaper");
  if (!canvas || !canvas.parentElement) {
    return;
  }
  var ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  var hero = canvas.parentElement;
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  var W, H, dpr;
  var mouseX = -9999,
    mouseY = -9999;
  var targetMouseX = -9999,
    targetMouseY = -9999;
  var phase = 0;

  var ROWS = 6;
  var STEP = 16;
  var isVisible = true;
  var rafId = null;
  var dotsLayer = null;

  function buildDots() {
    // Pre-render the faint dot grid once per resize; the per-frame loop then
    // composites it with a single drawImage instead of filling dozens of arcs.
    dotsLayer = document.createElement("canvas");
    dotsLayer.width = Math.max(1, Math.round(W * dpr));
    dotsLayer.height = Math.max(1, Math.round(H * dpr));
    var dctx = dotsLayer.getContext("2d");
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var GAP = 72;
    dctx.fillStyle = "rgba(232,147,61,0.05)";
    for (var gx = GAP / 2; gx < W; gx += GAP) {
      for (var gy = GAP / 2; gy < H; gy += GAP) {
        dctx.beginPath();
        dctx.arc(gx, gy, 1, 0, Math.PI * 2);
        dctx.fill();
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildDots();
  }

  function onMove(e) {
    var rect = canvas.getBoundingClientRect();
    targetMouseX = e.clientX - rect.left;
    targetMouseY = e.clientY - rect.top;
  }
  function onLeave() {
    targetMouseX = -9999;
    targetMouseY = -9999;
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    mouseX += (targetMouseX - mouseX) * 0.08;
    mouseY += (targetMouseY - mouseY) * 0.08;

    var rowGap = H / (ROWS + 1);

    for (var r = 1; r <= ROWS; r++) {
      var baseY = rowGap * r;
      ctx.beginPath();
      var first = true;

      for (var x = 0; x <= W; x += STEP) {
        var dx = x - mouseX;
        var dy = baseY - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var influence = Math.max(0, 1 - dist / 260);
        var ripple = Math.sin(x * 0.02 + phase + r) * 3;
        var push = Math.sin(dist * 0.045 - phase * 1.4) * influence * 22;
        var y = baseY + ripple + push;

        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else {
          ctx.lineTo(x, y);
        }
      }

      var op = 0.05 + 0.03 * (r % 3);
      ctx.strokeStyle =
        r % 3 === 0
          ? "rgba(95,168,160," + op + ")"
          : "rgba(232,147,61," + op + ")";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // static dot grid (pre-rendered once — compositing is much cheaper
    // than filling dozens of arcs every frame)
    if (dotsLayer) {
      ctx.drawImage(dotsLayer, 0, 0);
    }

    // soft glow that follows the cursor over the dots
    if (mouseX > -9000 && mouseX <= W && mouseY >= 0 && mouseY <= H) {
      var grad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 90);
      grad.addColorStop(0, "rgba(232,147,61,0.10)");
      grad.addColorStop(1, "rgba(232,147,61,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 90, 0, Math.PI * 2);
      ctx.fill();
    }

    phase += 0.012;
  }

  function draw() {
    frame();
    if (isVisible) {
      rafId = requestAnimationFrame(draw);
    }
  }

  window.addEventListener("resize", resize);
  hero.addEventListener("mousemove", onMove);
  hero.addEventListener("mouseleave", onLeave);
  hero.addEventListener(
    "touchmove",
    function (e) {
      if (e.touches && e.touches[0]) {
        var t = e.touches[0];
        onMove({ clientX: t.clientX, clientY: t.clientY });
      }
    },
    { passive: true },
  );

  if (reduceMotion) {
    // draw a single static frame, no loop
    draw = (function () {
      return function () {
        ctx.clearRect(0, 0, W, H);
        if (dotsLayer) {
          ctx.drawImage(dotsLayer, 0, 0);
        }
        var rowGap = H / (ROWS + 1);
        for (var r = 1; r <= ROWS; r++) {
          var baseY = rowGap * r;
          ctx.beginPath();
          ctx.moveTo(0, baseY);
          ctx.lineTo(W, baseY);
          ctx.strokeStyle = "rgba(232,147,61,0.06)";
          ctx.stroke();
        }
      };
    })();
  } else {
    // Pause the animation loop when the hero is scrolled out of view or the
    // tab is backgrounded, so it isn't spending CPU/battery for nothing.
    function startLoop() {
      if (rafId === null) {
        rafId = requestAnimationFrame(draw);
      }
    }
    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    var hasInteracted = false;

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          var entry = entries[0];
          isVisible =
            entry.isIntersecting && document.visibilityState === "visible";
          if (isVisible) {
            ensureLoop();
          } else {
            stopLoop();
          }
        },
        { threshold: 0 },
      );
      observer.observe(hero);
    } else {
      isVisible = true;
    }

    function ensureLoop() {
      if (hasInteracted && isVisible && rafId === null) {
        startLoop();
      }
    }
    function markInteracted() {
      hasInteracted = true;
      ensureLoop();
    }
    hero.addEventListener("pointerenter", markInteracted);
    hero.addEventListener("pointerdown", markInteracted);
    hero.addEventListener("pointermove", markInteracted);
    hero.addEventListener("touchstart", markInteracted, { passive: true });
    document.addEventListener("scroll", markInteracted, { passive: true });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        isVisible = false;
        stopLoop();
      } else {
        // Only resume if the hero is actually still on screen.
        var rect = hero.getBoundingClientRect();
        var onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
        if (onScreen) {
          isVisible = true;
          ensureLoop();
        }
      }
    });
  }

  // Draw the initial wallpaper AFTER first paint so the very first task stays
  // small (protects FCP/LCP). For reduced-motion visitors this is a single
  // static frame; for everyone else it's one animated-style frame — the loop
  // only starts once the visitor actually moves or scrolls.
  function bootCanvas() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        resize();
        if (reduceMotion) {
          draw();
        } else {
          frame();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootCanvas);
  } else {
    bootCanvas();
  }
})();

(function () {
  var form = document.getElementById("contact-form");
  var submitBtn = document.getElementById("cf-submit");
  var status = document.getElementById("cf-status");
  if (!form || !submitBtn || !status) {
    return;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // honeypot: if a bot filled this in, silently pretend to succeed
    if (form._gotcha.value) {
      status.textContent = "Message sent.";
      status.className = "form-status mono ok";
      form.reset();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    status.textContent = "";
    status.className = "form-status mono";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        if (res.ok) {
          status.textContent = "Message sent — thanks, I\u2019ll reply soon.";
          status.className = "form-status mono ok";
          form.reset();
        } else {
          return res.json().then(function (data) {
            var msg =
              data && data.errors && data.errors.length
                ? data.errors
                    .map(function (x) {
                      return x.message;
                    })
                    .join(", ")
                : "Something went wrong. Try again, or email me directly.";
            status.textContent = msg;
            status.className = "form-status mono err";
          });
        }
      })
      .catch(function () {
        status.textContent = "Network error — try again, or email me directly.";
        status.className = "form-status mono err";
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send message";
      });
  });
})();
/* ---------- SCROLL REVEAL ---------- */
(function () {
  var revealEls = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  function showAll() {
    for (var i = 0; i < revealEls.length; i++) {
      revealEls[i].classList.add("is-visible");
    }
  }

  // Fallback for browsers without IntersectionObserver, plus reduced-motion
  // users: reveal everything immediately instead of on scroll.
  if (!revealEls.length || !("IntersectionObserver" in window) || reduceMotion) {
    showAll();
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: "0px 0px -10% 0px" },
  );

  for (var j = 0; j < revealEls.length; j++) {
    observer.observe(revealEls[j]);
  }
})();

/* ---------- LOGO — SCROLL PROGRESS & CLICK SIGNAL ---------- */
(function () {
  var logo = document.getElementById("site-logo");
  if (!logo) {
    return;
  }
  var svg = logo.querySelector(".logo-glyph");
  var dotPos = logo.querySelector(".logo-dot-pos");
  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  // 2π × ring radius (15) = 94.25 — shared by the progress arc and the radar ping.
  var R = 15;
  var CX = 20;
  var CY = 20;

  var ticking = false;
  var lastY = window.scrollY;
  var velocity = 0;

  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress =
      max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    velocity = window.scrollY - lastY;
    lastY = window.scrollY;

    // The amber ring fills in step with page-scroll progress.
    // 2π × 15 ≈ 94.25 is the ring's circumference.
    svg.style.setProperty(
      "--arc-offset",
      (94.25 * (1 - progress)).toFixed(2) + "px",
    );

    // The teal dot orbits the ring from the top, clockwise.
    var angle = progress * Math.PI * 2 - Math.PI / 2;
    if (reduceMotion) {
      // Keep the informative progress arc, but skip the orbiting motion.
      dotPos.setAttribute(
        "transform",
        "translate(" + CX + "," + (CY - R) + ")",
      );
    } else {
      var x = CX + Math.cos(angle) * R;
      var y = CY + Math.sin(angle) * R;
      // Squash/stretch the dot with scroll velocity — flick the page hard
      // and the dot wobbles like it's caught in the signal.
      var wobble = Math.min(1, Math.abs(velocity) / 16);
      var sy = 1 + wobble * 0.4;
      var sx = 1 - wobble * 0.22;
      dotPos.setAttribute(
        "transform",
        "translate(" + x + "," + y + ") scale(" + sx + "," + sy + ")",
      );
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function onClick(e) {
    e.preventDefault();
    if (!reduceMotion) {
      // Restart the burst from scratch on every click.
      logo.classList.remove("burst");
      void logo.offsetWidth;
      logo.classList.add("burst");
      window.setTimeout(function () {
        logo.classList.remove("burst");
      }, 1000);
    }
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  logo.addEventListener("click", onClick);
  update();
})();
}

requestAnimationFrame(function () {
  requestAnimationFrame(bootPortfolio);
});
