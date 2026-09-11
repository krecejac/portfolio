<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

/**
 * Reads user accounts. Only the admin login needs these for now.
 */
final class UserRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::connect();
    }

    /**
     * Find one user by username, or null if there is no such user.
     *
     * @return array<string, mixed>|null
     */
    public function findByUsername(string $username): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM users WHERE username = ?');
        $statement->execute([$username]);
        $user = $statement->fetch(PDO::FETCH_ASSOC);
        return $user ?: null;
    }
}
