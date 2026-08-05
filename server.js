const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const OSS_CONFIG = require("./oss-config");

const PORT = 3000;
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function sign(stringToSign) {
  return crypto
    .createHmac("sha1", OSS_CONFIG.accessKeySecret)
    .update(stringToSign)
    .digest("base64");
}

function uploadToOSS(buffer, objectKey) {
  return new Promise((resolve, reject) => {
    const contentType = "image/png";
    const date = new Date().toUTCString();
    const resource = `/${OSS_CONFIG.bucket}/${objectKey}`;
    const stringToSign = `PUT\n\n${contentType}\n${date}\n${resource}`;
    const authorization = `OSS ${OSS_CONFIG.accessKeyId}:${sign(stringToSign)}`;

    const options = {
      hostname: `${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}`,
      path: `/${objectKey}`,
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        Date: date,
        Authorization: authorization,
        "Content-Length": buffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const url = `https://${OSS_CONFIG.bucket}.${OSS_CONFIG.endpoint}/${objectKey}`;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(url);
        } else {
          reject(new Error(`OSS ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.write(buffer);
    req.end();
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function serveStatic(filePath, res) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "POST" && url.pathname === "/api/upload") {
    try {
      const result = url.searchParams.get("result") || "game";
      const body = await readBody(req);
      if (!body.length) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "empty body" }));
        return;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const objectKey = `gomoku/${dateStr}/${Date.now()}-${result}.png`;
      const ossUrl = await uploadToOSS(body, objectKey);

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ url: ossUrl }));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  filePath = path.join(__dirname, decodeURIComponent(filePath));

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  serveStatic(filePath, res);
});

server.listen(PORT, () => {
  console.log(`五子棋游戏已启动: http://localhost:${PORT}`);
  console.log("对局截图将通过服务端代理上传至 OSS");
});
