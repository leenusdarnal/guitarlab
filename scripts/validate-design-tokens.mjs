#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../src/app.css', import.meta.url), 'utf8');
const blocks = [
  ...css.matchAll(/:root(?:\[data-theme='light'\])?\s*\{([^}]+)\}/g)
];

function tokensFrom(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((match) => [
      match[1],
      match[2]
    ])
  );
}

function luminance(hex) {
  const values = [1, 3, 5].map(
    (index) => parseInt(hex.slice(index, index + 2), 16) / 255
  );
  const linear = values.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

const checks = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['muted', 'bg', 4.5],
  ['muted', 'surface', 4.5],
  ['primary', 'bg', 4.5],
  ['secondary', 'bg', 4.5],
  ['success', 'bg', 4.5],
  ['warning', 'bg', 4.5],
  ['danger', 'bg', 4.5],
  ['primary-ink', 'primary', 4.5],
  ['focus', 'bg', 3]
];

if (blocks.length !== 2) {
  console.error('Expected dark and light :root token blocks in src/app.css.');
  process.exit(1);
}

const themes = [
  ['dark', tokensFrom(blocks[0][1])],
  ['light', tokensFrom(blocks[1][1])]
];
const failures = [];

for (const [themeName, tokens] of themes) {
  for (const [foregroundKey, backgroundKey, minimum] of checks) {
    const foreground = tokens[foregroundKey];
    const background = tokens[backgroundKey];
    if (!foreground || !background) {
      failures.push(
        \`\${themeName}: missing token --\${!foreground ? foregroundKey : backgroundKey}\`
      );
      continue;
    }
    const ratio = contrast(foreground, background);
    console.log(
      \`\${themeName}: --\${foregroundKey} / --\${backgroundKey} = \${ratio.toFixed(2)}:1 (min \${minimum}:1)\`
    );
    if (ratio < minimum) {
      failures.push(
        \`\${themeName}: --\${foregroundKey} on --\${backgroundKey} is below \${minimum}:1\`
      );
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Design-token contrast checks passed for dark and light themes.');
