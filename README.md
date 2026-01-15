# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a3be71b9-ccf6-4e82-83bd-7088223d270a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a3be71b9-ccf6-4e82-83bd-7088223d270a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a3be71b9-ccf6-4e82-83bd-7088223d270a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Importing FuelEconomy.gov 2025 data into Supabase

This project includes a one-time import script to load 2025 model-year vehicles into Supabase.

**Run the import**

```sh
npx ts-node scripts/import_fueleconomy_2025.ts
```

**Required environment variables**

```sh
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

**Option B (no service role key): use the Edge Function**

If you cannot access the service role key (e.g., Lovable Cloud projects), deploy the
`import-cars` Edge Function and run the script with your anon key instead:

```sh
npx supabase@latest functions deploy import-cars
```

```sh
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
```

Make sure the `import-cars` function has access to `SUPABASE_SERVICE_ROLE_KEY`
via your Supabase project secrets. If you don't have the CLI installed globally,
using `npx supabase@latest` avoids the unsupported `npm install -g supabase` path.

**Verify the imported row count**

```sql
select count(*) from cars where year=2025;
```
