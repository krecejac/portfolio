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
        $statement = $this->pdo->query('SELECT * FROM books ORDER BY id DESC');
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
        $statement = $this->pdo->prepare('SELECT * FROM books WHERE id = ?');
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
}
