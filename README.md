# BMW Quote Pro v2

A modular Lease, Retail, and Select quote application with Supabase saved quotes.

## Main features

- Lease, Retail, and Select comparisons
- BMW Blue, green, and orange result cards
- White payment text on all result cards
- Standard Lease and One-Pay Lease
- One-Pay formula: `(monthly lease payment × term) + normal total due up front`
- Equivalent monthly display for One-Pay
- Program presets stored in the browser
- Supabase login, save, update, search, open, duplicate, and delete
- Printable quote results

## Project files

- `index.html` — application layout
- `css/styles.css` — general application styles
- `css/cards.css` — comparison-card colors and One-Pay styles
- `css/print.css` — print rules
- `js/config.js` — application constants
- `js/presets.js` — program preset storage
- `js/calculations.js` — Lease, Retail, and Select calculations
- `js/database.js` — Supabase saved-quote workflow
- `js/ui.js` — tabs, printing, and form controls
- `js/app.js` — application startup
- `supabase/setup.sql` — secure quotes table and Row Level Security

## Run locally

Because this is now a multi-file web application, run it through a local web server rather than opening `index.html` directly.

### Windows / Python

Open Command Prompt inside the project folder and run:

```text
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Supabase setup

1. Open Supabase → SQL Editor.
2. Run `supabase/setup.sql`.
3. Open the app → Saved Quotes.
4. Enter your Supabase Project URL ending in `.supabase.co`.
5. Enter the publishable/anon key.
6. Create an account or sign in.

Never put the service-role key in this browser application.

## Hosting on your URL

Upload the entire project folder to Netlify, Vercel, Cloudflare Pages, or another static host. Set `index.html` as the entry page.


## Important fix

This package corrects an incomplete `js/ui.js` file that prevented all tabs and buttons from working.

When updating Netlify:

1. Delete or replace the previous deploy.
2. Upload the entire `BMW_Quote_Pro_v2_FIXED` folder.
3. Confirm that `index.html`, `css`, `js`, and `supabase` are at the published root.
4. Force-refresh the website with `Ctrl + Shift + R`.
