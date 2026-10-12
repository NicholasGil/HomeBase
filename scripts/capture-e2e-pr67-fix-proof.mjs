import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function run(command, args, env) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  const [code] = await once(child, "exit");
  if (code !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${code}`);
  }
}

async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not become ready at ${url}`);
}

async function main() {
  await run("npm", ["run", "build"], {
    VERCEL_ENV: "production",
    REALTYRISE_DEMO_MODE: "1",
    CLERK_SECRET_KEY: "",
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
    NODE_ENV: "production",
  });

  const server = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", "3000"], {
    cwd: ROOT,
    env: {
      ...process.env,
      VERCEL_ENV: "production",
      REALTYRISE_DEMO_MODE: "1",
      CLERK_SECRET_KEY: "",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
      NODE_ENV: "production",
    },
    stdio: "inherit",
  });

  try {
    await waitForServer("http://127.0.0.1:3000");
    await run(
      "npx",
      ["playwright", "test", "e2e/e2e-pr67-fix-proof.spec.ts", "--config=playwright.prod-proof.config.ts"],
      {
        CI: "1",
      },
    );
  } finally {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
