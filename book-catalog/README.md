# Book Catalog

A small full-stack web application for keeping a catalog of books, built as a
**portfolio project**. It has a public catalogue anyone can browse, reader
accounts (favourite and rate books), and an admin area for maintaining the
collection.

## Tech stack

- **PHP 8.3** — plain PHP, no framework (a small front controller in `public/index.php`)
- **MariaDB 11** — accessed through PDO with prepared statements
- **Docker + docker-compose** — the whole thing runs with one command
- **SASS** — source styles compiled to CSS; **Anton + Inter** web fonts
- Session-based authentication with roles, clean-URL routing

No framework was used on purpose: the goal was to show the fundamentals directly
(routing, PDO, sessions, roles, validation, CSRF) and keep the app trivial to run.

## Running it

The only requirement is Docker. From this folder:

```bash
cp .env.example .env          # database credentials (the .env is gitignored)
docker compose up --build
```

Then open **http://localhost:8080**. The schema, sample books, demo accounts and
a few sample ratings are created automatically on the first start (`db/schema.sql`).

## Accounts

Sign in at **/login** or create a reader account at **/signup**. Demo accounts
(all with password `admin123`, documented so the app can be tried immediately):

| Username   | Role  | Can do                                             |
|------------|-------|----------------------------------------------------|
| `admin`    | admin | add books, import from `books.json`, invite admins |
| `reader`   | user  | favourite and rate books                           |
| `bookworm` | user  | favourite and rate books                           |

> Demo credentials are committed on purpose. In a real deployment the admin
> password would be seeded randomly or supplied through secrets, never committed.

## What it does

**Public**
- Browse the catalogue as a grid of covers, search by title/author, print the list.
- Open a book for its details and its community rating (the average of readers' ratings).

**Readers** (any signed-up user)
- Favourite books and see them on a **Favourites** page.
- Rate a book 1–5; the book's shown rating is the average across all readers.

**Admins** (invite-only)
- Add a book through a validated form (server-side validation + CSRF).
- Import books from the prepared `books.json` (validates each entry, skips duplicates).
- Invite another admin via a one-time link (24 h, single-use).

## Project structure

```
book-catalog/
├── docker-compose.yml        # php-apache + mariadb services
├── Dockerfile                # php:8.3-apache + pdo_mysql + mod_rewrite
├── books.json                # sample data for the admin import
├── db/schema.sql             # tables + seed data (runs on first DB init)
├── public/                   # web root (Apache document root)
│   ├── index.php             # front controller / router
│   ├── .htaccess             # routes non-file requests to index.php
│   └── assets/{scss,css,js}/ # SASS source + compiled CSS + client JS
├── src/                      # application code
│   ├── Database.php          # single PDO connection
│   ├── BookRepository.php    # books + their average rating
│   ├── UserRepository.php    # user accounts
│   ├── FavouriteRepository.php
│   ├── RatingRepository.php
│   ├── Auth.php              # session login + roles
│   ├── Csrf.php              # CSRF token helper
│   ├── BookValidator.php     # shared book-input validation
│   ├── InviteRepository.php  # one-time admin invites
│   └── helpers.php           # e() escaping, stars() rendering
└── views/                    # PHP templates (public, auth, admin) + partials
```

## Notes

**Styling.** The source of truth is `public/assets/scss/style.scss`; the compiled
`public/assets/css/style.css` is committed so the running app needs only Docker
(no Node). To recompile after editing the SASS:

```bash
npx sass public/assets/scss/style.scss public/assets/css/style.css
```

**Security basics.** Passwords are stored as bcrypt hashes, all SQL uses prepared
statements, output is escaped, state-changing forms are CSRF-protected, admin
pages are role-guarded, and the session cookie is `HttpOnly` + `SameSite=Lax`.
