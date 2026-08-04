const fs = require("node:fs");
const path = require("node:path");

const APP_DIR = "/var/www/meditrack";

/**
 * PM2 does not read .env files, and the Next.js standalone server needs the
 * Supabase values at runtime. The file sitting next to the app is parsed here
 * and merged into the process environment.
 */
function readEnvFile(directory) {
  const file = path.join(directory, ".env");
  if (!fs.existsSync(file)) return {};

  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .reduce((accumulator, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return accumulator;

      const separator = trimmed.indexOf("=");
      if (separator === -1) return accumulator;

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed
        .slice(separator + 1)
        .trim()
        .replace(/^(['"])(.*)\1$/, "$2");

      accumulator[key] = value;
      return accumulator;
    }, {});
}

const baseEnv = {
  NODE_ENV: "production",
  PORT: 3000,
  // Bound to loopback on purpose: Nginx is the only thing that should reach
  // the app, and port 3000 stays closed in the security group.
  HOSTNAME: "127.0.0.1",
  ...readEnvFile(APP_DIR),
};

/**
 *   pm2 start ecosystem.config.js --env production
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "meditrack",
      script: ".next/standalone/server.js",
      cwd: APP_DIR,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      min_uptime: "20s",
      max_restarts: 10,
      restart_delay: 2000,
      kill_timeout: 5000,
      env: baseEnv,
      env_production: baseEnv,
      error_file: "/var/log/meditrack/error.log",
      out_file: "/var/log/meditrack/out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
