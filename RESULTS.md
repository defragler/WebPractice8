# RESULTS.md — результати практичної роботи № 8

## Тема

Зв'язки між сутностями, міграції бази даних та транзакції в NestJS (TypeORM).

## Індивідуальний варіант

**Каталог гаджетів (`gadgets`) із розширеною моделлю даних:** реалізовано сутності `Gadget`, `Brand`, `Feature`, `Warranty` та зв'язки між ними (One-to-One, Many-to-One / One-to-Many, Many-to-Many).

## Мета роботи

Навчитися проєктувати та реалізовувати зв'язки між таблицями в TypeORM, керувати схемою бази даних за допомогою міграцій, обробляти помилки БД та виконувати транзакційні операції в NestJS.

## Реалізовані вимоги

1. **Конфігурація БД та міграції (`src/database/`).**
    * Налаштовано `data-source.ts` для роботи з міграціями.
    * Створено та застосовано 4 міграції:
        * `1730000000001-InitGadgets.ts` — ініціалізація таблиці гаджетів;
        * `1730000000002-CreateRelations.ts` — налаштування зв'язків із брендами (`Brand`);
        * `1730000000003-AddFeaturesManyToMany.ts` — зв'язок Many-to-Many із характеристиками (`Feature`);
        * `1730000000004-AddWarrantyOneToOne.ts` — зв'язок One-to-One із гарантією (`Warranty`).
2. **Модулі та сутності.**
    * `BrandsModule` (`brand.entity.ts`, `create-brand.dto.ts`, контролер і сервіс).
    * `FeaturesModule` (`feature.entity.ts`, контролер і сервіс).
    * `GadgetsModule` (`gadget.entity.ts`, `warranty.entity.ts`, контролер і сервіс).
3. **DTO та транзакції.**
    * Додано `CreateWarrantyDto` та `CreateGadgetTransactionalDto` для атомарного створення гаджета разом із пов'язаними даними в межах транзакції.
    * Збережено валідацію `CreateGadgetDto`, `UpdateGadgetDto` та `PaginationQueryDto`.
4. **Обробка помилок БД.**
    * У `src/common/db-errors.ts` реалізовано допоміжну обробку помилок бази даних.
5. **HTTP-перевірки.**
    * У `requests.http` підготовлено та виконано набір запитів для перевірки роботи зі зв'язаними сутностями, транзакцій та обробки помилок.

## Структура проєкту

```text
src/
├── main.ts
├── app.module.ts
├── common/
│   └── db-errors.ts
├── database/
│   ├── data-source.ts
│   └── migrations/
│       ├── 1730000000001-InitGadgets.ts
│       ├── 1730000000002-CreateRelations.ts
│       ├── 1730000000003-AddFeaturesManyToMany.ts
│       └── 1730000000004-AddWarrantyOneToOne.ts
├── brands/
│   ├── brand.entity.ts
│   ├── brands.module.ts
│   ├── brands.controller.ts
│   ├── brands.service.ts
│   └── dto/
│       └── create-brand.dto.ts
├── features/
│   ├── feature.entity.ts
│   ├── features.module.ts
│   ├── features.controller.ts
│   └── features.service.ts
└── gadgets/
    ├── gadgets.module.ts
    ├── gadgets.controller.ts
    ├── gadgets.service.ts
    ├── entities/
    │   ├── gadget.entity.ts
    │   └── warranty.entity.ts
    └── dto/
        ├── create-gadget.dto.ts
        ├── update-gadget.dto.ts
        ├── pagination-query.dto.ts
        ├── create-warranty.dto.ts
        └── create-gadget-transactional.dto.ts

docker-compose.yml
requests.http
README.md
RESULTS.md
package.json
```

## Запуск і перевірка

```bash
docker compose up -d
npm install
npm run build
npm run start
```

Застосунок було запущено локально з підключеною базою даних у Docker, а запити з `requests.http` виконано через HTTP Client (збережені відповіді у `.idea/httpRequests/`).

| Перевірка | Фактичний результат |
|---|---|
| Створення брендів, характеристик і гаджетів зі зв'язками | Записи коректно зберігаються та повертаються з урахуванням зв'язків (`Brand`, `Feature`, `Warranty`) |
| Транзакційне створення (`CreateGadgetTransactionalDto`) | Успішне атомарне збереження або відкат змін при помилці |
| Невалідні вхідні дані | Отримано `400 Bad Request` з описом помилок валідації |
| Звернення до неіснуючих записів | Отримано `404 Not Found` |
| Помилки на рівні БД / сервера | Зафіксовано відповіді `500` у випадках порушення обмежень або збоїв БД |

## Висновок

У межах практичної роботи № 8 реалізовано та перевірено NestJS-застосунок із повноцінною реляційною моделлю даних (`Gadget`, `Brand`, `Feature`, `Warranty`), міграціями TypeORM, транзакційним створенням записів та обробкою помилок бази даних. Усі сценарії протестовано за допомогою `requests.http`.