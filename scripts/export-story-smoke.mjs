import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const distDir = path.join(projectRoot, "dist");
const outputRoot = path.join(tmpdir(), "spectramuse-export-smoke");
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const host = "127.0.0.1";
const port = 4173;
const debuggingPort = 9223;

const shortStory = "Dawn glows. Night answers.";
const mediumStory = Array.from({ length: 8 }, (_, i) => `Color ${i + 1} sings softly.`).join(" ");
const longStory = Array.from({ length: 32 }, (_, i) => `Star ${i + 1} glows.`).join(" ");
const veryLongStory = Array.from({ length: 105 }, (_, i) => `Pulse ${i + 1}.`).join(" ");
const paragraphWords = Array.from({ length: 72 }, (_, i) => `luminous${i + 1}`).join(" ");
const paragraphStory = `${paragraphWords}.\n\nSecond paragraph hums with violet sparks.\n\nFinal paragraph closes in silver light.`;

const tests = [
  { name: "short-plain-normal", story: shortStory, mode: "plain", volume: 0.8, muted: false },
  { name: "short-colorblind-muted", story: shortStory, mode: "colorblindFriendly", volume: 0.8, muted: true },
  { name: "short-high-contrast-pure", story: shortStory, mode: "highContrastPure", volume: 0.8, muted: false },
  { name: "short-high-contrast-spectra", story: shortStory, mode: "highContrastSpectra", volume: 0.8, muted: false },
  { name: "short-high-contrast-warm", story: shortStory, mode: "highContrastWarm", volume: 0.8, muted: false },
  { name: "medium-colorblind-boosted", story: mediumStory, mode: "colorblindFriendly", volume: 1.6, muted: false },
  { name: "long-32-high-contrast-spectra", story: longStory, mode: "highContrastSpectra", volume: 0.8, muted: false },
  { name: "very-long-105-sentences", story: veryLongStory, mode: "plain", volume: 0.8, muted: false },
  { name: "paragraphs-high-contrast-warm-boosted", story: paragraphStory, mode: "highContrastWarm", volume: 1.6, muted: false }
];

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHttp(url, attempts = 50) {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { method: "HEAD" });
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

function probeMedia(filePath) {
  const probe = JSON.parse(execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration,size:stream=index,codec_type,codec_name,duration",
    "-of", "json",
    filePath
  ], { encoding: "utf8" }));
  let silenceOutput = "";

  try {
    execFileSync("ffmpeg", [
      "-hide_banner", "-nostats", "-i", filePath,
      "-af", "silencedetect=noise=-45dB:d=1",
      "-f", "null", "-"
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    silenceOutput = `${error.stdout || ""}${error.stderr || ""}`;
  }

  const silenceEvents = [...silenceOutput.matchAll(/silence_(start|end):\s*([0-9.]+)/g)]
    .map(match => ({ type: match[1], time: Number(match[2]) }));

  return {
    durationSec: Number(probe.format?.duration || 0),
    size: Number(probe.format?.size || 0),
    codecs: probe.streams.map(stream => `${stream.codec_type}:${stream.codec_name}`),
    silenceEvents
  };
}

async function main() {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

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

  try {
    await waitForHttp(`http://${host}:${port}/`);
    await waitForHttp(`http://${host}:${debuggingPort}/json/version`);

    const target = await fetch(`http://${host}:${debuggingPort}/json/new`, { method: "PUT" }).then(response => response.json());
    const browser = createDevtoolsClient(target.webSocketDebuggerUrl);
    await browser.ready;
    await browser.send("Page.enable");
    await browser.send("Runtime.enable");
    const loaded = browser.waitForEvent("Page.loadEventFired");
    await browser.send("Page.navigate", { url: `http://${host}:${port}/` });
    await loaded;
    await wait(500);

    const migrationCheck = await browser.send("Runtime.evaluate", {
      expression: `(() => {
        localStorage.setItem(DISPLAY_MODE_KEY, "highContrast");
        displayMode = loadDisplayMode();
        syncDisplayModeControls();
        return {
          mode: getDisplayMode(),
          stored: localStorage.getItem(DISPLAY_MODE_KEY),
          selectValue: displayModeSelect.value
        };
      })()`,
      returnByValue: true
    });
    console.log(JSON.stringify({ migrationCheck: migrationCheck.result.value }));

    const results = [];
    for (const test of tests) {
      const downloadDir = path.join(outputRoot, test.name);
      await mkdir(downloadDir, { recursive: true });
      await browser.send("Browser.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: downloadDir,
        eventsEnabled: true
      });

      const setup = await browser.send("Runtime.evaluate", {
        expression: `(() => {
          storyInput.value = ${JSON.stringify(test.story)};
          updateFromTyping();
          updateDisplayMode(${JSON.stringify(test.mode)}, { persist: false });
          formatSelect.value = "wide";
          soundModeSelect.value = "velvetPad";
          audioSettings.volume = ${test.volume};
          audioSettings.muted = ${test.muted};
          updateAudioSettings({ persist: false });
          window.__spectramuseLastExportStats = null;
          const scratch = document.createElement("canvas");
          scratch.width = 1920;
          scratch.height = 1080;
          const scratchCtx = scratch.getContext("2d");
          const segments = buildStorySegments(storyInput.value.trim(), { targetCtx: scratchCtx, width: scratch.width, height: scratch.height, format: "wide" });
          return {
            mode: getDisplayMode(),
            muted: audioSettings.muted,
            volume: audioSettings.volume,
            sourceScenes: getScenes(storyInput.value.trim()).length,
            expectedSegments: segments.length,
            expectedWords: segments.reduce((sum, segment) => sum + getWords(segment.text).length, 0),
            expectedDurationMs: getExpectedPerformanceDurationMs(segments, { record: true }),
            finalExpected: segments.at(-1)?.text || "",
            preferred: getPreferredRecordingType()
          };
        })()`,
        returnByValue: true
      });
      if (setup.exceptionDetails) throw new Error(`Setup failed for ${test.name}: ${JSON.stringify(setup.exceptionDetails)}`);

      const started = Date.now();
      await browser.send("Runtime.evaluate", { expression: "performStory({ currentOnly: false, record: true })", awaitPromise: false });
      let files = [];
      let state = null;

      for (;;) {
        await wait(1000);
        files = await readdir(downloadDir).catch(() => []);
        const stateResult = await browser.send("Runtime.evaluate", {
          expression: "(() => ({ isPerforming, status: statusEl.textContent, stats: window.__spectramuseLastExportStats || null }))()",
          returnByValue: true
        });
        state = stateResult.result.value;
        if (!state.isPerforming && files.some(file => !file.endsWith(".crdownload"))) break;
        if (Date.now() - started > Math.max(30000, setup.result.value.expectedDurationMs + 45000)) {
          throw new Error(`Timed out waiting for ${test.name}`);
        }
      }

      const filename = files.find(file => !file.endsWith(".crdownload"));
      const filePath = path.join(downloadDir, filename);
      const fileInfo = await stat(filePath);
      const media = probeMedia(filePath);
      const expectedSec = state.stats.expectedDurationMs / 1000;
      const hasLateSilence = media.silenceEvents.some(event => event.type === "start" && event.time < Math.max(0, media.durationSec - 1.2));

      const result = {
        name: test.name,
        filename,
        filePath,
        fileSize: fileInfo.size,
        expectedDurationSec: Number(expectedSec.toFixed(3)),
        actualDurationSec: Number(media.durationSec.toFixed(3)),
        durationAtLeastExpected: media.durationSec >= expectedSec,
        codecs: media.codecs,
        extensionMatchesMime: filename.endsWith(".mp4")
          ? state.stats.downloadType.startsWith("video/mp4")
          : state.stats.downloadType.startsWith("video/webm"),
        finalTextRendered: state.stats.finalTextRendered,
        finalLineRendered: state.stats.finalLineRendered,
        audioThroughEnd: test.muted ? "muted by user" : !hasLateSilence,
        recorderChunks: state.stats.recorderChunks,
        finalDataRequested: state.stats.finalDataRequested,
        setup,
        state,
        media
      };
      results.push(result);
      console.log(JSON.stringify(result));
    }

    await writeFile(path.join(outputRoot, "results.json"), JSON.stringify({
      migrationCheck: migrationCheck.result.value,
      results
    }, null, 2));
    await fetch(`http://${host}:${debuggingPort}/json/close/${target.id}`);
    browser.close();
  } finally {
    server.kill("SIGINT");
    chrome.kill("SIGINT");
  }

  console.log(`Export smoke results: ${path.join(outputRoot, "results.json")}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
