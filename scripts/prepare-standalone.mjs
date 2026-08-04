/**
 * `next build` with `output: "standalone"` emits a minimal server bundle but
 * deliberately leaves the static assets behind. PM2 runs the bundle directly,
 * so the two asset trees are copied next to it here.
 */
import { cp, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

async function exists(target) {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(standalone))) {
    console.error(
      "No .next/standalone directory found. Run `npm run build` before this script."
    );
    process.exit(1);
  }

  await cp(
    path.join(root, ".next", "static"),
    path.join(standalone, ".next", "static"),
    { recursive: true }
  );

  if (await exists(path.join(root, "public"))) {
    await cp(path.join(root, "public"), path.join(standalone, "public"), {
      recursive: true,
    });
  }

  console.log("Standalone bundle ready at .next/standalone/server.js");
}

await main();
