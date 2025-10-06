#!/usr/bin/env node
/**
 * Build script that creates a widget.js with inlined CSS
 * This ensures Tailwind styles work correctly in Shadow DOM
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist-widget');

console.log('🎨 Building widget with inline styles...\n');

// Check if dist-widget exists
if (!existsSync(distDir)) {
  console.error('❌ dist-widget directory not found. Run "npm run build:widget" first.');
  process.exit(1);
}

// Read the CSS file
const cssPath = join(distDir, 'style.css');
if (!existsSync(cssPath)) {
  console.error('❌ style.css not found in dist-widget directory.');
  process.exit(1);
}

const cssContent = readFileSync(cssPath, 'utf-8');
console.log(`✓ Read style.css (${(cssContent.length / 1024).toFixed(2)} KB)`);

// Read the widget.js file
const jsPath = join(distDir, 'widget.js');
if (!existsSync(jsPath)) {
  console.error('❌ widget.js not found in dist-widget directory.');
  process.exit(1);
}

let jsContent = readFileSync(jsPath, 'utf-8');
console.log(`✓ Read widget.js (${(jsContent.length / 1024).toFixed(2)} KB)`);

// Escape the CSS content for embedding in JS
const escapedCSS = cssContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

// Inject CSS as a global variable at the start of the widget
const injectionCode = `
// Embedded CSS for Shadow DOM
window.__GRIDIX_WIDGET_STYLES__ = \`${escapedCSS}\`;
`;

// Add the injection code at the beginning
jsContent = injectionCode + jsContent;

// Modify the init function to use embedded styles by default
// Find and replace the ensureStylesInShadow to check for embedded styles first
jsContent = jsContent.replace(
  /function ensureStylesInShadow\([^)]+\):\s*Promise<void>\s*{/,
  function(match) {
    return match + `
    // Check for embedded styles first
    if (!options.inlineStyles && typeof window !== 'undefined' && window.__GRIDIX_WIDGET_STYLES__) {
      options.inlineStyles = window.__GRIDIX_WIDGET_STYLES__;
    }
    `;
  }
);

// Write the modified widget.js
const outputPath = join(distDir, 'widget-inline.js');
writeFileSync(outputPath, jsContent, 'utf-8');
console.log(`✓ Created widget-inline.js (${(jsContent.length / 1024).toFixed(2)} KB)`);

console.log('\n✅ Widget with inline styles built successfully!');
console.log(`📦 Output: ${outputPath}`);
console.log('\n💡 Usage:');
console.log('   <script src="path/to/widget-inline.js"></script>');
console.log('   <script>GridixWidget.init({ projectId: "your-id" });</script>');

