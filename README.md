# Ceylon Spares

A simple, fast online shop for a spare-parts business, plus an easy admin back office.
Customers browse and order as guests (no accounts). The owner manages products, models,
categories, orders and settings from a password-protected admin.

- **Storefront:** minimal white design, category menu, search (typo-tolerant), product
  pages with model/variant selection, guest checkout.
- **Delivery:** flat Rs 500 island-wide.
- **Payment:** Cash on Delivery, or Bank Deposit with slip upload.
- **Admin:** products (with models/variants + images), CSV import, categories, orders,
  business + bank settings.
- **Optional AI (OpenAI key):** auto-writes product descriptions, SEO tags, sorts CSV
  imports, and boosts search. Everything works without a key too.

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite (default) ·
Cloudflare R2 for images (optional).

---

## 1. Run locally

```bash
npm install
cp .env.example .env      # then edit .env (at least ADMIN_PASSWORD + SESSION_SECRET)
npx prisma migrate deploy # create the database
npm run db:seed           # optional: load sample products
npm run dev
```

Open http://localhost:3000 for the shop and http://localhost:3000/admin for the admin
(password = `ADMIN_PASSWORD` from `.env`).

## 2. Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | `file:./dev.db` for SQLite (default). |
| `ADMIN_PASSWORD` | yes | Password for the admin login. |
| `SESSION_SECRET` | yes | Long random string used to sign the admin cookie. |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public URL, e.g. `https://ceylonspares.lk` (for SEO/sitemap). |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | optional | Cloudflare R2 image storage. If unset, images are saved to `/public/uploads`. |

The **OpenAI API key** is *not* an env var — the owner adds it in **Admin → Settings**.

## 3. Image storage (Cloudflare R2)

Without R2, uploaded images go to `public/uploads` (fine for local dev, but this folder is
wiped on each deploy). For production, set up R2:

1. Cloudflare dashboard → R2 → create a bucket.
2. Enable public access (r2.dev) or attach a custom domain — that URL is `R2_PUBLIC_URL`.
3. Create an R2 API token (Object Read & Write) → gives the access key + secret.
4. Fill the five `R2_*` variables. Product images and deposit slips then upload to R2.

## 4. Adding products via CSV

**Admin → Products → Import CSV.** Download the template, or use these columns:

```
main_product, model, price, sale_price, category, description, in_stock, image_url
```

Rows that share the same `main_product` become one product with multiple models. Example:

```
Fan Motor,60W,2500,,Motor Spares,Copper winding fan motor,yes,
Fan Motor,80W,2900,,Motor Spares,,yes,
```

If an OpenAI key is set and "Use AI to sort" is ticked, categories are tidied and SEO tags
are generated automatically. Without a key, rows import exactly as given.

---

## 5. Deploy to Railway

The production build never touches the database, and migrations run at startup, so
deployment is straightforward.

1. Push this folder to a GitHub repo and create a Railway project from it.
2. **Add a Volume** to the service, mounted at `/data` (this keeps the SQLite database and
   any local uploads across deploys).
3. Set service **Variables**:
   - `DATABASE_URL` = `file:/data/prod.db`
   - `ADMIN_PASSWORD` = a strong password
   - `SESSION_SECRET` = a long random string
   - `NEXT_PUBLIC_SITE_URL` = your public URL
   - the `R2_*` variables (recommended, so images survive deploys)
4. Deploy. Railway runs `npm run build`, then `npm run start`, which applies migrations to
   the volume database and boots the app.

### Alternative: PostgreSQL

To use Railway Postgres instead of SQLite:

1. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
2. Delete the `prisma/migrations` folder and run `npx prisma migrate dev --name init`
   against your Postgres `DATABASE_URL` to regenerate migrations.
3. Add the Railway PostgreSQL plugin and set `DATABASE_URL` to its connection string
   (no volume needed).

---

## Notes

- **Change `ADMIN_PASSWORD` and `SESSION_SECRET`** before going live.
- There are no customer accounts — checkout is fully guest.
- New orders appear in **Admin → Orders** (no email/SMS alerts by design).
- Hidden products (Admin → Products → "Shown/Hidden") stay in the catalog but are removed
  from the storefront.

## Useful scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run start      # migrate + start (production)
npm run db:seed    # load sample data
npm run db:studio  # browse the database (Prisma Studio)
```
