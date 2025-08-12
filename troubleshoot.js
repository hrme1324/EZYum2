#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Ezyum Food App Troubleshooting Script\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Check Node.js version
const nodeVersion = process.version;
console.log(`📦 Node.js version: ${nodeVersion}`);

// Check if dist directory exists and has proper files
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Dist directory exists');

  const distFiles = fs.readdirSync(distPath);
  const hasIndexHtml = distFiles.includes('index.html');
  const hasAssets = fs.existsSync(path.join(distPath, 'assets'));

  if (hasIndexHtml && hasAssets) {
    console.log('✅ Build files look correct');

    // Check asset files
    const assetsPath = path.join(distPath, 'assets');
    const assetFiles = fs.readdirSync(assetsPath);
    const jsFiles = assetFiles.filter((f) => f.endsWith('.js'));
    const cssFiles = assetFiles.filter((f) => f.endsWith('.css'));

    console.log(`📁 Found ${jsFiles.length} JS files and ${cssFiles.length} CSS files`);

    // Check if HTML references match actual files
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
    const jsMatches = jsFiles.some((jsFile) => indexHtml.includes(jsFile));
    const cssMatches = cssFiles.some((cssFile) => indexHtml.includes(cssFile));

    if (jsMatches && cssMatches) {
      console.log('✅ HTML references match actual asset files');
    } else {
      console.log('⚠️  Warning: HTML references may not match actual asset files');
    }
  } else {
    console.log('❌ Build files are incomplete');
  }
} else {
  console.log('❌ Dist directory not found - run "npm run build" first');
}

// Check for common issues
console.log('\n🔧 Checking for common issues...');

// Check if vite is running
try {
  const viteProcesses = execSync('ps aux | grep vite | grep -v grep', { encoding: 'utf8' });
  if (viteProcesses.trim()) {
    console.log('✅ Vite development server is running');
  } else {
    console.log('⚠️  Vite development server is not running');
  }
} catch (error) {
  console.log('⚠️  Could not check Vite processes');
}

// Check for port conflicts
const ports = [3000, 3001, 3002];
console.log('\n🔌 Checking for port conflicts...');
ports.forEach((port) => {
  try {
    execSync(`lsof -i :${port}`, { stdio: 'ignore' });
    console.log(`⚠️  Port ${port} is in use`);
  } catch (error) {
    console.log(`✅ Port ${port} is available`);
  }
});

// Check API connectivity
console.log('\n🌐 Checking API connectivity...');
try {
  const response = execSync(
    'curl -s -o /dev/null -w "%{http_code}" https://www.themealdb.com/api/json/v1/1/categories.php',
    { encoding: 'utf8' },
  );
  if (response.trim() === '200') {
    console.log('✅ MealDB API is accessible');
  } else {
    console.log(`⚠️  MealDB API returned status: ${response.trim()}`);
  }
} catch (error) {
  console.log('❌ MealDB API is not accessible');
}

// Provide solutions
console.log('\n💡 Solutions for common issues:');
console.log("1. If assets don't load: Clear browser cache and restart dev server");
console.log('2. If API errors: Check internet connection and API endpoints');
console.log('3. If build fails: Delete node_modules and reinstall dependencies');
console.log('4. If port conflicts: Kill existing processes or use different port');
console.log('5. If MIME type errors: Ensure proper file extensions and server config');

console.log('\n🚀 Quick fixes:');
console.log('- Run: npm run dev (for development)');
console.log('- Run: npm run build && npm run preview (for production testing)');
console.log('- Run: rm -rf dist node_modules/.vite && npm run build (for clean build)');

console.log('\n✅ Troubleshooting complete!');
