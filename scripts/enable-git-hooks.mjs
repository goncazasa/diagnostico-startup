import { execFileSync } from 'node:child_process';

execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
process.stdout.write('Hooks de documentación activados para este clon.\n');
