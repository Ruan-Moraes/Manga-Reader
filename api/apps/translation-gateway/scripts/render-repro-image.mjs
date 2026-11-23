import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  parseImageOptions,
  prepareReproImageContext,
} from "./native-image/render-native-image.mjs";

// Only prepares a local snapshot; never starts Docker, downloads or publishes.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    process.stdout.write(
      JSON.stringify(
        await prepareReproImageContext(
          parseImageOptions(process.argv.slice(2)),
        ),
      ) + "\n",
    );
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
