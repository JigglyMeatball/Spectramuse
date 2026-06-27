import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const distDir = path.join(projectRoot, "dist");
const outputRoot = path.join(tmpdir(), "spectramuse-export-smoke");
const chromePath = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const host = "127.0.0.1";

const scenarios = [
  {
    name: "studio-story-download",
    story: "Dawn glows. Night answers.",
    mode: "studio",
    preset: "normal",
    palette: "classic",
    animation: "wave",
    intensity: 74,
    action: "save",
    expectedFile: "spectramuse-story.txt",
    type: "text"
  },
  {
    name: "studio-scene-svg",
    story: "Mira folded sunlight into her pocket and every step rang gold.",
    mode: "studio",
    preset: "colorBlind",
    palette: "dream",
    animation: "orb",
    intensity: 88,
    action: "saveImage",
    expectedFile: "spectramuse-scene.svg",
    type: "svg"
  }
];

const mp4StubActions = [
  {
    name: "mp4-story-export-stub",
    action: "saveMp4Story",
    expectedStatus: "MP4 story export is staged for the next engine build."
  },
  {
    name: "mp4-scene-export-stub",
    action: "saveMp4Scene",
    expectedStatus: "MP4 scene export is staged for the next engine build."
  }
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, host, () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForHttp(url, attempts = 50) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(200);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function createDevtoolsClient(webSocketUrl) {
  const ws = new WebSocket(webSocketUrl);
  const pending = new Map();
  const eventWaiters = new Map();
  let nextId = 1;

  function send(method, params = {}) {
    const id = nextId++;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  function waitForEvent(method) {
    return new Promise(resolve => {
      const waiters = eventWaiters.get(method) || [];
      waiters.push(resolve);
      eventWaiters.set(method, waiters);
    });
  }

  ws.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }

    const waiters = eventWaiters.get(message.method);
    if (waiters && waiters.length) waiters.shift()(message.params || {});
  });

  return {
    send,
    waitForEvent,
    close() {
      ws.close();
    },
    ready: new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    })
  };
}

async function evaluate(browser, expression) {
  const response = await browser.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (response.exceptionDetails) {
    throw new Error(`Browser evaluation failed: ${JSON.stringify(response.exceptionDetails)}`);
  }
  return response.result.value;
}

async function waitForPageReady(browser) {
  for (let i = 0; i < 50; i += 1) {
    const ready = await evaluate(browser, `(() => Boolean(
      document.querySelector("#story") &&
      document.querySelector("#letterLayer") &&
      document.querySelector("[data-action='save']") &&
      document.querySelector("[data-action='saveImage']") &&
      window.SpectraMuse
    ))()`);
    if (ready) return;
    await wait(100);
  }
  throw new Error("Timed out waiting for current SpectraMuse UI selectors and globals");
}

async function navigate(browser, url) {
  const loaded = browser.waitForEvent("Page.loadEventFired");
  await browser.send("Page.navigate", { url });
  await loaded;
  await waitForPageReady(browser);
}

async function waitForDownload(downloadDir, expectedFile, timeoutMs = 8000) {
  const started = Date.now();
  for (;;) {
    const files = await readdir(downloadDir).catch(() => []);
    const complete = files.filter(file => !file.endsWith(".crdownload"));
    if (complete.includes(expectedFile)) return path.join(downloadDir, expectedFile);
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for ${expectedFile}; saw ${files.join(", ") || "no files"}`);
    }
    await wait(200);
  }
}

async function configureScenario(browser, scenario) {
  return evaluate(browser, `(() => {
    const story = document.querySelector("#story");
    const letterLayer = document.querySelector("#letterLayer");
    const presetSelect = document.querySelector(${JSON.stringify(scenario.mode === "lite" ? "#presetLite" : "#presetStudio")});
    const paletteSelect = document.querySelector("#palette");
    const animationSelect = document.querySelector("#animationStyle");
    const intensityInput = document.querySelector("#intensity");

    window.SpectraMuse.setMode(${JSON.stringify(scenario.mode)}, { persist: false });
    window.SpectraMuse.setPreset(${JSON.stringify(scenario.preset)}, { persist: false });
    paletteSelect.value = ${JSON.stringify(scenario.palette)};
    paletteSelect.dispatchEvent(new Event("change", { bubbles: true }));
    animationSelect.value = ${JSON.stringify(scenario.animation)};
    animationSelect.dispatchEvent(new Event("change", { bubbles: true }));
    intensityInput.value = ${JSON.stringify(String(scenario.intensity))};
    intensityInput.dispatchEvent(new Event("input", { bubbles: true }));
    story.value = ${JSON.stringify(scenario.story)};
    story.dispatchEvent(new Event("input", { bubbles: true }));

    const profile = window.SpectraMuse.getLetterProfile("m");
    const actionButton = document.querySelector(${JSON.stringify(`[data-action='${scenario.action}']`)});
    return {
      storySelector: story.id,
      storyValue: story.value,
      mode: window.SpectraMuse.getMode(),
      preset: window.SpectraMuse.getPreset(),
      presetValue: presetSelect.value,
      palette: paletteSelect.value,
      animation: animationSelect.value,
      intensity: intensityInput.value,
      letterCount: letterLayer.querySelectorAll(".letter").length,
      actionFound: Boolean(actionButton),
      profileHasTone: Boolean(profile?.tone?.frequency),
      profileHasColor: typeof profile?.color === "string" && profile.color.length > 0
    };
  })()`);
}

async function runSupportedExport(browser, scenario) {
  const downloadDir = path.join(outputRoot, scenario.name);
  await mkdir(downloadDir, { recursive: true });
  await browser.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
    eventsEnabled: true
  });

  const setup = await configureScenario(browser, scenario);
  assert(setup.storySelector === "story", `${scenario.name}: did not target #story`);
  assert(setup.storyValue === scenario.story, `${scenario.name}: story text was not set`);
  assert(setup.mode === scenario.mode, `${scenario.name}: expected mode ${scenario.mode}, got ${setup.mode}`);
  assert(setup.preset === scenario.preset, `${scenario.name}: expected preset ${scenario.preset}, got ${setup.preset}`);
  assert(setup.presetValue === scenario.preset, `${scenario.name}: preset select did not sync`);
  assert(setup.palette === scenario.palette, `${scenario.name}: palette did not sync`);
  assert(setup.animation === scenario.animation, `${scenario.name}: animation did not sync`);
  assert(Number(setup.intensity) === scenario.intensity, `${scenario.name}: intensity did not sync`);
  assert(setup.letterCount > 0, `${scenario.name}: letter layer did not render`);
  assert(setup.actionFound, `${scenario.name}: export action button was not found`);
  assert(setup.profileHasTone && setup.profileHasColor, `${scenario.name}: shared sensory engine profile was not available`);

  await evaluate(browser, `document.querySelector(${JSON.stringify(`[data-action='${scenario.action}']`)}).click()`);
  const filePath = await waitForDownload(downloadDir, scenario.expectedFile);
  const fileInfo = await stat(filePath);
  const content = await readFile(filePath, "utf8");

  if (scenario.type === "text") {
    assert(content === scenario.story, `${scenario.name}: downloaded story text did not match #story`);
  } else if (scenario.type === "svg") {
    assert(content.includes("<svg"), `${scenario.name}: downloaded scene was not SVG`);
    assert(content.includes("SpectraMuse"), `${scenario.name}: downloaded SVG did not include SpectraMuse title`);
    assert(content.includes("Mira folded sunlight"), `${scenario.name}: downloaded SVG did not include story words`);
  }

  return {
    name: scenario.name,
    action: scenario.action,
    expectedFile: scenario.expectedFile,
    filePath,
    fileSize: fileInfo.size,
    setup
  };
}

async function runMp4StubCheck(browser, stub) {
  const downloadDir = path.join(outputRoot, stub.name);
  await mkdir(downloadDir, { recursive: true });
  await browser.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: downloadDir,
    eventsEnabled: true
  });

  const state = await evaluate(browser, `(() => {
    const story = document.querySelector("#story");
    story.value = "A staged MP4 export should not create a media file yet.";
    story.dispatchEvent(new Event("input", { bubbles: true }));
    const button = document.querySelector(${JSON.stringify(`[data-action='${stub.action}']`)});
    button.click();
    return {
      actionFound: Boolean(button),
      status: document.querySelector("#status").textContent
    };
  })()`);
  await wait(500);
  const files = (await readdir(downloadDir).catch(() => [])).filter(file => !file.endsWith(".crdownload"));

  assert(state.actionFound, `${stub.name}: MP4 action button was not found`);
  assert(state.status === stub.expectedStatus, `${stub.name}: unexpected MP4 stub status "${state.status}"`);
  assert(files.length === 0, `${stub.name}: MP4 stub unexpectedly downloaded ${files.join(", ")}`);

  return {
    name: stub.name,
    action: stub.action,
    skipped: true,
    reason: state.status,
    downloadedFiles: files
  };
}

async function runMobileSmoke(browser, url) {
  await browser.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true
  });
  await browser.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  await navigate(browser, `${url}?mode=lite`);

  const smoke = await evaluate(browser, `(() => {
    window.SpectraMuse.setMode("lite", { persist: false });
    window.SpectraMuse.setPreset("calm", { persist: false });
    const story = document.querySelector("#story");
    story.value = "Mobile smoke keeps the current story selector usable.";
    story.dispatchEvent(new Event("input", { bubbles: true }));
    const shell = document.querySelector(".app-shell").getBoundingClientRect();
    const storyRect = story.getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      mode: window.SpectraMuse.getMode(),
      storySelectorFound: Boolean(story),
      storyHeight: Math.round(storyRect.height),
      shellWidth: Math.round(shell.width),
      documentScrollWidth: document.documentElement.scrollWidth,
      letterCount: document.querySelectorAll("#letterLayer .letter").length,
      status: document.querySelector("#status").textContent
    };
  })()`);

  assert(smoke.mode === "lite", `mobile smoke: expected lite mode, got ${smoke.mode}`);
  assert(smoke.storySelectorFound, "mobile smoke: #story was not found");
  assert(smoke.storyHeight > 120, `mobile smoke: #story height looked collapsed (${smoke.storyHeight})`);
  assert(smoke.letterCount > 0, "mobile smoke: letters did not render");

  return smoke;
}

async function main() {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const port = await getAvailablePort();
  const debuggingPort = await getAvailablePort();
  const url = `http://${host}:${port}/`;
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", host], {
    cwd: distDir,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const profileDir = await mkdtemp(path.join(tmpdir(), "spectramuse-chrome."));
  const chrome = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-address=${host}`,
    `--remote-debugging-port=${debuggingPort}`,
    "--autoplay-policy=no-user-gesture-required",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${profileDir}`,
    "about:blank"
  ], { stdio: ["ignore", "pipe", "pipe"] });

  let browser;
  try {
    await waitForHttp(url);
    await waitForHttp(`http://${host}:${debuggingPort}/json/version`);

    const target = await fetch(`http://${host}:${debuggingPort}/json/new`, { method: "PUT" }).then(response => response.json());
    browser = createDevtoolsClient(target.webSocketDebuggerUrl);
    await browser.ready;
    await browser.send("Page.enable");
    await browser.send("Runtime.enable");
    await navigate(browser, url);

    const supportedExports = [];
    for (const scenario of scenarios) {
      const result = await runSupportedExport(browser, scenario);
      supportedExports.push(result);
      console.log(JSON.stringify(result));
    }

    const mp4Stubs = [];
    for (const stub of mp4StubActions) {
      const result = await runMp4StubCheck(browser, stub);
      mp4Stubs.push(result);
      console.log(JSON.stringify(result));
    }

    const mobileSmoke = await runMobileSmoke(browser, url);
    console.log(JSON.stringify({ mobileSmoke }));

    await writeFile(path.join(outputRoot, "results.json"), JSON.stringify({
      supportedExports,
      mp4Stubs,
      mobileSmoke
    }, null, 2));
    await fetch(`http://${host}:${debuggingPort}/json/close/${target.id}`);
  } finally {
    if (browser) browser.close();
    server.kill("SIGINT");
    chrome.kill("SIGINT");
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }

  console.log(`Export smoke results: ${path.join(outputRoot, "results.json")}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
