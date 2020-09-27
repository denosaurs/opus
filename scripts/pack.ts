import { encode as encode64 } from "https://deno.land/std@0.71.0/encoding/base64.ts";
import { encode as encodeUTF } from "https://deno.land/std@0.71.0/encoding/utf8.ts";
import { join } from "https://deno.land/std@0.71.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.71.0/fs/mod.ts";
import { minify } from "https://jspm.dev/terser@5.2.1";

function log(text: string): void {
  console.log(`[log] ${text}`);
}

function err(text: string): never {
  console.log(`[err] ${text}`);
  return Deno.exit(1);
}

const build = "build";
const pack = "pack";

const out = join(pack, "opuswasm.js");
const eWrapper = join(build, "opuswasm.js");
const eWasm = join(build, "opuswasm.wasm");

await ensureDir(pack);

if (!(await Deno.stat("README.md")).isFile) {
  err("pack script should be executed in project root");
}

const wasm = await Deno.readFile(eWasm);
const encoded = encode64(wasm);

const prelude = `export const source = Uint8Array
.from(atob("${encoded}"), c => c.charCodeAt(0));`;

const exit = `export default Module({
  wasmBinary: source
})`;

let glue = await Deno.readTextFile(eWrapper);
glue = glue.replace(
  "Module = Module || {};",
  "let document = {};let TextDecoder = undefined;"
);

const output: any = await minify(`${prelude}${glue}${exit}`, {
  mangle: { module: true },
  output: {
    preamble: "//deno-fmt-ignore-file",
  },
});

if (output.error) {
  err(`encountered error when minifying: ${output.error}`);
}

await Deno.writeFile(out, encodeUTF(output.code));
