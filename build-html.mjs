import { compress } from "brotli";
import { readFileSync, writeFileSync } from "fs";
import { minify } from "html-minifier";
import { I18n } from "i18n";
import { createHash } from "node:crypto";
import { dirname, join } from "path";
import { renderFile } from "pug";

const rootDir = dirname(new URL(import.meta.url).pathname);
const configDir = join(rootDir, "config");
const resourcesDir = join(rootDir, "resources");
const localesDir = join(rootDir, "locales");
const publicDir = join(rootDir, "public");

const locales = ["it", "en"];

// @ts-ignore
const i18n = new I18n({
	locales,
	directory: localesDir,
});

buildHtml(locales);

/**
 * @param {string[]} locales 
 */
function buildHtml(locales) {
	locales.forEach((locale, index) => {
		const renderedHtml = renderHtml(locale);
		const minifiedHtml = minifyHtml(renderedHtml);
		writeFileSync(join(publicDir, `${locale}.html`), minifiedHtml);
		if (index === 0) {
			updateCaddyfileStyleHash(minifiedHtml);
		}

		const compressedHtml = brotliCompress(minifiedHtml);
		writeFileSync(join(publicDir, `${locale}.html.br`), compressedHtml);
	});
}

/**
 * @param {string} locale
 * @returns {string}
 */
function renderHtml(locale) {
	i18n.setLocale(locale);
	return renderFile(join(resourcesDir, `${locale}.pug`), {
		locale,
		__: i18n.__.bind(i18n)
	});
}

/**
 * @param {string} html 
 * @returns {string}
 */
function minifyHtml(html) {
	return minify(html, {
		collapseBooleanAttributes: true,
		collapseWhitespace: true,
		minifyCSS: true,
		removeAttributeQuotes: true,
		removeComments: true,
		removeTagWhitespace: true,
	});
}

function updateCaddyfileStyleHash(html) {
	const styleHash = getStyleHash(html);
	const caddyfile = join(configDir, "Caddyfile");
	const caddyfileContent = readFileSync(caddyfile, "utf8");
	const caddyfileContentWithHash = caddyfileContent.replace(/style-src '.*?'/, `style-src 'sha256-${styleHash}'`);
	writeFileSync(caddyfile, caddyfileContentWithHash);
}

function getStyleHash(html) {
	const styleContent = html.match(/<style>(.+?)<\/style>/)[1];
	const hash = createHash("sha256");
	hash.update(styleContent);
	return hash.digest("base64");
}

/**
 * @param {string} inputText 
 * @returns {Uint8Array}
 */
function brotliCompress(inputText) {
	return compress(Buffer.from(inputText), {
		mode: 1,
	})
}