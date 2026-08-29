const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const DIATONIC_STEPS = [0, 2, 4, 5, 7, 9, 11];
const LETTER_BASE_MIDI = 48;
const DIGIT_MIDI = Object.freeze({
  "0": 43,
  "1": 50,
  "2": 52,
  "3": 53,
  "4": 55,
  "5": 57,
  "6": 59,
  "7": 62,
  "8": 64,
  "9": 67
});
const WAVEFORMS = ["sine", "triangle", "sine", "triangle", "sawtooth"];
const SOUND_MODE_KEY = "spectramuse-sound-mode-v2";

export const LITE_PRESETS = ["normal", "colorBlind", "calm", "inverted"];
export const STUDIO_PRESETS = ["normal", "colorBlind", "inverted", "calm", "crazyFun"];

export const PRESENTATION_PRESETS = {
  normal: {
    label: "Normal",
    hueOffset: 0,
    saturation: 92,
    lightness: 68,
    glow: 1,
    motion: 1,
    particles: 1,
    audioEnergy: 1,
    tempo: 0.105,
    underlineStyle: "solid"
  },
  colorBlind: {
    label: "Color Blind",
    colorBlind: true,
    saturation: 86,
    lightness: 70,
    glow: 0.86,
    motion: 0.9,
    particles: 0.82,
    audioEnergy: 0.96,
    tempo: 0.12,
    underlineStyle: "solid"
  },
  inverted: {
    label: "Inverted",
    hueOffset: 24,
    saturation: 78,
    lightness: 44,
    glow: 0.72,
    motion: 0.92,
    particles: 0.7,
    audioEnergy: 0.9,
    tempo: 0.118,
    underlineStyle: "double"
  },
  calm: {
    label: "Calm",
    hueOffset: 14,
    saturation: 62,
    lightness: 72,
    glow: 0.54,
    motion: 0.45,
    particles: 0.42,
    audioEnergy: 0.5,
    tempo: 0.165,
    underlineStyle: "solid"
  },
  crazyFun: {
    label: "Crazy Fun",
    hueOffset: 44,
    saturation: 100,
    lightness: 67,
    glow: 1.28,
    motion: 1.65,
    particles: 1.48,
    audioEnergy: 1.26,
    tempo: 0.078,
    underlineStyle: "wavy"
  }
};

export const STORY_PALETTES = {
  classic: { label: "Classic glow", hueShift: 18, hue2Shift: 190, accent: "#ffcc7a" },
  dream: { label: "Dream lake", hueShift: 206, hue2Shift: 282, accent: "#7ac7ff" },
  storm: { label: "Storm page", hueShift: 254, hue2Shift: 38, accent: "#c5b7ff" },
  ember: { label: "Ember room", hueShift: 8, hue2Shift: 158, accent: "#ff9a6b" },
  prism: { label: "Prism night", hueShift: 318, hue2Shift: 146, accent: "#ff7ab7" }
};

export const SOUND_MODES = Object.freeze({
  orchestralBloom: {
    label: "Orchestral Bloom",
    descriptor: "warm layered orchestra",
    attack: 0.035,
    release: 0.72,
    filter: 3100,
    wet: 0.22,
    partials: [[1, "triangle", 1], [2, "sine", 0.28], [3, "sine", 0.12]]
  },
  grandPiano: {
    label: "Grand Piano",
    descriptor: "warm acoustic piano",
    attack: 0.006,
    release: 0.86,
    filter: 4300,
    wet: 0.16,
    partials: [[1, "triangle", 1], [2, "sine", 0.34], [3, "sine", 0.16]]
  },
  crystalBells: {
    label: "Crystal Bells",
    descriptor: "bright glass bell",
    attack: 0.009,
    release: 1.1,
    filter: 6200,
    wet: 0.3,
    partials: [[1, "sine", 1], [2, "sine", 0.36], [4, "sine", 0.12]]
  },
  velvetStrings: {
    label: "Velvet Strings",
    descriptor: "soft sustained strings",
    attack: 0.12,
    release: 0.9,
    filter: 2400,
    wet: 0.24,
    partials: [[1, "triangle", 1], [2, "sine", 0.22], [3, "sine", 0.08]]
  },
  auroraChoir: {
    label: "Aurora Choir",
    descriptor: "airy glowing choir",
    attack: 0.16,
    release: 1.05,
    filter: 2800,
    wet: 0.34,
    partials: [[1, "sine", 1], [1, "sine", 0.42, -6], [1, "sine", 0.42, 6], [2, "sine", 0.1]]
  },
  softKeys: {
    label: "Soft Keys",
    descriptor: "gentle electric keys",
    attack: 0.012,
    release: 0.48,
    filter: 3500,
    wet: 0.13,
    partials: [[1, "triangle", 1], [2, "sine", 0.18]]
  },
  cinematicDeep: {
    label: "Cinematic Deep",
    descriptor: "dark cinematic resonance",
    attack: 0.08,
    release: 1.18,
    filter: 1800,
    wet: 0.28,
    partials: [[1, "sine", 1], [2, "triangle", 0.18], [3, "sine", 0.06]]
  }
});

const COLOR_BLIND_COLORS = [
  { color: "hsl(42 100% 70%)", hue: 42 },
  { color: "hsl(199 76% 70%)", hue: 199 },
  { color: "hsl(211 100% 68%)", hue: 211 },
  { color: "hsl(24 95% 66%)", hue: 24 },
  { color: "hsl(313 55% 74%)", hue: 313 },
  { color: "hsl(170 62% 68%)", hue: 170 },
  { color: "hsl(255 74% 78%)", hue: 255 },
  { color: "hsl(0 0% 88%)", hue: 0 }
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLetter(letter) {
  return String(letter || "").toLowerCase().match(/[a-z]/)?.[0] || "";
}

function normalizeSymbol(symbol) {
  const value = String(symbol || "").toLowerCase();
  return value.match(/[a-z0-9]/)?.[0] || "";
}

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function diatonicMidi(degreeIndex, baseMidi = 60) {
  const octave = Math.floor(degreeIndex / DIATONIC_STEPS.length);
  const degree = ((degreeIndex % DIATONIC_STEPS.length) + DIATONIC_STEPS.length) % DIATONIC_STEPS.length;
  return baseMidi + octave * 12 + DIATONIC_STEPS[degree];
}

function getLetterMidi(letter) {
  const index = getLetterIndex(letter);
  if (index < 0) return null;
  return diatonicMidi(index, LETTER_BASE_MIDI);
}

function getDigitIndex(digit) {
  return DIGITS.indexOf(String(digit || ""));
}

function getSymbolIndex(symbol) {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return -1;
  const letterIndex = LETTERS.indexOf(normalized);
  return letterIndex >= 0 ? letterIndex : LETTERS.length + getDigitIndex(normalized);
}

function getSymbolMidi(symbol) {
  const normalized = normalizeSymbol(symbol);
  if (!normalized) return null;
  if (DIGIT_MIDI[normalized] != null) return DIGIT_MIDI[normalized];
  return getLetterMidi(normalized);
}

function hashText(text) {
  let h = 2166136261;
  for (const char of String(text || "")) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getPreset(presetId = "normal") {
  return PRESENTATION_PRESETS[presetId] || PRESENTATION_PRESETS.normal;
}

export function getPalette(paletteId = "classic") {
  return STORY_PALETTES[paletteId] || STORY_PALETTES.classic;
}

export function getSoundMode(modeId = "orchestralBloom") {
  return SOUND_MODES[modeId] || SOUND_MODES.orchestralBloom;
}

export function getLetterIndex(letter) {
  const normalized = normalizeLetter(letter);
  if (!normalized) return -1;
  return LETTERS.indexOf(normalized);
}

export function getSymbolTone(symbol, presetId = "normal") {
  const normalized = normalizeSymbol(symbol);
  const midi = getSymbolMidi(normalized);
  if (midi == null) return null;
  const index = Math.max(0, getSymbolIndex(normalized));
  const preset = getPreset(presetId);
  const frequency = midiToFrequency(midi);
  const calmType = preset === PRESENTATION_PRESETS.calm ? "sine" : null;

  return {
    midi,
    frequency: Math.round(frequency * 100) / 100,
    type: calmType || WAVEFORMS[index % WAVEFORMS.length],
    duration: clamp(0.2 / preset.audioEnergy, 0.11, 0.3),
    gain: clamp(0.082 * preset.audioEnergy, 0.032, 0.12),
    pan: ((index % 9) - 4) / 10,
    detune: 0
  };
}

export function getLetterTone(letter, presetId = "normal") {
  return getSymbolTone(letter, presetId) || {
    midi: 60,
    frequency: 261.63,
    type: "sine",
    duration: 0.18,
    gain: 0.06,
    pan: 0,
    detune: 0
  };
}

export function getSymbolProfile(symbol, options = {}) {
  const normalized = normalizeSymbol(symbol);
  const index = Math.max(0, getSymbolIndex(normalized));
  const preset = getPreset(options.presetId);
  const palette = getPalette(options.paletteId);
  const isDigit = DIGITS.includes(normalized);
  const isVowel = !isDigit && VOWELS.has(normalized);
  const category = isDigit ? "number" : isVowel ? "vowel" : index % 3 === 0 ? "pulse" : index % 3 === 1 ? "line" : "grain";
  const underlineStyles = ["solid", "dashed", "double", "wavy"];
  const hueSeed = isDigit ? 24 + getDigitIndex(normalized) * 31.7 : index * 137.508;
  let hue = (hueSeed + palette.hueShift + (preset.hueOffset || 0)) % 360;
  let color = `hsl(${Math.round(hue)} ${preset.saturation}% ${preset.lightness}%)`;
  let underlineStyle = preset.underlineStyle || underlineStyles[index % underlineStyles.length];

  if (preset.colorBlind) {
    const safe = COLOR_BLIND_COLORS[index % COLOR_BLIND_COLORS.length];
    color = safe.color;
    hue = safe.hue;
    underlineStyle = underlineStyles[index % underlineStyles.length];
  }

  return {
    symbol: normalized,
    letter: normalized,
    index,
    category,
    color,
    hue,
    isDigit,
    isVowel,
    glow: preset.glow,
    underlineStyle,
    lane: index % 5,
    tone: getSymbolTone(normalized, options.presetId)
  };
}

export function getLetterProfile(letter, options = {}) {
  return getSymbolProfile(letter, options);
}

export function getLetterColor(letter, options = {}) {
  return getLetterProfile(letter, options).color;
}

export function getWordMotif(word, options = {}) {
  return String(word || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 18)
    .split("")
    .map((symbol, index) => ({
      letter: symbol,
      symbol,
      profile: getSymbolProfile(symbol, { ...options, position: index }),
      delay: index * getPreset(options.presetId).tempo
    }));
}

export function getWordChord(word) {
  const clean = String(word || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!clean) return [];
  const rootDegree = hashText(clean) % 7;
  return [0, 2, 4].map(step => {
    const midi = diatonicMidi(rootDegree + step, 60);
    return { midi, frequency: midiToFrequency(midi) };
  });
}

export function scoreStory(value) {
  const raw = String(value || "").toLowerCase();
  const letters = raw.replace(/[^a-z]/g, "");
  const digits = raw.replace(/[^0-9]/g, "");
  const vowels = [...letters].filter(letter => VOWELS.has(letter)).length;
  const consonants = Math.max(letters.length - vowels + digits.length, 1);
  const words = String(value || "").trim().match(/[a-zA-Z0-9]+/g) || [];
  const warmth = Math.round((vowels / Math.max(letters.length, 1)) * 360);
  const density = clamp(String(value || "").length / 340, 0, 1);

  return { letters, digits, vowels, consonants, words, warmth, density };
}

function findInsertedText(before, after) {
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;
  let beforeSuffix = before.length;
  let afterSuffix = after.length;
  while (beforeSuffix > prefix && afterSuffix > prefix && before[beforeSuffix - 1] === after[afterSuffix - 1]) {
    beforeSuffix -= 1;
    afterSuffix -= 1;
  }
  return { text: after.slice(prefix, afterSuffix), start: prefix };
}

function tokenBeforeCaret(value, caret) {
  return value.slice(0, caret).match(/[a-zA-Z0-9]+(?=[^a-zA-Z0-9]*$)/)?.[0] || "";
}

function buildDeterministicImpulse(context, seconds = 1.55, decay = 2.6) {
  const length = Math.max(1, Math.floor(context.sampleRate * seconds));
  const buffer = context.createBuffer(2, length, context.sampleRate);
  let seed = 0x5a17c9e3;
  function nextRandom() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  }
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const envelope = Math.pow(1 - i / length, decay);
      data[i] = nextRandom() * envelope * 0.42;
    }
  }
  return buffer;
}

function ensureOrchestraVisuals() {
  if (typeof document === "undefined") return null;
  const visualizer = document.querySelector(".visualizer");
  if (!visualizer) return null;
  let field = visualizer.querySelector(".orchestra-field");
  if (field) return field;

  const style = document.createElement("style");
  style.id = "spectramuse-orchestra-style";
  style.textContent = `
    .visualizer .orb { display: none !important; }
    .visualizer .bar { animation: none !important; transform: scaleY(.3); opacity: .48; }
    body[data-mode="lite"] .grain { animation: none !important; }
    .orchestra-field { position:absolute; inset:72px 18px 126px; z-index:2; pointer-events:none; overflow:hidden; border-radius:20px; }
    body[data-mode="lite"] .orchestra-field { inset:22px 12px 112px; }
    .orchestra-lane { position:absolute; left:3%; right:3%; height:28px; transform:translateY(-50%); }
    .orchestra-line { position:absolute; left:0; right:0; top:50%; height:2px; border-radius:999px; background:linear-gradient(90deg, transparent, hsla(var(--hue),100%,76%,.28), hsla(var(--hue2),100%,72%,.38), transparent); opacity:.5; transform-origin:center; }
    .orchestra-note { position:absolute; left:0; top:50%; width:11px; height:11px; margin:-5.5px 0 0 -5.5px; border-radius:50%; background:var(--note-color, var(--accent)); box-shadow:0 0 12px var(--note-color, var(--accent)),0 0 24px var(--note-color, var(--accent)); }
    .orchestra-sweep { position:absolute; top:6%; bottom:6%; width:2px; left:0; background:linear-gradient(180deg, transparent, var(--accent), transparent); box-shadow:0 0 18px var(--accent); opacity:0; }
    @media (max-width:820px) { .orchestra-field { inset:18px 10px 108px; } }
    @media (prefers-reduced-motion: reduce) { .orchestra-note,.orchestra-sweep { display:none !important; } .orchestra-line { opacity:.65; } }
  `;
  document.head.appendChild(style);

  field = document.createElement("div");
  field.className = "orchestra-field";
  field.setAttribute("aria-hidden", "true");
  [16, 33, 50, 67, 84].forEach((top, index) => {
    const lane = document.createElement("div");
    lane.className = "orchestra-lane";
    lane.dataset.lane = String(index);
    lane.style.top = `${top}%`;
    const line = document.createElement("div");
    line.className = "orchestra-line";
    lane.appendChild(line);
    field.appendChild(lane);
  });
  visualizer.appendChild(field);
  return field;
}

function triggerSymbolVisual(symbol, options = {}) {
  if (typeof document === "undefined") return;
  const field = ensureOrchestraVisuals();
  if (!field) return;
  const presetId = options.presetId || document.body?.dataset?.preset || "normal";
  const paletteId = options.paletteId || document.getElementById("palette")?.value || "classic";
  const profile = getSymbolProfile(symbol, { presetId, paletteId });
  if (!profile.tone) return;
  const lane = field.querySelector(`.orchestra-lane[data-lane="${profile.lane}"]`);
  if (!lane) return;
  const line = lane.querySelector(".orchestra-line");
  const note = document.createElement("span");
  note.className = "orchestra-note";
  note.style.setProperty("--note-color", profile.color);
  lane.appendChild(note);

  if (note.animate) {
    const animation = note.animate([
      { left: "0%", opacity: 0, transform: "scale(.5)" },
      { left: "12%", opacity: 1, transform: "scale(1.25)" },
      { left: "72%", opacity: .92, transform: "scale(.9)" },
      { left: "100%", opacity: 0, transform: "scale(.55)" }
    ], { duration: 720, easing: "cubic-bezier(.2,.7,.25,1)" });
    animation.addEventListener("finish", () => note.remove(), { once: true });
  } else {
    setTimeout(() => note.remove(), 760);
  }
  if (line?.animate) {
    line.animate([
      { transform: "scaleY(1)", opacity: .48 },
      { transform: "scaleY(4.2)", opacity: .95 },
      { transform: "scaleY(1)", opacity: .5 }
    ], { duration: 420, easing: "ease-out" });
  }
}

function triggerWordVisual(word) {
  if (typeof document === "undefined") return;
  const field = ensureOrchestraVisuals();
  if (!field) return;
  const phase = hashText(word) % 120;
  field.querySelectorAll(".orchestra-line").forEach((line, index) => {
    if (!line.animate) return;
    line.animate([
      { transform: "scaleY(1) translateX(0)", opacity: .45 },
      { transform: `scaleY(${2.8 + (index % 2)}) translateX(${(phase % 7) - 3}px)`, opacity: .95 },
      { transform: "scaleY(1) translateX(0)", opacity: .5 }
    ], { duration: 620 + index * 35, easing: "ease-in-out" });
  });
}

function triggerCadenceVisual(mark) {
  if (typeof document === "undefined") return;
  const field = ensureOrchestraVisuals();
  if (!field) return;
  const sweep = document.createElement("div");
  sweep.className = "orchestra-sweep";
  field.appendChild(sweep);
  if (sweep.animate) {
    const animation = sweep.animate([
      { left: "0%", opacity: 0 },
      { left: "18%", opacity: .95 },
      { left: "82%", opacity: .9 },
      { left: "100%", opacity: 0 }
    ], { duration: mark === "!" ? 520 : mark === "?" ? 760 : 640, easing: "ease-in-out" });
    animation.addEventListener("finish", () => sweep.remove(), { once: true });
  } else {
    setTimeout(() => sweep.remove(), 800);
  }
}

function decorateDigits() {
  if (typeof document === "undefined") return;
  const layer = document.getElementById("letterLayer");
  if (!layer) return;
  const presetId = document.body?.dataset?.preset || "normal";
  const paletteId = document.getElementById("palette")?.value || "classic";
  [...layer.children].forEach((span, index) => {
    const char = span.textContent || "";
    if (!/^[0-9]$/.test(char)) return;
    const profile = getSymbolProfile(char, { presetId, paletteId, position: index });
    span.className = "letter letter-number";
    span.style.setProperty("--letter-color", profile.color);
    span.style.setProperty("--letter-glow", String(profile.glow));
    span.style.setProperty("--underline-style", profile.underlineStyle);
    span.dataset.tone = String(profile.tone.frequency);
  });
}

function mountDigitObserver() {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  const layer = document.getElementById("letterLayer");
  if (!layer || layer.dataset.numberObserver === "true") return;
  layer.dataset.numberObserver = "true";
  const observer = new MutationObserver(decorateDigits);
  observer.observe(layer, { childList: true });
  decorateDigits();
}

function mountSoundControls(api) {
  if (typeof document === "undefined") return;
  const settings = document.querySelectorAll(".lite-settings, .studio-settings");
  if (!settings.length) return;

  const sync = value => {
    api.setSoundMode(value);
    document.querySelectorAll("[data-spectramuse-sound-select]").forEach(select => {
      select.value = api.getSoundMode();
    });
  };

  settings.forEach(container => {
    if (container.querySelector("[data-spectramuse-sound-field]")) return;
    const label = document.createElement("label");
    label.className = "field";
    label.dataset.spectramuseSoundField = "true";
    label.append("Sound");
    const wrap = document.createElement("span");
    wrap.className = "select-wrap";
    const select = document.createElement("select");
    select.dataset.spectramuseSoundSelect = "true";
    select.setAttribute("aria-label", "Choose SpectraMuse sound");
    Object.entries(SOUND_MODES).forEach(([value, mode]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = mode.label;
      select.appendChild(option);
    });
    select.value = api.getSoundMode();
    select.addEventListener("change", () => sync(select.value));
    wrap.appendChild(select);
    label.appendChild(wrap);
    container.appendChild(label);
  });
}

export function createSensoryAudio() {
  const AudioContextCtor = typeof window !== "undefined" ? (window.AudioContext || window.webkitAudioContext) : null;
  let context = null;
  let input = null;
  let compressor = null;
  let unlocked = false;
  let soundMode = (() => {
    try {
      const stored = typeof localStorage !== "undefined" ? localStorage.getItem(SOUND_MODE_KEY) : null;
      return SOUND_MODES[stored] ? stored : "orchestralBloom";
    } catch {
      return "orchestralBloom";
    }
  })();
  const activeNodes = new Set();
  const recentNotes = new Map();
  let suppressLegacyMotifUntil = 0;
  let previousInputValue = "";

  function currentMs() {
    if (typeof performance !== "undefined" && performance.now) return performance.now();
    return Date.now();
  }

  function buildAudioGraph() {
    input = context.createGain();
    input.gain.value = 0.72;
    const dry = context.createGain();
    const wet = context.createGain();
    const convolver = context.createConvolver();
    compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -11;
    compressor.knee.value = 12;
    compressor.ratio.value = 7;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.22;
    convolver.buffer = buildDeterministicImpulse(context);
    dry.gain.value = 0.88;
    wet.gain.value = 0.2;
    input.connect(dry).connect(compressor);
    input.connect(convolver).connect(wet).connect(compressor);
    compressor.connect(context.destination);
    input.__spectramuseWet = wet;
  }

  async function unlock() {
    if (!AudioContextCtor) return false;
    if (!context) {
      context = new AudioContextCtor();
      buildAudioGraph();
      const silent = context.createBuffer(1, 1, context.sampleRate);
      const source = context.createBufferSource();
      source.buffer = silent;
      source.connect(input);
      source.start(0);
    }

    if (context.state !== "running") {
      await context.resume();
    }

    unlocked = context.state === "running";
    return unlocked;
  }

  function registerNode(node) {
    activeNodes.add(node);
    if (node.addEventListener) node.addEventListener("ended", () => activeNodes.delete(node), { once: true });
  }

  function setWetAmount(value, when) {
    const wet = input?.__spectramuseWet;
    if (!wet) return;
    try {
      wet.gain.setTargetAtTime(value, when, 0.035);
    } catch {
      wet.gain.value = value;
    }
  }

  function playFrequency(frequency, options = {}) {
    if (!context || context.state !== "running" || !input || !frequency) return false;
    const mode = getSoundMode(options.soundMode || soundMode);
    const preset = getPreset(options.presetId);
    const start = context.currentTime + (options.when || 0);
    const velocity = clamp(options.velocity ?? 1, 0.18, 1.5);
    const durationScale = clamp(options.durationScale ?? 1, 0.45, 1.8);
    const release = mode.release * durationScale / Math.max(0.65, preset.audioEnergy);
    const attack = mode.attack / Math.max(0.72, preset.audioEnergy);
    const end = start + attack + release;
    const filter = context.createBiquadFilter();
    const voiceGain = context.createGain();
    const panner = context.createStereoPanner ? context.createStereoPanner() : null;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(Math.max(900, mode.filter + frequency * 0.6), start);
    filter.Q.value = 0.55;
    voiceGain.gain.setValueAtTime(0.0001, start);
    voiceGain.gain.linearRampToValueAtTime(0.07 * velocity * preset.audioEnergy, start + attack);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, end);
    setWetAmount(mode.wet, start);

    mode.partials.forEach(([ratio, type, level, detune = 0]) => {
      const osc = context.createOscillator();
      const partialGain = context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency * ratio, start);
      osc.detune.setValueAtTime(detune, start);
      partialGain.gain.value = level;
      osc.connect(partialGain).connect(filter);
      osc.start(start);
      osc.stop(end + 0.04);
      registerNode(osc);
    });

    if (panner) {
      panner.pan.setValueAtTime(clamp(options.pan ?? 0, -0.8, 0.8), start);
      filter.connect(voiceGain).connect(panner).connect(input);
    } else {
      filter.connect(voiceGain).connect(input);
    }
    return true;
  }

  function shouldDedupe(symbol, position) {
    const key = `${String(symbol).toLowerCase()}:${Number.isFinite(position) ? position : -1}`;
    const now = currentMs();
    const last = recentNotes.get(key) || -Infinity;
    recentNotes.set(key, now);
    if (recentNotes.size > 80) {
      for (const [storedKey, time] of recentNotes) {
        if (now - time > 1000) recentNotes.delete(storedKey);
      }
    }
    return now - last < 65;
  }

  function playSymbolNow(symbol, options = {}) {
    const normalized = normalizeSymbol(symbol);
    if (!normalized || !context || context.state !== "running") return false;
    if (shouldDedupe(normalized, options.position)) return true;
    const profile = getSymbolProfile(normalized, options);
    const tone = profile.tone;
    const played = playFrequency(tone.frequency, {
      ...options,
      pan: tone.pan,
      velocity: options.velocity ?? 0.92
    });
    if (played && options.visual !== false) triggerSymbolVisual(normalized, options);
    return played;
  }

  async function playSymbolTone(symbol, options = {}) {
    const ready = await unlock();
    if (!ready) return false;
    return playSymbolNow(symbol, options);
  }

  async function playLetterTone(letter, options = {}) {
    return playSymbolTone(letter, options);
  }

  function playChordNow(word, options = {}) {
    const chord = getWordChord(word);
    if (!chord.length) return false;
    chord.forEach((note, index) => {
      playFrequency(note.frequency, {
        ...options,
        when: (options.when || 0) + index * 0.018,
        velocity: (options.velocity ?? 0.55) * (1 - index * 0.08),
        durationScale: 1.12,
        pan: (index - 1) * 0.18
      });
    });
    if (options.visual !== false) triggerWordVisual(word);
    return true;
  }

  async function playWordHarmony(word, options = {}) {
    const ready = await unlock();
    if (!ready) return false;
    return playChordNow(word, options);
  }

  async function playWordMotif(word, options = {}) {
    if (currentMs() < suppressLegacyMotifUntil) return true;
    return playWordHarmony(word, options);
  }

  function cadenceFrequencies(mark) {
    const degrees = mark === "?" ? [4, 5, 6] : mark === "!" ? [0, 4, 7] : mark === "," ? [1, 3] : [4, 2, 0];
    return degrees.map(degree => midiToFrequency(diatonicMidi(degree, 60)));
  }

  async function playCadence(mark, options = {}) {
    const ready = await unlock();
    if (!ready) return false;
    const frequencies = cadenceFrequencies(mark);
    frequencies.forEach((frequency, index) => {
      playFrequency(frequency, {
        ...options,
        when: (options.when || 0) + index * (mark === "!" ? 0.045 : 0.075),
        velocity: mark === "!" ? 0.72 : 0.5,
        durationScale: mark === "?" ? 0.72 : 0.9,
        pan: (index - 1) * 0.16
      });
    });
    if (options.visual !== false) triggerCadenceVisual(mark);
    return true;
  }

  async function playPhraseMotifs(value, options = {}) {
    const ready = await unlock();
    if (!ready) return false;
    const raw = String(value || "");
    const tokens = raw.match(/[a-zA-Z0-9]+|[.,!?;:]/g) || [];
    let cursor = 0;
    let hasMusic = false;

    tokens.slice(0, 42).forEach(token => {
      if (/^[a-zA-Z0-9]+$/.test(token)) {
        const symbols = token.slice(0, 18).split("");
        symbols.forEach((symbol, index) => {
          const profile = getSymbolProfile(symbol, options);
          playFrequency(profile.tone.frequency, {
            ...options,
            when: cursor + index * 0.085,
            velocity: 0.46,
            durationScale: 0.72,
            pan: profile.tone.pan
          });
          setTimeout(() => triggerSymbolVisual(symbol, options), Math.max(0, (cursor + index * 0.085) * 1000));
        });
        const chordAt = cursor + symbols.length * 0.085 + 0.02;
        playChordNow(token, { ...options, when: chordAt, velocity: 0.42, visual: false });
        setTimeout(() => triggerWordVisual(token), Math.max(0, chordAt * 1000));
        cursor = chordAt + 0.23;
        hasMusic = true;
      } else {
        const at = cursor;
        cadenceFrequencies(token).forEach((frequency, index) => {
          playFrequency(frequency, { ...options, when: at + index * 0.06, velocity: 0.38, durationScale: 0.7 });
        });
        setTimeout(() => triggerCadenceVisual(token), Math.max(0, at * 1000));
        cursor += 0.22;
      }
    });
    return hasMusic;
  }

  function stop() {
    activeNodes.forEach(node => {
      try { node.stop(); } catch {}
    });
    activeNodes.clear();
  }

  function setSoundMode(nextMode) {
    soundMode = SOUND_MODES[nextMode] ? nextMode : "orchestralBloom";
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(SOUND_MODE_KEY, soundMode);
    } catch {}
    return soundMode;
  }

  const api = {
    unlock,
    playLetterTone,
    playSymbolTone,
    playWordMotif,
    playWordHarmony,
    playPhraseMotifs,
    playCadence,
    stop,
    setSoundMode,
    getSoundMode: () => soundMode,
    isUnlocked: () => unlocked,
    isSupported: () => Boolean(AudioContextCtor)
  };

  function mountInputBridge() {
    if (typeof document === "undefined") return;
    const story = document.getElementById("story");
    if (!story || story.dataset.sensoryBridge === "true") return;
    story.dataset.sensoryBridge = "true";
    previousInputValue = story.value;

    story.addEventListener("input", async event => {
      const currentValue = story.value;
      const caret = story.selectionStart ?? currentValue.length;
      const direct = event.data || "";
      let inserted = direct;
      let start = Math.max(0, caret - direct.length);

      if (!inserted && currentValue !== previousInputValue) {
        const diff = findInsertedText(previousInputValue, currentValue);
        inserted = diff.text;
        start = diff.start;
      }

      const presetId = document.body?.dataset?.preset || "normal";
      const paletteId = document.getElementById("palette")?.value || "classic";

      if (inserted) {
        const bridgeHandlesLetters = !direct;
        for (let offset = 0; offset < inserted.length; offset += 1) {
          const char = inserted[offset];
          const position = start + offset;
          if (/[0-9]/.test(char) || (bridgeHandlesLetters && /[a-zA-Z]/.test(char))) {
            await playSymbolTone(char, { presetId, paletteId, position, velocity: 0.9 });
            const status = document.getElementById("status");
            const profile = getSymbolProfile(char, { presetId, paletteId });
            if (status && /[0-9]/.test(char)) status.textContent = `${char} joined the score at ${Math.round(profile.tone.frequency)} Hz.`;
          }
        }

        if (/[^a-zA-Z0-9]/.test(inserted)) {
          const token = tokenBeforeCaret(currentValue, caret);
          if (token) {
            suppressLegacyMotifUntil = currentMs() + 100;
            await playWordHarmony(token, { presetId, paletteId, velocity: 0.5 });
          }
          for (const mark of inserted.match(/[.,!?;:]/g) || []) {
            await playCadence(mark, { presetId, paletteId });
          }
        } else if (/[0-9]/.test(inserted)) {
          suppressLegacyMotifUntil = currentMs() + 80;
        }
      }

      previousInputValue = currentValue;
    });
  }

  if (typeof document !== "undefined") {
    ensureOrchestraVisuals();
    mountDigitObserver();
    mountSoundControls(api);
    mountInputBridge();
  }

  return api;
}
