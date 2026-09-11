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
        // avg_rating / rating_count come from the users' ratings (NULL when none).
        $statement = $this->pdo->query(
            'SELECT b.*,
                    ROUND(AVG(r.rating)) AS avg_rating,
                    COUNT(r.rating)      AS rating_count
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
                    ROUND(AVG(r.rating)) AS avg_rating,
                    COUNT(r.rating)      AS rating_count
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
        ?string $annotation
    ): int {
        $statement = $this->pdo->prepare(
            'INSERT INTO books (title, author, year, rating, annotation)
             VALUES (?, ?, ?, ?, ?)'
        );
        $statement->execute([$title, $author, $year, $rating, $annotation]);
        return (int) $this->pdo->lastInsertId();
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
