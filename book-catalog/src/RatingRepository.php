<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

/**
 * A user's rating of a book (1-5). One row per user+book.
 */
final class RatingRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::connect();
    }

    /** The user's rating for this book (1-5), or null if they haven't rated it. */
    public function userRating(int $userId, int $bookId): ?int
    {
        $statement = $this->pdo->prepare(
            'SELECT rating FROM ratings WHERE user_id = ? AND book_id = ?'
        );
        $statement->execute([$userId, $bookId]);
        $value = $statement->fetchColumn();
        return $value === false ? null : (int) $value;
    }

    /** Set (or update) the user's rating for a book. */
    public function rate(int $userId, int $bookId, int $rating): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO ratings (user_id, book_id, rating) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating)'
        );
        $statement->execute([$userId, $bookId, $rating]);
    }
}
