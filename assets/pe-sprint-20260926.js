import { i as interop, n as reactNs, t as jsxNs } from "./jsx-runtime-Cltr0gcK.js";
import { C as useStore, Qt as toast, d as chime, g as miss, u as finishSound } from "./index-BLVOhKhN.js?v=20260926-qa6";

const React = interop(reactNs(), 1);
const jsx = jsxNs();
const { useEffect, useRef, useState } = React;

const meta = {
  id: "pe-circuit",
  name: "Scholar Sprint",
  kicker: "PE · House Games",
  blurb: "Eight circuits on the school track. Earn two stars to open the next one.",
  levels: 8,
};

const CIRCUITS = [
  ["Warm-up", "Learn the track.", ["feet", "reaction", "target"]],
  ["Coordination", "Faster feet, cleaner reactions.", ["feet", "memory", "reaction"]],
  ["Control", "Timing and direction.", ["target", "hold", "dodge"]],
  ["Agility", "Four skills, one run.", ["feet", "memory", "target", "dodge"]],
  ["Pressure", "Shorter windows.", ["reaction", "hold", "memory", "feet"]],
  ["Full Circuit", "Keep the rhythm.", ["dodge", "target", "feet", "memory"]],
  ["Elite", "Speed and precision.", ["reaction", "feet", "target", "hold"]],
  ["House Final", "Fast, precise, fair.", ["feet", "reaction", "memory", "dodge"]],
];

const NAME = {
  feet: "Quick Feet",
  reaction: "Reaction Dash",
  target: "Precision Kick",
  memory: "Footwork",
  hold: "Balance",
  dodge: "Dodge Lane",
};
const HINT = {
  feet: "Step on the lit marker.",
  reaction: "Wait for the gold light.",
  target: "Strike while the mark is in the goal.",
  memory: "Copy the cones.",
  hold: "Hold, then release on the gold mark.",
  dodge: "Take the open lane.",
};

const DISPLAY = '"Cormorant Garamond", Palatino, Georgia, serif';
const SANS = '"Source Sans 3", "Avenir Next", "Segoe UI", sans-serif';
const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const starsOf = (v) => (v >= 86 ? 3 : v >= 68 ? 2 : v >= 45 ? 1 : 0);

const ART = { field: null, doll: null, run: [], pose: [], started: false, ready: false };
function ensureArt() {
  if (ART.started) return;
  ART.started = true;
  const load = (src) =>
    new Promise((res) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });
  Promise.all([
    load("/art/pe-sprint/field.jpg"),
    load("/art/doll/pe.png"),
    ...[1, 2, 3, 4].map((n) => load(`/art/pe-sprint/run-${n}.png`)),
    ...[1, 2, 3, 4].map((n) => load(`/art/pe-sprint/pose-${n}.png`)),
  ]).then((all) => {
    ART.field = all[0];
    ART.doll = all[1];
    ART.run = all.slice(2, 6).filter(Boolean);
    ART.pose = all.slice(6, 10).filter(Boolean);
    ART.ready = true;
  });
}

function shellStyle() {
  return {
    position: "fixed",
    inset: 0,
    zIndex: 80,
    background: "#102433",
    touchAction: "none",
    paddingTop: "env(safe-area-inset-top)",
    paddingBottom: "env(safe-area-inset-bottom)",
    paddingLeft: "env(safe-area-inset-left)",
    paddingRight: "env(safe-area-inset-right)",
  };
}

function useCanvas(draw) {
  const ref = useRef(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    const loop = (now) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      drawRef.current(ctx, w, h, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return ref;
}

function useLockScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ensureArt();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
}

function point(e, canvas) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function hitAt(hits, x, y) {
  for (let i = hits.length - 1; i >= 0; i--) {
    const h = hits[i];
    if (h.r) {
      const dx = x - h.x;
      const dy = y - h.y;
      if (dx * dx + dy * dy <= h.r * h.r) return h.id;
    } else if (x >= h.x && y >= h.y && x <= h.x + h.w && y <= h.y + h.h) return h.id;
  }
  return null;
}

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function star(ctx, x, y, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const b = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(b) * r * 0.45, y + Math.sin(b) * r * 0.45);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}
function label(ctx, text, x, y, font, color, align = "left", base = "middle") {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawField(ctx, w, h) {
  if (ART.field) {
    const img = ART.field;
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, "rgba(243,238,228,0.28)");
    wash.addColorStop(0.4, "rgba(243,238,228,0.05)");
    wash.addColorStop(1, "rgba(22,50,74,0.18)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    return;
  }
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#e7eef6");
  sky.addColorStop(0.45, "#f3eee4");
  sky.addColorStop(1, "#d5e3cc");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

function plate(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 18);
  ctx.fillStyle = "rgba(255,253,248,0.92)";
  ctx.fill();
}

function drawScholar(ctx, pose, frame, x, feetY, height, flip) {
  const img = ART.doll;
  const bob = pose === "run" || pose === "kick" ? Math.sin(frame * 1.3) * height * 0.025 : 0;
  ctx.save();
  ctx.translate(x, feetY + bob);
  if (flip) ctx.scale(-1, 1);
  ctx.fillStyle = "rgba(22,50,74,0.12)";
  ctx.beginPath();
  ctx.ellipse(0, -4, height * 0.18, height * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  if (img) {
    const aspect = img.width / img.height;
    const dh = height;
    const dw = dh * aspect;
    ctx.drawImage(img, -dw / 2, -dh, dw, dh);
  }
  ctx.restore();
}

function stone(ctx, x, y, w, h, hot, pulse) {
  ctx.save();
  rr(ctx, x, y, w, h, 22);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  if (hot) {
    g.addColorStop(0, `rgba(255,236,196,${0.92})`);
    g.addColorStop(1, `rgba(212,164,78,${0.92})`);
  } else {
    g.addColorStop(0, "rgba(255,253,248,0.96)");
    g.addColorStop(1, "rgba(238,243,232,0.96)");
  }
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = hot ? 3 : 1.5;
  ctx.strokeStyle = hot ? "rgba(122,98,64,0.45)" : "rgba(22,50,74,0.16)";
  ctx.stroke();
  ctx.restore();
}

function pops(ctx, list, now) {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    const k = (now - p.t) / p.life;
    if (k >= 1) {
      list.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.font = `600 28px ${SANS}`;
    ctx.fillStyle = p.color || "#fff8ea";
    ctx.textAlign = "center";
    ctx.fillText(p.text, p.x, p.y - k * 36);
    ctx.restore();
  }
}

function burst(sim, x, y, color) {
  for (let i = 0; i < 10; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 40 + Math.random() * 90;
    sim.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.45 + Math.random() * 0.25, age: 0, color });
  }
}
function drawFx(ctx, sim, dt) {
  for (let i = sim.fx.length - 1; i >= 0; i--) {
    const p = sim.fx[i];
    p.age += dt;
    if (p.age > p.life) {
      sim.fx.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt;
    ctx.globalAlpha = 1 - p.age / p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function makeSim(mode, level) {
  const sim = { mode, level, fx: [], pops: [], shake: 0, reported: false, born: performance.now() };
  if (mode === "feet") {
    sim.goal = 14 + level * 2;
    sim.count = 0;
    sim.side = "left";
    sim.err = 0;
    sim.start = 0;
    sim.stepUntil = 0;
  } else if (mode === "reaction") {
    sim.total = 4 + Math.ceil(level / 2);
    sim.phase = "ready";
    sim.scores = [];
    sim.goAt = 0;
    sim.deadline = 0;
    sim.retryAt = 0;
    sim.text = "SET";
    sim.window = Math.max(900, 1500 - level * 60);
  } else if (mode === "target") {
    sim.total = 4 + (level >= 6 ? 1 : 0);
    sim.width = Math.max(14, 34 - level * 2.5);
    sim.round = 0;
    sim.scores = [];
    sim.locked = false;
    sim.ball = null;
    sim.start = performance.now();
  } else if (mode === "memory") {
    sim.total = 3 + (level >= 6 ? 1 : 0);
    sim.round = 0;
    sim.scores = [];
    sim.len = Math.min(6, 2 + Math.ceil(level / 2));
    sim.input = [];
    sim.flash = null;
    beginMemory(sim);
  } else if (mode === "hold") {
    sim.total = 4;
    sim.round = 0;
    sim.scores = [];
    sim.target = 900 + level * 90;
    sim.holding = false;
    sim.elapsed = 0;
    sim.start = 0;
    sim.lock = false;
  } else {
    sim.total = 6 + level;
    sim.round = 0;
    sim.scores = [];
    sim.started = false;
    sim.dir = "left";
    sim.startedAt = 0;
  }
  return sim;
}

function beginMemory(sim) {
  const dirs = ["up", "right", "down", "left"];
  sim.seq = Array.from({ length: sim.len }, () => dirs[Math.floor(Math.random() * 4)]);
  sim.input = [];
  sim.showing = true;
  sim.flash = null;
  const flash = Math.max(270, 620 - sim.level * 38);
  let t = 360;
  sim.timeline = [];
  for (const id of sim.seq) {
    sim.timeline.push({ t, id });
    t += flash;
    sim.timeline.push({ t, id: null });
    t += 130;
  }
  sim.showUntil = t;
  sim.memStart = performance.now();
}

function targetPos(sim, now) {
  const speed = Math.max(1050, 2100 - sim.level * 110);
  const q = ((now - sim.start) % speed) / speed;
  return q < 0.5 ? q * 200 : (1 - q) * 200;
}
function targetCenter(sim) {
  return 50 + ((sim.round % 3) - 1) * 12;
}

function pressSim(sim, id, kind, now, sound, onDone) {
  if (sim.reported) return;
  if (sim.mode === "feet" && kind === "down" && (id === "left" || id === "right")) {
    if (!sim.start) sim.start = now;
    if (id !== sim.side) {
      sim.err += 1;
      sim.shake = 8;
      sound && miss();
      sim.pops.push({ text: "Other side", x: 0, y: 0, t: now, life: 600, color: "#ffd0c8" });
      return;
    }
    sound && chime();
    sim.count += 1;
    sim.side = id === "left" ? "right" : "left";
    sim.stepUntil = now + 220;
    sim.pops.push({ text: String(sim.count), x: 0, y: 0, t: now, life: 500, color: "#fff4d2" });
    if (sim.count >= sim.goal) {
      const sec = (now - sim.start) / 1000;
      const score = clamp(Math.round(52 + (sim.goal / sec) * 13 - sim.err * 7), 0, 100);
      finish(sim, score, onDone);
    }
  } else if (sim.mode === "reaction" && kind === "down" && id === "field") {
    if (sim.phase === "ready" || (sim.phase === "result" && now >= sim.retryAt)) {
      cueReaction(sim, now);
      return;
    }
    if (sim.phase === "wait") {
      sim.phase = "result";
      sim.text = "Too early";
      sim.retryAt = now + 600;
      sim.shake = 7;
      sound && miss();
      return;
    }
    if (sim.phase === "go") {
      const ms = now - sim.goAt;
      const sc = ms <= 280 ? 100 : ms <= 420 ? 90 : ms <= 580 ? 78 : ms <= 780 ? 62 : ms <= 1050 ? 45 : 25;
      sound && (sc >= 60 ? chime() : miss());
      sim.scores.push(sc);
      sim.phase = "result";
      sim.text = `${Math.round(ms)} ms`;
      sim.pops.push({ text: sim.text, x: 0, y: 0, t: now, life: 700, color: "#fff4d2" });
      if (sim.scores.length >= sim.total) finish(sim, avg(sim.scores), onDone);
      else sim.retryAt = now + 520;
    }
  } else if (sim.mode === "target" && kind === "down" && id === "goal" && !sim.locked) {
    const pos = targetPos(sim, now);
    const center = targetCenter(sim);
    const half = sim.width / 2;
    const dist = Math.abs(pos - center);
    const sc = dist <= half ? Math.round(78 + 22 * (1 - dist / half)) : clamp(Math.round(78 - (dist - half) * 2.4), 10, 75);
    sim.locked = true;
    sim.ball = { pos, sc, t: now };
    sound && (sc >= 70 ? chime() : miss());
    sim.scores.push(sc);
    sim.pops.push({ text: sc >= 78 ? "In" : "Wide", x: 0, y: 0, t: now, life: 650, color: "#fff4d2" });
    if (sim.scores.length >= sim.total) finish(sim, avg(sim.scores), onDone);
    else {
      sim.nextAt = now + 460;
    }
  } else if (sim.mode === "memory" && kind === "down" && id && id.startsWith("cone-") && !sim.showing) {
    const dir = id.slice(5);
    sim.input.push(dir);
    if (dir !== sim.seq[sim.input.length - 1]) {
      sound && miss();
      sim.shake = 8;
      const sc = Math.round(((sim.input.length - 1) / sim.seq.length) * 100);
      sim.scores.push(sc);
      sim.showing = true;
      if (sim.scores.length >= sim.total) finish(sim, avg(sim.scores), onDone);
      else sim.retryAt = now + 480;
      return;
    }
    sound && chime();
    sim.flash = dir;
    sim.flashUntil = now + 140;
    if (sim.input.length === sim.seq.length) {
      sim.scores.push(100);
      sim.showing = true;
      burst(sim, 0, 0, "#f0d48a");
      if (sim.scores.length >= sim.total) finish(sim, avg(sim.scores), onDone);
      else sim.retryAt = now + 480;
    }
  } else if (sim.mode === "hold" && id === "hold") {
    if (kind === "down" && !sim.holding && !sim.lock) {
      sim.holding = true;
      sim.start = now;
      sim.elapsed = 0;
    }
    if ((kind === "up" || kind === "cancel") && sim.holding) {
      sim.holding = false;
      const ms = now - sim.start;
      const sc = clamp(Math.round(100 - (Math.abs(ms - sim.target) / (sim.target * 0.55)) * 100), 10, 100);
      sim.scores.push(sc);
      sim.lock = true;
      sound && (sc >= 70 ? chime() : miss());
      sim.pops.push({ text: `${(ms / 1000).toFixed(2)}s`, x: 0, y: 0, t: now, life: 700, color: "#fff4d2" });
      if (sim.scores.length >= sim.total) finish(sim, avg(sim.scores), onDone);
      else sim.retryAt = now + 420;
    }
  } else if (sim.mode === "dodge") {
    if (!sim.started && kind === "down" && id === "start") {
      sim.started = true;
      sim.dir = Math.random() > 0.5 ? "left" : "right";
      sim.startedAt = now;
      return;
    }
    if (sim.started && kind === "down" && (id === "left" || id === "right")) {
      const rt = now - sim.startedAt;
      const correct = id === sim.dir;
      const sc = correct ? (rt <= 420 ? 100 : rt <= 650 ? 85 : rt <= 900 ? 70 : rt <= 1200 ? 55 : 40) : 0;
      sound && (correct ? chime() : miss());
      if (!correct) sim.shake = 9;
      sim.scores.push(sc);
      sim.lean = id;
      sim.leanUntil = now + 220;
      if (sim.scores.length >= sim.total) finish(sim, avg(sim.scores), onDone);
      else {
        sim.round += 1;
        sim.dir = Math.random() > 0.5 ? "left" : "right";
        sim.startedAt = now;
      }
    }
  }
}

function cueReaction(sim, now) {
  sim.phase = "wait";
  sim.text = "WAIT";
  sim.goAt = now + 650 + Math.random() * 700;
  sim.deadline = 0;
}
function tickSim(sim, now) {
  if (sim.reported) return;
  if (sim.mode === "reaction") {
    if (sim.phase === "wait" && now >= sim.goAt) {
      sim.phase = "go";
      sim.text = "GO";
      sim.deadline = now + sim.window;
    } else if (sim.phase === "go" && sim.deadline && now >= sim.deadline) {
      sim.scores.push(0);
      sim.phase = "result";
      sim.text = "Too slow";
      sim.shake = 6;
      if (sim.scores.length >= sim.total) finish(sim, avg(sim.scores), sim.onDone);
      else sim.retryAt = now + 560;
    } else if (sim.phase === "result" && sim.retryAt && now >= sim.retryAt && sim.scores.length < sim.total) {
      cueReaction(sim, now);
    }
  } else if (sim.mode === "target" && sim.locked && sim.nextAt && now >= sim.nextAt && !sim.reported) {
    sim.round += 1;
    sim.locked = false;
    sim.ball = null;
    sim.start = now;
    sim.nextAt = 0;
  } else if (sim.mode === "memory") {
    if (sim.showing && sim.timeline) {
      const elapsed = now - sim.memStart;
      let flash = null;
      for (const ev of sim.timeline) if (elapsed >= ev.t) flash = ev.id;
      sim.flash = flash;
      if (elapsed >= sim.showUntil) {
        sim.showing = false;
        sim.flash = null;
      }
    } else if (sim.retryAt && now >= sim.retryAt && sim.scores.length < sim.total && !sim.reported) {
      sim.round += 1;
      sim.retryAt = 0;
      beginMemory(sim);
    }
    if (sim.flashUntil && now > sim.flashUntil && !sim.showing) sim.flash = null;
  } else if (sim.mode === "hold") {
    if (sim.holding) sim.elapsed = now - sim.start;
    if (sim.lock && sim.retryAt && now >= sim.retryAt && sim.scores.length < sim.total && !sim.reported) {
      sim.round += 1;
      sim.lock = false;
      sim.elapsed = 0;
      sim.retryAt = 0;
    }
  }
}
function finish(sim, score, onDone) {
  if (sim.reported) return;
  sim.reported = true;
  sim.final = score;
  const done = onDone || sim.onDone;
  setTimeout(() => done && done(score), 280);
}

function layout(w, h) {
  const land = w / h > 1.02;
  const hud = land ? 84 : 102;
  const padH = land ? Math.max(128, Math.min(188, h * 0.24)) : Math.max(160, Math.min(230, h * 0.23));
  const bottom = 16;
  return { land, w, h, hud, padH, bottom, padTop: h - bottom - padH, feetY: h - bottom - padH - 6, scholarH: land ? Math.min(h * 0.52, 390) : Math.min(h * 0.34, 300) };
}

function hud(ctx, L, title, sub, right) {
  const boxH = sub ? 92 : 74;
  rr(ctx, 14, 12, Math.min(L.w - 140, 480), boxH, 20);
  ctx.fillStyle = "rgba(255,253,248,0.94)";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(22,50,74,0.1)";
  ctx.stroke();
  label(ctx, "SCHOLAR SPRINT", 28, 32, `600 11px ${SANS}`, "#7a6240");
  label(ctx, title, 28, 58, `600 ${L.land ? 32 : 28}px ${DISPLAY}`, "#16324a");
  if (sub) label(ctx, sub, 28, 84, `500 14px ${SANS}`, "#6d7874");
  if (right) label(ctx, right, L.w - 32, 48, `600 15px ${SANS}`, "#16324a", "right");
}

function drawPips(ctx, L, list, at) {
  const n = list.length;
  const gap = 8;
  const w = Math.min(148, (L.w - 48) / n - gap);
  let x = L.w - 22 - n * (w + gap) + gap;
  const y = L.land ? 70 : 86;
  list.forEach((_, i) => {
    rr(ctx, x, y, w, 6, 3);
    ctx.fillStyle = i < at ? "#3f6b52" : i === at ? "#16324a" : "rgba(22,50,74,0.16)";
    ctx.fill();
    x += w + gap;
  });
}

function chevron(ctx, x, y, dir, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (dir === "left") {
    ctx.moveTo(18, -26);
    ctx.lineTo(-14, 0);
    ctx.lineTo(18, 26);
  } else {
    ctx.moveTo(-18, -26);
    ctx.lineTo(14, 0);
    ctx.lineTo(-18, 26);
  }
  ctx.stroke();
  ctx.restore();
}

function twoPads(ctx, hits, L, hot) {
  const gap = 14;
  const w = (L.w - 36 - gap) / 2;
  const y = L.padTop;
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 180);
  [["left", 18], ["right", 18 + w + gap]].forEach(([id, x]) => {
    stone(ctx, x, y, w, L.padH, hot === id, pulse);
    hits.push({ id, x, y, w, h: L.padH });
    chevron(ctx, x + w / 2, y + L.padH / 2, id, hot === id ? "#3a2a12" : "#16324a");
  });
}

function drawPlay(ctx, L, sim, now, hits, stationAt, stations, runScore) {
  drawField(ctx, L.w, L.h);
  const pulse = 0.5 + 0.5 * Math.sin(now / 180);
  const cx = L.w * 0.5;
  let pose = "idle";
  let frame = 0;
  let sx = L.land ? L.w * 0.34 : L.w * 0.5;
  let sy = L.feetY;
  let flip = false;

  if (sim.mode === "feet") {
    pose = now < sim.stepUntil ? "run" : "idle";
    frame = pose === "run" ? Math.floor(now / 90) % 4 : 0;
    sx = L.w * 0.5;
    twoPads(ctx, hits, L, sim.side);
    const anchor = sim.pops[sim.pops.length - 1];
    if (anchor && anchor.x === 0) {
      anchor.x = L.w * 0.5;
      anchor.y = L.feetY - L.scholarH * 0.72;
    }
  } else if (sim.mode === "reaction") {
    pose = sim.phase === "go" ? "run" : "blocks";
    frame = sim.phase === "go" ? Math.floor(now / 80) % 4 : 1;
    sx = sim.phase === "go" ? L.w * 0.42 : L.w * 0.3;
    const y = L.hud + 16;
    const h = L.padTop - y - 16;
    stone(ctx, 18, y, L.w - 36, h, sim.phase === "go", pulse);
    hits.push({ id: "field", x: 18, y, w: L.w - 36, h });
    const lamp = sim.phase === "go" ? "#f2d48a" : sim.phase === "wait" ? "#c4564a" : "#d9c7a2";
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.arc(L.w / 2, y + 36, 14, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, sim.text, L.w / 2, y + h * 0.58, `600 ${L.land ? 64 : 48}px ${DISPLAY}`, "#16324a", "center");
    label(ctx, `${Math.min(sim.scores.length + 1, sim.total)} / ${sim.total}`, L.w - 36, y + 28, `600 14px ${SANS}`, "#6d7874", "right");
  } else if (sim.mode === "target") {
    pose = sim.ball && now - sim.ball.t < 280 ? "kick" : "idle";
    frame = pose === "kick" ? 2 : 0;
    sx = L.land ? L.w * 0.28 : L.w * 0.24;
    const gx = L.land ? L.w * 0.48 : 18;
    const gy = L.hud + 18;
    const gw = L.land ? L.w * 0.46 : L.w - 36;
    const gh = L.padTop - gy - 18;
    rr(ctx, gx, gy, gw, gh, 18);
    ctx.fillStyle = "rgba(255,253,248,0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(22,50,74,0.28)";
    ctx.lineWidth = 3;
    ctx.stroke();
    const center = targetCenter(sim);
    const pos = sim.locked && sim.ball ? sim.ball.pos : targetPos(sim, now);
    const zoneX = gx + ((center - sim.width / 2) / 100) * gw;
    const zoneW = (sim.width / 100) * gw;
    ctx.fillStyle = "rgba(126,196,122,0.55)";
    ctx.fillRect(zoneX, gy + 8, zoneW, gh - 16);
    const mx = gx + (pos / 100) * gw;
    ctx.fillStyle = "#16324a";
    rr(ctx, mx - 5, gy + 10, 10, gh - 20, 5);
    ctx.fill();
    hits.push({ id: "goal", x: gx, y: gy, w: gw, h: gh });
    label(ctx, sim.locked ? "Locked" : "Tap the goal", gx + gw / 2, gy + gh - 22, `600 14px ${SANS}`, "#16324a", "center");
  } else if (sim.mode === "memory") {
    pose = "idle";
    frame = 0;
    sx = L.land ? L.w * 0.22 : L.w * 0.5;
    sy = L.land ? L.h * 0.78 : L.padTop - 4;
    const dirs = [
      ["up", L.w * 0.62, L.hud + (L.padTop - L.hud) * 0.22],
      ["left", L.w * 0.46, L.hud + (L.padTop - L.hud) * 0.55],
      ["right", L.w * 0.78, L.hud + (L.padTop - L.hud) * 0.55],
      ["down", L.w * 0.62, L.hud + (L.padTop - L.hud) * 0.84],
    ];
    if (!L.land) {
      dirs[0][1] = L.w * 0.5;
      dirs[1][1] = L.w * 0.24;
      dirs[2][1] = L.w * 0.76;
      dirs[3][1] = L.w * 0.5;
      dirs[0][2] = L.hud + 70;
      dirs[1][2] = L.hud + (L.feetY - L.hud) * 0.42;
      dirs[2][2] = dirs[1][2];
      dirs[3][2] = L.hud + (L.feetY - L.hud) * 0.68;
    }
    const r = L.land ? 46 : 40;
    for (const [id, x, y] of dirs) {
      const on = sim.flash === id;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.72, y + r * 0.55);
      ctx.lineTo(x - r * 0.72, y + r * 0.55);
      ctx.closePath();
      ctx.fillStyle = on ? "#f2d48a" : "#c4553d";
      ctx.shadowColor = on ? "rgba(242,212,138,0.8)" : "transparent";
      ctx.shadowBlur = on ? 18 : 0;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff8ee";
      ctx.fillRect(x - r * 0.28, y - 2, r * 0.56, 8);
      hits.push({ id: `cone-${id}`, x, y: y - 6, r: r + 8 });
    }
  } else if (sim.mode === "hold") {
    pose = sim.holding ? "blocks" : "idle";
    frame = sim.holding ? 1 : 0;
    sx = L.w * 0.5;
    stone(ctx, 18, L.padTop, L.w - 36, L.padH, sim.holding, pulse);
    hits.push({ id: "hold", x: 18, y: L.padTop, w: L.w - 36, h: L.padH });
    const ratio = sim.elapsed / sim.target;
    ctx.strokeStyle = "rgba(22,50,74,0.18)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(sx, sy - L.scholarH * 0.48, L.scholarH * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = ratio > 1.08 ? "#e07a6a" : "#f2d48a";
    ctx.beginPath();
    ctx.arc(sx, sy - L.scholarH * 0.48, L.scholarH * 0.42, -Math.PI / 2, -Math.PI / 2 + Math.min(ratio, 1.35) * Math.PI * 2);
    ctx.stroke();
    label(ctx, sim.holding ? `${(sim.elapsed / 1000).toFixed(2)}` : "HOLD", L.w / 2, L.padTop + L.padH / 2, `600 28px ${SANS}`, "#16324a", "center");
    label(ctx, `Mark ${(sim.target / 1000).toFixed(2)}s`, L.w / 2, L.padTop + 22, `600 13px ${SANS}`, "#6d7874", "center");
  } else if (sim.mode === "dodge") {
    pose = "run";
    frame = sim.started ? Math.floor(now / 90) % 4 : 0;
    const lane = sim.leanUntil && now < sim.leanUntil ? sim.lean : "mid";
    sx = L.w * 0.34;
    if (!sim.started) {
      stone(ctx, L.w * 0.28, L.padTop, L.w * 0.44, L.padH, true, pulse);
      hits.push({ id: "start", x: L.w * 0.28, y: L.padTop, w: L.w * 0.44, h: L.padH });
      label(ctx, "READY", L.w / 2, L.padTop + L.padH / 2, `600 28px ${SANS}`, "#3a2a12", "center");
    } else {
      twoPads(ctx, hits, L, sim.dir);
      const danger = sim.dir === "left" ? "right" : "left";
      const travel = ((now - sim.startedAt) % 900) / 900;
      const gap = 14;
      const pw = (L.w - 36 - gap) / 2;
      const hx = danger === "left" ? 18 + pw - travel * pw : 18 + pw + gap + travel * (pw * 0.3);
      ctx.fillStyle = "rgba(22,50,74,0.85)";
      rr(ctx, hx, L.padTop + 18, 18, L.padH - 36, 6);
      ctx.fill();
      if (lane === "left") sx = L.w * 0.28;
      if (lane === "right") sx = L.w * 0.72;
    }
  }

  drawScholar(ctx, pose, frame, sx, sy, L.scholarH, flip);
  const doneCount = sim.scores ? sim.scores.length : sim.count || 0;
  const total = sim.total || sim.goal;
  hud(ctx, L, NAME[sim.mode], HINT[sim.mode], runScore == null ? `${Math.min(doneCount + (sim.reported ? 0 : 1), total)}/${total}` : `Run ${runScore}`);
  drawPips(ctx, L, stations, stationAt);
  if (sim.shake > 0.5) sim.shake *= 0.88;
  pops(ctx, sim.pops, now);
}

function MapScreen({ onPick, unlocked = 1, stars = [], points = 0, streak = 0, count = 8 }) {
  const n = Math.max(1, Math.min(8, count || 8));
  const openLevel = Math.max(1, Math.min(n, unlocked));
  const current = CIRCUITS[openLevel - 1];
  return jsx.jsxs("div", {
    className: "mx-auto max-w-3xl space-y-6",
    children: [
      jsx.jsx("a", {
        href: "/play",
        className: "inline-flex items-center gap-2 text-sm text-muted hover:text-ink",
        children: "←  Play",
      }),
      jsx.jsxs("header", {
        className: "flex flex-wrap items-end justify-between gap-4",
        children: [
          jsx.jsxs("div", {
            className: "max-w-xl",
            children: [
              jsx.jsx("p", { className: "text-xs font-semibold tracking-[0.22em] text-navy uppercase", children: "PE · House Games" }),
              jsx.jsx("h1", { className: "mt-2 font-display text-4xl font-semibold text-ink", children: "Scholar Sprint" }),
              jsx.jsx("p", { className: "mt-2 text-muted", children: "Eight circuits on the house track. Two stars open the next one." }),
            ],
          }),
          jsx.jsxs("div", {
            className: "flex gap-2 text-sm text-ink",
            children: [
              jsx.jsx("span", { className: "rounded-full bg-sage px-3 py-1.5", children: `${points} pts` }),
              jsx.jsx("span", { className: "rounded-full bg-sage px-3 py-1.5", children: `Streak ${streak}` }),
            ],
          }),
        ],
      }),
      jsx.jsxs("section", {
        className: "panel relative overflow-hidden",
        children: [
          jsx.jsx("img", { src: "/art/pe-sprint/field.jpg", alt: "", className: "h-72 w-full object-cover sm:h-80", style: { objectPosition: "center 62%" } }),
          jsx.jsx("img", { src: "/art/doll/pe.png", alt: "", className: "pointer-events-none absolute bottom-0 right-[4%] h-[94%] w-auto drop-shadow" }),
          jsx.jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/5 to-transparent" }),
          jsx.jsxs("div", {
            className: "absolute inset-x-0 bottom-0 p-5 text-card sm:p-6",
            children: [
              jsx.jsx("p", { className: "text-xs font-semibold tracking-[0.18em] text-gold uppercase", children: `Circuit ${openLevel} open` }),
              jsx.jsx("p", { className: "font-display text-3xl font-semibold leading-none", children: current[0] }),
              jsx.jsx("p", { className: "mt-1 max-w-sm text-sm text-card/80", children: current[1] }),
            ],
          }),
        ],
      }),
      jsx.jsx("div", {
        className: "grid gap-3 sm:grid-cols-2",
        children: Array.from({ length: n }, (_, i) => {
          const level = i + 1;
          const open = level <= unlocked;
          const earned = stars[i] || 0;
          const hot = level === openLevel;
          const [title, focus] = CIRCUITS[i];
          return jsx.jsxs("button", {
            type: "button",
            disabled: !open,
            onClick: () => open && onPick?.(level),
            className: `panel flex min-h-[5.5rem] items-center gap-4 p-4 text-left transition ${hot ? "ring-2 ring-navy" : ""} ${open ? "hover:-translate-y-0.5" : "cursor-not-allowed opacity-50"}`,
            children: [
              jsx.jsx("span", {
                className: `grid size-12 shrink-0 place-items-center rounded-full font-display text-2xl ${hot ? "bg-navy text-card" : "bg-sage text-navy"}`,
                children: String(level),
              }),
              jsx.jsxs("span", {
                className: "min-w-0 flex-1",
                children: [
                  jsx.jsx("span", { className: "block font-display text-2xl leading-none text-ink", children: title }),
                  jsx.jsx("span", { className: "mt-1 block text-sm text-muted", children: open ? focus : "Need 2 stars on the circuit before" }),
                  jsx.jsx("span", { className: "mt-1 block text-sm tracking-[0.2em] text-bronze", children: `${"★".repeat(earned)}${"☆".repeat(3 - earned)}` }),
                ],
              }),
            ],
          }, String(level));
        }),
      }),
    ],
  });
}

function useChromeBox() {
  const [box, setBox] = useState({ top: 64, bottom: 0, left: 0 });
  useEffect(() => {
    const measure = () => {
      const header = document.querySelector("header");
      const nav = document.querySelector("nav.fixed");
      const today = document.getElementById("lux-today");
      let top = 0;
      if (header) {
        const s = getComputedStyle(header);
        if (s.display !== "none" && (s.position === "sticky" || s.position === "fixed")) top = header.getBoundingClientRect().height;
      }
      if (today && !today.hidden && today.dataset.place !== "aside") top = Math.max(top, today.getBoundingClientRect().bottom);
      let bottom = 0;
      if (nav) {
        const r = nav.getBoundingClientRect();
        const style = getComputedStyle(nav);
        const docked = style.display !== "none" && r.height > 20 && r.top < window.innerHeight - 8 && r.bottom > window.innerHeight * 0.55;
        if (docked) bottom = Math.max(bottom, window.innerHeight - r.top);
      }
      let left = 0;
      const aside = document.querySelector("aside");
      if (aside && getComputedStyle(aside).display !== "none" && aside.getBoundingClientRect().width > 40 && window.innerWidth >= 1280) {
        left = Math.round(aside.getBoundingClientRect().width);
      }
      setBox({ top: Math.round(top), bottom: Math.round(bottom), left });
    };
    measure();
    window.addEventListener("resize", measure);
    const id = setInterval(measure, 500);
    return () => {
      window.removeEventListener("resize", measure);
      clearInterval(id);
    };
  }, []);
  return box;
}

function Arena({ level, onExit }) {
  useLockScroll();
  const chrome = useChromeBox();
  const record = useStore((s) => s.recordPe);
  const sound = useStore((s) => s.sound);
  const cfg = CIRCUITS[Math.min(8, Math.max(1, level)) - 1];
  const [phase, setPhase] = useState("intro");
  const [at, setAt] = useState(0);
  const [scores, setScores] = useState([]);
  const [result, setResult] = useState(null);
  const scoresRef = useRef([]);
  const sim = useRef(null);
  const hits = useRef([]);
  const last = useRef(performance.now());
  const mode = cfg[2][at];

  useEffect(() => {
    if (phase !== "play") return;
    const next = makeSim(mode, level);
    next.onDone = (score) => {
      const a = [...scoresRef.current, score];
      scoresRef.current = a;
      setScores(a);
      if (a.length >= cfg[2].length) {
        const av = avg(a);
        const st = starsOf(av);
        const res = record(50 + av + level * 10, st, level);
        if (sound) finishSound();
        toast("Circuit complete", { description: `${st} star${st === 1 ? "" : "s"} · ${res?.awarded ?? 0} XP` });
        setResult({ ...(res && typeof res === "object" ? res : {}), avg: av, stars: st });
        setPhase("done");
      } else setAt(a.length);
    };
    sim.current = next;
  }, [phase, mode, at, level]);

  const ref = useCanvas((ctx, w, h, now) => {
    const dt = Math.min(0.05, (now - last.current) / 1000);
    last.current = now;
    const L = layout(w, h);
    const list = [];
    if (sim.current && phase === "play") tickSim(sim.current, now);
    if (phase === "intro") {
      drawField(ctx, w, h);
      drawScholar(ctx, "idle", 0, w * 0.72, h * 0.72, Math.min(420, h * 0.5), false);
      const rows = cfg[2].length;
      const boxW = Math.min(420, w - 130);
      const boxH = 96 + rows * 30;
      plate(ctx, 16, 16, boxW, boxH);
      label(ctx, "SCHOLAR SPRINT", 32, 38, `600 11px ${SANS}`, "#7a6240");
      label(ctx, cfg[0], 32, 66, `600 30px ${DISPLAY}`, "#16324a");
      label(ctx, cfg[1], 32, 96, `500 15px ${SANS}`, "#6d7874");
      cfg[2].forEach((m, i) => {
        label(ctx, `${i + 1}    ${NAME[m]}`, 32, 128 + i * 28, `600 16px ${SANS}`, "#16324a");
      });
      const bw = Math.min(280, w - 48);
      const bh = 74;
      const bx = 22;
      const by = h - bh - 28;
      stone(ctx, bx, by, bw, bh, true, 0.6);
      label(ctx, "Start", bx + bw / 2, by + bh / 2, `600 28px ${DISPLAY}`, "#3a2a12", "center");
      list.push({ id: "start", x: bx, y: by, w: bw, h: bh });
    } else if (phase === "play" && sim.current) {
      ctx.save();
      if (sim.current.shake > 0.5) ctx.translate((Math.random() - 0.5) * sim.current.shake, (Math.random() - 0.5) * sim.current.shake);
      drawPlay(ctx, L, sim.current, now, list, at, cfg[2], scores.length ? avg(scores) : null);
      drawFx(ctx, sim.current, 0);
      ctx.restore();
    } else if (phase === "done") {
      drawField(ctx, w, h);
      drawScholar(ctx, "cheer", 3, w * 0.72, h * 0.7, Math.min(400, h * 0.48), false);
      const rows = cfg[2].length;
      const boxW = Math.min(360, w - 48);
      const boxH = 150 + rows * 26;
      plate(ctx, (w - boxW) / 2, 16, boxW, boxH);
      label(ctx, "SCHOLAR SPRINT", w / 2, 40, `600 11px ${SANS}`, "#7a6240", "center");
      label(ctx, cfg[0], w / 2, 70, `600 30px ${DISPLAY}`, "#16324a", "center");
      const st = result?.stars || 0;
      for (let i = 0; i < 3; i++) star(ctx, w / 2 - 36 + i * 36, 108, 14, i < st ? "#b08968" : "rgba(22,50,74,0.16)");
      label(ctx, `${result?.avg ?? 0} / 100`, w / 2, 140, `600 18px ${SANS}`, "#16324a", "center");
      label(ctx, `${result?.awarded ?? 0} XP`, w / 2, 162, `500 14px ${SANS}`, "#6d7874", "center");
      cfg[2].forEach((m, i) => {
        label(ctx, `${NAME[m]}    ${scores[i] ?? 0}`, w / 2, 196 + i * 24, `600 16px ${SANS}`, "#16324a", "center");
      });
      const bw = Math.min(220, (w - 56) / 2);
      const by = h - 96;
      stone(ctx, 22, by, bw, 68, true, 0.4);
      stone(ctx, w - 22 - bw, by, bw, 68, false, 0);
      label(ctx, "Again", 22 + bw / 2, by + 34, `600 20px ${SANS}`, "#3a2a12", "center");
      label(ctx, "Circuits", w - 22 - bw / 2, by + 34, `600 20px ${SANS}`, "#16324a", "center");
      list.push({ id: "again", x: 22, y: by, w: bw, h: 68 });
      list.push({ id: "back", x: w - 22 - bw, y: by, w: bw, h: 68 });
    }
    hits.current = list;
  });

  const down = (e) => {
    e.preventDefault();
    ref.current?.setPointerCapture?.(e.pointerId);
    const id = hitAt(hits.current, point(e, ref.current).x, point(e, ref.current).y);
    if (phase === "intro" && id === "start") {
      scoresRef.current = [];
      setScores([]);
      setAt(0);
      setPhase("play");
      return;
    }
    if (phase === "done") {
      if (id === "again") {
        scoresRef.current = [];
        setScores([]);
        setAt(0);
        setResult(null);
        setPhase("intro");
      } else if (id === "back") onExit?.();
      return;
    }
    if (phase === "play" && sim.current) pressSim(sim.current, id, "down", performance.now(), sound, sim.current.onDone);
  };
  const up = (e) => {
    if (phase === "play" && sim.current) pressSim(sim.current, hitAt(hits.current, point(e, ref.current).x, point(e, ref.current).y) || "hold", "up", performance.now(), sound, sim.current.onDone);
  };

  return jsx.jsxs("div", {
    style: {
      position: "fixed",
      top: chrome.top,
      left: chrome.left,
      right: 0,
      bottom: chrome.bottom,
      zIndex: 35,
      background: "#f3eee4",
      touchAction: "none",
    },
    children: [
      jsx.jsx("canvas", {
        ref,
        style: { width: "100%", height: "100%", display: "block", touchAction: "none" },
        onPointerDown: down,
        onPointerUp: up,
        onPointerCancel: up,
        onContextMenu: (e) => e.preventDefault(),
      }),
      jsx.jsx("button", {
        type: "button",
        onClick: () => onExit?.(),
        style: {
          position: "absolute",
          top: 18,
          right: 18,
          zIndex: 2,
          background: "#16324a",
          color: "#fffdf8",
          border: 0,
          borderRadius: 999,
          padding: "8px 14px",
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 650,
        },
        children: "Leave",
      }),
    ],
  });
}

function Game(props) {
  if (!props.level) return jsx.jsx(MapScreen, props);
  return jsx.jsx(Arena, { level: props.level, onExit: props.onExit });
}

export { Game as n, meta as t };
