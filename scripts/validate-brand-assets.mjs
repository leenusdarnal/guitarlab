#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const staticFile = (path) =>
  readFile(new URL(`../static/${path}`, import.meta.url));

function pngDimensions(buffer, label) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(buffer.subarray(0, 8).equals(signature), `${label} must be a PNG file`);
  assert.equal(buffer.toString('ascii', 12, 16), 'IHDR', `${label} must have a PNG IHDR`);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

const manifest = JSON.parse((await staticFile('manifest.webmanifest')).toString('utf8'));
assert.equal(manifest.name, 'GuitarLab — Learn, Practise, Master');
assert.equal(manifest.short_name, 'GuitarLab');
assert.equal(manifest.display, 'standalone');

for (const icon of manifest.icons) {
  const path = icon.src.replace(/^\//, '');
  const content = await staticFile(path);
  if (icon.type === 'image/png') {
    const dimensions = pngDimensions(content, path);
    const declared = icon.sizes.split(' ')[0].split('x').map(Number);
    assert.deepEqual(dimensions, { width: declared[0], height: declared[1] }, `${path} dimensions must match the manifest`);
  } else {
    const source = content.toString('utf8');
    assert.match(source, /<svg\b/, `${path} must contain an SVG root`);
    assert.match(source, /viewBox=/, `${path} must declare a viewBox`);
  }
}

const png192 = pngDimensions(await staticFile('icons/guitarlab-192.png'), '192px PWA icon');
const png512 = pngDimensions(await staticFile('icons/guitarlab-512.png'), '512px PWA icon');
const apple = pngDimensions(await staticFile('apple-touch-icon.png'), 'Apple touch icon');
assert.deepEqual(png192, { width: 192, height: 192 });
assert.deepEqual(png512, { width: 512, height: 512 });
assert.deepEqual(apple, { width: 180, height: 180 });

const maskable = (await staticFile('icons/guitarlab-maskable.svg')).toString('utf8');
assert.match(maskable, /<rect width="512" height="512" fill="url\(#tile\)"\s*\/>/, 'maskable icon must have a full-bleed background');
assert.match(maskable, /translate\(110 105\) scale\(1\.15\)/, 'maskable artwork must remain inset inside the safe area');
assert.doesNotMatch(maskable, /<rect[^>]*rx=/, 'maskable background must not pre-round corners');

const favicon = (await staticFile('favicon.svg')).toString('utf8');
assert.match(favicon, /viewBox="0 0 64 64"/, 'favicon must use its compact 64px viewBox');
assert.match(favicon, /<circle cx="33" cy="37"/, 'favicon must retain a recognizable acoustic sound hole');

const [lightLogo, darkLogo, appHtml, brandComponent] = await Promise.all([
  staticFile('brand/guitarlab-logo.svg'),
  staticFile('brand/guitarlab-logo-dark.svg'),
  readFile(new URL('../src/app.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/components/Brand.svelte', import.meta.url), 'utf8')
]);
assert.match(lightLogo.toString('utf8'), /fill="#14251F"/, 'light-background logo must use dark lettering');
assert.match(darkLogo.toString('utf8'), /fill="#F1F4EF"/, 'dark-background logo must use ivory lettering');
assert.match(appHtml, /rel="apple-touch-icon"[^>]+sizes="180x180"/, 'document head must declare the Apple touch icon');
assert.match(appHtml, /rel="manifest" href="\/manifest\.webmanifest"/, 'document head must declare the web app manifest');
assert.match(brandComponent, /class="brand-name"/, 'shared brand component must expose the visible wordmark text');
assert.match(brandComponent, /alt=""/, 'wordmark image must remain decorative beside visible text');

console.log('Brand asset validation passed: manifest, PNG dimensions, SVG variants, maskable safe area, favicon and app-head declarations.');
