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

let cssContent = readFileSync(cssPath, 'utf-8');
console.log(`✓ Read style.css (${(cssContent.length / 1024).toFixed(2)} KB)`);

// Replace :root with :host for Shadow DOM compatibility
// :host is the shadow DOM root selector
cssContent = cssContent.replace(/:root\s*{/g, ':host {');
console.log('✓ Replaced :root with :host for Shadow DOM');

// Replace .dark class with :host(.dark) for Shadow DOM
// This allows dark theme to work when .dark class is on the shadow host
cssContent = cssContent.replace(/\.dark\s*{/g, ':host(.dark) {');
console.log('✓ Replaced .dark with :host(.dark) for Shadow DOM');

// Replace Tailwind's :is(.dark *) pattern with :is(:host(.dark) *)
// This transforms patterns like: .dark\:bg-black:is(.dark *) 
// into: .dark\:bg-black:is(:host(.dark) *)
cssContent = cssContent.replace(/:is\(\.dark \*\)/g, ':is(:host(.dark) *)');
console.log('✓ Replaced :is(.dark *) pattern for Shadow DOM');

// Replace body selector with :host as well, since body doesn't exist in Shadow DOM
cssContent = cssContent.replace(/\bbody\s*{/g, ':host {');
console.log('✓ Replaced body with :host for Shadow DOM');

// Replace html selector with :host
cssContent = cssContent.replace(/\bhtml\s*{/g, ':host {');
console.log('✓ Replaced html with :host for Shadow DOM');

// Add additional CSS to ensure variables are inherited
cssContent = `
/* Shadow DOM root styles */
:host {
  display: block;
  height: 100%;
  width: 100%;
}

/* Ensure all elements inherit CSS variables */
* {
  box-sizing: border-box;
}

` + cssContent;

console.log('✓ Added Shadow DOM wrapper styles');

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

// Generate cache busting version
const cacheVersion = Date.now().toString();

// Inject CSS as a global variable at the start of the widget
const injectionCode = `
// Embedded CSS for Shadow DOM
window.__GRIDIX_WIDGET_STYLES__ = \`${escapedCSS}\`;
window.__GRIDIX_WIDGET_VERSION__ = '${cacheVersion}';
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

