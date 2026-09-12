<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

/**
 * A user's favourite books.
 */
final class FavouriteRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::connect();
    }

    /** Is this book among the user's favourites? */
    public function isFavourite(int $userId, int $bookId): bool
    {
        $statement = $this->pdo->prepare(
            'SELECT 1 FROM favourites WHERE user_id = ? AND book_id = ?'
        );
        $statement->execute([$userId, $bookId]);
        return (bool) $statement->fetchColumn();
    }

    /**
     * The ids of every book this user has favourited, so a listing can mark
     * hearts as filled without a query per card.
     *
     * @return array<int, int>
     */
    public function idsForUser(int $userId): array
    {
        $statement = $this->pdo->prepare('SELECT book_id FROM favourites WHERE user_id = ?');
        $statement->execute([$userId]);
        return array_map('intval', $statement->fetchAll(PDO::FETCH_COLUMN));
    }

    /** Add or remove a favourite, and return the new state (true = now a favourite). */
    public function toggle(int $userId, int $bookId): bool
    {
        if ($this->isFavourite($userId, $bookId)) {
            $this->pdo->prepare('DELETE FROM favourites WHERE user_id = ? AND book_id = ?')
                ->execute([$userId, $bookId]);
            return false;
        }
        $this->pdo->prepare('INSERT INTO favourites (user_id, book_id) VALUES (?, ?)')
            ->execute([$userId, $bookId]);
        return true;
    }

    /**
     * The user's favourite books, newest first, with their average rating.
     *
     * @return array<int, array<string, mixed>>
     */
    public function booksForUser(int $userId): array
    {
        $statement = $this->pdo->prepare(
            'SELECT b.*,
                    ROUND(AVG(r.rating)) AS avg_rating,
                    COUNT(r.rating)      AS rating_count
             FROM favourites f
             JOIN books b       ON b.id = f.book_id
             LEFT JOIN ratings r ON r.book_id = b.id
             WHERE f.user_id = ?
             GROUP BY b.id
             ORDER BY b.id DESC'
        );
        $statement->execute([$userId]);
        return $statement->fetchAll(PDO::FETCH_ASSOC);
    }
}
