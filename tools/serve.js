// tools/serve.js — a tiny static file server with no dependencies.
// Run with:  node tools/serve.js [port]      (default 8000)
// Also imported by tools/screenshots.js and test/e2e.test.js.

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".json": "application/json",
};

function createServer() {
  return http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]);
    const file = path.join(root, rel === "/" ? "index.html" : rel);
    const ok = file.startsWith(root + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile();
    if (!ok) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = Number(process.argv[2]) || 8000;
  createServer().listen(port, () => console.log(`Autopilot at http://localhost:${port}`));
}
