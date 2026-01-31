const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ROOT = __dirname;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".ico": "image/x-icon"
};

function send(res, status, content, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(content);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  let filePath = urlPath === "/" ? "/index.html" : urlPath;

  filePath = filePath.replace(/\.\./g, "");

  const fullPath = path.join(ROOT, filePath);
  fs.readFile(fullPath, (err, data) => {
    if (err) return send(res, 404, "Not Found", "text/plain; charset=utf-8");
    const ext = path.extname(fullPath).toLowerCase();
    send(res, 200, data, mime[ext] || "application/octet-stream");
  });
});

server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
