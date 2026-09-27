# Living Software Organism

[English](README.md)

**Сохраняйте идентичность, текущее состояние и свидетельства восстановления проекта рядом с самим проектом, а не в одном чате с ИИ.** LSO нужен разработчикам, передающим работу между Codex, Claude, Gemini, OpenHands и другими заменяемыми агентами.

## Попробуйте локальный release candidate за пять минут

Нужны Node.js 26+ и npm. Исправленный release candidate: `0.1.0-rc.2`. Установите его в свой проект: `npm install living-software-organism@0.1.0-rc.2`, затем используйте `npx lso`. Ниже также описана установка tarball из исходников.

Из корня этого репозитория соберите пакет и установите его в проект, который подключаете (в Windows укажите абсолютный путь к архиву):

```sh
npm pack ./components/organism --pack-destination .
cd /путь/к/вашему-проекту
npm install --no-save /абсолютный/путь/к/living-software-organism-0.1.0-rc.2.tgz
npx lso init --dry-run
npx lso init --yes
npx lso doctor
npx lso status
npx lso context --json
npx lso recover plan
npx lso recover rehearse
```

`init --dry-run` показывает точный ограниченный план. `--yes` подтверждает только этот детерминированный план. `init` создаёт bootstrap-файлы Project Corpus V2 и `lso.config.json`; он не устанавливает зависимости и не создаёт Git-коммит. Изменения проверяйте и коммитьте самостоятельно.

В репозитории LSO запускайте демонстрацию командой `npm run demo`; проверки — `npm test`, `npm run check`, smoke установки локального tarball — `npm run pack:organism`.

## Что такое LSO

Устойчивый организм — сам программный проект. Модели, провайдеры и исполнители — заменяемые временные органы. Project Corpus остаётся независимо используемым слоем идентичности, непрерывности и полномочий проекта. Organism layer через явный adapter выводит ограниченные свидетельства здоровья и восстановления, но не становится второй authority.

Принятая архитектура: v0.1–v0.7. Экспериментальные Organ Systems остаются без версии — это не v0.8. Версия npm-пакета (`0.1.0-rc.2`) описывает жизненный цикл пакета, а не архитектурную версию. Project Corpus сохраняет Protocol 2.0 и optional Python Runtime 2.2.0.

## Чего LSO автоматически не делает

Нет автономного ремонта, shell runner, фонового сервиса, опроса, неявной сети, удаления, live restore/overwrite, переключения провайдера, биллинга или публикации. `doctor`, readiness, recovery plans и receipts — только свидетельства. Только явная команда `lso origin verify` обращается к объявленному Git origin. Даже успешная проверка исходного кода не доказывает полное восстановление приложения и не даёт права на restore.

## Компоненты и документация

- [Начало работы (RU)](docs/getting-started.ru.md) · [Getting started (EN)](docs/getting-started.md)
- [CLI, конфигурация, recovery и агенты](docs/productization.ru.md)
- [Unified architecture](docs/architecture.md)
- [Organism API](components/organism/docs/api.md)
- [Safety](components/organism/docs/safety.md) · [Recovery](components/organism/docs/recovery.md)
- [Компонент Project Corpus](components/project-corpus/README.ru.md)

Project Corpus по-прежнему можно использовать отдельно; LSO необязателен. Прежний отдельный репозиторий Project Corpus остаётся архивным и этим проектом не изменяется.

## Зрелость и лицензия

Это локальный pre-release-кандидат, а не обещание production-совместимости или полного восстановления. У organism package нет сторонних runtime-зависимостей. Project Corpus сохраняет идентичность и лицензию компонента; см. [LICENSING.md](LICENSING.md).

Образ живого корабля из LEXX был только концептуальной искрой. LSO — оригинальная программная архитектура; связи, адаптации или копирования художественной интеллектуальной собственности не подразумевается.
