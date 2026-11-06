# Мини CRM «Объекты и задачи»

Готовое тестовое задание: защищённая CRM для управления строительными объектами и задачами исполнителей.

## Возможности

- вход по email и паролю через Supabase Auth;
- роли постановщика и исполнителя;
- объекты, задачи, назначения и фильтр «Мои задачи»;
- контролируемый автомат статусов с историей изменений;
- RLS-политики и серверный RPC для безопасных переходов;
- адаптивный React-интерфейс;
- 5 frontend-тестов и 15 pgTAP-тестов базы данных.

## Стек

React 19, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod и Supabase.

## Локальный запуск

Требуются Node.js 20+, npm и запущенный Docker Desktop.

```powershell
npm install
npx supabase start
npx supabase db reset
Copy-Item .env.example .env.local
```

Из `npx supabase status` перенесите локальные `Project URL` и `Publishable key` в `.env.local`:

```text
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=LOCAL_PUBLISHABLE_KEY
```

Запустите frontend:

```powershell
npm run dev
```

Приложение доступно по адресу `http://127.0.0.1:5177`.

Демонстрационные аккаунты и пошаговый сценарий находятся в `docs/LOCAL_DEMO.md`.

## Миграции

`npx supabase db reset` пересоздаёт только локальную базу, применяет все файлы из `supabase/migrations` и загружает `supabase/seed.sql`. Не запускайте эту команду против рабочей облачной базы.

Подробности применения миграций и создания профилей: `docs/DATABASE.md`.

## Проверки

```powershell
npm run check
npx supabase test db
```

Windows-скрипты полного цикла:

```powershell
.\scripts\verify.ps1
.\scripts\verify-database.ps1
```

Ожидаемый результат: 5 frontend-тестов, 15 database-тестов и успешный production build.

## Документация

- `docs/SPECIFICATION.md` — требования и критерии приёмки;
- `docs/ARCHITECTURE.md` — архитектура и структура frontend;
- `docs/DATA_MODEL.md` — таблицы, связи и ограничения;
- `docs/SECURITY.md` — модель угроз и матрица доступа;
- `docs/STATUS_WORKFLOW.md` — автомат статусов и RPC-контракт;
- `docs/DATABASE.md` — миграции, seed и SQL-тесты;
- `docs/LOCAL_DEMO.md` — аккаунты и сценарий демонстрации;
- `docs/DEPLOYMENT.md` — публикация GitHub, Supabase и Vercel;
- `docs/DECISIONS.md` — принятые продуктовые и технические решения;
- `docs/SUBMISSION_MESSAGE.md` — готовый текст сообщения для hh.ru;
- `docs/SUBMISSION_CHECKLIST.md` — финальная проверка перед сдачей;
- `AGENTS.md` — правила работы с проектом.
