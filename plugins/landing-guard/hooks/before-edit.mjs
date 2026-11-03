// PreToolUse: спрацьовує ДО Edit/Write/MultiEdit і може правку заборонити.
//  • файли з "generated" — заборона з підказкою, що правити замість;
//  • .claude/landing-guard.json — заборона: список номерів і правила змінює лише людина;
//  • сторінки з "pages" — заборона, якщо з'являється номер не зі списку "phones"
//    або справжній номер повністю зникає.
// Чому не «ask»: в авторежимі «спитати» може вирішити автоперевірка, а не людина.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONFIG_FILE, loadConfig, phoneKey, projectRoot, readInput, relPath, respond } from './lib.mjs';

const data = await readInput();
const root = projectRoot();
const cfg = data && loadConfig(root);
if (!cfg) process.exit(0);

const input = data.tool_input || {};
const rel = relPath(root, input.file_path);
if (!rel) process.exit(0);
const deny = (reason) => respond({
  hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
});

if (cfg.generated[rel]) {
  deny(`${rel} генерується збіркою — ручна правка зникне при наступній збірці. Редагуй ${cfg.generated[rel]}; після правки хук сам збере ${rel}.`);
}
if (rel === CONFIG_FILE) {
  deny(`${CONFIG_FILE} — правила landing-guard і список справжніх телефонів; їх змінює лише людина вручну (хуки обмежують тільки Claude). Поясни користувачу, що змінити.`);
}
if (!cfg.pages.includes(rel) || !cfg.phones.length) process.exit(0);

// «Приміряємо» правку; переноси зводимо до \n (Edit не розрізняє \r\n і \n)
const lf = (s) => String(s ?? '').replace(/\r\n/g, '\n');
const file = resolve(root, rel);
const before = existsSync(file) ? lf(readFileSync(file, 'utf8')) : '';
const apply = (text, o, n, all) => {
  o = lf(o); n = lf(n);
  if (!o) return text;
  return all ? text.split(o).join(n) : text.replace(o, () => n);
};
let after = before;
if (data.tool_name === 'Write') after = lf(input.content);
else if (Array.isArray(input.edits)) for (const e of input.edits) after = apply(after, e.old_string, e.new_string, e.replace_all);
else after = apply(after, input.old_string, input.new_string, input.replace_all);

// Усі номери на сторінці: tel:-посилання і видимий текст за шаблоном phoneText
const re = new RegExp(`tel:(\\+?\\d+)|\\b(${cfg.phoneText})\\b`, 'g');
const count = (text) => {
  const c = {};
  for (const m of text.matchAll(re)) { const k = phoneKey(m[1] || m[2]); c[k] = (c[k] || 0) + 1; }
  return c;
};
const a = count(before);
const b = count(after);
const known = new Set(cfg.phones.map((p) => phoneKey(p.tel)));
const label = (k) => cfg.phones.find((p) => phoneKey(p.tel) === k)?.name || `…${k}`;
const unknown = Object.keys(b).filter((k) => !known.has(k) && b[k] > (a[k] || 0));
const vanished = Object.keys(a).filter((k) => known.has(k) && !b[k]);

if (unknown.length || vanished.length) {
  deny('Правку зупинено: вона змінює телефони на сайті.' +
    (unknown.length ? ` Нові номери не зі списку: ${unknown.map(label).join(', ')}.` : '') +
    (vanished.length ? ` Повністю зникає номер: ${vanished.map(label).join(', ')}.` : '') +
    ` Якщо номер справді змінився — попроси користувача спершу вручну оновити "phones" у ${CONFIG_FILE}.`);
}
