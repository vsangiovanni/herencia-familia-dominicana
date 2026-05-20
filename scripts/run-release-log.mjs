import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logPath = join(root, 'release-output.txt');

try {
  const out = execSync('bash scripts/run-release.sh', {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 600_000,
    maxBuffer: 20 * 1024 * 1024,
  });
  writeFileSync(logPath, out, 'utf8');
  process.stdout.write(out);
} catch (error) {
  const text = `${error.stdout ?? ''}\n${error.stderr ?? ''}\n${error.message ?? error}`;
  writeFileSync(logPath, text, 'utf8');
  process.stderr.write(text);
  process.exit(error.status ?? 1);
}
