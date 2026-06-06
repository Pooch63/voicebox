import { copyFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

mkdirSync(publicDir, { recursive: true });

const copies = [
  {
    from: join(root, "node_modules/onnxruntime-web/dist"),
    pattern: /\.(wasm|mjs)$/,
  },
  {
    from: join(root, "node_modules/@ricky0123/vad-web/dist"),
    pattern: /\.(onnx|js)$/,
    filter: (name) =>
      name.endsWith(".onnx") || name === "vad.worklet.bundle.min.js",
  },
];

for (const { from, pattern, filter } of copies) {
  for (const name of readdirSync(from)) {
    if (!pattern.test(name)) continue;
    if (filter && !filter(name)) continue;
    copyFileSync(join(from, name), join(publicDir, name));
  }
}
