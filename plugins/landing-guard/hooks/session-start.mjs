// SessionStart: на початку сесії дає Claude контекст «де ми зупинились» —
// прогрес із файлу плану ("plan", розділ «## Прогрес»), незакомічене, останні коміти.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig, projectRoot, respond } from './lib.mjs';

const root = projectRoot();
const cfg = loadConfig(root);
if (!cfg) process.exit(0);

const sh = (cmd) => { try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };
const lines = ['[landing-guard — де ми зупинились]'];

const planFile = resolve(root, cfg.plan);
if (existsSync(planFile)) {
  const progress = readFileSync(planFile, 'utf8').split(/^##\s*Прогрес/m)[1] || '';
  const done = (progress.match(/^- \[x\]/gm) || []).length;
  const open = [...progress.matchAll(/^- \[ \] (.+)$/gm)].map((m) => m[1].split(' — ')[0].trim());
  lines.push(`${cfg.plan}: виконано пунктів ${done}; відкриті — ${open.length ? open.join('; ') : 'немає 🎉'}.`);
}
const status = sh('git status --short');
lines.push(status ? `Незакомічені зміни (не загуби їх і спитай перед комітом):\n${status}` : 'Робоча папка чиста — усе закомічено.');
const log = sh('git log --oneline -5');
if (log) lines.push(`Останні коміти:\n${log}`);

respond({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: lines.join('\n') } });
