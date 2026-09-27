# Начало работы

Living Software Organism (LSO) добавляет ограниченные свидетельства здоровья и восстановления поверх непрерывности, принадлежащей проекту. Это локальный npm release candidate `0.1.0-rc.1`, пакет не опубликован. Требуются Node.js 26+ и npm.

## Подключение за пять минут из исходного репозитория

В корне репозитория LSO соберите tarball:

```sh
npm pack ./components/organism --pack-destination .
```

Перейдите в существующий проект и установите архив по абсолютному пути (не выполняйте init из монорепозитория LSO, если не хотите подключить сам монорепозиторий):

```sh
cd /путь/к/вашему-проекту
npm install --no-save /путь/к/living-software-organism-0.1.0-rc.1.tgz
npx lso init --dry-run
npx lso init --yes
npx lso doctor
npx lso status
npx lso context --json
npx lso recover plan
npx lso recover rehearse
```

Сначала изучите точный план `init`. Интерактивный режим спрашивает подтверждение; `--yes` подтверждает лишь перечисленные детерминированные пути. `--dry-run` и `--json` не применяют записи. Init отвергает частичное/несовместимое состояние Corpus и не перезаписывает canonical-файлы. Он не устанавливает зависимости, не коммитит, не отправляет изменения и не меняет исходники.

CLI не требует Python. Optional Python Runtime Project Corpus не является зависимостью CLI.

## Команды и доказательства

- `lso doctor [path] [--json]` читает свидетельства adapter/core, формирует рекомендации и возвращает 0 при стабильном состоянии, 1 при деградации, 2 при ошибке использования, 3 при внутренней ошибке. Только чтение.
- `lso status [path] [--json]` — компактный снимок.
- `lso context [path] --json` — ограниченный envelope handoff, не замена обязательным чтениям проекта.
- `lso findings [path] [--json]` — findings, предложения ремонта без исполнения.
- `lso recover plan [path] [--json]` — известные локальные inputs, пропуски и недоказанные предпосылки; ничего не запускает.
- `lso recover deps [path] [--json]` — объявленные зависимости. В `lso.config.json` допустимы только описательные, несекретные значения; произвольных команд нет.
- `lso recover rehearse [path] [--json]` — изолированная репетиция с `restore_authorized: false`.
- `lso origin verify [path] --remote <https-or-ssh-git-url> --commit <40-hex> --file <tracked-path>` — явный ограниченный Git fetch во временный каталог. Требует чистого локального worktree/index и точного локального HEAD. Сверяет объявленные файлы побайтно с blobs коммита и связывает digest всего отслеживаемого дерева. Receipt — свидетельство, не authority. Ошибки сети/тайм-ауты, неполное покрытие и изменённые/незакоммиченные файлы остаются непроверенными. `file://` работает только для локальных тестовых bare-Git fixtures и возвращает `LOCAL_GIT_FIXTURE_VERIFIED`, не durable reacquisition.

Успешная проверка доказывает лишь, что объявленные исходные файлы удалось получить из данного URL/коммита во время проверки. Экспериментальный Capsule contract не использует CLI receipt для заявления полного `RECONSTRUCTIBLE`; более широкое восстановление остаётся `PARTIAL / REACQUISITION_VERIFIED_FOR_SOURCE` либо `UNPROVEN`. Restore и repair не разрешены.

## Проверки и demo разработчика

В корне репозитория:

```sh
npm test
npm run check
npm run demo
npm run pack:organism
```

Demo создаёт обычный временный проект, инициализирует его, показывает реальную деградацию при отсутствии continuity, ручное восстановление, recovery plan и изолированную репетицию, затем удаляет свой временный проект. Pack smoke собирает и устанавливает tarball офлайн в чистого временного потребителя и запускает установленный CLI вне репозитория.

## Только Project Corpus / миграция

Если нужны только identity, authority, Tasks, Reports и handoff, используйте `components/project-corpus` напрямую; LSO необязателен. Для существующего проекта с Corpus V2 `lso init` добавляет только конфигурацию LSO при совпадении canonical identity, протокола и policy. Для проекта без Corpus V2 предлагается встроенный минимальный V2-шаблон с явным подтверждением. Частичное или несовместимое состояние отвергается; разрешайте его по authority проекта, не поручайте LSO перезаписывать его.

## Границы версий и ограничения

Версия пакета не равна версии архитектуры: пакет `0.1.0-rc.1`, принятая архитектура LSO v0.1–v0.7, экспериментальные органы без версии, Project Corpus Protocol 2.0 и optional Runtime 2.2.0. Публикации npm в рамках этой работы нет.

LSO не доказывает неописанные build inputs, секреты, сервисы времени выполнения, внешние данные или среду deployment. Он не запускает build/test проекта. Проверка reacquisition явная; `doctor` не выполняет fetch. Подробнее: [руководство CLI](productization.ru.md), [архитектура](architecture.md), [API](../components/organism/docs/api.md), [безопасность](../components/organism/docs/safety.md).
