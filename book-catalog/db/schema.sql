-- Schema for the Book Catalog database.
-- Runs automatically on first DB init (mounted into docker-entrypoint-initdb.d).
-- The book rows (incl. genres and real cover URLs) are generated from books.json.

CREATE TABLE books (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255)  NOT NULL,
    author      VARCHAR(255)  NOT NULL,
    year        SMALLINT      NOT NULL,
    rating      TINYINT       NULL,
    annotation  TEXT          NULL,
    genre       VARCHAR(100)  NULL,   -- for filtering; filled by hand or by the Open Library lookup
    cover_url   VARCHAR(500)  NULL    -- real cover; falls back to a generated one when empty/offline
);

INSERT INTO books (title, author, year, annotation, genre, cover_url) VALUES
    ('The Hobbit', 'J.R.R. Tolkien', 1937, 'A hobbit is swept into a quest to reclaim a treasure guarded by a dragon.', 'Fantasy', 'https://covers.openlibrary.org/b/id/10762989-M.jpg'),
    ('1984', 'George Orwell', 1949, 'A chilling vision of a totalitarian future under constant surveillance.', 'Dystopian', 'https://covers.openlibrary.org/b/id/853463-M.jpg'),
    ('Dune', 'Frank Herbert', 1965, 'On the desert planet Arrakis, a young heir confronts destiny and power.', 'Science Fiction', 'https://covers.openlibrary.org/b/id/475886-M.jpg'),
    ('Pride and Prejudice', 'Jane Austen', 1813, 'Wit and misunderstanding shape the courtship of Elizabeth and Darcy.', 'Romance', NULL),
    ('The Great Gatsby', 'F. Scott Fitzgerald', 1925, 'Wealth, longing and disillusion in the Jazz Age.', 'Fiction', 'https://covers.openlibrary.org/b/id/8432032-M.jpg'),
    ('To Kill a Mockingbird', 'Harper Lee', 1960, 'A child watches her father defend an innocent man in the Deep South.', 'Fiction', 'https://covers.openlibrary.org/b/id/12784310-M.jpg'),
    ('The Catcher in the Rye', 'J.D. Salinger', 1951, 'A few restless days in the life of Holden Caulfield.', 'Fiction', 'https://covers.openlibrary.org/b/id/10737898-M.jpg'),
    ('Brave New World', 'Aldous Huxley', 1932, 'A engineered society trades freedom for comfort.', 'Dystopian', NULL),
    ('Fahrenheit 451', 'Ray Bradbury', 1953, 'A fireman who burns books begins to question everything.', 'Science Fiction', NULL),
    ('The Lord of the Rings', 'J.R.R. Tolkien', 1954, 'A fellowship sets out to destroy a ring of terrible power.', 'Fantasy', 'https://covers.openlibrary.org/b/id/6853080-M.jpg'),
    ('Harry Potter and the Philosopher''s Stone', 'J.K. Rowling', 1997, 'An orphan discovers he is a wizard and a world of magic.', 'Fantasy', 'https://covers.openlibrary.org/b/id/3237622-M.jpg'),
    ('The Da Vinci Code', 'Dan Brown', 2003, 'A symbologist races to solve a murder tangled in ancient secrets.', 'Thriller', 'https://covers.openlibrary.org/b/id/583059-M.jpg'),
    ('The Girl with the Dragon Tattoo', 'Stieg Larsson', 2005, 'A journalist and a hacker investigate a decades-old disappearance.', 'Mystery', NULL),
    ('Gone Girl', 'Gillian Flynn', 2012, 'A marriage unravels when a wife vanishes on her anniversary.', 'Thriller', NULL),
    ('The Hunger Games', 'Suzanne Collins', 2008, 'A girl volunteers for a televised fight to the death.', 'Science Fiction', NULL),
    ('The Shining', 'Stephen King', 1977, 'A haunted hotel preys on a caretaker and his family.', 'Horror', 'https://covers.openlibrary.org/b/id/4822686-M.jpg'),
    ('It', 'Stephen King', 1986, 'Seven friends face an ancient evil that wears many faces.', 'Horror', NULL),
    ('Dracula', 'Bram Stoker', 1897, 'The classic tale of the count who feeds on the living.', 'Horror', 'https://covers.openlibrary.org/b/id/8028797-M.jpg'),
    ('Frankenstein', 'Mary Shelley', 1818, 'A scientist creates life and unleashes tragedy.', 'Horror', 'https://covers.openlibrary.org/b/id/7267770-M.jpg'),
    ('The Name of the Wind', 'Patrick Rothfuss', 2007, 'A legendary figure recounts how he became a myth.', 'Fantasy', NULL);

CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(20)   NOT NULL DEFAULT 'user'
);

-- Demo accounts, all with password admin123 (bcrypt).
INSERT INTO users (username, password_hash, role) VALUES
    ('admin',    '$2y$10$aivpV7vnWkKanOrH5V1lwe1aoNP2ItwSm/c5BO02zcWD3r2SAkOqW', 'admin'),
    ('reader',   '$2y$10$aivpV7vnWkKanOrH5V1lwe1aoNP2ItwSm/c5BO02zcWD3r2SAkOqW', 'user'),
    ('bookworm', '$2y$10$aivpV7vnWkKanOrH5V1lwe1aoNP2ItwSm/c5BO02zcWD3r2SAkOqW', 'user');

CREATE TABLE invites (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    token_hash CHAR(64)  NOT NULL,
    expires_at DATETIME  NOT NULL,
    used_at    DATETIME  NULL
);

CREATE TABLE favourites (
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

CREATE TABLE ratings (
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    rating  TINYINT NOT NULL,
    PRIMARY KEY (user_id, book_id)
);

-- Varied community ratings so the stars and the rating filter are meaningful.
INSERT INTO ratings (user_id, book_id, rating) VALUES
    (2, 1, 5),
    (2, 2, 4),
    (2, 3, 3),
    (3, 3, 3),
    (2, 4, 2),
    (2, 5, 5),
    (2, 6, 4),
    (3, 6, 3),
    (2, 7, 3),
    (2, 8, 2),
    (2, 9, 5),
    (3, 9, 3),
    (2, 10, 4),
    (2, 11, 3),
    (2, 12, 2),
    (3, 12, 3),
    (2, 13, 5),
    (2, 14, 4),
    (2, 15, 3),
    (3, 15, 3),
    (2, 16, 2),
    (2, 17, 5),
    (2, 18, 4),
    (3, 18, 3),
    (2, 19, 3),
    (2, 20, 2);

-- A few favourites for the demo readers.
INSERT INTO favourites (user_id, book_id) VALUES
    (2, 1), (2, 3), (2, 10), (3, 2), (3, 16);
