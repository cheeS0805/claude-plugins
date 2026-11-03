// UserPromptSubmit: коли користувач відправляє повідомлення (ще до Claude).
// Якщо в ньому номер телефону, якого немає в "phones", — попереджає (не блокує):
// користувача рядком в інтерфейсі, Claude — підказкою в контексті.
import { CONFIG_FILE, loadConfig, phoneKey, projectRoot, readInput, respond } from './lib.mjs';

const data = await readInput();
const cfg = data && loadConfig(projectRoot());
if (!cfg || !cfg.phones.length) process.exit(0);

// Українські номери: 063 389 06 18, 0633890618, +380 63 389-06-18, +380633890618
const found = [...String(data.prompt || '').matchAll(/(?:\+?38)?[\s(-]*0\d{2}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}\b/g)]
  .map((m) => m[0].trim());
const known = new Set(cfg.phones.map((p) => phoneKey(p.tel)));
const unknown = [...new Map(found.filter((n) => !known.has(phoneKey(n))).map((n) => [phoneKey(n), n])).values()];
if (!unknown.length) process.exit(0);

respond({
  systemMessage: `⚠️ У повідомленні номер, якого немає в ${CONFIG_FILE}: ${unknown.join(', ')}. Якщо це новий справжній номер — спершу онови "phones" вручну.`,
  hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit',
    additionalContext: `landing-guard: у повідомленні номер(и) ${unknown.join(', ')}, яких немає в "phones" (${CONFIG_FILE}). Не став їх на сайт (PreToolUse однаково заборонить). Уточни, чий це номер; якщо справжній — попроси користувача вручну оновити ${CONFIG_FILE}.`,
  },
});
