> axon@1.0.0 build C:\Users\brcom\ai-agent
> next build

   ▲ Next.js 15.3.5
   - Environments: .env.local, .env

   Creating an optimized production build ...
Failed to compile.

./src/app/(protected)/admin/modules/[id]/configure/page.tsx
Module not found: Can't resolve '@/app/actions/admin/module-catalog'

https://nextjs.org/docs/messages/module-not-found

./src/app/(protected)/[slug]/(modules)/alerts/page.tsx
Module not found: Can't resolve './implementations/BanbanAlertsImplementation'

https://nextjs.org/docs/messages/module-not-found

./src/app/(protected)/[slug]/(modules)/alerts/page.tsx
Module not found: Can't resolve './implementations/EnterpriseAlertsImplementation'

https://nextjs.org/docs/messages/module-not-found

./src/app/(protected)/[slug]/(modules)/insights/page.tsx
Module not found: Can't resolve './implementations/EnterpriseInsightsImplementation'

https://nextjs.org/docs/messages/module-not-found

./src/lib/modules/index.ts
Module not found: Can't resolve '@supabase/auth-helpers-nextjs'

https://nextjs.org/docs/messages/module-not-found

Import trace for requested module:
./src/app/(protected)/[slug]/(modules)/alerts/page.tsx


> Build failed because of webpack errors
 ELIFECYCLE  Command failed with exit code 1.