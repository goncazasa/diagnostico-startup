import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(dir, '../..', 'Validacion_Expertos_Startup_V2_7.html');
const imageDefinitions = [
  ['D1', 'dimension-1-equipo.png', 'Ilustración de los cuatro aspectos de la dimensión Equipo: perfiles, conocimiento, dedicación y aprendizaje.'],
  ['D2', 'dimension-2-mercado.png', 'Ilustración del recorrido de Adaptación al mercado: clientes, problema, mercado, competencia, monitorización, pago y mejora.'],
  ['D4', 'dimension-3-marketing.png', 'Ilustración de Marketing y ventas: compromiso, canal y aprendizaje del proceso comercial.'],
  ['D5', 'dimension-4-gestion-financiera.png', 'Ilustración de Gestión financiera: caja actual, previsión de los próximos meses, capital necesario y siguiente hito.'],
  ['D6', 'dimension-5-gestion-recursos-relaciones.png', 'Ilustración de Gestión de recursos y relaciones: colaboraciones, legitimidad y acceso a financiación, clientes y oportunidades.']
];
const imageDir = path.join(dir, 'assets', 'dimensions');
const shell = fs.readFileSync(path.join(dir, 'shell.html'), 'utf8');
function imageMap(inline) {
  return Object.fromEntries(imageDefinitions.map(([id, filename, alt]) => [id, {
    src: inline ? 'data:image/png;base64,' + fs.readFileSync(path.join(imageDir, filename)).toString('base64') : 'assets/dimensions/' + filename,
    alt
  }]));
}
function render(images) {
  let html = shell;
  const imagesScript = 'globalThis.ValidationDimensionImages=' + JSON.stringify(images) + ';';
  new vm.Script(imagesScript, { filename: 'dimension-images.js' });
  html = html.replace('/*__DIMENSION_IMAGES__*/', () => imagesScript);
  for (const [marker, filename] of [['STYLES', 'style.css'], ['INSTRUMENT', 'instrument.js'], ['CORE', 'core.js'], ['APP', 'app.js']]) {
    const contents = fs.readFileSync(path.join(dir, filename), 'utf8') + (marker === 'STYLES' ? '\n' + fs.readFileSync(path.join(dir, 'focus.css'), 'utf8') : '');
    if (filename.endsWith('.js')) {
      new vm.Script(contents, { filename });
      if (/<\/script/i.test(contents)) throw new Error('Unsafe inline script closing tag in ' + filename);
    }
    html = html.replace('/*__' + marker + '__*/', () => contents);
  }
  if (/\/\*__[A-Z_]+__\*\//.test(html)) throw new Error('Unresolved template marker');
  return html;
}
const standaloneHtml = render(imageMap(true));
fs.writeFileSync(output, standaloneHtml, 'utf8');
const publicDir = path.resolve(dir, '../..', 'public');
fs.mkdirSync(publicDir, { recursive: true });
const publicImageDir = path.join(publicDir, 'assets', 'dimensions');
fs.mkdirSync(publicImageDir, { recursive: true });
for (const [, filename] of imageDefinitions) fs.copyFileSync(path.join(imageDir, filename), path.join(publicImageDir, filename));
const publicHtml = render(imageMap(false));
fs.writeFileSync(path.join(publicDir, 'index.html'), publicHtml, 'utf8');
fs.writeFileSync(path.join(publicDir, '.nojekyll'), '', 'utf8');
console.log('HTML autónomo generado: ' + output);
console.log('Tamaño: ' + Buffer.byteLength(standaloneHtml) + ' bytes. Sin dependencias de red.');
console.log('Copia para publicar: ' + path.join(publicDir, 'index.html'));
