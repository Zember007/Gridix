#!/usr/bin/env node
/**
 * Generate a safe-ish bridge migration from DEV -> PROD for NEW objects only.
 *
 * What it does:
 * - compares public enums and tables between DEV and PROD
 * - builds SQL using DEV schema dump statements related to objects missing in PROD
 * - writes output SQL file for manual review + `supabase db push`
 *
 * What it does NOT do:
 * - does not generate ALTERs for existing objects (columns/type changes/etc.)
 * - does not auto-resolve logical conflicts
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function readArg(name, fallback = "") {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

function run(cmd, args, options = {}) {
  try {
    return execFileSync(cmd, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
  } catch (error) {
    const stderr = error?.stderr?.toString?.() ?? String(error);
    throw new Error(`${cmd} ${args.join(" ")} failed:\n${stderr}`);
  }
}

function parseList(out) {
  return out
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function getPublicTables(dbUrl) {
  const sql = `
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
    order by 1;
  `;
  const out = run("psql", [dbUrl, "-At", "-c", sql]);
  return new Set(parseList(out));
}

function getPublicEnums(dbUrl) {
  const sql = `
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typtype = 'e'
    order by 1;
  `;
  const out = run("psql", [dbUrl, "-At", "-c", sql]);
  return new Set(parseList(out));
}

function dumpPublicSchema(dbUrl) {
  return run("pg_dump", [
    dbUrl,
    "--schema-only",
    "--no-owner",
    "--no-privileges",
    "--schema=public",
  ]);
}

function splitSqlStatements(sql) {
  const statements = [];
  let cur = "";
  let inSingle = false;
  let dollarTag = null;

  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1] ?? "";
    cur += ch;

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        cur += sql.slice(i + 1, i + dollarTag.length);
        i += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }

    if (inSingle) {
      if (ch === "'" && next === "'") {
        cur += next;
        i += 1;
        continue;
      }
      if (ch === "'") inSingle = false;
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      continue;
    }

    if (ch === "$") {
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) {
        dollarTag = m[0];
      }
      continue;
    }

    if (ch === ";") {
      statements.push(cur.trim());
      cur = "";
    }
  }

  const tail = cur.trim();
  if (tail) statements.push(tail);
  return statements.filter(Boolean);
}

function extractObjectName(statement, kind) {
  const re =
    kind === "table"
      ? /^\s*CREATE\s+TABLE\s+public\.(?:"([^"]+)"|([a-zA-Z0-9_]+))/i
      : /^\s*CREATE\s+TYPE\s+public\.(?:"([^"]+)"|([a-zA-Z0-9_]+))\s+AS\s+ENUM/i;
  const m = statement.match(re);
  if (!m) return null;
  return m[1] || m[2] || null;
}

function statementTouchesTable(statement, tableName) {
  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\bpublic\\.(?:"${escaped}"|${escaped})\\b`, "i");
  return re.test(statement);
}

function isTableRelatedDdl(statement) {
  return /^(CREATE\s+TABLE|CREATE\s+SEQUENCE|ALTER\s+TABLE|ALTER\s+SEQUENCE|CREATE\s+(UNIQUE\s+)?INDEX|CREATE\s+TRIGGER|COMMENT\s+ON\s+TABLE|COMMENT\s+ON\s+COLUMN)\b/i.test(
    statement.trim(),
  );
}

function isEnumCreate(statement) {
  return /^\s*CREATE\s+TYPE\s+public\./i.test(statement);
}

function main() {
  const devUrl = readArg("--dev-url", process.env.DEV_DB_URL || "");
  const prodUrl = readArg("--prod-url", process.env.PROD_DB_URL || "");
  const outFile = readArg(
    "--out",
    path.join(
      process.cwd(),
      "supabase",
      "migrations",
      `${new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14)}_bridge_dev_to_prod.sql`,
    ),
  );

  if (!devUrl || !prodUrl) {
    console.error(
      "Usage: node scripts/supabase/generate-bridge-migration.mjs --dev-url <url> --prod-url <url> [--out <file>]",
    );
    process.exit(1);
  }

  const devTables = getPublicTables(devUrl);
  const prodTables = getPublicTables(prodUrl);
  const devEnums = getPublicEnums(devUrl);
  const prodEnums = getPublicEnums(prodUrl);

  const missingTables = [...devTables].filter((x) => !prodTables.has(x));
  const missingEnums = [...devEnums].filter((x) => !prodEnums.has(x));

  const dump = dumpPublicSchema(devUrl);
  const statements = splitSqlStatements(dump);

  const selected = [];
  for (const st of statements) {
    const maybeEnum = extractObjectName(st, "enum");
    if (maybeEnum && missingEnums.includes(maybeEnum) && isEnumCreate(st)) {
      selected.push(st);
      continue;
    }

    if (!isTableRelatedDdl(st)) continue;
    if (missingTables.some((t) => statementTouchesTable(st, t))) {
      selected.push(st);
    }
  }

  const uniqueSelected = [...new Set(selected)];

  const header = [
    "-- Auto-generated bridge migration (DEV -> PROD)",
    "-- Review manually before applying in production.",
    `-- Missing enums in PROD: ${missingEnums.length}`,
    `-- Missing tables in PROD: ${missingTables.length}`,
    "",
    "begin;",
    "",
  ].join("\n");

  const footer = "\n\ncommit;\n";
  const body =
    uniqueSelected.length > 0
      ? `${uniqueSelected.join(";\n\n")};`
      : "-- No missing enums/tables detected. Nothing to apply.";
  const output = `${header}${body}${footer}`;

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, output, "utf8");

  console.log("Bridge migration generated:");
  console.log(`- File: ${outFile}`);
  console.log(`- Missing enums: ${missingEnums.length}`);
  console.log(`- Missing tables: ${missingTables.length}`);
  console.log(`- Selected SQL statements: ${uniqueSelected.length}`);
  console.log("\nNext:");
  console.log(`1) Review file carefully`);
  console.log(`2) supabase link --project-ref <PROD_REF>`);
  console.log(`3) supabase db push --dry-run`);
  console.log(`4) supabase db push`);
}

main();
