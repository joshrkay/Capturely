import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const isWatch = process.argv.includes("--watch");

/** @type {esbuild.BuildOptions} */
const buildOptions = {
  entryPoints: [path.resolve(__dirname, "src/widget.ts")],
  bundle: true,
  format: "iife",
  target: "es2017",
  outfile: path.resolve(rootDir, "public/widget.js"),
  minify: !isWatch,
  sourcemap: isWatch,
  alias: {
    "@capturely/shared-forms": path.resolve(
      rootDir,
      "packages/shared/forms/src/index.ts"
    ),
  },
  logLevel: "info",
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("Watching for widget changes...");
} else {
  await esbuild.build(buildOptions);
}
