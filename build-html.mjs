import { I18n } from "i18n";
import { dirname, join } from "path";
import { renderFile } from "pug";
import { minify } from "html-minifier";
import { compress } from "brotli";
import { writeFileSync } from "fs";

const rootDir = dirname(new URL(import.meta.url).pathname);
const resourcesDir = join(rootDir, "resources");
const localesDir = join(rootDir, "locales");
const publicDir = join(rootDir, "public");

const htmlMinifierOptions = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	minifyCSS: true,
	removeAttributeQuotes: true,
	removeComments: true,
	removeTagWhitespace: true,
};

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
	locales.forEach(locale => {
		const renderedHtml = renderHtml(locale);
		const minifiedHtml = minifyHtml(renderedHtml);
		writeFileSync(join(publicDir, `${locale}.html`), minifiedHtml);

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
	return minify(html, htmlMinifierOptions);
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