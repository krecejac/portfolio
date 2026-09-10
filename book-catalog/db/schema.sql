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