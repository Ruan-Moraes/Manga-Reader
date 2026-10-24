import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (name) =>
  readFile(new URL(`../infra/terraform/${name}`, import.meta.url), "utf8");
function block(source, declaration) {
  const start = source.indexOf(`${declaration} {`);
  assert.notEqual(start, -1, `missing ${declaration}`);
  const end = source.indexOf("\n}", start);
  assert.notEqual(end, -1, `unterminated ${declaration}`);
  return source.slice(start, end + 2);
}

test("baseline remains the default; candidate uses a supported 2-vCPU/8-GiB pair", async () => {
  const variables = await read("variables.tf"),
    main = await read("main.tf");
  const profile = block(variables, 'variable "worker_resource_profile"');
  assert.match(profile, /default\s*=\s*"baseline"/);
  assert.match(profile, /nullable\s*=\s*false/);
  assert.match(
    profile,
    /contains\(\["baseline", "native-candidate-8g"\], var\.worker_resource_profile\)/,
  );
  const locals = block(main, "locals");
  assert.match(
    locals,
    /baseline\s*=\s*\{\s*cpu\s*=\s*"1"\s*memory\s*=\s*"1Gi"\s*concurrency\s*=\s*null\s*\}/,
  );
  assert.match(
    locals,
    /"native-candidate-8g"\s*=\s*\{\s*cpu\s*=\s*"2"\s*memory\s*=\s*"8Gi"\s*concurrency\s*=\s*1\s*\}/,
  );
  assert.match(
    locals,
    /worker_resources\s*=\s*local\.worker_resource_profiles\[var\.worker_resource_profile\]/,
  );
});

test("only the worker consumes the selected resources and its own image", async () => {
  const main = await read("main.tf");
  const worker = block(main, 'resource "google_cloud_run_v2_service" "worker"');
  assert.match(worker, /cpu\s*=\s*local\.worker_resources\.cpu/);
  assert.match(worker, /memory\s*=\s*local\.worker_resources\.memory/);
  assert.match(
    worker,
    /max_instance_request_concurrency\s*=\s*local\.worker_resources\.concurrency/,
  );
  assert.match(
    worker,
    /image\s*=\s*coalesce\(var\.worker_container_image, var\.container_image\)/,
  );
  assert.match(worker, /min_instance_count\s*=\s*0/);
  assert.match(worker, /max_instance_count\s*=\s*1/);
  for (const resource of [
    'resource "google_cloud_run_v2_service" "gateway"',
    'resource "google_cloud_run_v2_job" "maintenance"',
  ])
    assert.doesNotMatch(
      block(main, resource),
      /worker_resources|worker_container_image/,
    );
});

test("candidate is non-deployable through a hard lifecycle precondition, not a warning-only check", async () => {
  const main = await read("main.tf");
  const worker = block(main, 'resource "google_cloud_run_v2_service" "worker"');
  assert.match(worker, /lifecycle\s*\{\s*precondition\s*\{/);
  assert.match(
    worker,
    /condition\s*=\s*var\.worker_resource_profile\s*==\s*"baseline"/,
  );
  assert.match(
    worker,
    /error_message\s*=\s*"Native worker candidate is offline-only/,
  );
  assert.match(worker, /count\s*=\s*var\.worker_enabled\s*\?\s*1\s*:\s*0/);
  // The gateway is unconditional: this also blocks other resource creation when worker count is zero.
  const gateway = block(
    main,
    'resource "google_cloud_run_v2_service" "gateway"',
  );
  assert.doesNotMatch(gateway, /^\s*count\s*=/m);
  assert.match(gateway, /lifecycle\s*\{\s*precondition\s*\{/);
  assert.match(
    gateway,
    /condition\s*=\s*var\.worker_resource_profile\s*==\s*"baseline"/,
  );
});

test("examples and worker environment keep providers, rendering and uploads disabled", async () => {
  const variables = await read("variables.tf"),
    main = await read("main.tf");
  for (const name of ["gateway_enabled", "worker_enabled"])
    assert.match(block(variables, `variable "${name}"`), /default\s*=\s*false/);
  for (const example of [
    "terraform.tfvars.example",
    "native-worker-candidate.tfvars.example",
  ]) {
    const source = await read(example);
    assert.match(source, /^gateway_enabled\s*=\s*false$/m);
    assert.match(source, /^worker_enabled\s*=\s*false$/m);
  }
  assert.match(
    await read("native-worker-candidate.tfvars.example"),
    /^worker_resource_profile\s*=\s*"native-candidate-8g"$/m,
  );
  const workerEnvironment = main.match(
    /worker_env\s*=\s*merge\(local\.database_env,\s*\{([\s\S]*?)\n\s*\}\)/,
  )?.[1];
  assert.ok(workerEnvironment, "missing worker environment");
  for (const name of [
    "OCR",
    "TRANSLATION",
    "LAYOUT",
    "RENDERING",
    "RESULT_DOWNLOAD",
  ])
    assert.match(
      workerEnvironment,
      new RegExp(`GATEWAY_${name}_MODE\\s*=\\s*"disabled"`),
    );
});

test("worker image override is optional and requires an immutable registry digest", async () => {
  const image = block(
    await read("variables.tf"),
    'variable "worker_container_image"',
  );
  assert.match(image, /default\s*=\s*null/);
  assert.match(image, /@sha256:\[a-f0-9\]\{64\}/);
  assert.match(image, /validation\s*\{/);
});
