import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  parseImageOptions,
  prepareSingleJreImageContext,
} from "./render-native-image.mjs";

// Only prepares a bounded local snapshot. No Docker, download, credentials, provider or push.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    process.stdout.write(
      JSON.stringify(
        await prepareSingleJreImageContext(
          parseImageOptions(process.argv.slice(2)),
        ),
      ) + "\n",
    );
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
