import { parseImageOptions, prepareSecurityRefreshImageContext } from "./native-image/render-native-image.mjs";

// Explicit local snapshot only: no Docker, credentials, download or publication.
try {
  process.stdout.write(JSON.stringify(await prepareSecurityRefreshImageContext(
    parseImageOptions(process.argv.slice(2)),
  )) + "\n");
} catch {
  process.stderr.write("security-refresh-image-unavailable\n");
  process.exitCode = 1;
}
