(function () {
  var canvas = document.getElementById("wallpaper");
  var ctx = canvas.getContext("2d");
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

  var ROWS = 7;
  var STEP = 14;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.offsetWidth;
    H = hero.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  function draw() {
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

    // faint dot grid
    ctx.fillStyle = "rgba(232,147,61,0.06)";
    var GAP = 46;
    for (var gx = GAP / 2; gx < W; gx += GAP) {
      for (var gy = GAP / 2; gy < H; gy += GAP) {
        var ddx = gx - mouseX,
          ddy = gy - mouseY;
        var d = Math.sqrt(ddx * ddx + ddy * ddy);
        var glow = Math.max(0, 1 - d / 180);
        var size = 1 + glow * 1.6;
        ctx.beginPath();
        ctx.arc(gx, gy, size, 0, Math.PI * 2);
        ctx.fillStyle =
          glow > 0.05
            ? "rgba(232,147,61," + (0.08 + glow * 0.4) + ")"
            : "rgba(232,147,61,0.05)";
        ctx.fill();
      }
    }

    phase += 0.012;
    requestAnimationFrame(draw);
  }

  resize();
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
    draw = (function (originalDraw) {
      return function () {
        ctx.clearRect(0, 0, W, H);
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
    })(draw);
    draw();
  } else {
    requestAnimationFrame(draw);
  }
})();

(function () {
  var form = document.getElementById("contact-form");
  var submitBtn = document.getElementById("cf-submit");
  var status = document.getElementById("cf-status");

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
