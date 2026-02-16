#!/usr/bin/env node
/**
 * Overwrites the "partners" key in packages/utils shared locale files (ar, he, ka)
 * with the content from apps/main locales partners.json (correct translations).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MAIN_PARTNERS = (lang) =>
  path.join(ROOT, "apps/main/src/locales", lang, "partners.json");
const SHARED_LOCALE = (lang) =>
  path.join(ROOT, "packages/utils/src/locales/shared", `${lang}.json`);

["ar", "he", "ka"].forEach((lang) => {
  const mainPath = MAIN_PARTNERS(lang);
  const sharedPath = SHARED_LOCALE(lang);
  const partnersContent = JSON.parse(fs.readFileSync(mainPath, "utf8"));
  const shared = JSON.parse(fs.readFileSync(sharedPath, "utf8"));
  shared.partners = partnersContent;
  fs.writeFileSync(sharedPath, JSON.stringify(shared, null, 2) + "\n", "utf8");
  console.log(`Updated partners in ${lang}.json`);
});

console.log("Done.");
