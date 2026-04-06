# HappyTails Split Workspace

This repository has been reorganized into four top-level projects:

- `Frontend-Customer` for the customer-facing React/Vite app
- `Frontend-Admin` for the admin-facing React/Vite app
- `Backend-Customer` for customer-side database utilities and migrations
- `Backend-Admin` for the admin Express API

Source recovery notes:

- The customer app was recovered from `HappyTailsShop-schen`.
- The admin app was recovered from `HappyTailsShop-schen/happytailsadmin-main`.
- The original damaged root-level app files were left in place as recovery artifacts. Use the four folders above as the active projects.

Quick start:

1. `cd Frontend-Customer && npm install && npm run dev`
2. `cd Frontend-Admin && npm install && npm run dev`
3. `cd Backend-Customer && npm install && npm run db:inspect`
4. `cd Backend-Admin && npm install && npm run dev`
