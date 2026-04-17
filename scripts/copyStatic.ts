import { Glob } from "bun";
import { mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

const html = await Bun.file("index.html").text();
const rewritten = html
	.replace("/src/main.ts", "./main.js")
	.replace("/src/ui/styles.css", "./styles.css");
await Bun.write("dist/index.html", rewritten);

const glob = new Glob("src/ui/*.css");
for await (const file of glob.scan(".")) {
	const name = file.split("/").pop()!;
	await Bun.write(`dist/${name}`, Bun.file(file));
}

await mkdir("dist/fonts", { recursive: true });
const fonts = new Glob("src/ui/fonts/*");
for await (const file of fonts.scan(".")) {
	const name = file.split("/").pop()!;
	await Bun.write(`dist/fonts/${name}`, Bun.file(file));
}
