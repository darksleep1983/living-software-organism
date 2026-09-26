# Living Software Organism

[English](README.md)

**Непрерывность, здоровье и восстановление программного проекта, которыми владеет сам проект, а не конкретный ИИ.**

Living Software Organism (LSO) - публичная pre-release архитектура и reference implementation для проектов, которые должны жить дольше отдельного сеанса ИИ, модели, провайдера или исполнителя.

Если ты по очереди используешь Codex, Claude, Gemini, OpenHands, локальных или облачных агентов, проект не должен зависеть от того, какой агент сейчас помнит больше контекста. LSO хранит долговременную правду в состоянии, принадлежащем самому проекту, а health/recovery evidence выводит из проверяемых файлов и контрактов.

Главный принцип:

> **Устойчивый организм - сам программный проект. Модели ИИ, провайдеры и исполнители - заменяемые временные органы.**

## Какую проблему это решает

ИИ-агенты хорошо решают локальные задачи, но чат - плохое место для хранения идентичности и authority проекта.

Долгоживущему AI-assisted проекту нужно уметь ответить:

- Что это за проект и что сейчас является authority?
- Какие заявления агента подтверждены прямыми evidence?
- Текущее состояние healthy, degraded, stale или противоречивое?
- Какой repair предлагается и кто имеет право его разрешить?
- Можно ли восстановить проект из известного source и continuity evidence?
- Может ли один агент передать работу другому, не превращая старый summary в истину?

LSO делает эти вопросы собственностью проекта, а не памятью конкретной модели.

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

Бывший standalone-репозиторий [project-corpus](https://github.com/darksleep1983/project-corpus) теперь архивирован как исторический/reference источник и перенаправляет активную разработку сюда.

### Living Software Organism

[components/organism/](components/organism/)

Dependency-free CommonJS Node.js reference implementation ограниченных organism contracts.

Принятая архитектурная линия:

- v0.1 Homeostasis
- v0.2 Supervised Repair Contracts
- v0.3 Supervised Capability Repair
- v0.4 Verified Evolution / Immune Memory
- v0.5 Metabolism / Resource Homeostasis
- v0.6 Longitudinal Homeostasis / Health History
- v0.7 Resilience / Recovery Readiness

Новые Organ Systems остаются **экспериментальными и без версии**: Recovery Dependency Contract, Rebirth Capsule, Organ Readiness, Nervous System Tracing, Clean Organism / Autophagy, Supervision Tree и Reproducible Phenotype.

Объединение в monorepo не делает их v0.8.

## Быстрый запуск

Исходный GitHub-репозиторий публичный. Единый npm/PyPI umbrella package пока не опубликован.

Из корня репозитория:

    node examples/full-stack/smoke.js
    node tools/check.js
    node tools/verify.js

Full-stack smoke создаёт временный проект Project Corpus V2, читает его через реальный LSO Project Corpus adapter, вычисляет health/recovery evidence, проверяет, что restore authority остаётся false, и удаляет временное состояние.

Подробности: [Getting Started](docs/getting-started.md).

## Чего система не делает

LSO не назначает себя authority проекта. Он не выполняет автономный repair, не диспетчеризует работу, не предоставляет generic shell, не удаляет файлы проекта, не восстанавливает живое состояние, не переключает провайдеров ИИ, не оплачивает сервисы и не публикует что-либо наружу.

Health и recovery status - evidence, а не разрешение действовать. Хеш доказывает только покрытые байты. Успешный fresh Git clone доказывает возможность получить репозиторий из конкретного remote в конкретный момент, но не гарантирует вечную доступность remote или полное восстановление всех внешних зависимостей любого проекта.

## Зрелость

Это **публичный pre-release unified monorepo**.

Project Corpus остаётся зрелым substrate-компонентом со своими существующими версиями Protocol/Runtime. Organism layer остаётся reference implementation с принятой архитектурой до v0.7 и experimental unversioned расширениями.

Публикация репозитория независимо проверена:

- GitHub CI для Project Corpus на Windows, Ubuntu и macOS;
- Node 26 проверки organism layer на Windows и Ubuntu;
- full-stack integration и strict docs checks;
- настоящий fresh clone из GitHub с проверкой committed bytes и истории.

Это evidence публикации самого репозитория, а не заявление о production adoption или полностью автоматическом fresh-machine recovery для любого подключённого проекта.

## Лицензии

Импортированный Project Corpus сохраняет существующую MIT-лицензию в [components/project-corpus/LICENSE](components/project-corpus/LICENSE).

Umbrella repository и organism layer лицензированы по MIT License. Импортированный Project Corpus также остаётся MIT-лицензированным со своим сохранённым компонентным LICENSE.

Подробнее: [LICENSE](LICENSE) и [LICENSING.md](LICENSING.md).

## Документация

- [Getting Started](docs/getting-started.md)
- [Архитектура](docs/architecture.md)
- [Происхождение импортов](docs/provenance.md)
- [Project Corpus](components/project-corpus/README.md)
- [Organism component](components/organism/README.md)
- [Safety boundaries](components/organism/docs/safety.md)
- [Recovery](components/organism/docs/recovery.md)

Образ живого корабля из LEXX был только концептуальной искрой и метафорой. Living Software Organism - оригинальная программная архитектура; это не означает связи с правообладателями, адаптации или копирования художественной интеллектуальной собственности.
