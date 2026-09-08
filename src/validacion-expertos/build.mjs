import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(dir, '../..', 'Validacion_Expertos_Startup_V2_1.html');
let html = fs.readFileSync(path.join(dir, 'shell.html'), 'utf8');
for (const [marker, filename] of [['STYLES', 'style.css'], ['INSTRUMENT', 'instrument.js'], ['CORE', 'core.js'], ['APP', 'app.js']]) {
  const contents = fs.readFileSync(path.join(dir, filename), 'utf8') + (marker === 'STYLES' ? '\n' + fs.readFileSync(path.join(dir, 'focus.css'), 'utf8') : '');
  if (filename.endsWith('.js')) {
    new vm.Script(contents, { filename });
    if (/<\/script/i.test(contents)) throw new Error('Unsafe inline script closing tag in ' + filename);
  }
  html = html.replace('/*__' + marker + '__*/', () => contents);
}
if (/\/\*__[A-Z]+__\*\//.test(html)) throw new Error('Unresolved template marker');
fs.writeFileSync(output, html, 'utf8');
const publicDir = path.resolve(dir, '../..', 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'index.html'), html, 'utf8');
fs.writeFileSync(path.join(publicDir, '.nojekyll'), '', 'utf8');
console.log('HTML autónomo generado: ' + output);
console.log('Tamaño: ' + Buffer.byteLength(html) + ' bytes. Sin dependencias de red.');
console.log('Copia para publicar: ' + path.join(publicDir, 'index.html'));
