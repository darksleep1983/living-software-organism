# Living Software Organism

[English](README.md)

**Собственная идентичность, память, здоровье, восстановление и проверяемое развитие программного проекта в эпоху ИИ.**

Living Software Organism (LSO) - предварительная архитектура и reference implementation для проектов, которые должны жить дольше отдельного сеанса ИИ, модели, провайдера или исполнителя.

Главный принцип:

> **Устойчивый организм - сам программный проект. Модели ИИ, провайдеры и исполнители - заменяемые временные органы.**

Теперь это один полный репозиторий:

    Living Software Organism
    ├── Project Corpus
    │   идентичность · непрерывность · authority · Tasks · Reports · context
    │
    └── Organism layer
        здоровье · controlled repair · immune memory · metabolism
        history · recovery · readiness · tracing · hygiene
        supervision · phenotype

## Зачем два слоя

Сначала проекту нужно знать, кто он, что является authority, что сейчас актуально и что происходило. Это Project Corpus.

После этого можно спрашивать, здоров ли проект, что деградировало, можно ли восстановиться, какие evidence свежие и что должно пережить смену ИИ. Это organism layer.

Они интегрированы, но не смешаны в одну власть:

- **Project Corpus можно использовать самостоятельно.**
- **Organism layer может работать через другой явный adapter.**
- **Project Corpus + LSO - рекомендуемый полный стек.**

## Компоненты

### Project Corpus

[components/project-corpus/](components/project-corpus/)

Vendor-neutral Markdown-first протокол долговременной идентичности, непрерывности и authority проекта с опциональным Python Runtime.

Сохранена существующая идентичность:

- Project Corpus Protocol 2.0
- optional Python Runtime 2.2.0
- Python package/import остаются project-corpus / project_corpus
- компонент можно использовать отдельно
- его существующая MIT-лицензия остаётся лицензией именно этого компонента

### Living Software Organism

[components/organism/](components/organism/)

Node.js reference implementation ограниченных organism contracts.

Принятая архитектурная линия: v0.1-v0.7. Новые Organ Systems остаются **экспериментальными и без версии**: Recovery Dependency Contract, Rebirth Capsule, Organ Readiness, Nervous System Tracing, Clean Organism / Autophagy, Supervision Tree и Reproducible Phenotype.

Объединение в monorepo не делает их v0.8.

## Быстрый запуск

Из корня репозитория:

    node examples/full-stack/smoke.js
    node tools/check.js
    node tools/verify.js

Full-stack smoke создаёт временный проект Project Corpus V2, читает его через реальный LSO Project Corpus adapter, вычисляет health/recovery evidence, проверяет, что restore authority остаётся false, и удаляет временное состояние.

Подробности: [Getting Started](docs/getting-started.md).

## Чего система не делает

LSO не назначает себя authority проекта. Он не выполняет автономный repair, не диспетчеризует работу, не предоставляет generic shell, не удаляет файлы проекта, не восстанавливает живое состояние, не переключает провайдеров ИИ, не оплачивает сервисы и не публикует что-либо наружу.

Health и recovery status - evidence, а не разрешение действовать. Хеш доказывает только покрытые байты, а clean clone на одной машине не доказывает fresh-machine, cross-OS или bitwise recovery.

## Зрелость

Это **pre-release unified monorepo**.

Project Corpus остаётся зрелым substrate-компонентом со своими существующими версиями Protocol/Runtime. Organism layer остаётся reference implementation с принятой архитектурой до v0.7 и experimental unversioned расширениями.

Удалённый CI единого репозитория ещё не запускался.

## Лицензии

Импортированный Project Corpus сохраняет существующую MIT-лицензию в [components/project-corpus/LICENSE](components/project-corpus/LICENSE).

Для umbrella repository и organism layer отдельная публичная лицензия Owner пока не выбрана.

Подробнее: [LICENSING.md](LICENSING.md).

## Документация

- [Getting Started](docs/getting-started.md)
- [Архитектура](docs/architecture.md)
- [Происхождение импортов](docs/provenance.md)
- [Project Corpus](components/project-corpus/README.md)
- [Organism component](components/organism/README.md)
- [Safety boundaries](components/organism/docs/safety.md)
- [Recovery](components/organism/docs/recovery.md)

Образ живого корабля из LEXX был только концептуальной искрой и метафорой. Living Software Organism - оригинальная программная архитектура; это не означает связи с правообладателями, адаптации или копирования художественной интеллектуальной собственности.
