import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['index.html', 'lab.html', 'app.js', ...['engine', 'styles'].flatMap(dir =>
  readdirSync(path.join(root, dir)).filter(name => name.endsWith('.js')).map(name => `${dir}/${name}`)
)];

for (const file of files) {
  const source = readFileSync(path.join(root, file), 'utf8');
  if (file.endsWith('.js')) new vm.Script(source, { filename: file });
  if (file.endsWith('.html')) {
    for (const [, reference] of source.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|#|data:)/.test(reference)) continue;
      const asset = reference.split(/[?#]/)[0];
      if (!existsSync(path.join(root, asset))) throw new Error(`Missing asset in ${file}: ${asset}`);
    }
  }
  const destination = path.join(root, 'dist', file);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(path.join(root, file), destination);
}
console.log(`Validated and prepared ${files.length} website files in dist/`);
