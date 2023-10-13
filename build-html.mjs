import { compress } from "brotli";
import { readFileSync, writeFileSync } from "fs";
import { minify } from "html-minifier";
import { createHash } from "node:crypto";
import { dirname, join } from "path";
import { renderFile } from "pug";
import postcss from "postcss";
import postcssNesting from "postcss-nesting";

const rootDir = dirname(new URL(import.meta.url).pathname);
const configDir = join(rootDir, "config");
const resourcesDir = join(rootDir, "resources");
const publicDir = join(rootDir, "public");

buildHTML();

function buildHTML() {
	const rawCss = getRawCSS();
	const processedCss = processCSS(rawCss);
	const renderedHtml = renderHTML(processedCss);
	const minifiedHtml = minifyHtml(renderedHtml);
	writeFileSync(join(publicDir, "index.html"), minifiedHtml);
	const compressedHtml = brotliCompress(minifiedHtml);
	writeFileSync(join(publicDir, "index.html.br"), compressedHtml);
	const styleHash = getStyleHash(processedCss);
	updateCaddyfileStyleHash(styleHash);
}

/**
 * @returns {string}
 */
function getRawCSS() {
	return readFileSync(join(resourcesDir, "style.css")).toString();
}

/**
 * @param {string} css 
 * @return {string}
 */
function processCSS(css) {
	// @ts-ignore
	return postcss([postcssNesting()]).process(css).css;
}

/**
 * @param {string} css 
 * @returns {string}
 */
function getStyleHash(css) {
	return createHash("sha256").update(css).digest("base64");
}

/**
 * @param {string} css 
 * @returns {string}
 */
function renderHTML(css) {
	return renderFile(join(resourcesDir, "index.pug"), { css });
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

/**
 * @param {string} styleHash 
 */
function updateCaddyfileStyleHash(styleHash) {
	const caddyfilename = join(configDir, "Caddyfile");
	const caddyfileContent = readFileSync(caddyfilename, "utf8");
	const updatedCaddyfileContent = caddyfileContent.replace(/style-src '.*?'/, `style-src 'sha256-${styleHash}'`);
	writeFileSync(caddyfilename, updatedCaddyfileContent);
}

/**
 * @param {string} inputText 
 * @returns {Uint8Array}
 */
function brotliCompress(inputText) {
	return compress(Buffer.from(inputText), { mode: 1 })
}