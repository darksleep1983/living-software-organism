# Начало работы

Living Software Organism (LSO) хранит непрерывность у самого проекта и даёт read-only свидетельства здоровья и восстановления, которые переживают смену AI-агента.

Текущий публичный release candidate: `0.1.0-rc.4`. Требуются Node.js 26+ и npm.

## Подключение через npm за пять минут

В проекте, который хотите подключить:

```sh
npm install living-software-organism@0.1.0-rc.4
npx lso init --dry-run
npx lso init --yes
npx lso doctor
```

Начинайте с `--dry-run`: он показывает точный список создаваемых файлов. `--yes` подтверждает только этот детерминированный план.

`init` не устанавливает зависимости вашего приложения, не запускает project scripts, не меняет исходники, не создаёт Git-коммит, не делает push/publication и не перезаписывает существующие совместимые canonical-файлы.

CLI не требует Python. Optional Python Runtime Project Corpus остаётся отдельным компонентом.

## Что добавляется в проект

Если Project Corpus V2 ещё нет, `init` создаёт минимальную основу непрерывности:

```text
AGENTS.md
.project-corpus/state/PROJECT.md
.project-corpus/state/STATUS.md
.project-corpus/policy.toml
.project-corpus/tasks/
.project-corpus/reports/
.project-corpus/history/
lso.config.json
```

Три основных человекочитаемых файла: `AGENTS.md`, `PROJECT.md`, `STATUS.md`.

Policy и config безопасно связывают инструменты с проектом. Пустые Tasks/Reports/history - это места для непрерывности, а не обязанность производить бюрократию.

## Повседневная работа

Для обычных мелких изменений:

1. Поддерживайте актуальными `AGENTS.md`, `PROJECT.md` и `STATUS.md`.
2. Перед работой агент читает эти файлы.
3. Task/Report нужен только когда этого требует локальный протокол или работа существенная, делегированная, рискованная, продолжается между сессиями либо требует долговечных доказательств.
4. Для свежей проверки запускайте `npx lso doctor` или `npx lso status`.

LSO не требует Task/Report для каждой мелкой правки.

## Основные команды

### Повседневные

- `lso doctor [path] [--json]` проверяет идентичность, непрерывность, здоровье и готовность восстановления. Ничего не записывает.
- `lso status [path] [--json]` показывает короткий read-only снимок.
- `lso context [path] --json` даёт агенту ограниченные указатели и evidence. Настоящие authority-файлы всё равно читаются напрямую.
- `lso findings [path] [--json]` показывает текущие findings, только предложения.

### Свидетельства восстановления

- `lso recover plan [path] [--json]` показывает проверенные локальные inputs, пропуски и недоказанные предпосылки, ничего не исполняя.
- `lso recover deps [path] [--json]` показывает объявленные зависимости восстановления.
- `lso recover rehearse [path] [--json]` выполняет изолированную репетицию и сохраняет `restore_authorized: false`.
- `lso origin verify [path] --remote <https-or-ssh-git-url> --commit <40-hex> --file <tracked-path>` выполняет явный ограниченный Git fetch во временное хранилище и проверяет точные объявленные байты исходников.

Успешный origin check доказывает reacquisition только для объявленных файлов данного URL/commit на момент проверки. Он не доказывает секреты, toolchain, сервисы, данные, deployment или полную реконструкцию приложения.

## Сначала обычные термины

LSO можно использовать, вообще не изучая биологический словарь.

- Идентичность проекта: что это за проект и какие правила действуют.
- Текущее состояние: что верно сейчас и какая работа активна.
- Здоровье: согласуются ли эти утверждения со свежими evidence.
- Свидетельства восстановления: что реально проверено об объявленной основе проекта.

Продвинутые термины Homeostasis, Immune Memory, Metabolism, Autophagy и Rebirth Capsule описаны в [архитектуре](architecture.md). Стабильные JSON/API имена не меняются.

## Существующий Project Corpus

Если проект уже использует совместимый Project Corpus V2, `lso init` добавляет только недостающую конфигурацию LSO. Частичное или несовместимое состояние отвергается без перезаписи.

Если вам нужен только долговечный handoff идентичности и текущего состояния, Project Corpus можно использовать отдельно. LSO необязателен.

## Работа из исходного репозитория

В репозитории LSO:

```sh
npm pack ./components/organism --pack-destination .
```

Затем установите tarball в целевой проект:

```sh
cd /абсолютный/путь/к/вашему-проекту
npm install --no-save /абсолютный/путь/к/living-software-organism-0.1.0-rc.4.tgz
npx lso init --dry-run
```

## Проверки репозитория

```sh
npm test
npm run check
npm run demo
npm run pack:organism
```

## Версии и границы безопасности

Версия пакета: `0.1.0-rc.4`. Принятая архитектура LSO остаётся v0.1-v0.7. Экспериментальные Organ Systems остаются без версии. Project Corpus сохраняет Protocol 2.0 и optional Runtime 2.2.0.

LSO не чинит автономно, не запускает произвольный shell, не опрашивает в фоне, не удаляет файлы проекта, не выполняет live restore, не переключает провайдеров, не списывает деньги и не публикует. `doctor` не делает сетевой fetch.

См. [CLI и работу агентов](productization.ru.md), [архитектуру](architecture.md), [API](../components/organism/docs/api.md) и [безопасность](../components/organism/docs/safety.md).
