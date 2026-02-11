import translate from 'google-translate-api-x';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SOURCE_LANG = 'en';
const RATE_LIMIT_DELAY_MS = 500;
const RATE_LIMIT_BACKOFF_MS = 10000;

/** Sleep only after Google Translate calls to avoid rate limiting */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Discover all locale roots in the monorepo.
 * Supports: folder-per-lang (locales/en/, locales/ru/) and flat (locales/shared/en.json, ru.json).
 */
function discoverLocaleRoots() {
  const roots = [];
  const dirs = ['apps', 'packages'];

  for (const dir of dirs) {
    const base = path.join(ROOT, dir);
    if (!fs.existsSync(base)) continue;

    const walk = (current) => {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const e of entries) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
        const full = path.join(current, e.name);
        if (e.isDirectory()) {
          if (e.name === 'locales') {
            const sub = fs.readdirSync(full);
            if (sub.includes('en')) {
              roots.push({ root: full, type: 'folder-per-lang' });
            }
            const sharedPath = path.join(full, 'shared');
            if (sub.includes('shared') && fs.existsSync(sharedPath)) {
              const sharedFiles = fs.readdirSync(sharedPath);
              if (sharedFiles.includes('en.json')) {
                roots.push({ root: sharedPath, type: 'flat' });
              }
            }
          } else {
            walk(full);
          }
        }
      }
    };
    walk(base);
  }

  return roots;
}

/**
 * Get target locales (all except source).
 */
function getTargetLangs(localeRoot, type) {
  if (type === 'folder-per-lang') {
    const dirs = fs.readdirSync(localeRoot, { withFileTypes: true });
    return dirs
      .filter((d) => d.isDirectory() && d.name !== SOURCE_LANG)
      .map((d) => d.name);
  }
  if (type === 'flat') {
    const files = fs.readdirSync(localeRoot).filter((f) => f.endsWith('.json'));
    return files
      .map((f) => f.replace('.json', ''))
      .filter((lang) => lang !== SOURCE_LANG);
  }
  return [];
}

/**
 * Get file pairs (source, target) for a locale root.
 */
function getFilePairs(localeRoot, type, targetLang) {
  if (type === 'folder-per-lang') {
    const enDir = path.join(localeRoot, SOURCE_LANG);
    const targetDir = path.join(localeRoot, targetLang);
    const files = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));
    return files.map((f) => ({
      sourcePath: path.join(enDir, f),
      targetPath: path.join(targetDir, f),
      name: f,
    }));
  }
  if (type === 'flat') {
    return [
      {
        sourcePath: path.join(localeRoot, `${SOURCE_LANG}.json`),
        targetPath: path.join(localeRoot, `${targetLang}.json`),
        name: `${targetLang}.json`,
      },
    ];
  }
  return [];
}

/**
 * Deep merge: keep existing target values, translate only missing string keys.
 * Returns { merged, translatedCount }.
 */
async function mergeAndTranslate(source, target, targetLang, onTranslate) {
  const merged = {};
  let translatedCount = 0;

  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = target[key];

    if (typeof srcVal === 'object' && srcVal !== null && !Array.isArray(srcVal)) {
      const subTarget = typeof tgtVal === 'object' && tgtVal !== null ? tgtVal : {};
      const { merged: subMerged, translatedCount: subCount } = await mergeAndTranslate(
        srcVal,
        subTarget,
        targetLang,
        onTranslate
      );
      merged[key] = subMerged;
      translatedCount += subCount;
    } else if (typeof srcVal === 'string') {
      if (typeof tgtVal === 'string' && tgtVal.trim() !== '') {
        merged[key] = tgtVal;
      } else {
        try {
          const res = await translate(srcVal, { to: targetLang, forceBatch: false });
          merged[key] = res.text;
          translatedCount++;
          onTranslate?.(key, res.text);
          await delay(RATE_LIMIT_DELAY_MS);
        } catch (err) {
          console.error(`   ERROR [${key}]:`, err.message);
          if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
            console.log(`   Rate limit hit. Waiting ${RATE_LIMIT_BACKOFF_MS / 1000}s...`);
            await delay(RATE_LIMIT_BACKOFF_MS);
            try {
              const retry = await translate(srcVal, { to: targetLang, forceBatch: false });
              merged[key] = retry.text;
              translatedCount++;
              onTranslate?.(key, retry.text);
              await delay(RATE_LIMIT_DELAY_MS);
            } catch (retryErr) {
              merged[key] = srcVal;
            }
          } else {
            merged[key] = srcVal;
          }
        }
      }
    } else {
      merged[key] = srcVal;
    }
  }

  return { merged, translatedCount };
}

async function processFile(sourcePath, targetPath, targetLang, relativeName) {
  const source = await fs.readJson(sourcePath);
  let target = {};
  if (fs.existsSync(targetPath)) {
    target = await fs.readJson(targetPath);
  } else {
    await fs.ensureDir(path.dirname(targetPath));
  }

  const { merged, translatedCount } = await mergeAndTranslate(
    source,
    target,
    targetLang,
    (key, text) => console.log(`   + ${key}: ${text.substring(0, 40)}...`)
  );

  await fs.writeJson(targetPath, merged, { spaces: 2 });
  return translatedCount;
}

async function run() {
  console.log('Scanning monorepo for locale roots...\n');

  const roots = discoverLocaleRoots();
  if (roots.length === 0) {
    console.log('No locale roots found.');
    return;
  }

  let totalTranslated = 0;

  for (const { root, type } of roots) {
    const relRoot = path.relative(ROOT, root);
    console.log(`\n[${relRoot}] (${type})`);

    const targetLangs = getTargetLangs(root, type);
    if (targetLangs.length === 0) {
      console.log('  No target locales.');
      continue;
    }

    for (const targetLang of targetLangs) {
      const pairs = getFilePairs(root, type, targetLang);
      for (const { sourcePath, targetPath, name } of pairs) {
        if (!fs.existsSync(sourcePath)) continue;

        const count = await processFile(sourcePath, targetPath, targetLang, name);
        if (count > 0) {
          console.log(`  ${name} (${targetLang}): ${count} new translations`);
          totalTranslated += count;
        }
      }
    }
  }

  console.log('\n--- Translation complete ---');
  console.log(`Total new translations: ${totalTranslated}`);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
