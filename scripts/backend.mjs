// Lance le backend avec le wrapper Maven adapte a l'OS (mvnw.cmd sous Windows, mvnw ailleurs).
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../backend/', import.meta.url));
const wrapper = process.platform === 'win32' ? 'mvnw.cmd' : './mvnw';

const child = spawn(wrapper, ['spring-boot:run'], { cwd, stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code ?? 0));
