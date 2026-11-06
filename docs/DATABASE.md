# База данных и миграции

## Состав

- `20261106170000_initial_schema.sql` создаёт типы, таблицы, ограничения, индексы, триггеры и RPC перехода статуса.
- `20261106171000_rls_and_grants.sql` включает RLS, выдаёт минимальные табличные права и создаёт политики доступа.
- `seed.sql` добавляет демонстрационные объекты и задачи, если уже существуют один постановщик и два исполнителя.
- `tests/database/rls_and_transitions.test.sql` проверяет чтение, запреты и переходы от имени разных пользователей.

## Локальная проверка

Для локального Supabase требуется Docker Desktop и Supabase CLI.

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

В Windows эти команды можно выполнить одним скриптом из корня проекта:

```powershell
.\scripts\verify-database.ps1
```

`db reset` пересоздаёт локальную базу, применяет миграции и запускает seed. Команду нельзя применять к рабочей облачной базе.

## Применение к связанному проекту

После проверки локальной базы:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Перед `db push` нужно убедиться, что выбран тестовый проект, а не чужая или рабочая база. Секреты и access token не добавляются в репозиторий.

## Создание профилей

Публичная регистрация отключена. Пользователи создаются в Supabase Auth административно. После этого для каждого пользователя добавляется строка в `public.profiles` с тем же UUID и ролью `manager` либо `executor`.

Пример выполняется только после создания пользователя в Auth:

```sql
insert into public.profiles (id, display_name, role)
values ('AUTH_USER_UUID', 'Имя пользователя', 'executor');
```

Роль нельзя назначить из frontend.
