# Практична робота № 8

## Тема: Моделювання зв'язків між сутностями та керування міграціями

---

## Мета роботи

- Опанувати принципи моделювання реляційних зв'язків між сутностями (`One-to-One`, `One-to-Many` / `Many-to-One`, `Many-to-Many`) в ORM TypeORM.
- Навчитися налаштовувати каскадні операції збереження та видалення (`cascade`, `onDelete`).
- Опанувати конфігурування TypeORM CLI та `DataSource` для версіонування схеми бази даних через міграції.
- Навчитися генерувати, застосовувати та відкочувати міграції (`migration:generate`, `migration:run`, `migration:revert`).
- Освоїти побудову комплексних вибірок даних за допомогою `QueryBuilder` з об'єднанням зв'язаних таблиць.
- Навчитися забезпечувати атомарність операцій збереження взаємопов'язаних сутностей засобами транзакцій (`DataSource.transaction`).

---

## Технічне забезпечення

- Операційна система: Windows, macOS або Linux.
- Середовище розробки: Visual Studio Code (із розширенням REST Client, Database Client або аналогами).
- Платформа виконання: Node.js версії 18+ (LTS) та пакетний менеджер npm.
- Контейнеризація: Docker Engine та Docker Compose (V2).
- База даних: PostgreSQL 16+.
- Бібліотеки бекенду: NestJS, `@nestjs/typeorm`, `typeorm`, `pg`.
- Інструменти тестування API: Postman або файл `requests.http` для REST Client.
- Термінал / CLI: bash, zsh або PowerShell.
- Система контролю версій: Git.

---

## Короткі теоретичні відомості

### 1. Моделювання реляційних зв'язків у TypeORM

Для демонстрації зв'язків розглядається домен системи управління проектами (*Project Management System*): сутності `Project` (проєкт), `Task` (завдання), `TaskDetail` (технічні деталі завдання) та `Tag` (мітки/теги).

#### Зв'язок один-до-багатьох (One-to-Many / Many-to-One)

Один проєкт містить багато завдань, але кожне завдання належить конкретному проєкту:

```typescript
// project.entity.ts
@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @OneToMany(() => TaskEntity, (task) => task.project)
  tasks: TaskEntity[];
}

// task.entity.ts
@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @ManyToOne(() => ProjectEntity, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;
}
```

#### Зв'язок один-до-одного (One-to-One)

Кожне завдання має рівно одну сутність технічних деталей виконання:

```typescript
// task-detail.entity.ts
@Entity('task_details')
export class TaskDetailEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  rawLogs: string;

  @Column({ type: 'varchar', length: 100 })
  environment: string;

  @OneToOne(() => TaskEntity, (task) => task.detail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: TaskEntity;
}
```

#### Зв'язок багато-до-багатьох (Many-to-Many)

Завдання може мати кілька міток, а одна мітка може призначатися багатьом завданням:

```typescript
// task.entity.ts (доповнення)
@ManyToMany(() => TagEntity, (tag) => tag.tasks, { cascade: true })
@JoinTable({
  name: 'task_tags',
  joinColumn: { name: 'task_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
})
tags: TagEntity[];
```

---

### 2. Керування схемою через TypeORM Migrations

У виробничому середовищі опція `synchronize: true` вимикається, оскільки вона може призвести до незворотної втрати даних при модифікації полів. Зміни структури бази даних фіксуються у вигляді міграцій.

#### Конфігурація CLI (`data-source.ts`)

Для генерації та застосування міграцій поза контекстом запуску самого сервера створюється окремий файл джерела даних:

```typescript
// src/database/data-source.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'ecommerce_db',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
});
```

#### Скрипти у `package.json`

```json
"scripts": {
  "typeorm": "typeorm-ts-node-commonjs -d src/database/data-source.ts",
  "migration:generate": "npm run typeorm -- migration:generate",
  "migration:run": "npm run typeorm -- migration:run",
  "migration:revert": "npm run typeorm -- migration:revert"
}
```

- `migration:generate src/database/migrations/<Name>` — аналізує відмінності між класами сутностей та схемою БД і генерує файл міграції.
- `migration:run` — виконує всі незастосовані міграції.
- `migration:revert` — скасовує дію останньої застосованої міграції.

---

### 3. Комплексні вибірки через `QueryBuilder`

Для виконання вибірок зі складними умовами, динамічною фільтрацією та об'єднанням кількох зв'язаних таблиць використовується `QueryBuilder`:

```typescript
async findTasksWithFilters(projectId: string, tagTitle?: string) {
  const query = this.taskRepo.createQueryBuilder('task')
    .leftJoinAndSelect('task.project', 'project')
    .leftJoinAndSelect('task.tags', 'tag')
    .leftJoinAndSelect('task.detail', 'detail')
    .where('project.id = :projectId', { projectId });

  if (tagTitle) {
    query.andWhere('tag.title = :tagTitle', { tagTitle });
  }

  return await query.getMany();
}
```

---

### 4. Транзакції для забезпечення атомарності

Транзакції гарантують виконання операцій за принципом **ACID**: усі операції всередині транзакції або фіксуються разом (`commit`), або в разі виникнення будь-якої помилки повністю скасовуються (`rollback`).

```typescript
async createTaskWithAtomicOperations(dto: CreateTaskDto) {
  return await this.dataSource.transaction(async (manager) => {
    // 1. Збереження базової сутності
    const task = manager.create(TaskEntity, { title: dto.title, project: { id: dto.projectId } });
    const savedTask = await manager.save(task);

    // 2. Створення пов'язаної детальної сутності
    const detail = manager.create(TaskDetailEntity, {
      environment: dto.environment,
      task: savedTask,
    });
    await manager.save(detail);

    return savedTask;
  });
}
```

---

## Постановка задачі

Розширити архітектуру бекенд-сервісу інтернет-магазину (розробленого у попередній практичній роботі): відмовитися від автоматичної синхронізації схеми `synchronize: true`, налаштувати версіонування структури через міграції TypeORM CLI, спроєктувати зв'язки між сутностями відповідно до предметної області варіанта та реалізувати транзакційні бізнес-методи.

У межах практичної роботи необхідно:

1. Створити конфігураційний файл `data-source.ts` та додати команди TypeORM CLI до `package.json`.
2. Вимкнути `synchronize: true` у конфігурації `TypeOrmModule.forRoot()` основного застосунку.
3. Описати реляційні зв'язки для власної предметної області згідно з індивідуальним варіантом:
   - зв'язок **Many-to-One / One-to-Many** (довідник/категорія -> товар);
   - зв'язок **Many-to-Many** (товар <-> характеристики/теги) з таблицею зв'язку;
   - зв'язок **One-to-One** (товар <-> розширені деталі/гарантія).
4. Згенерувати початкову та додаткові міграції за допомогою `migration:generate` та успішно застосувати їх до PostgreSQL за допомогою `migration:run`.
5. Перевірити роботу відкату міграції (`migration:revert`) та її повторного виконання.
6. Налаштувати каскадні операції збереження та видалення (`cascade`, `onDelete`).
7. Реалізувати вибірку товарів з фільтрацією за зв'язаною категорією/тегами через `createQueryBuilder`.
8. Реалізувати метод створення або пакетного оновлення сутності з дочірніми зв'язками в межах єдиної транзакції (`DataSource.transaction`).

Параметри сутностей та зв'язків визначаються індивідуальним *варіантом за номером у журналі*:

### Таблиця варіантів реляційних зв'язків

| Варіант | Базова сутність | Сутність One-to-Many (1:M) | Сутність Many-to-Many (M:N) | Сутність One-to-One (1:1) |
|---|---|---|---|---|
| **1** | `GadgetEntity` (Гаджети) | `BrandEntity` (Виробник/Бренд) | `FeatureEntity` (Особливості / фічі) | `WarrantyEntity` (Гарантійні умови) |
| **2** | `BookEntity` (Книги) | `PublisherEntity` (Видавництво) | `GenreEntity` (Жанри літератури) | `IsbnDetailEntity` (Штрихкод та реєстр) |
| **3** | `ClothingEntity` (Одяг) | `CollectionEntity` (Сезонна колекція) | `MaterialEntity` (Склад тканин) | `CareInstructionEntity` (Догляд за річчю) |
| **4** | `DishEntity` (Страви/Ресторан) | `MenuCategoryEntity` (Розділ меню) | `AllergenEntity` (Алергени) | `NutritionalValueEntity` (Харчова цінність) |
| **5** | `MedicineEntity` (Аптека) | `ManufacturerEntity` (Фарм-компанія) | `ActiveSubstanceEntity` (Діючі речовини) | `StorageConditionEntity` (Умови зберігання) |
| **6** | `BuildingMaterialEntity` (Будматеріали) | `WarehouseEntity` (Склад розміщення) | `StandardEntity` (Стандарти якості/ДСТУ) | `SafetySheetEntity` (Паспорт безпеки) |
| **7** | `AutoPartEntity` (Автозапчастини) | `CarModelEntity` (Сумісна модель авто) | `SpecificationEntity` (Вузли та агрегати) | `CompatibilityCodeEntity` (OEM-код сумісності) |
| **8** | `TicketEntity` (Квитки на події) | `EventEntity` (Концерт / Захід) | `BenefitEntity` (Переваги квитка) | `SeatPlacementEntity` (Схема посадкового місця) |
| **9** | `CourseEntity` (Онлайн-курси) | `InstructorEntity` (Викладач / Ментор) | `SkillEntity` (Навички курсу) | `CertificateEntity` (Шаблон сертифіката) |
| **10** | `PetProductEntity` (Зоотовари) | `AnimalTypeEntity` (Вид тварини) | `IngredientEntity` (Склад / Інгредієнти) | `DosageGuideEntity` (Рекомендація раціону) |

---

## Завдання

Практична робота складається з трьох послідовних рівнів. Кожен наступний рівень базується на попередньому та розширює функціональність розроблюваного рішення.

### Рівень 1. Базовий

1. **Конфігурація міграцій та Data Source:**
   - Створити конфігураційний файл `src/database/data-source.ts`.
   - Додати npm-скрипти `typeorm`, `migration:generate`, `migration:run`, `migration:revert` у `package.json`.
   - Вимкнути `synchronize: true` у конфігурації `TypeOrmModule.forRoot()` у `app.module.ts`.
2. **Моделювання зв'язку 1:M / M:1:**
   - Описати батьківську сутність довідника згідно з варіантом (наприклад, `BrandEntity` або `CategoryEntity`).
   - Налаштувати відношення `@ManyToOne()` у базовій сутності та `@OneToMany()` у батьківській сутності.
   - Згенерувати міграцію створення таблиць та зовнішнього ключа (`foreign key`) за допомогою CLI і застосувати її:
     ```bash
     npm run migration:generate -- src/database/migrations/CreateRelations
     npm run migration:run
     ```
3. **Отримання зв'язаних даних:**
   - Реалізувати ендпоінт отримання сутності за ідентифікатором із завантаженням пов'язаного об'єкта через параметр `relations`:
     ```typescript
     this.repository.findOne({ where: { id }, relations: ['brand'] });
     ```
   - Продемонструвати коректну відповідь API з вкладеним об'єктом у REST-клієнті.

### Рівень 2. Середній

1. **Реалізація зв'язку Many-to-Many:**
   - Описати другу зв'язану сутність для зв'язку M:N відповідно до варіанта (наприклад, `FeatureEntity` або `GenreEntity`).
   - Додати декоратори `@ManyToMany()` та `@JoinTable()` у базову сутність для формування проміжної асоціативної таблиці зв'язку.
   - Увімкнути прапорець `cascade: true` для автоматичного збереження нових сутностей при збереженні базового об'єкта.
2. **Керування життєвим циклом міграцій:**
   - Згенерувати нову міграцію, яка додає нову таблицю та зв'язок Many-to-Many.
   - Виконати відкат попередньої міграції (`npm run migration:revert`) та перевірити стан бази даних.
   - Накатати всі актуальні міграції (`npm run migration:run`).
3. **Фільтрація через QueryBuilder:**
   - Реалізувати метод сервісу та GET-ендпоінт контролера з пошуком та фільтрацією сутностей за ідентифікатором або назвою зв'язаної M:N сутності (наприклад, `GET /gadgets?feature=5G`).
   - Запит побудувати за допомогою `createQueryBuilder` з використанням операторів `innerJoinAndSelect` та параметризованого `where()`.

### Рівень 3. Просунутий

1. **Моделювання зв'язку One-to-One:**
   - Описати сутність деталей 1:1 згідно з варіантом (наприклад, `WarrantyEntity`).
   - Додати `@OneToOne()` та `@JoinColumn()` з обов'язковим налаштуванням поведінки при каскадному видаленні (`onDelete: 'CASCADE'`).
2. **Атомарні бізнес-операції через транзакції:**
   - Реалізувати створення або повне оновлення базової сутності разом з сутністю One-to-One та списком зв'язків Many-to-Many у межах єдиної транзакції бази даних (`DataSource.transaction`).
   - Додати імітацію збою бізнес-логіки (наприклад, валідацію або штучну помилку всередині блоку транзакції після збереження частини даних) та продемонструвати за допомогою REST-клієнта або SQL-клієнта, що в разі помилки жоден рядок не записується в PostgreSQL (відкат транзакції `rollback`).
3. **Data Integrity та вибірка повного агрегата:**
   - Реалізувати ендпоінт вибірки повного агрегата сутності, який через `QueryBuilder` підвантажує одночасно всі 3 типи зв'язків (1:1, 1:M, M:N).

---

## Приклад очікуваного виведення програми

```text
[Nest] 31240  - 09/09/2026, 22:30:00     LOG [NestFactory] Starting Nest application...
[Nest] 31240  - 09/09/2026, 22:30:00     LOG [TypeOrmModule] Database connection established successfully (PostgreSQL 16) +40ms
[Nest] 31240  - 09/09/2026, 22:30:00     LOG [RoutesResolver] GadgetsController {/gadgets}: +4ms
[Nest] 31240  - 09/09/2026, 22:30:00     LOG [NestApplication] Nest application successfully started on port 3000 +2ms

=== ТЕСТУВАННЯ ЗВ'ЯЗКІВ ТА QUERYBUILDER ===

> GET /gadgets/e4b1a37c-501b-4f4d-a2f2-c9a174092b61 HTTP/1.1
> Host: localhost:3000

< HTTP/1.1 200 OK
< Content-Type: application/json; charset=utf-8
{
  "id": "e4b1a37c-501b-4f4d-a2f2-c9a174092b61",
  "title": "Флагманський смартфон",
  "price": "39999.00",
  "brand": {
    "id": "11a4d8c2-3b10-4e2a-89a1-55c82910fa21",
    "name": "TechCorp"
  },
  "features": [
    { "id": "22b5e9d3-4c21-5f3b-90b2-66d93021eb32", "name": "5G" },
    { "id": "33c6f0e4-5d32-6a4c-01c3-77ea4132fc43", "name": "OLED 120Hz" }
  ],
  "warranty": {
    "id": "44d7a1f5-6e43-7b5d-12d4-88fb5243ad54",
    "durationMonths": 24,
    "conditions": "Повна офіційна гарантія виробника"
  }
}

=== ТЕСТУВАННЯ ВІДКАТУ ТРАНЗАКЦІЇ (ROLLBACK) ===

> POST /gadgets/transactional HTTP/1.1
> Host: localhost:3000
> Content-Type: application/json

{
  "title": "Тестовий пристрій",
  "price": -100,
  "features": ["NFC"]
}

< HTTP/1.1 400 Bad Request
{
  "statusCode": 400,
  "message": "Ціна не може бути від'ємною. Транзакцію відкочено.",
  "error": "Bad Request"
}
```

---

## Контрольні питання

1. Чим відрізняються реляційні зв'язки `One-to-Many`, `Many-to-One`, `Many-to-Many` та `One-to-One` в реляційних базах даних?
2. Для чого призначений декоратор `@JoinColumn()` та на якому боці зв'язку він повинен розташовуватися?
3. Чому декоратор `@JoinTable()` потрібен для зв'язку Many-to-Many та які стовпці формуються в проміжній таблиці?
4. У чому полягає призначення опції `cascade: true` в декораторах зв'язків TypeORM? Які ризики вона може спричинити?
5. Чим відрізняється поведінка `onDelete: 'CASCADE'` від `onDelete: 'SET NULL'` при видаленні батьківського запису?
6. Чому опцію `synchronize: true` заборонено використовувати на production-серверах? Які задачі вирішують файли міграцій?
7. Як влаштований механізм відкату міграції за допомогою команди `migration:revert`?
8. У яких ситуаціях використання `QueryBuilder` є більш доцільним, ніж стандартні методи `find()` репозиторію?
9. Що таке ACID-властивості транзакцій? Як метод `DataSource.transaction()` гарантує неподільність виконання операцій?

---

## Критерії оцінювання

Оцінювання здійснюється за шкалою повноти реалізації рівнів практичної роботи:

- **«Задовільно» (Рівень 1):** реалізовано базовий прототип, створено структуру проєкту, програма успішно компілюється та виконує базові сценарії.
- **«Добре» (Рівень 2):** виконано базовий рівень та реалізовано ключову функціональність заняття, забезпечено надійність і безпеку виконання коду.
- **«Відмінно» (Рівень 3):** повністю завершено всі три рівні завдання з дотриманням кращих інженерних практик, чистоти архітектури та оптимізації.
- **Усний захист:** обов'язкове пояснення логіки коду та впевнені відповіді на контрольні питання викладача.

## Вимоги до звітності

1. Опублікувати вихідний код у Git-репозиторії.
2. Оформити файл `README.md` з описом проєкту, інструкцією запуску та обов'язковими скриншотами роботи програми (включаючи демонстрацію відсутності помилок).
3. Продемонструвати роботу програми викладачеві та захистити результати.
