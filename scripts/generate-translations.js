#!/usr/bin/env node

// Node ESM is enabled via package.json { "type": "module" }
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

function parseArgs(argv) {
  const args = { localesDir: 'src/locales', input: null, dryRun: false, overwrite: true };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i') {
      args.input = argv[++i];
    } else if (arg === '--locales' || arg === '-l') {
      args.localesDir = argv[++i];
    } else if (arg === '--dry-run' || arg === '-d') {
      args.dryRun = true;
    } else if (arg === '--no-overwrite') {
      args.overwrite = false;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      // ignore unknown flags for simplicity
    }
  }
  if (!args.input) {
    console.error('Missing --input <file>.');
    printHelp();
    process.exit(1);
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/generate-translations.js --input translations.json [--locales src/locales] [--dry-run] [--no-overwrite]\n\n` +
    `Input JSON schema (flat map):\n` +
    `  {\n` +
    `    "common.cancel": { "ru": "Отмена", "en": "Cancel", "ka": "გაუქმება", "ar": "إلغاء" },\n` +
    `    "admin.project.create.title": { "en": "Create project", ... }\n` +
    `  }\n\n` +
    `Will generate files like: src/locales/en/common.json, src/locales/ru/admin.json, ... with nested keys.`);
}

async function fileExists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function setNested(target, pathSegments, value) {
  let node = target;
  for (let i = 0; i < pathSegments.length; i++) {
    const seg = pathSegments[i];
    const last = i === pathSegments.length - 1;
    if (last) {
      node[seg] = value;
    } else {
      if (typeof node[seg] !== 'object' || node[seg] === null) {
        node[seg] = {};
      }
      node = node[seg];
    }
  }
}

function mergeDeep(target, source, overwrite = true) {
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];
    if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      if (!tgtVal || typeof tgtVal !== 'object' || Array.isArray(tgtVal)) {
        target[key] = {};
      }
      mergeDeep(target[key], srcVal, overwrite);
    } else {
      if (overwrite || !(key in target)) {
        target[key] = srcVal;
      }
    }
  }
  return target;
}

function sortKeysDeep(obj) {
  if (Array.isArray(obj) || typeof obj !== 'object' || obj === null) return obj;
  const out = {};
  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    out[key] = sortKeysDeep(obj[key]);
  }
  return out;
}

function detectIndentFromJson(jsonText, defaultIndent = 2) {
  const match = jsonText.match(/^\s{2,}\"/m);
  if (!match) return defaultIndent;
  const spaces = match[0].match(/^\s+/);
  return spaces ? spaces[0].length : defaultIndent;
}

async function readJsonIfExists(filePath) {
  if (!(await fileExists(filePath))) return { data: {}, indent: 2 };
  const text = await readFile(filePath, 'utf8');
  try {
    const data = JSON.parse(text);
    const indent = detectIndentFromJson(text, 2);
    return { data, indent };
  } catch {
    // If existing file is invalid JSON, preserve content by not parsing
    return { data: {}, indent: 2 };
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const inputPath = path.resolve(process.cwd(), args.input);
  const localesRoot = path.resolve(process.cwd(), args.localesDir);

  const raw = await readFile(inputPath, 'utf8');
  let flatMap;
  try {
    flatMap = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse input JSON:', e.message);
    process.exit(1);
  }

  const filesByLang = new Map(); // lang -> Map(fileName -> nestedObject)

  for (const flatKey of Object.keys(flatMap)) {
    const valueByLang = flatMap[flatKey];
    if (!valueByLang || typeof valueByLang !== 'object') continue;
    const segments = flatKey.split('.');
    if (segments.length < 2) {
      console.warn(`Skip key without file prefix: ${flatKey}`);
      continue;
    }
    const fileName = segments[0];
    const nestedPath = segments.slice(1);

    for (const [lang, translation] of Object.entries(valueByLang)) {
      if (typeof translation !== 'string') continue;
      if (!filesByLang.has(lang)) filesByLang.set(lang, new Map());
      const byFile = filesByLang.get(lang);
      if (!byFile.has(fileName)) byFile.set(fileName, {});
      const obj = byFile.get(fileName);
      setNested(obj, nestedPath, translation);
    }
  }

  const writePlan = [];
  for (const [lang, byFile] of filesByLang.entries()) {
    for (const [fileName, dataToWrite] of byFile.entries()) {
      const langDir = path.join(localesRoot, lang);
      const targetFile = path.join(langDir, `${fileName}.json`);
      writePlan.push({ lang, langDir, targetFile, dataToWrite });
    }
  }

  if (args.dryRun) {
    console.log(`Planned updates: ${writePlan.length} file(s)`);
    for (const item of writePlan) {
      console.log(`- ${item.targetFile}`);
    }
    return;
  }

  for (const item of writePlan) {
    await mkdir(item.langDir, { recursive: true });
    const { data: existing, indent } = await readJsonIfExists(item.targetFile);
    const merged = mergeDeep(existing, item.dataToWrite, args.overwrite);
    const sorted = sortKeysDeep(merged);
    const json = JSON.stringify(sorted, null, indent || 2) + '\n';
    await writeFile(item.targetFile, json, 'utf8');
    console.log(`Wrote ${item.targetFile}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


