const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Compiling Electron...');
try {
    execSync('tsc -p electron/tsconfig.json', { stdio: 'inherit' });
} catch (e) {
    console.error('TypeScript compilation failed');
    process.exit(1);
}

const distPackageJson = path.join(__dirname, '../dist-electron/package.json');
const content = JSON.stringify({ type: 'commonjs' }, null, 2);

console.log('Writing dist-electron/package.json...');
fs.writeFileSync(distPackageJson, content);
console.log('Done.');
