import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/generated/schema.d.ts");

const specUrl = process.env.FEVRIPS_SPEC_URL;
if (!specUrl) {
  console.error("FEVRIPS_SPEC_URL is required (use gen:stage or gen:prod)");
  process.exit(1);
}

const ast = await openapiTS(new URL(specUrl));
const banner = `// Auto-generated from ${specUrl} on ${new Date().toISOString()}\n// Do not edit by hand. Re-run \`pnpm gen:stage\` or \`pnpm gen:prod\`.\n\n`;
const content = banner + astToString(ast);

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, content, "utf8");

console.log(`Wrote ${OUT} (${content.length} bytes)`);
