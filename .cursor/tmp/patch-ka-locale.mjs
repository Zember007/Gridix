/**
 * Fix ka/projectList.json construction/media strings (UTF-8). ASCII-only source.
 * Run: node .cursor/tmp/patch-ka-locale.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const c = (...codes) => String.fromCodePoint(...codes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const kaPath = path.join(repoRoot, "apps/main/src/locales/ka/projectList.json");

const data = JSON.parse(fs.readFileSync(kaPath, "utf8"));

const linkWord = c(0x10d1, 0x10db, 0x10e3, 0x10da, 0x10d8);

const hintTail =
  c(0x20, 0x10d0, 0x10dc, 0x20) +
  c(0x10e9, 0x10d0, 0x10e1, 0x10d5, 0x10d8, 0x10d7) +
  c(0x20) +
  linkWord +
  c(0x20, 0x10d0, 0x10e5, 0x20, 0x10d0, 0x10dc, 0x20) +
  c(0x10d6, 0x10d4, 0x10db, 0x10dd, 0x10d7, 0x20) +
  c(0x10d0, 0x10e6, 0x10ec, 0x10d4, 0x10e0, 0x10d8, 0x10e1, 0x20) +
  c(0x10d5, 0x10d4, 0x10da, 0x10e8, 0x10d8);

let hint = data.media.attachFilesHint;
if (!hint.includes(hintTail)) {
  hint = hint.replace(
    c(
      0x20,
      0x10e4,
      0x10d0,
      0x10d8,
      0x10da,
      0x10d4,
      0x10d1,
      0x10d8,
      0x20,
      0x10d0,
      0x10e5,
      0x20,
      0x10d0,
      0x10dc,
      0x20,
    ),
    c(0x20, 0x10e4, 0x10d0, 0x10d8, 0x10da, 0x10d4, 0x10d1, 0x10d8, 0x2c, 0x20),
  );
  hint += hintTail;
}
data.media.attachFilesHint = hint;

const videoWord = data.media.linksLabel.split(/\s+/)[0];
data.construction.linkAnchorYoutube = videoWord;
data.construction.linkAnchorWeb = linkWord;

const lp = data.media.linksPlaceholder;
const chasvit = lp.split(/\s+/)[0];
const failis = c(0x10e4, 0x10d0, 0x10d8, 0x10da, 0x10d8, 0x10e1);

const descExtra =
  c(0x20) +
  chasvit +
  c(0x20) +
  videoWord +
  c(0x10e1) +
  c(0x20, 0x10d0, 0x10dc, 0x20) +
  failis +
  c(0x20) +
  linkWord +
  c(0x20, 0x10d0, 0x10e5, 0x20, 0x10d0, 0x10dc, 0x20) +
  c(0x10e5, 0x10d5, 0x10d4, 0x10db, 0x10dd, 0x10d7, 0x20) +
  c(
    0x10d7,
    0x10d0,
    0x10dc,
    0x10d3,
    0x10d0,
    0x10e0,
    0x10d7,
    0x10e3,
    0x10da,
    0x10d4,
    0x10d1,
    0x10e8,
    0x10d8,
    0x20,
    0x2014,
    0x20,
    0x10e2,
    0x10d4,
    0x10e5,
    0x10e1,
    0x10e2,
    0x10e8,
    0x10d8,
    0x20,
    0x10e9,
    0x10d0,
    0x10dc,
    0x10e1,
    0x20,
    0x10db,
    0x10dd,
    0x10d9,
    0x10da,
    0x10d4,
    0x20,
  ) +
  linkWord +
  c(0x2e);

const baseDesc = data.construction.descriptionPlaceholder;
if (!baseDesc.endsWith("...")) {
  throw new Error("descriptionPlaceholder: expected to end with '...'");
}
data.construction.descriptionPlaceholder = baseDesc + descExtra;

fs.writeFileSync(kaPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log("patched", kaPath);
