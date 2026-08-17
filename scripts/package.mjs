// Zips the built `dist/` folder into a versioned, upload-ready archive for the
// Chrome Web Store. Run after `pnpm build` (the `package` npm script chains both).
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

if (!existsSync(resolve(dist, 'manifest.json'))) {
  console.error('✗ dist/ has no manifest.json — run `pnpm build` first.');
  process.exit(1);
}

const { name, version } = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8'),
);
const zipPath = resolve(root, `${name}-v${version}.zip`);

// zip appends to an existing archive, so remove any stale build first.
rmSync(zipPath, { force: true });

// Zip the *contents* of dist/ (not the dist/ folder itself) so manifest.json
// sits at the archive root, which is what the Web Store expects.
execFileSync('zip', ['-r', zipPath, '.', '-x', '*.DS_Store'], {
  cwd: dist,
  stdio: 'inherit',
});

console.log(`\n✓ Packaged ${name} v${version} → ${zipPath}`);
