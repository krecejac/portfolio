-- Schema for the Book Catalog database.
-- Runs automatically on first DB init (mounted into docker-entrypoint-initdb.d).

CREATE TABLE books (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)  NOT NULL,
    author      VARCHAR(255)  NOT NULL,
    year        SMALLINT      NOT NULL,
    rating      TINYINT       NULL,
    annotation  TEXT          NULL
);

-- Insert some sample data into the books table.
INSERT INTO books (title, author, year, rating, annotation) VALUES
    ('Book A', 'Author A', 2020, 5, 'Short annotation.'),
    ('Book B', 'Author B', 2019, 4, 'Another short annotation.'),
    ('Book C', 'Author C', 2021, 1, 'Third short annotation.');

-- Accounts. role is 'admin' (manages the catalogue, invite-only) or 'user'
-- (signs up publicly, can favourite and rate books).
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(20)   NOT NULL DEFAULT 'user'
);

-- Seed one admin (admin / admin123) and two demo readers (also admin123, so a
-- reviewer can log in as a normal user). Hashes are bcrypt of the password.
INSERT INTO users (username, password_hash, role) VALUES
    ('admin',    '$2y$10$aivpV7vnWkKanOrH5V1lwe1aoNP2ItwSm/c5BO02zcWD3r2SAkOqW', 'admin'),
    ('reader',   '$2y$10$aivpV7vnWkKanOrH5V1lwe1aoNP2ItwSm/c5BO02zcWD3r2SAkOqW', 'user'),
    ('bookworm', '$2y$10$aivpV7vnWkKanOrH5V1lwe1aoNP2ItwSm/c5BO02zcWD3r2SAkOqW', 'user');

-- One-time invitations to create a new admin account. We store only a sha256
-- hash of the token (never the token itself), plus its expiry and whether it
-- has already been used.
CREATE TABLE invites (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64)  NOT NULL,   -- sha256 hex of the invite token
    expires_at DATETIME  NOT NULL,
    used_at    DATETIME  NULL
);

-- A user's favourite books (one row per user+book).
CREATE TABLE favourites (
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

-- A user's rating of a book, 1-5 (one row per user+book). The rating shown for
-- a book is the average of these.
CREATE TABLE ratings (
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    rating  TINYINT NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

-- Seed a few ratings from the demo readers so the sample books show averages.
INSERT INTO ratings (user_id, book_id, rating) VALUES
    (2, 1, 5), (3, 1, 4),
    (2, 2, 4), (3, 2, 4),
    (2, 3, 3), (3, 3, 2);

-- And a couple of favourites.
INSERT INTO favourites (user_id, book_id) VALUES
    (2, 1), (2, 2);
