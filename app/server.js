const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
// Serve the whole site (repo root) so links like ../services/ work locally.
const ROOT = path.resolve(__dirname, "..");

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
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split("?")[0]);
  } catch {
    return send(res, 400, "Bad Request");
  }

  // Resolve and make sure the path stays inside ROOT.
  let fullPath = path.resolve(ROOT, "." + urlPath);
  if (fullPath !== ROOT && !fullPath.startsWith(ROOT + path.sep)) {
    return send(res, 403, "Forbidden");
  }

  fs.stat(fullPath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      // Redirect /folder to /folder/ so relative links work.
      if (!urlPath.endsWith("/")) {
        res.writeHead(301, { Location: urlPath + "/" });
        return res.end();
      }
      fullPath = path.join(fullPath, "index.html");
    }
    fs.readFile(fullPath, (err2, data) => {
      if (err2) return send(res, 404, "Not Found");
      const ext = path.extname(fullPath).toLowerCase();
      send(res, 200, data, mime[ext] || "application/octet-stream");
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}  (app: http://localhost:${PORT}/app/)`);
});
