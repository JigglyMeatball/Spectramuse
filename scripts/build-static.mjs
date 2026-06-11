import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = path.join(projectRoot, "dist");

const requiredFiles = ["index.html"];
const optionalFiles = [
  "robots.txt",
  "_headers",
  "favicon.ico",
  "site.webmanifest",
  "manifest.webmanifest",
  "manifest.json",
  "apple-touch-icon.png",
  "browserconfig.xml"
];
const optionalDirectories = [
  "assets",
  "css",
  "fonts",
  "images",
  "img",
  "js",
  "media",
  "styles"
];

async function pathStat(entryPath) {
  try {
    return await stat(entryPath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function copyEntry(entry, { required = false } = {}) {
  const source = path.join(projectRoot, entry);
  const sourceStat = await pathStat(source);

  if (!sourceStat) {
    if (required) {
      throw new Error(`Required static asset is missing: ${entry}`);
    }
    return null;
  }

  await cp(source, path.join(distDir, entry), { recursive: sourceStat.isDirectory() });
  return entry;
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const copied = [];

for (const file of requiredFiles) {
  copied.push(await copyEntry(file, { required: true }));
}

for (const file of optionalFiles) {
  const copiedFile = await copyEntry(file);
  if (copiedFile) {
    copied.push(copiedFile);
  }
}

for (const directory of optionalDirectories) {
  const copiedDirectory = await copyEntry(directory);
  if (copiedDirectory) {
    copied.push(`${copiedDirectory}/`);
  }
}

console.log(`Built ${path.relative(projectRoot, distDir)} with ${copied.join(", ")}`);
