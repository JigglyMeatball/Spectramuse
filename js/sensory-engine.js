const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const VOWELS = new Set(["a", "e", "i", "o", "u"]);
const SCALE_STEPS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
const WAVEFORMS = ["sine", "triangle", "sine", "triangle", "sawtooth"];

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

export function getPreset(presetId = "normal") {
  return PRESENTATION_PRESETS[presetId] || PRESENTATION_PRESETS.normal;
}

export function getPalette(paletteId = "classic") {
  return STORY_PALETTES[paletteId] || STORY_PALETTES.classic;
}

export function getLetterIndex(letter) {
  const normalized = normalizeLetter(letter);
  if (!normalized) return -1;
  return LETTERS.indexOf(normalized);
}

export function getLetterTone(letter, presetId = "normal", context = {}) {
  const index = Math.max(0, getLetterIndex(letter));
  const preset = getPreset(presetId);
  const octave = Math.floor(index / SCALE_STEPS.length);
  const semitone = SCALE_STEPS[index % SCALE_STEPS.length] + octave * 12;
  const position = Number.isFinite(context.position) ? context.position : 0;
  const positionDetune = (position % 7) * 2.75;
  const frequency = 174.61 * Math.pow(2, semitone / 12) * Math.pow(2, positionDetune / 1200);
  const calmType = preset === PRESENTATION_PRESETS.calm ? "sine" : null;

  return {
    frequency: Math.round(frequency * 100) / 100,
    type: calmType || WAVEFORMS[index % WAVEFORMS.length],
    duration: clamp(0.16 / preset.audioEnergy, 0.09, 0.24),
    gain: clamp(0.095 * preset.audioEnergy, 0.035, 0.14),
    pan: ((index % 7) - 3) / 8,
    detune: (index % 5 - 2) * 2.5
  };
}

export function getLetterProfile(letter, options = {}) {
  const index = Math.max(0, getLetterIndex(letter));
  const preset = getPreset(options.presetId);
  const palette = getPalette(options.paletteId);
  const isVowel = VOWELS.has(normalizeLetter(letter));
  const category = isVowel ? "vowel" : index % 3 === 0 ? "pulse" : index % 3 === 1 ? "line" : "grain";
  const underlineStyles = ["solid", "dashed", "double", "wavy"];
  let hue = (index * 137.508 + palette.hueShift + (preset.hueOffset || 0)) % 360;
  let color = `hsl(${Math.round(hue)} ${preset.saturation}% ${preset.lightness}%)`;
  let underlineStyle = preset.underlineStyle || underlineStyles[index % underlineStyles.length];

  if (preset.colorBlind) {
    const safe = COLOR_BLIND_COLORS[index % COLOR_BLIND_COLORS.length];
    color = safe.color;
    hue = safe.hue;
    underlineStyle = underlineStyles[index % underlineStyles.length];
  }

  return {
    letter,
    index,
    category,
    color,
    hue,
    isVowel,
    glow: preset.glow,
    underlineStyle,
    tone: getLetterTone(letter, options.presetId, options)
  };
}

export function getLetterColor(letter, options = {}) {
  return getLetterProfile(letter, options).color;
}

export function getWordMotif(word, options = {}) {
  return String(word || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 14)
    .split("")
    .map((letter, index) => ({
      letter,
      profile: getLetterProfile(letter, { ...options, position: index }),
      delay: index * getPreset(options.presetId).tempo
    }));
}

export function scoreStory(value) {
  const letters = String(value || "").toLowerCase().replace(/[^a-z]/g, "");
  const vowels = [...letters].filter(letter => VOWELS.has(letter)).length;
  const consonants = Math.max(letters.length - vowels, 1);
  const words = String(value || "").trim().match(/[a-zA-Z]+/g) || [];
  const warmth = Math.round((vowels / Math.max(letters.length, 1)) * 360);
  const density = clamp(String(value || "").length / 340, 0, 1);

  return { letters, vowels, consonants, words, warmth, density };
}

export function createSensoryAudio() {
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  let context = null;
  let master = null;
  let unlocked = false;
  const activeNodes = new Set();

  async function unlock() {
    if (!AudioContextCtor) return false;
    if (!context) {
      context = new AudioContextCtor();
      master = context.createGain();
      master.gain.value = 0.82;
      master.connect(context.destination);

      const silent = context.createBuffer(1, 1, context.sampleRate);
      const source = context.createBufferSource();
      source.buffer = silent;
      source.connect(master);
      source.start(0);
    }

    if (context.state !== "running") {
      await context.resume();
    }

    unlocked = context.state === "running";
    return unlocked;
  }

  function playTone(letter, options = {}) {
    if (!context || context.state !== "running" || !master) return false;
    const tone = getLetterTone(letter, options.presetId, options);
    const preset = getPreset(options.presetId);
    const start = context.currentTime + (options.when || 0);
    const duration = options.duration || tone.duration;
    const velocity = clamp(options.velocity ?? 1, 0.2, 1.8);
    const osc = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const panner = context.createStereoPanner ? context.createStereoPanner() : null;

    osc.type = options.type || tone.type;
    osc.frequency.setValueAtTime(tone.frequency, start);
    osc.detune.setValueAtTime(tone.detune, start);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(preset === PRESENTATION_PRESETS.calm ? 1200 : 2200 + tone.frequency * 2, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.gain * velocity, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    if (panner) {
      panner.pan.setValueAtTime(tone.pan, start);
      osc.connect(filter).connect(gain).connect(panner).connect(master);
    } else {
      osc.connect(filter).connect(gain).connect(master);
    }

    osc.start(start);
    osc.stop(start + duration + 0.03);
    activeNodes.add(osc);
    osc.addEventListener("ended", () => activeNodes.delete(osc), { once: true });
    return true;
  }

  async function playLetterTone(letter, options = {}) {
    const ready = await unlock();
    if (!ready) return false;
    return playTone(letter, options);
  }

  async function playWordMotif(word, options = {}) {
    const ready = await unlock();
    if (!ready) return false;
    const motif = getWordMotif(word, options);
    motif.forEach(note => {
      playTone(note.letter, {
        ...options,
        when: (options.when || 0) + note.delay,
        velocity: options.velocity ?? 0.82
      });
    });
    return motif.length > 0;
  }

  async function playPhraseMotifs(value, options = {}) {
    const ready = await unlock();
    if (!ready) return false;
    const words = String(value || "").match(/[a-zA-Z]+/g) || [];
    words.slice(0, 10).forEach((word, wordIndex) => {
      const wordDelay = wordIndex * 0.24;
      getWordMotif(word, options).slice(0, 8).forEach(note => {
        playTone(note.letter, {
          ...options,
          when: wordDelay + note.delay,
          velocity: 0.62 + Math.min(word.length, 10) / 24
        });
      });
    });
    return words.length > 0;
  }

  function stop() {
    activeNodes.forEach(node => {
      try { node.stop(); } catch {}
    });
    activeNodes.clear();
  }

  return {
    unlock,
    playLetterTone,
    playWordMotif,
    playPhraseMotifs,
    stop,
    isUnlocked: () => unlocked,
    isSupported: () => Boolean(AudioContextCtor)
  };
}
