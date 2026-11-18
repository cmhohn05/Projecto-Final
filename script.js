// Lecturas en Espejo — interacciones de la guía
// Plain JavaScript, no libraries. Each block is independent.

document.addEventListener("DOMContentLoaded", function () {
  setupTabs();
  setupTimeline();
  setupSwitch();
  setupQuiz();
  setupPlan();
  setupScrollHelpers();
});

/* 01 · Mapa de espejos — accessible tabs (click + arrow keys) */
function setupTabs() {
  var list = document.querySelector("[data-tabs]");
  if (!list) return;
  var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));

  function select(index, focus) {
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tabs[index].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(i, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next !== null) { e.preventDefault(); select(next, true); }
    });
  });
}

/* 02 · Recorrido — pick a scene on the timeline */
function setupTimeline() {
  var bar = document.querySelector("[data-timeline]");
  if (!bar) return;
  var segs = Array.prototype.slice.call(bar.querySelectorAll("button"));

  segs.forEach(function (seg) {
    seg.addEventListener("click", function () {
      segs.forEach(function (s) {
        var on = s === seg;
        s.setAttribute("aria-pressed", on ? "true" : "false");
        document.getElementById(s.getAttribute("aria-controls")).hidden = !on;
      });
    });
  });
}

/* 03 · El interruptor — flip which world is the dream */
function setupSwitch() {
  var section = document.querySelector("[data-switch]");
  if (!section) return;
  var button = section.querySelector("[data-toggle]");

  button.addEventListener("click", function () {
    var flipped = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", flipped ? "true" : "false");
    section.classList.toggle("is-flipped", flipped);
    section.querySelectorAll('[data-state="first"]').forEach(function (el) { el.hidden = flipped; });
    section.querySelectorAll('[data-state="flipped"]').forEach(function (el) { el.hidden = !flipped; });
  });
}

/* 07 · Quiz — one answer per question, live score */
function setupQuiz() {
  var quiz = document.querySelector("[data-quiz]");
  if (!quiz) return;
  var scoreEl = quiz.querySelector("[data-score]");
  var questions = Array.prototype.slice.call(quiz.querySelectorAll(".question"));

  var resultEl = quiz.querySelector("[data-quiz-result]");
  var resetBtn = quiz.querySelector("[data-quiz-reset]");

  function updateScore() {
    var score = questions.filter(function (q) { return q.dataset.result === "ok"; }).length;
    var answered = questions.filter(function (q) { return q.dataset.result; }).length;
    scoreEl.textContent = score;
    if (answered < questions.length) { resultEl.textContent = ""; return; }
    if (score === questions.length) {
      resultEl.textContent = "¡Perfecto! Estás despierto. Marca el quiz en tu plan de estudio.";
    } else if (score >= questions.length - 1) {
      resultEl.textContent = "¡Casi! Revisa la pregunta que fallaste y vuelve a intentarlo.";
    } else {
      resultEl.textContent = "Repasa el mapa de espejos y el interruptor, y vuelve a intentarlo.";
    }
  }

  resetBtn.addEventListener("click", function () {
    questions.forEach(function (q) {
      delete q.dataset.result;
      q.querySelectorAll(".option").forEach(function (o) {
        o.setAttribute("aria-pressed", "false");
        o.classList.remove("is-correct", "is-wrong");
      });
      var fb = q.querySelector(".feedback");
      fb.className = "feedback";
      fb.innerHTML = "";
    });
    updateScore();
    questions[0].querySelector(".option").focus();
  });

  questions.forEach(function (q) {
    var correct = Number(q.dataset.correct);
    var options = Array.prototype.slice.call(q.querySelectorAll(".option"));
    var feedback = q.querySelector(".feedback");

    options.forEach(function (opt, i) {
      opt.addEventListener("click", function () {
        var ok = i === correct;
        options.forEach(function (o) {
          o.setAttribute("aria-pressed", o === opt ? "true" : "false");
          o.classList.remove("is-correct", "is-wrong");
        });
        opt.classList.add(ok ? "is-correct" : "is-wrong");
        feedback.className = "feedback " + (ok ? "is-correct" : "is-wrong");
        feedback.innerHTML = ok ? q.dataset.ok : q.dataset.no;
        q.dataset.result = ok ? "ok" : "no";
        updateScore();
      });
    });
  });
}

/* 00 · Plan de estudio — checklist saved in this browser */
function setupPlan() {
  var plan = document.querySelector("[data-plan]");
  if (!plan) return;
  var KEY = "lecturas-en-espejo:plan";
  var boxes = Array.prototype.slice.call(plan.querySelectorAll('input[type="checkbox"]'));
  var countEl = plan.querySelector("[data-plan-count]");
  var barEl = plan.querySelector("[data-plan-bar]");

  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }

  function update() {
    var done = boxes.filter(function (b) { return b.checked; }).length;
    countEl.textContent = done;
    barEl.style.width = (done / boxes.length) * 100 + "%";
  }

  boxes.forEach(function (box) {
    box.checked = !!saved[box.id];
    box.addEventListener("change", function () {
      saved[box.id] = box.checked;
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked: still works for this visit */ }
      update();
    });
  });
  update();
}

/* Reading-progress bar in the header + "back to top" button */
function setupScrollHelpers() {
  var bar = document.querySelector("[data-read-progress]");
  var toTop = document.querySelector("[data-to-top]");
  var ticking = false;

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    if (bar) bar.style.width = pct + "%";
    if (toTop) toTop.classList.toggle("is-visible", doc.scrollTop > 800);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
}
