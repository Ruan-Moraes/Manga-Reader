import { spawnSync } from "node:child_process";
import { mkdir, realpath } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  checkedFile,
  packageCodec,
  SOURCE_HASH,
} from "./render-native-package.mjs";

// Immutable local toolchain: Ubuntu GCC 13.3.0, CMake 3.28.3, glibc 2.39.
export const BUILDER =
  "sha256:a5e056701b09317d667148809010b63de2e5398aa3adf1cf85b599b6968c75b2";
export const WEBP =
  "d98f252299f6451b57fc2a3cc914cc949d110e7c1ecd993f4714679ce7b82178";
export const SHARP =
  "0de1f045859d93a0c80542538d667896e547489cfa5e0785c17a445fab01a0d4";
export const MANIFEST =
  "bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58";

const BUILD = `set -eu
export SOURCE_DATE_EPOCH=1756684800
tar xzf /input/source.tar.gz -C /build
cmake -S /build/libwebp-1.6.0 -B /build/cmake \\
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_C_FLAGS_RELEASE=-O2 \\
  -DCMAKE_INSTALL_PREFIX=/build/install -DBUILD_SHARED_LIBS=ON \\
  -DWEBP_LINK_STATIC=OFF -DWEBP_ENABLE_SIMD=OFF -DWEBP_USE_THREAD=OFF \\
  -DWEBP_BUILD_ANIM_UTILS=OFF -DWEBP_BUILD_CWEBP=OFF -DWEBP_BUILD_DWEBP=OFF \\
  -DWEBP_BUILD_GIF2WEBP=OFF -DWEBP_BUILD_IMG2WEBP=OFF -DWEBP_BUILD_VWEBP=OFF \\
  -DWEBP_BUILD_WEBPINFO=OFF -DWEBP_BUILD_LIBWEBPMUX=OFF -DWEBP_BUILD_WEBPMUX=OFF \\
  -DWEBP_BUILD_EXTRAS=OFF -DWEBP_BUILD_WEBP_JS=OFF -DWEBP_BUILD_FUZZTEST=OFF \\
  '-DCMAKE_INSTALL_RPATH=$ORIGIN' -DCMAKE_BUILD_WITH_INSTALL_RPATH=ON \\
  -DCMAKE_INSTALL_RPATH_USE_LINK_PATH=OFF >/dev/null
cmake --build /build/cmake --parallel 2 >/dev/null
cmake --install /build/cmake >/dev/null`;

export async function rebuild(source, destination) {
  if (
    !isAbsolute(source) ||
    !isAbsolute(destination) ||
    source.includes(",") ||
    destination.includes(",")
  )
    throw new Error("native-build-invalid-path");
  await checkedFile(source, SOURCE_HASH, 16 * 1024 * 1024);
  const target = resolve(destination);
  if ((await realpath(dirname(target))) !== dirname(target))
    throw new Error("native-build-invalid-parent");
  // Never reuse, overwrite or delete an earlier build, even after a failure.
  await mkdir(target, { mode: 0o700 });
  const build = join(target, "build");
  await mkdir(build, { mode: 0o700 });
  const result = spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--pull=never",
      "--network=none",
      "--memory=2g",
      "--memory-swap=2g",
      "--cpus=2",
      "--pids-limit=128",
      "--cap-drop=ALL",
      "--security-opt=no-new-privileges",
      "--mount",
      `type=bind,src=${source},dst=/input/source.tar.gz,readonly`,
      "--mount",
      `type=bind,src=${build},dst=/build`,
      "--entrypoint",
      "/bin/sh",
      BUILDER,
      "-c",
      BUILD,
    ],
    { encoding: "utf8", timeout: 300000, maxBuffer: 1024 * 1024 },
  );
  if (result.status !== 0 || result.error)
    throw new Error("native-build-failed");
  const root = join(build, "libwebp-1.6.0");
  const packageResult = await packageCodec({
    destination: join(target, "package"),
    platform: "linux-aarch64-glibc",
    webp: join(build, "install/lib/libwebp.so.7.2.0"),
    "webp-sha256": WEBP,
    sharp: join(build, "install/lib/libsharpyuv.so.0.1.2"),
    "sharp-sha256": SHARP,
    copying: join(root, "COPYING"),
    patents: join(root, "PATENTS"),
  });
  if (packageResult.manifestSha256 !== MANIFEST)
    throw new Error("native-build-manifest-mismatch");
  return {
    builder: BUILDER,
    sourceSha256: SOURCE_HASH,
    webpSha256: WEBP,
    sharpSha256: SHARP,
    manifestSha256: MANIFEST,
    status: "packaged-not-admitted",
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    if (process.argv.length !== 4)
      throw new Error("native-build-invalid-arguments");
    process.stdout.write(
      JSON.stringify(await rebuild(process.argv[2], process.argv[3])) + "\n",
    );
  } catch (error) {
    process.stderr.write(error.message + "\n");
    process.exitCode = 1;
  }
}
