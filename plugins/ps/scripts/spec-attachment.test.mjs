import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "spec-attachment.mjs");
const NAME = "14-spec-attach";
const BASE = "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678";

const FILES = {
  "proposal.md": "## Why\nSpecs drift.\n\n## What Changes\n- Attach the change.\n",
  "design.md": [
    "## Context",
    "A nested fence:",
    "```bash",
    "echo hi",
    "```",
    "And a run of four: ```` inline.",
    "#### proposal.md",
    "",
  ].join("\n"),
  "tasks.md": "## 1. Build\n- [ ] 1.1 Write the helper\n",
  "specs/spec-attachment/spec.md": [
    "## ADDED Requirements",
    "### Requirement: Round trip",
    "The helper SHALL round-trip a change.",
    "",
    "#### Scenario: Pack then unpack",
    "- **WHEN** a change is packed and unpacked",
    "- **THEN** the files are identical",
    "",
  ].join("\n"),
};

function tmp() {
  return mkdtempSync(join(tmpdir(), "spec-attachment-"));
}

function writeChange(root, files = FILES, name = NAME) {
  const dir = join(root, name);
  for (const [p, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), content);
  }
  return dir;
}

function run(args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
}

function pack(root) {
  const r = run(["pack", writeChange(root), "--base", BASE]);
  assert.equal(r.status, 0, r.stderr);
  const file = join(root, "comment.md");
  writeFileSync(file, r.stdout);
  return { file, text: r.stdout, hash: r.stdout.match(/sha256 `([0-9a-f]{64})`/)[1] };
}

// Builds an attachment by hand with a correct hash, to reach the checks that run after the hash.
function forge(name, files) {
  const paths = Object.keys(files).sort();
  let input = `name:${name}\nbase:${BASE}\n`;
  for (const p of paths) input += `${p}\n${files[p]}\n`;
  const hash = createHash("sha256").update(input).digest("hex");
  let out = `<!-- ps:spec -->\n**OpenSpec change** \`${name}\` · base \`${BASE}\` · sha256 \`${hash}\`\n`;
  out += `<details><summary>${paths.length} files</summary>\n`;
  for (const p of paths) out += `\n#### ${p}\n\`\`\`\`markdown\n${files[p]}\`\`\`\`\n`;
  out += "</details>\n";
  return { text: out, hash };
}

test("pack then unpack returns byte-identical files", () => {
  const root = tmp();
  const { file, hash } = pack(root);
  const into = join(root, "out");
  const r = run(["unpack", file, "--expect", hash, "--name", NAME, "--into", into]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), BASE);
  for (const [p, content] of Object.entries(FILES)) {
    assert.equal(readFileSync(join(into, NAME, p), "utf8"), content, p);
  }
});

test("an edited file fails the hash check and writes nothing", () => {
  const root = tmp();
  const { file, text, hash } = pack(root);
  writeFileSync(file, text.replace("Write the helper", "Skip the helper"));
  const into = join(root, "out");
  const r = run(["unpack", file, "--expect", hash, "--name", NAME, "--into", into]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /spec attachment: hash mismatch: expected [0-9a-f]{64}, got [0-9a-f]{64}/);
  assert.equal(existsSync(join(into, NAME)), false);
});

test("an edited header name fails the hash check and writes nothing", () => {
  const root = tmp();
  const { file, text, hash } = pack(root);
  writeFileSync(file, text.replace(`\`${NAME}\``, "`14-other-name`"));
  const into = join(root, "out");
  const r = run(["unpack", file, "--expect", hash, "--name", NAME, "--into", into]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /hash mismatch/);
  assert.equal(existsSync(into), false);
});

test("a name that differs from --name, or isn't allowed, is rejected", () => {
  const root = tmp();
  const { file, hash } = pack(root);
  const into = join(root, "out");
  let r = run(["unpack", file, "--expect", hash, "--name", "14-something-else", "--into", into]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /spec attachment: name mismatch: expected 14-something-else, got 14-spec-attach/);

  const bad = forge("../x", { "proposal.md": "x\n" });
  writeFileSync(file, bad.text);
  r = run(["unpack", file, "--expect", bad.hash, "--name", "../x", "--into", into]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /spec attachment: name not allowed: \.\.\/x/);
  assert.equal(existsSync(into), false);
});

test("a path outside the allowed set is rejected after a valid file, writing nothing", () => {
  for (const bad of ["../x", "/etc/x", "notes.md", "specs/../x/spec.md"]) {
    const root = tmp();
    const { text, hash } = forge(NAME, { "design.md": "ok\n", [bad]: "evil\n" });
    const file = join(root, "comment.md");
    writeFileSync(file, text);
    const into = join(root, "out");
    const r = run(["unpack", file, "--expect", hash, "--name", NAME, "--into", into]);
    assert.equal(r.status, 1, bad);
    assert.equal(r.stderr.trim(), `spec attachment: path not allowed: ${bad}`);
    assert.equal(existsSync(join(into, NAME)), false, bad);
    assert.equal(existsSync(join(root, "x")), false, bad);
  }
});

test("CRLF line endings keep the hash and unpack to LF", () => {
  const root = tmp();
  const { file, text, hash } = pack(root);
  writeFileSync(file, text.replace(/\n/g, "\r\n"));
  const h = run(["hash", file]);
  assert.equal(h.status, 0, h.stderr);
  assert.equal(h.stdout.trim(), hash);
  const into = join(root, "out");
  const r = run(["unpack", file, "--expect", hash, "--name", NAME, "--into", into]);
  assert.equal(r.status, 0, r.stderr);
  for (const [p, content] of Object.entries(FILES)) {
    assert.equal(readFileSync(join(into, NAME, p), "utf8"), content, p);
  }
});

test("a comment without the marker is rejected", () => {
  const root = tmp();
  const file = join(root, "comment.md");
  writeFileSync(file, "just a comment\n");
  const r = run(["unpack", file, "--expect", "0".repeat(64), "--name", NAME, "--into", join(root, "out")]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /spec attachment: no ps:spec marker/);
});

test("pack skips the CLI's .openspec.yaml metadata", () => {
  const root = tmp();
  const dir = writeChange(root);
  writeFileSync(join(dir, ".openspec.yaml"), "schema: spec-driven\n");
  const r = run(["pack", dir, "--base", BASE]);
  assert.equal(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stdout, /openspec\.yaml/);
  assert.equal(readdirSync(dir).includes(".openspec.yaml"), true);
});
