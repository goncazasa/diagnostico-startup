import { execFileSync } from 'node:child_process';

const isDocumentation = file => file === 'README.md' || file === 'CHANGELOG.md' || file === 'google-apps-script/LEEME.md' || file.startsWith('docs/');
const gitFiles = args => execFileSync('git', args, { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const fail = message => { process.stderr.write(`Control de documentación: ${message}\n`); process.exitCode = 1; };

function check(files, label) {
  if (!files.length || files.every(isDocumentation)) return true;
  if (files.some(isDocumentation)) return true;
  fail(`${label} cambia código o configuración sin actualizar README, CHANGELOG, docs/ o google-apps-script/LEEME.md.`);
  return false;
}

const args = process.argv.slice(2);
if (args[0] === '--files') {
  check((args[1] || '').split(',').filter(Boolean), 'El cambio');
} else if (args[0] === '--staged') {
  check(gitFiles(['diff', '--cached', '--name-only']), 'El commit');
} else if (args[0] === '--range') {
  const [base, head] = args.slice(1);
  if (!base || !head) fail('usa --range <base> <head>.');
  else {
    const commits = /^0+$/.test(base) ? [head] : gitFiles(['rev-list', '--reverse', `${base}..${head}`]);
    for (const commit of commits) check(gitFiles(['diff-tree', '--no-commit-id', '--name-only', '-r', commit]), `El commit ${commit.slice(0, 7)}`);
  }
} else {
  fail('usa --staged, --range <base> <head> o --files <lista>.');
}
