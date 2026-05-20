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
  sessionStart: 12066,
  source: "manual",
  updatedAt: new Date().toISOString()
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
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  if (url.pathname === "/api/state") {
    if (request.method === "GET") {
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...corsHeaders
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
            scale: Math.min(Math.max(Number(incoming.scale ?? streamState.scale) || 100, 80), 150),
            source: incoming.source || "manual",
            updatedAt: new Date().toISOString()
          };
          response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders });
          response.end(JSON.stringify(streamState));
        } catch {
          response.writeHead(400, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders });
          response.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }
  }

  if (url.pathname === "/api/wearable" && request.method === "POST") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) request.destroy();
    });
    request.on("end", () => {
      try {
        const incoming = JSON.parse(body || "{}");
        const hasSteps = incoming.steps !== undefined;
        const hasDelta = incoming.delta !== undefined;

        if (!hasSteps && !hasDelta) {
          response.writeHead(400, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders });
          response.end(JSON.stringify({ error: "Send either steps or delta." }));
          return;
        }

        const nextSteps = hasSteps
          ? Number(incoming.steps)
          : Number(streamState.steps) + Number(incoming.delta);

        if (!Number.isFinite(nextSteps)) {
          response.writeHead(400, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders });
          response.end(JSON.stringify({ error: "steps or delta must be numeric." }));
          return;
        }

        streamState = {
          ...streamState,
          steps: Math.max(0, Math.round(nextSteps)),
          source: incoming.source || "wearable",
          deviceName: incoming.deviceName || incoming.device || streamState.deviceName || "Wearable",
          updatedAt: new Date().toISOString()
        };

        if (incoming.goal !== undefined) {
          streamState.goal = Math.max(1, Number(incoming.goal) || streamState.goal);
        }

        response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders });
        response.end(JSON.stringify(streamState));
      } catch {
        response.writeHead(400, { "Content-Type": "application/json; charset=utf-8", ...corsHeaders });
        response.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });
    return;
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
