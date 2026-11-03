# sonia-plugins

Мій маркетплейс плагінів для [Claude Code](https://claude.com/claude-code).

| Плагін | Що робить |
|---|---|
| [landing-guard](plugins/landing-guard/) | «Охоронець» статичного сайту: захищає телефони й згенеровані файли, збирає й перевіряє сайт після кожної правки, нагадує «де ми зупинились» на старті сесії, дає порядок дебагу. |

## Як встановити

```bash
claude plugin marketplace add cheeS0805/claude-plugins
claude plugin install landing-guard@sonia-plugins
```

Плагін нічого не робить, доки в проєкті немає файлу `.claude/landing-guard.json` — тож його безпечно ставити будь-куди. Скласти цей файл допоможе skill плагіна: напиши Claude «налаштуй landing-guard».

## Звідки

Виріс із навчального проєкту PRO CEILING — лендингу натяжних стель, на якому я відпрацьовувала курси Anthropic Academy: CLAUDE.md, skills, хуки, субагенти, MCP і плагіни.
