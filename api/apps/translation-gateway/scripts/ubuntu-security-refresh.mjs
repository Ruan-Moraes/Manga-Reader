import { prepareBase } from "./native-image/ubuntu-base-update.mjs";

// Separate opt-in route: the original two-package default is unchanged.
try {
  const args = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!args[i]?.startsWith("--") || !args[i + 1] || Object.hasOwn(options, args[i].slice(2)))
      throw new Error("invalid-arguments");
    options[args[i].slice(2)] = args[i + 1];
  }
  process.stdout.write(JSON.stringify(await prepareBase(options, "security-refresh-2026-10-27")) + "\n");
} catch {
  process.stderr.write("security-refresh-not-admitted; inspect local preparation evidence\n");
  process.exitCode = 1;
}
