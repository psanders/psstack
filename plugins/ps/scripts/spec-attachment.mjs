#!/usr/bin/env node
// Packs an OpenSpec change folder into a GitHub issue comment (the spec attachment), and
// unpacks it back after checking it against the hash pinned in the issue body.
// Format and rules: process/issue-format.md § Spec as an OpenSpec change.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, rmSync, renameSync } from "node:fs";
import { join, basename, dirname } from "node:path";

const MARKER = "<!-- ps:spec -->";
const NAME_RE = /^[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$/;
const PATH_RE = /^(proposal\.md|design\.md|tasks\.md|specs\/[a-z0-9]+(-[a-z0-9]+)*\/spec\.md)$/;
const HEADER_RE = /^\*\*OpenSpec change\*\* `([^`]*)` · base `([0-9a-f]{40})` · sha256 `([0-9a-f]{64})`$/;
const IGNORED = new Set([".openspec.yaml"]); // metadata the CLI writes; validate and archive don't need it

class AttachmentError extends Error {}
const fail = (msg) => {
  throw new AttachmentError(`spec attachment: ${msg}`);
};

const lf = (s) => s.replace(/\r\n?/g, "\n");
const withEol = (s) => (s.endsWith("\n") ? s : `${s}\n`);

function hashOf(name, base, files) {
  const h = createHash("sha256");
  h.update(`name:${name}\nbase:${base}\n`);
  for (const p of Object.keys(files).sort()) h.update(`${p}\n${files[p]}\n`);
  return h.digest("hex");
}

function fenceFor(content) {
  const longest = Math.max(0, ...(content.match(/`+/g) ?? []).map((r) => r.length));
  return "`".repeat(Math.max(4, longest + 1));
}

function listFiles(dir, prefix = "") {
  const out = [];
  for (const entry of readdirSync(join(dir, prefix)).sort()) {
    const rel = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(join(dir, rel)).isDirectory()) out.push(...listFiles(dir, rel));
    else if (!IGNORED.has(rel)) out.push(rel);
  }
  return out;
}

export function pack(dir, base) {
  const name = basename(dir);
  if (!NAME_RE.test(name)) fail(`name not allowed: ${name}`);
  if (!/^[0-9a-f]{40}$/.test(base ?? "")) fail(`base must be a full commit SHA: ${base}`);
  const files = {};
  for (const p of listFiles(dir)) {
    if (!PATH_RE.test(p)) fail(`path not allowed: ${p}`);
    files[p] = withEol(lf(readFileSync(join(dir, p), "utf8")));
  }
  const paths = Object.keys(files).sort();
  if (paths.length === 0) fail(`no files in ${dir}`);
  const hash = hashOf(name, base, files);
  let out = `${MARKER}\n**OpenSpec change** \`${name}\` · base \`${base}\` · sha256 \`${hash}\`\n`;
  out += `<details><summary>${paths.length} files: ${paths.join(", ")}</summary>\n`;
  for (const p of paths) {
    const fence = fenceFor(files[p]);
    out += `\n#### ${p}\n${fence}markdown\n${files[p]}${fence}\n`;
  }
  return `${out}</details>\n`;
}

export function parse(text) {
  const lines = lf(text).split("\n");
  const start = lines.findIndex((l) => l.trim() === MARKER);
  if (start < 0) fail("no ps:spec marker");
  const header = (lines[start + 1] ?? "").match(HEADER_RE);
  if (!header) fail("header not found under the marker");
  const [, name, base, claimed] = header;
  const files = {};
  for (let i = start + 2; i < lines.length; i++) {
    const heading = lines[i].match(/^#### (.+)$/);
    const open = (lines[i + 1] ?? "").match(/^(`{4,})markdown$/);
    if (!heading || !open) continue;
    const fence = open[1];
    const end = lines.indexOf(fence, i + 2);
    if (end < 0) fail(`unclosed fence for ${heading[1]}`);
    if (heading[1] in files) fail(`duplicate path: ${heading[1]}`);
    files[heading[1]] = `${lines.slice(i + 2, end).join("\n")}\n`;
    i = end;
  }
  return { name, base, claimed, files, hash: hashOf(name, base, files) };
}

export function unpack(text, { expect, name: pinnedName, into }) {
  const a = parse(text);
  if (a.hash !== expect) fail(`hash mismatch: expected ${expect}, got ${a.hash}`);
  if (!NAME_RE.test(a.name)) fail(`name not allowed: ${a.name}`);
  if (a.name !== pinnedName) fail(`name mismatch: expected ${pinnedName}, got ${a.name}`);
  for (const p of Object.keys(a.files)) if (!PATH_RE.test(p)) fail(`path not allowed: ${p}`);
  if (Object.keys(a.files).length === 0) fail("no files");

  // Every check passed: write to a sibling folder, then swap it in.
  const target = join(into, a.name);
  const staging = join(into, `.${a.name}.tmp-${process.pid}`);
  rmSync(staging, { recursive: true, force: true });
  for (const [p, content] of Object.entries(a.files)) {
    mkdirSync(dirname(join(staging, p)), { recursive: true });
    writeFileSync(join(staging, p), content);
  }
  if (existsSync(target)) rmSync(target, { recursive: true });
  renameSync(staging, target);
  return a.base;
}

function main(argv) {
  const [cmd, arg, ...rest] = argv;
  const opts = {};
  for (let i = 0; i < rest.length; i += 2) {
    if (!rest[i]?.startsWith("--")) fail(`unexpected argument: ${rest[i]}`);
    opts[rest[i].slice(2)] = rest[i + 1];
  }
  if (cmd === "pack" && arg) return process.stdout.write(pack(arg.replace(/\/+$/, ""), opts.base));
  if (cmd === "hash" && arg) return console.log(parse(readFileSync(arg, "utf8")).hash);
  if (cmd === "unpack" && arg && opts.expect && opts.name && opts.into) {
    return console.log(unpack(readFileSync(arg, "utf8"), opts));
  }
  console.error(
    "usage:\n" +
      "  spec-attachment.mjs pack <change-dir> --base <sha>\n" +
      "  spec-attachment.mjs hash <comment-file>\n" +
      "  spec-attachment.mjs unpack <comment-file> --expect <sha256> --name <change-name> --into <changes-dir>",
  );
  process.exitCode = 2;
}

try {
  main(process.argv.slice(2));
} catch (e) {
  if (!(e instanceof AttachmentError)) throw e;
  console.error(e.message);
  process.exitCode = 1;
}
