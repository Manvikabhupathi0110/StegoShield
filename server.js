const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const ROOT_DIR = __dirname;
const HTML_DIR = path.join(ROOT_DIR, "html");
const CSS_DIR = path.join(ROOT_DIR, "css");
const JS_DIR = path.join(ROOT_DIR, "js");
const PORT = Number.parseInt(process.env.PORT || "3000", 10);

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

function safeResolve(baseDir, relativePath) {
  const resolvedPath = path.resolve(baseDir, relativePath);
  if (resolvedPath === baseDir || resolvedPath.startsWith(baseDir + path.sep)) {
    return resolvedPath;
  }

  return null;
}

function sendResponse(res, statusCode, contentType, body) {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(body);
}

async function serveFile(filePath, req, res) {
  try {
    const data = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    if (req.method === "HEAD") {
      res.end();
      return;
    }

    res.end(data);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      sendResponse(res, 404, "text/plain; charset=utf-8", "Not Found");
      return;
    }

    sendResponse(res, 500, "text/plain; charset=utf-8", "Internal Server Error");
  }
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendResponse(res, 400, "text/plain; charset=utf-8", "Bad Request");
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    sendResponse(res, 405, "text/plain; charset=utf-8", "Method Not Allowed");
    return;
  }

  let pathname;
  try {
    const parsed = new URL(req.url, "http://localhost");
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    sendResponse(res, 400, "text/plain; charset=utf-8", "Bad Request");
    return;
  }

  if (pathname === "/") {
    await serveFile(path.join(HTML_DIR, "index.html"), req, res);
    return;
  }

  if (pathname.startsWith("/css/")) {
    const requestedPath = pathname.slice("/css/".length);
    const filePath = safeResolve(CSS_DIR, requestedPath);

    if (!filePath) {
      sendResponse(res, 404, "text/plain; charset=utf-8", "Not Found");
      return;
    }

    await serveFile(filePath, req, res);
    return;
  }

  if (pathname.startsWith("/js/")) {
    const requestedPath = pathname.slice("/js/".length);
    const filePath = safeResolve(JS_DIR, requestedPath);

    if (!filePath) {
      sendResponse(res, 404, "text/plain; charset=utf-8", "Not Found");
      return;
    }

    await serveFile(filePath, req, res);
    return;
  }

  if (/^\/[^/]+\.html$/i.test(pathname)) {
    const requestedPath = pathname.slice(1);
    const filePath = safeResolve(HTML_DIR, requestedPath);

    if (!filePath) {
      sendResponse(res, 404, "text/plain; charset=utf-8", "Not Found");
      return;
    }

    await serveFile(filePath, req, res);
    return;
  }

  sendResponse(res, 404, "text/plain; charset=utf-8", "Not Found");
});

server.listen(PORT, () => {
  process.stdout.write(`StegoShield server listening on port ${PORT}\n`);
});
