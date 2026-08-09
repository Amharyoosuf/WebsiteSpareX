// Production start script.
// Defaults DATABASE_URL to the Railway volume path when it isn't provided,
// then runs migrations and starts Next.js. A DATABASE_URL you set in the
// environment always takes precedence over this default.
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:/data/prod.db";
  console.log("DATABASE_URL not set — defaulting to file:/data/prod.db (Railway volume).");
}

function run(command) {
  const res = spawnSync(command, { stdio: "inherit", shell: true, env: process.env });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

run("prisma migrate deploy");
run("next start");
