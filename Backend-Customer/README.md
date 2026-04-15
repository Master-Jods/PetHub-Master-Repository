# Backend-Customer

Customer-side backend utilities recovered from the shop project.

This folder currently contains database migrations and direct PostgreSQL/Supabase helper scripts. It is not an Express API yet.

## Run

1. `npm install`
2. Create `.env` from `.env.example`
3. Use one of:

- `npm run db:inspect`
- `npm run db:migrate:profile`
- `npm run db:migrate:order-methods`
- `npm run db:migrate:shared-schema`
- `npm run db:migrate:shared-legacy`
- `npm run db:migrate:profile-cleanup`
- `npm run db:migrate:profile-trigger`
- `npm run db:migrate:inventory-stock`

## Shared Database Setup

For the new merged database:

1. Run `npm run db:migrate:shared-schema`
2. Run `npm run db:migrate:profile-cleanup` if your DB was created before the profile cleanup
3. Run `npm run db:migrate:profile-trigger` so new auth users automatically get profile rows
4. Run `npm run db:migrate:inventory-stock` so inventory stock is deducted automatically whenever a customer places an order
5. If you are migrating old data, load the old customer tables into `legacy_customer` and the old admin tables into `legacy_admin`
6. Run `npm run db:migrate:shared-legacy`

Files:

- `database/migrations/20260406_shared_app_schema.sql`
- `database/migrations/20260406_migrate_legacy_customer_admin.sql`
- `database/migrations/20260406_profile_cleanup.sql`
- `database/migrations/20260406_profile_trigger.sql`
- `database/migrations/20260413_inventory_stock_on_orders.sql`
