// PostToolUse: після Edit/Write/MultiEdit збирає те, що змінилось ("build"),
// і запускає перевірку ("check"). Помилка → код 2 і звіт у stderr: Claude мусить полагодити.
import { spawnSync } from 'node:child_process';
import { loadConfig, projectRoot, readInput, relPath } from './lib.mjs';

const data = await readInput();
const root = projectRoot();
const cfg = data && loadConfig(root);
if (!cfg) process.exit(0);

const rel = relPath(root, data.tool_input?.file_path || data.tool_input?.notebook_path);
if (!rel) process.exit(0);

const sh = (cmd) => spawnSync(cmd, { cwd: root, encoding: 'utf8', shell: true });
const tail = (r, n = 8) => `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n').slice(-n).join('\n');
const fail = (msg) => { process.stderr.write(`${msg}\n\nПолагодь це, перш ніж іти далі.\n`); process.exit(2); };

// Збірка: перше правило, що підходить
const rule = cfg.build.find((r) => new RegExp(r.match).test(rel));
if (rule) {
  const r = sh(rule.run);
  if (r.status !== 0) fail(`Після правки ${rel} не зібралось (${rule.run}):\n${tail(r)}`);
}

// Перевірка
const check = cfg.check;
if (!check || !check.match.some((m) => new RegExp(m).test(rel))) process.exit(0);
const r = sh(check.run);
if (r.status === 0) process.exit(0);
const problems = `${r.stdout || ''}`.split('\n').filter((l) => l.trim().startsWith('❌'));
fail(`Після правки ${rel} перевірка (${check.run}) знайшла проблеми:\n${problems.length ? problems.join('\n') : tail(r)}`);
