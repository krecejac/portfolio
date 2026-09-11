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

-- Admin users for the administration part. We store only a bcrypt hash of the
-- password, never the plain text. UNIQUE on username prevents duplicates.
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL
);

-- Seed one admin account: admin / admin123 (documented in the README so a
-- reviewer can log in). The hash below was generated with PHP's
-- password_hash('admin123', PASSWORD_DEFAULT); never commit a plain password.
INSERT INTO users (username, password_hash) VALUES
    ('admin', '$2y$10$aivpV7vnWkKanOrH5V1lwe1aoNP2ItwSm/c5BO02zcWD3r2SAkOqW');