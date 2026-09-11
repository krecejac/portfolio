# Book Catalog

A small full-stack web application for keeping a catalog of books, built as a
**portfolio project**. It has a public part (browse and print the catalog) and a
password-protected admin part (add books, import them from a JSON file).

## Tech stack

- **PHP 8.3** — plain PHP, no framework (a small front controller in `public/index.php`)
- **MariaDB 11** — accessed through PDO with prepared statements
- **Docker + docker-compose** — the whole thing runs with one command
- **SASS** — source styles compiled to CSS
- Session-based authentication, clean-URL routing

No framework was used on purpose: with a single table the goal was to show the
fundamentals directly (routing, PDO, sessions, validation, CSRF) and keep the
app trivial to run.

## Running it

The only requirement is Docker. From this folder:

```bash
cp .env.example .env          # database credentials (the .env is gitignored)
docker compose up --build
```

Then open **http://localhost:8080**.

The schema and three sample books are created automatically on the first start
(`db/schema.sql`).

## Admin area

Open **http://localhost:8080/admin/login** and sign in with the demo account:

| Username | Password   |
|----------|------------|
| `admin`  | `admin123` |

> These are demo credentials, committed on purpose so the app can be tried
> immediately. In a real deployment the admin password would be seeded randomly
> or supplied through secrets, never committed.

Once logged in you can:

- **Add a book** through a validated form — server-side validation is the source
  of truth, and the form is protected with a CSRF token.
- **Import books** from the prepared `books.json` file. Every entry is validated
  and duplicates are skipped, so the import is safe to run more than once.

## Project structure

```
book-catalog/
├── docker-compose.yml       # php-apache + mariadb services
├── Dockerfile               # php:8.3-apache + pdo_mysql + mod_rewrite
├── books.json               # sample data for the admin import
├── db/schema.sql            # tables + seed data (runs on first DB init)
├── public/                  # web root (Apache document root)
│   ├── index.php            # front controller / router
│   ├── .htaccess            # routes non-file requests to index.php
│   └── assets/{scss,css}/   # SASS source + compiled CSS
├── src/                     # application code
│   ├── Database.php         # single PDO connection
│   ├── BookRepository.php   # SQL for the books table
│   ├── UserRepository.php   # SQL for the users table
│   ├── Auth.php             # session-based login
│   ├── Csrf.php             # CSRF token helper
│   └── BookValidator.php    # shared book-input validation
└── views/                   # PHP templates (public + admin)
```

## Notes

**Styling.** The source of truth is `public/assets/scss/style.scss`; the compiled
`public/assets/css/style.css` is committed so the running app needs only Docker
(no Node). To recompile after editing the SASS:

```bash
npx sass public/assets/scss/style.scss public/assets/css/style.css
```

**Security basics.** Passwords are stored as bcrypt hashes, all SQL uses prepared
statements, output is escaped, admin forms are CSRF-protected, and the session
cookie is `HttpOnly` + `SameSite=Lax`.
