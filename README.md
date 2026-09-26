# case2

REST API на Express для учёта заявок на техническое обслуживание
оборудования производственной площадки (ветропарк).

Сервис ведёт справочник оборудования и заявки на его обслуживание,
контролирует жизненный цикл заявки (переходы статусов) и позволяет
оценить погодные условия на объекте перед планированием наружных работ
через внешний погодный API.

## Содержание

- [Требования](#требования)
- [Установка и запуск](#установка-и-запуск)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)
- [Архитектура](#архитектура)
- [Эндпоинты](#эндпоинты)
- [Параметры списочных эндпоинтов](#параметры-списочных-эндпоинтов)
- [Модель данных](#модель-данных)
- [Переходы статусов](#переходы-статусов)
- [Формат ответа и ошибок](#формат-ответа-и-ошибок)
- [Коды ответов](#коды-ответов)
- [Примеры запросов и ответов](#примеры-запросов-и-ответов)
- [Прогноз погоды](#прогноз-погоды)
- [Безопасность](#безопасность)
- [Логирование](#логирование)
- [Postman](#postman)

## Требования

- Node.js >= 18 (используется нативный `fetch` для внешнего API)
- npm

## Установка и запуск

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать пример окружения
cp .env.example .env

# 3. Запустить в режиме разработки (nodemon)
npm run dev

# 4. Или в production-режиме
npm start

# 5. Опционально: dev с pretty-логами
npm run dev:pretty
```

Сервер поднимается на `http://localhost:3000` (порт задаётся через `PORT`).

Быстрая проверка:

```bash
curl http://localhost:3000/api/health
```

## Переменные окружения

Все настройки задаются через переменные окружения, хардкода нет.
В репозитории лежит `.env.example`.

| Переменная | По умолчанию | Описание |
|---|---|---|
| `PORT` | `3000` | Порт HTTP-сервера |
| `NODE_ENV` | `development` | Режим (`development` / `production`) |
| `CORS_ORIGINS` | — | Список разрешённых origin через запятую |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Окно rate limit в мс (15 минут) |
| `RATE_LIMIT_MAX` | `100` | Максимум запросов на окно |
| `WEATHER_API_URL` | пустая строка (мок) | URL дневного прогноза Open-Meteo; в `.env.example` задан рабочий URL |
| `WEATHER_MAX_WIND_SPEED` | `10` | Порог скорости ветра, м/с |
| `WEATHER_ALLOW_PRECIPITATION` | `false` | Разрешать работу при осадках |
| `WEATHER_TIMEOUT_MS` | `5000` | Таймаут запроса погоды, мс |
| `REQUEST_TIMEOUT_MS` | `5000` | Общий таймаут внешних запросов, мс |
| `LOG_LEVEL` | `info` | Уровень логирования pino |

## Структура проекта

```
.
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── data/                       # JSON-хранилище (в .gitignore)
│   ├── .gitkeep
│   ├── equipment.json
│   └── requests.json
├── docs/
│   └── postman/
│       ├── case2.postman_collection.json
└── src/
    ├── app.js                  # сборка Express-приложения (экспортируется)
    ├── server.js               # запуск сервера
    ├── config/
    │   └── env.js              # конфигурация из process.env
    ├── routes/                 # HTTP-роутинг
    ├── controllers/            # разбор req/res, вызов сервисов
    ├── services/               # бизнес-логика
    ├── repositories/           # доступ к данным (JSON-файлы)
    ├── middlewares/            # requestId, validate, errorHandler, notFound
    ├── schemas/                # Zod-схемы валидации
    ├── errors/                 # типы ошибок
    └── utils/                  # logger, asyncHandler
```

## Архитектура

Слоистая архитектура:

```
routes → controllers → services → repositories
```

- **routes** — только сопоставление HTTP-метода и пути с цепочкой middleware.
- **controllers** — разбор `req`/`res`, вызов сервисов, формирование ответа.
- **services** — бизнес-логика (уникальность серийного номера, переходы
  статусов, запрет удаления оборудования с открытыми заявками).
- **repositories** — единственное место, где код знает про хранилище
  (сейчас — JSON-файлы в `data/`; на Неделе 3 заменяется на PostgreSQL
  через Sequelize без изменения сервисов и контроллеров).

Сборка приложения (`src/app.js`) отделена от запуска сервера
(`src/server.js`) — `app` экспортируется и может быть подключён в тестах.

## Эндпоинты

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/api/health` | Проверка доступности сервиса |
| GET | `/api/equipment` | Список оборудования (фильтры, сортировка, пагинация) |
| POST | `/api/equipment` | Создание единицы оборудования |
| GET | `/api/equipment/:id` | Карточка оборудования |
| PATCH | `/api/equipment/:id` | Частичное обновление оборудования |
| DELETE | `/api/equipment/:id` | Удаление (запрещено при открытых заявках) |
| GET | `/api/equipment/:id/requests` | Заявки по конкретной единице оборудования |
| GET | `/api/equipment/:id/weather` | Прогноз и пригодность окна для наружных работ |
| GET | `/api/requests` | Список заявок (фильтры, сортировка, пагинация) |
| POST | `/api/requests` | Создание заявки |
| GET | `/api/requests/:id` | Карточка заявки |
| PATCH | `/api/requests/:id` | Редактирование полей заявки |
| PATCH | `/api/requests/:id/status` | Смена статуса с проверкой перехода |
| DELETE | `/api/requests/:id` | Удаление заявки |

## Параметры списочных эндпоинтов

### `GET /api/equipment`

| Параметр | Тип | Допустимые значения | По умолчанию |
|---|---|---|---|
| `type` | query | `turbine \| inverter \| sensor \| substation` | — |
| `status` | query | `operational \| maintenance \| fault \| decommissioned` | — |
| `installedAtFrom` | query | ISO-дата, нижняя граница | — |
| `installedAtTo` | query | ISO-дата, верхняя граница | — |
| `page` | query | целое ≥ 1 | `1` |
| `limit` | query | целое 1–100 | `10` |
| `sortBy` | query | `name \| type \| status \| installedAt` | `name` |
| `order` | query | `asc \| desc` | `asc` |

### `GET /api/requests`

| Параметр | Тип | Допустимые значения | По умолчанию |
|---|---|---|---|
| `status` | query | `new \| in_progress \| done \| rejected` | — |
| `priority` | query | `low \| medium \| high \| critical` | — |
| `equipmentId` | query | uuid | — |
| `createdAtFrom` / `createdAtTo` | query | ISO-диапазон даты создания | — |
| `plannedAtFrom` / `plannedAtTo` | query | ISO-диапазон плановой даты | — |
| `page` | query | целое ≥ 1 | `1` |
| `limit` | query | целое 1–100 | `10` |
| `sortBy` | query | `createdAt \| updatedAt \| plannedAt \| priority \| status \| title` | `createdAt` |
| `order` | query | `asc \| desc` | `desc` |

Формат ответа списка:

```json
{
  "data": [ /* ... */ ],
  "meta": { "total": 42, "page": 1, "limit": 10 }
}
```

## Модель данных

### Equipment

| Поле | Тип | Ограничения |
|---|---|---|
| `id` | string (uuid) | генерируется сервером |
| `name` | string | 3–100 символов, обязательное |
| `type` | enum | `turbine \| inverter \| sensor \| substation` |
| `serialNumber` | string | уникальный в пределах системы |
| `location` | object | `{ lat: -90..90, lon: -180..180 }` |
| `status` | enum | `operational \| maintenance \| fault \| decommissioned` |
| `installedAt` | string (ISO) | не в будущем |

### Maintenance Request

| Поле | Тип | Ограничения |
|---|---|---|
| `id` | string (uuid) | генерируется сервером |
| `equipmentId` | string (uuid) | ссылка на существующее оборудование |
| `title` | string | 5–120 символов, обязательное |
| `description` | string | до 2000 символов |
| `priority` | enum | `low \| medium \| high \| critical` |
| `status` | enum | `new \| in_progress \| done \| rejected`, по умолчанию `new` |
| `plannedAt` | string (ISO) | опционально |
| `createdAt` | string (ISO) | генерируется сервером |
| `updatedAt` | string (ISO) | генерируется сервером |

Поля `id`, `createdAt`, `updatedAt` проставляются сервером и **не могут
быть изменены через API**. Неизвестные поля тела запроса отбрасываются
валидатором (Zod в режиме strip).

## Переходы статусов

```
new         → in_progress | rejected
in_progress → done | rejected
done        → (терминальный)
rejected    → (терминальный)
```

Недопустимый переход → `409 Conflict` с сообщением
`"Недопустимый переход статуса: <from> → <to>"`.

Смена статуса выполняется **отдельным** эндпоинтом
`PATCH /api/requests/:id/status` и проверяется на уровне сервиса
(`request.service.js`), а не в контроллере или репозитории.

## Формат ответа и ошибок

### Успешный ответ

Одиночный ресурс:

```json
{ "data": { /* ... */ } }
```

Список:

```json
{
  "data": [ /* ... */ ],
  "meta": { "total": 42, "page": 1, "limit": 10 }
}
```

### Ответ об ошибке

Единый формат для всего API:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [
      { "field": "priority", "message": "Invalid enum value", "code": "invalid_enum_value" }
    ],
    "requestId": "b1f2c3d4-..."
  }
}
```

- `code` — машиночитаемый код (`VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`,
  `INVALID_JSON`, `PAYLOAD_TOO_LARGE`, `RATE_LIMIT_EXCEEDED`,
  `CORS_FORBIDDEN`, `WEATHER_API_ERROR`, `WEATHER_TIMEOUT`,
  `INTERNAL_SERVER_ERROR`).
- `message` — понятное человеку сообщение.
- `details` — массив ошибок валидации (для `VALIDATION_ERROR`), иначе `[]`.
- `requestId` — совпадает с заголовком `X-Request-Id`; по нему можно найти
  запись в логах.

В `NODE_ENV=production` стек-трейсы и внутренние сообщения в ответ
не попадают.

## Коды ответов

| Код | Когда используется |
|---|---|
| `200` | Успешное чтение или обновление |
| `201` | Успешное создание (с заголовком `Location`) |
| `204` | Успешное удаление |
| `400` | Ошибка валидации query/params, некорректный JSON |
| `422` | Семантически некорректное тело запроса |
| `403` | Origin не разрешён политикой CORS |
| `404` | Ресурс или маршрут не найден |
| `409` | Конфликт (дубль серийного номера, недопустимый переход статуса, удаление с открытыми заявками) |
| `413` | Тело запроса слишком большое |
| `429` | Превышен rate limit |
| `500` | Внутренняя ошибка сервера |
| `502` | Ошибка внешнего погодного API |
| `504` | Таймаут погодного API |

## Примеры запросов и ответов

### Проверка доступности

```http
GET /api/health
```

Ответ `200`:

```json
{
  "status": "ok",
  "message": "Maintenance API is running",
  "requestId": "9b0c...c2"
}
```

### Создание оборудования

```http
POST /api/equipment
Content-Type: application/json

{
  "name": "Turbine A1",
  "type": "turbine",
  "serialNumber": "TRB-001",
  "location": { "lat": 55.75, "lon": 37.61 },
  "status": "operational",
  "installedAt": "2023-05-01T10:00:00.000Z"
}
```

Ответ `201 Created`, заголовок `Location: /api/equipment/<uuid>`:

```json
{
  "data": {
    "id": "3f6a...b7",
    "name": "Turbine A1",
    "type": "turbine",
    "serialNumber": "TRB-001",
    "location": { "lat": 55.75, "lon": 37.61 },
    "status": "operational",
    "installedAt": "2023-05-01T10:00:00.000Z"
  }
}
```

### Список оборудования с фильтрами

```http
GET /api/equipment?type=turbine&status=operational&page=1&limit=10&sortBy=name&order=asc
```

Фильтр по диапазону даты установки:

```http
GET /api/equipment?installedAtFrom=2023-01-01T00:00:00.000Z&installedAtTo=2024-01-01T00:00:00.000Z
```

Для заявок доступны диапазоны `createdAtFrom/createdAtTo` и
`plannedAtFrom/plannedAtTo`. Все границы включаются; начало диапазона
не может быть позже конца.

### Карточка оборудования

```http
GET /api/equipment/:id
```

### Частичное обновление

```http
PATCH /api/equipment/:id
Content-Type: application/json

{ "status": "maintenance" }
```

### Удаление оборудования

```http
DELETE /api/equipment/:id
```

Успех — `204 No Content`.
Если у оборудования есть заявки в статусе `new` или `in_progress` —
`409 Conflict`.

### Заявки по конкретной единице оборудования

```http
GET /api/equipment/:id/requests
```

Ответ `200` — список заявок с этим `equipmentId`. Если оборудование
не найдено — `404`.

### Создание заявки

```http
POST /api/requests
Content-Type: application/json

{
  "equipmentId": "3f6a...b7",
  "title": "Плановое ТО",
  "description": "Заменить фильтры",
  "priority": "high",
  "plannedAt": "2025-06-01T08:00:00.000Z"
}
```

Ответ `201 Created`, `Location: /api/requests/<uuid>`, поле `status: "new"`.

### Смена статуса заявки

```http
PATCH /api/requests/:id/status
Content-Type: application/json

{ "status": "in_progress" }
```

Недопустимый переход (например, `new → done`) → `409`:

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Недопустимый переход статуса: new → done",
    "details": [],
    "requestId": "..."
  }
}
```

### Ошибка валидации

```http
POST /api/equipment
Content-Type: application/json

{ "name": "x" }
```

Ответ `422`:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Некорректные данные запроса",
    "details": [
      { "field": "name", "message": "String must contain at least 3 character(s)", "code": "too_small" },
      { "field": "type", "message": "Required", "code": "invalid_type" }
    ],
    "requestId": "..."
  }
}
```

### Несуществующий маршрут

```http
GET /api/unknown
```

Ответ `404` в едином формате с `code: "NOT_FOUND"`.

### Некорректный JSON

```http
POST /api/equipment
Content-Type: application/json

"broken":
```

Ответ `400` с `code: "INVALID_JSON"`.

## Прогноз погоды

Эндпоинт `GET /api/equipment/:id/weather`:

1. Находит оборудование по `id` (иначе `404`).
2. Делает запрос к внешнему погодному API (`weatherProvider.service.js`),
   используя координаты `location.lat` / `location.lon`.
3. Возвращает дневной прогноз и признак пригодности окна для наружных работ.

Это прогноз по `daily`-полям Open-Meteo, а не текущие погодные условия.
Поле `source` равно `"mock"` для синтетических данных и `"OpenMeteo"`
для ответа провайдера.

Пример ответа:

```json
{
  "data": {
    "equipmentId": "3f6a...b7",
    "location": { "lat": 55.75, "lon": 37.61 },
    "source": "OpenMeteo",
    "fetchedAt": "2025-05-01T10:00:00.000Z",
    "data": [
      {
        "date": "2025-05-01",
        "temperatureMin": 10,
        "temperatureMax": 15,
        "precipitation": false,
        "windSpeed": 4.2
      }
    ],
    "outdoorWorkSuitable": true,
    "criteria": {
      "maxWindSpeed": 10,
      "allowPrecipitation": false
    }
  }
}
```

### Правило пригодности

```
outdoorWorkSuitable =
  (WEATHER_ALLOW_PRECIPITATION || data[0].precipitation === false)
  && data[0].windSpeed < WEATHER_MAX_WIND_SPEED
```

Правило задаётся переменными окружения `WEATHER_MAX_WIND_SPEED`
и `WEATHER_ALLOW_PRECIPITATION`, а также возвращается в ответе в поле
`criteria`, чтобы клиент видел, по каким порогам принято решение.

### Поведение при недоступности внешнего API

Сервис не падает:

- таймаут → `504` с `code: "WEATHER_TIMEOUT"`;
- ошибка HTTP/сети → `502` с `code: "WEATHER_API_ERROR"`.

Если `WEATHER_API_URL` пуст, используется детерминированный мок —
это удобно для локальной разработки и тестов без сети.

## Безопасность

- **CORS**: явный allowlist из переменной `CORS_ORIGINS`
  (никакого `*`). Запросы с origin, не входящего в список, отклоняются
  с `403 CORS_FORBIDDEN`. При пустом списке междоменные запросы
  запрещены; запросы без заголовка `Origin` пропускаются.
- **Rate limit**: 100 запросов / 15 минут на все маршруты `/api/*`
  (`express-rate-limit`). При превышении — `429` в едином формате ошибки
  и стандартные заголовки `RateLimit-*`.
- **Helmet**: базовые защитные HTTP-заголовки.
- **Body limit**: 100 kb на JSON-тело. При превышении — `413` с
  `code: "PAYLOAD_TOO_LARGE"`.
- **Cookie**: не используются — API stateless и не выставляет cookies,
  поэтому флаги `HttpOnly`, `Secure`, `SameSite` не применяются.
  Если в будущем понадобится сессия, значение `SameSite=Lax` — разумный
  дефолт (защита от CSRF при обычной навигации), `Secure` — только при
  работе по HTTPS.
- **Секреты**: `.env` в `.gitignore`, в репозитории только
  `.env.example`. Стек-трейсы наружу не отдаются.

## Логирование

- Логирование запросов через `pino-http`. Для каждого запроса
  фиксируются: HTTP-метод, путь, код ответа, длительность, `requestId`.
- `requestId` генерируется middleware `requestId` (UUID v4),
  прокидывается в `req.requestId` и возвращается клиенту в заголовке
  `X-Request-Id` и в теле ошибки.
- Ошибки логируются с тем же `requestId` — по нему можно найти запись
  в логах.
- Уровни логирования настраиваются через `LOG_LEVEL`
  (`trace|debug|info|warn|error|fatal`).
- `console.log` в коде отсутствует — только `logger.info/warn/error`.
- Чувствительные заголовки (`authorization`, `cookie`)
  редактируются в логах (`[REDACTED]`).

Пример записи лога:

```json
{"level":30,"time":1714567890123,"msg":"request completed","req":{"method":"GET","url":"/api/health"},"res":{"statusCode":200},"responseTime":3,"requestId":"9b0c...c2"}
```

## Postman

Коллекция лежит в `docs/postman/case2.postman_collection.json`,

### Импорт

1. Postman → **Import** → выбрать `case2.postman_collection.json`.
2. Коллекция появится в левой панели.

### Переменные окружения

| Переменная | Значение | Как заполняется |
|---|---|---|
| `baseUrl` | `http://localhost:3000` | Вручную |
| `equipmentId` | — | Автоматически после `Create equipment` |
| `requestId` | — | Автоматически после `Create request` |

### Что покрыто

- Happy path для всех эндпоинтов.
- Негативные сценарии: `400` (query/params и битый JSON), `422` (валидация тела), `404` (несуществующий ресурс),
  `409` (дубль серийного номера, недопустимый переход статуса,
  удаление заявки в работе и оборудования с открытой заявкой), `429` (rate limit).
- Тесты `pm.test` на код ответа и структуру тела.
- Идентификаторы созданных сущностей передаются через переменные
  коллекции.

### Запуск

1. Убедиться, что сервер запущен (`npm run dev`).
2. Запустить коллекцию через **Collection Runner** или вручную по порядку.
3. Либо отдельные запросы — для точечной проверки.

Проверка `429` вынесена в отдельную папку: остановите сервер, запустите его
с `RATE_LIMIT_MAX=1` (в PowerShell задайте `$env:RATE_LIMIT_MAX=1` перед
`npm start`), затем выполните только папку **Rate limit** на новом
процессе. Первый запрос должен вернуть `200`, второй — `429`. Не запускайте
эту папку вместе с остальной коллекцией: лимит общий для всех `/api/*`.
