import { compress } from "brotli";
import { readFileSync, writeFileSync } from "fs";

const supportedLocales = ["it", "en"];
const publicDir = "public";
const filenames = supportedLocales.map(locale => `${publicDir}/${locale}.html`);

filenames.forEach(filename => {
	const compressedData = compress(readFileSync(filename), {
		mode: 1,
	});
	writeFileSync(`${filename}.br`, compressedData);
});
