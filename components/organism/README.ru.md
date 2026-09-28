# Living Software Organism

Living Software Organism (LSO) - prerelease Node.js package для project-owned continuity, проверки здоровья и ограниченных evidence восстановления между AI-assisted сессиями разработки.

## Начните отсюда

Требуется Node.js 26+.

```sh
npm install living-software-organism@0.1.0-rc.4
npx lso init --dry-run
npx lso init --yes
npx lso doctor
```

Пакет публично доступен как `living-software-organism@0.1.0-rc.4`.

Для повседневного использования достаточно четырёх идей:

- **Идентичность проекта**: что это за проект и какие правила действуют.
- **Текущее состояние**: что верно сейчас и какая работа активна.
- **Здоровье**: согласуются ли project-owned утверждения со свежими evidence.
- **Свидетельства восстановления**: что реально проверено об объявленной основе проекта.

LSO не становится владельцем этих фактов. Authority остаётся у самого проекта.

## Минимальная непрерывность

С bundled adapter Project Corpus V2 основные человекочитаемые файлы:

```text
AGENTS.md
.project-corpus/state/PROJECT.md
.project-corpus/state/STATUS.md
```

Небольшой policy-файл и `lso.config.json` связывают инструменты.

Tasks/Reports доступны для долговечной фиксации работы. Сам LSO не требует их для каждой мелкой правки; используйте их, когда требует локальный протокол или работа существенная, делегированная, рискованная, продолжается между сессиями либо нуждается в долговечных evidence.

## CLI

Первые полезные команды:

```sh
npx lso doctor
npx lso status
npx lso context --json
npx lso recover plan
npx lso recover rehearse
```

CLI по умолчанию read-only. `init` создаёт только заранее показанные bootstrap paths после подтверждения. Recovery rehearsal записывает изолированные evidence в настроенный runtime и никогда не разрешает live restore.

## Программный API

Стабильные публичные namespaces сохраняются:

- `homeostasis`
- `repair`
- `capabilities`
- `immune`
- `metabolism`
- `history`
- `recovery`
- `experimental`

Это архитектурный словарь, а не обязательные знания для onboarding.

| Namespace / термин | Обычный смысл |
|---|---|
| `homeostasis` | Здоровье проекта |
| `repair` | Контролируемое намерение ремонта и проверка |
| `capabilities` | Явная допустимость и привязка возможности |
| `immune` | Проверенные переиспользуемые уроки |
| `metabolism` | Бюджеты ресурсов и наблюдения |
| `history` | История изменений здоровья |
| `recovery` | Готовность восстановления и изолированная репетиция |
| hygiene/autophagy | Планирование очистки |
| capsule | Ограниченные evidence реконструкции |
| trace | Причинная трассировка evidence |
| phenotype | Сравнение объявленных свойств |

Точные сигнатуры описаны в [API guide](docs/api.md).

## Архитектура и зрелость

Устойчивой системой является сам программный проект. Модели, провайдеры и исполнители заменяемы.

Принятая архитектура остаётся v0.1-v0.7. Experimental Organ Systems остаются без версии и включают declarations зависимостей восстановления, evidence реконструкции, readiness, tracing, hygiene, supervision и сравнение воспроизводимых свойств.

Это всё ещё prerelease-продукт. Локальные проверки не доказывают широкую совместимость, восстановление всего приложения, реконструкцию на новой машине или побитовую воспроизводимость.

## Связь с Project Corpus

Project Corpus - optional независимо используемый Markdown-first слой идентичности и непрерывности. LSO читает его через небольшой reference adapter. Другой явный adapter может предоставить эквивалентные нормализованные evidence проекта.

Core не требует базы данных, AI provider или optional Python Runtime Project Corpus.

## Разработка

```sh
npm test
npm run smoke
npm run check
```

Generated evidence хранится внутри project-local runtime, по умолчанию `.lso-runtime`.

## Чего LSO не делает

LSO не чинит автономно и не dispatch'ит работу. Он не запускает произвольные shell-команды, не опрашивает в фоне, не работает демоном, не удаляет файлы проекта, не делает backup/live restore, не перезаписывает canonical-файлы, не переключает провайдеров, не покупает сервисы и не публикует наружу.

Recovery readiness - evidence, а не разрешение.

Подробнее: [архитектура](docs/architecture.md), [безопасность](docs/safety.md), [интеграция Project Corpus](docs/project-corpus.md), [восстановление](docs/recovery.md), [экспериментальные системы](docs/experimental.md) и [API](docs/api.md).

LSO лицензирован по MIT License. См. [LICENSE](LICENSE).
