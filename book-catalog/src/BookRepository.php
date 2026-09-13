<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

/**
 * Reads and writes books. The only place with SQL for the books table.
 */
final class BookRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::connect();
    }

    /**
     * Return all books, newest id first.
     *
     * @return array<int, array<string, mixed>>  list of book rows
     */
    public function all(): array
    {
        // avg_rating is the readers' average; when a book has no reader ratings it
        // falls back to the admin's editorial books.rating (NULL only if neither
        // exists). rating_count is the number of reader ratings, so the views can
        // still tell a community score from the editorial fallback.
        $statement = $this->pdo->query(
            'SELECT b.*,
                    ROUND(COALESCE(AVG(r.rating), b.rating)) AS avg_rating,
                    COUNT(r.rating)                          AS rating_count
             FROM books b
             LEFT JOIN ratings r ON r.book_id = b.id
             GROUP BY b.id
             ORDER BY b.id DESC'
        );
        $result = $statement->fetchAll(PDO::FETCH_ASSOC);
        return $result;
    }

    /**
     * Return a single book by id, or null if it does not exist.
     *
     * @return array<string, mixed>|null
     */
    public function find(int $id): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT b.*,
                    ROUND(COALESCE(AVG(r.rating), b.rating)) AS avg_rating,
                    COUNT(r.rating)                          AS rating_count
             FROM books b
             LEFT JOIN ratings r ON r.book_id = b.id
             WHERE b.id = ?
             GROUP BY b.id'
        );
        $statement->execute([$id]);
        $book = $statement->fetch(PDO::FETCH_ASSOC);
        return $book ?: null;
    }

    /**
     * Insert a new book. Values are already validated by the caller.
     * Returns the id of the newly created row.
     */
    public function create(
        string $title,
        string $author,
        int $year,
        ?int $rating,
        ?string $annotation,
        ?string $genre = null,
        ?string $coverUrl = null
    ): int {
        $statement = $this->pdo->prepare(
            'INSERT INTO books (title, author, year, rating, annotation, genre, cover_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $statement->execute([$title, $author, $year, $rating, $annotation, $genre, $coverUrl]);
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Update an existing book. Values are already validated by the caller.
     */
    public function update(
        int $id,
        string $title,
        string $author,
        int $year,
        ?int $rating,
        ?string $annotation,
        ?string $genre = null,
        ?string $coverUrl = null
    ): void {
        $statement = $this->pdo->prepare(
            'UPDATE books
                SET title = ?, author = ?, year = ?, rating = ?, annotation = ?, genre = ?, cover_url = ?
              WHERE id = ?'
        );
        $statement->execute([$title, $author, $year, $rating, $annotation, $genre, $coverUrl, $id]);
    }

    /**
     * Delete a book. Its favourites and ratings rows are removed automatically by
     * the ON DELETE CASCADE foreign keys, so only the book itself is deleted here.
     */
    public function delete(int $id): void
    {
        $this->pdo->prepare('DELETE FROM books WHERE id = ?')->execute([$id]);
    }

    /**
     * Is there already a book with the same title, author and year?
     * Used by the import to skip duplicates so re-running it is safe.
     */
    public function existsSame(string $title, string $author, int $year): bool
    {
        $statement = $this->pdo->prepare(
            'SELECT 1 FROM books WHERE title = ? AND author = ? AND year = ? LIMIT 1'
        );
        $statement->execute([$title, $author, $year]);
        return (bool) $statement->fetchColumn();
    }
}
