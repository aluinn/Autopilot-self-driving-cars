// tools/lint.js — a dependency-free sanity check. Run with:  node tools/lint.js
//   1. Every .js file parses (syntax check).
//   2. No tabs, CRLF line endings or trailing whitespace in source files (see .editorconfig).
//   3. Every <script src> and <link href> in index.html points at a file that exists,
//      and every top-level script is actually loaded by the page.
// It is not a replacement for ESLint or a type checker; see CONTRIBUTING.md.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const skip = new Set(["node_modules", ".git"]);
const problems = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    skip.has(e.name) ? [] : e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

const files = walk(root);
for (const file of files) {
  const rel = path.relative(root, file);
  if (!/\.(js|css|html|md|yml|yaml|json|cff)$/.test(file) || rel === "package-lock.json") continue;
  const text = fs.readFileSync(file, "utf8");
  if (file.endsWith(".js")) {
    try { new vm.Script(text, { filename: rel }); } catch (e) { problems.push(`${rel}: syntax error: ${e.message}`); }
  }
  if (/\.(js|css|html)$/.test(file)) {
    text.split("\n").forEach((line, i) => {
      if (line.includes("\t")) problems.push(`${rel}:${i + 1}: tab character`);
      if (/[ \t]+$/.test(line)) problems.push(`${rel}:${i + 1}: trailing whitespace`);
      if (line.endsWith("\r")) problems.push(`${rel}:${i + 1}: CRLF line ending`);
    });
  }
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const refs = [...html.matchAll(/<(?:script src|link [^>]*?href)="([^"]+)"/g)].map((m) => m[1]).filter((r) => !/^(https?:|data:)/.test(r));
for (const ref of refs) if (!fs.existsSync(path.join(root, ref))) problems.push(`index.html references missing file: ${ref}`);
const topLevelJs = fs.readdirSync(root).filter((f) => f.endsWith(".js"));
for (const js of topLevelJs) if (!refs.includes(js)) problems.push(`${js} is not loaded by index.html`);

if (problems.length) { console.error(problems.join("\n")); process.exit(1); }
console.log(`lint ok: ${files.length} files checked`);
