import http from "node:http";
import { parse } from "node:url";
import next from "next";

const args = process.argv.slice(2);
const dev = args.includes("--dev");

let port = Number(process.env.PORT || 3000);
let hostname = "0.0.0.0";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if ((arg === "-p" || arg === "--port") && args[i + 1]) {
    port = Number(args[++i]) || port;
  } else if (arg.startsWith("--port=")) {
    port = Number(arg.slice("--port=".length)) || port;
  } else if (
    (arg === "-H" || arg === "--host" || arg === "--hostname") &&
    args[i + 1]
  ) {
    hostname = args[++i];
  } else if (arg.startsWith("--host=")) {
    hostname = arg.slice("--host=".length);
  } else if (arg.startsWith("--hostname=")) {
    hostname = arg.slice("--hostname=".length);
  }
}

(process.env as Record<string, string | undefined>).NODE_ENV = dev
  ? "development"
  : "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => {
      const parsedUrl = parse(req.url || "/", true);
      void handle(req, res, parsedUrl);
    });

    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
