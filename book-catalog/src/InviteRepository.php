<?php
declare(strict_types=1);

require_once __DIR__ . '/Database.php';

/**
 * One-time admin invitations. Stores only the sha256 hash of each token, so a
 * leaked database can't reveal working invite links.
 */
final class InviteRepository
{
    private PDO $pdo;

    public function __construct()
    {
        $this->pdo = Database::connect();
    }

    /** Store a new invite (hash + expiry) and return its id. */
    public function create(string $tokenHash, string $expiresAt): int
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO invites (token_hash, expires_at) VALUES (?, ?)'
        );
        $statement->execute([$tokenHash, $expiresAt]);
        return (int) $this->pdo->lastInsertId();
    }

    /**
     * Find an invite by token hash that is still usable: not used and not yet
     * expired. Returns null otherwise.
     *
     * @return array<string, mixed>|null
     */
    public function findUsable(string $tokenHash): ?array
    {
        $statement = $this->pdo->prepare(
            'SELECT * FROM invites
             WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
             LIMIT 1'
        );
        $statement->execute([$tokenHash]);
        $invite = $statement->fetch(PDO::FETCH_ASSOC);
        return $invite ?: null;
    }

    /** Mark an invite as used so its link cannot be reused. */
    public function markUsed(int $id): void
    {
        $statement = $this->pdo->prepare('UPDATE invites SET used_at = NOW() WHERE id = ?');
        $statement->execute([$id]);
    }
}
