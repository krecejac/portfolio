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
}
