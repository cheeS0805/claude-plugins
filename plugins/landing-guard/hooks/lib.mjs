// Спільне для хуків landing-guard: корінь проєкту, налаштування, відповідь Claude Code.
import { existsSync, readFileSync, writeSync } from 'node:fs';
import { relative, resolve } from 'node:path';

export const CONFIG_FILE = '.claude/landing-guard.json';

/** Корінь проєкту, у якому працює Claude Code */
export const projectRoot = () => process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * Налаштування проєкту з .claude/landing-guard.json, або null, якщо файлу немає
 * (тоді плагін у цьому проєкті нічого не робить). Приклад — README плагіна.
 */
export function loadConfig(root = projectRoot()) {
  const file = resolve(root, CONFIG_FILE);
  if (!existsSync(file)) return null;
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  return {
    phones: [],              // [{ name, tel: "+380…", text: "063 389 06 18" }]
    phoneText: '0\\d{2} \\d{3} \\d{2} \\d{2}', // як номер виглядає в тексті сторінки
    pages: ['index.html'],   // де стерегти телефони
    generated: {},           // { "styles.css": "src/scss/" } — що генерується і що правити замість
    build: [],               // [{ match: "^src/scss/", run: "npm run build:css" }]
    check: null,             // { match: ["^index\\.html$", "^src/"], run: "npm run verify:quick" }
    plan: 'PLAN.md',         // файл плану з розділом «## Прогрес»
    ...cfg,
  };
}

/** Читає JSON, який Claude Code передає хуку на stdin */
export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try { return JSON.parse(raw || '{}'); } catch { return null; }
}

/** Шлях файлу відносно кореня проєкту зі «/», або null, якщо файл поза проєктом */
export function relPath(root, file) {
  if (!file) return null;
  const rel = relative(root, resolve(root, file)).replace(/\\/g, '/');
  return rel.startsWith('..') ? null : rel;
}

/** Відповідь хука. writeSync — бо на Windows process.exit() губить асинхронний stdout. */
export function respond(obj) {
  writeSync(1, JSON.stringify(obj));
  process.exit(0);
}

/** Останні 9 цифр номера — щоб «063 389 06 18» і «+380633890618» вважались одним номером */
export const phoneKey = (s) => String(s).replace(/\D/g, '').slice(-9);
