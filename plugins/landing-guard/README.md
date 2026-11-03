# landing-guard

Плагін Claude Code — «охоронець» статичного сайту. Виріс із навчального проєкту PRO CEILING.

| Що | Подія | Що робить |
|---|---|---|
| `before-edit.mjs` | PreToolUse | забороняє Claude правити згенеровані файли, файл налаштувань і ставити на сторінку номер не зі списку (або прибирати справжній) |
| `after-edit.mjs` | PostToolUse | після правки збирає змінене і запускає перевірку; ❌ → Claude мусить полагодити |
| `session-start.mjs` | SessionStart | на старті сесії: прогрес плану, незакомічене, останні коміти |
| `check-prompt.mjs` | UserPromptSubmit | попереджає, якщо в повідомленні номер не зі списку |
| skill `debugging` | — | порядок дебагу без вгадування |
| skill `setup` | — | допомагає скласти файл налаштувань для нового проєкту |

## Встановлення

```bash
claude plugin marketplace add C:\Users\User\claude-plugins
claude plugin install landing-guard@sonia-plugins --scope project
```

Потім створи в проєкті `.claude/landing-guard.json` (або попроси Claude: «налаштуй landing-guard» — skill `setup` запропонує вміст). **Без цього файлу плагін нічого не робить** — тож його безпечно ставити будь-куди.

Приклад налаштувань — у `skills/setup/SKILL.md`.

## Обмеження

- Хуки стоять на Edit/Write/MultiEdit. Зміни через Bash (`sed` тощо) PreToolUse не бачить — правило «не обходь відмову через Bash» варто записати в CLAUDE.md проєкту.
- Пошук номерів у повідомленнях налаштований на українські номери.
