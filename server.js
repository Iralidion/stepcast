const http = require("http");
const fs = require("fs");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
let streamState = {
  steps: 12486,
  goal: 20000,
  theme: "neon",
  align: "bottom-right",
  scale: 100,
  sessionStart: 12066
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (url.pathname === "/api/state") {
    if (request.method === "GET") {
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify(streamState));
      return;
    }

    if (request.method === "POST") {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk;
        if (body.length > 1e6) request.destroy();
      });
      request.on("end", () => {
        try {
          const incoming = JSON.parse(body || "{}");
          streamState = {
            ...streamState,
            ...incoming,
            steps: Math.max(0, Number(incoming.steps ?? streamState.steps) || 0),
            goal: Math.max(1, Number(incoming.goal ?? streamState.goal) || 1),
            scale: Math.min(Math.max(Number(incoming.scale ?? streamState.scale) || 100, 80), 150)
          };
          response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify(streamState));
        } catch {
          response.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          response.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }
  }

  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath === "\\" || safePath === "/" ? "index.html" : safePath);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
});

server.listen(port, () => {
  console.log(`StepCast running at http://localhost:${port}`);
  console.log(`OBS overlay URL: http://localhost:${port}/?mode=overlay`);
});
