<?php
declare(strict_types=1);

/**
 * Single place that builds the PDO connection to MariaDB.
 * Call Database::connect() anywhere instead of repeating connection code.
 */
final class Database
{
    private static ?PDO $pdo = null;

    /** Return the shared PDO connection, opening it on first use. */
    public static function connect(): PDO
    {
        // Reuse one connection per request instead of opening a new one each call.
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $host = self::env('DB_HOST');
        $name = self::env('DB_NAME');
        $user = self::env('DB_USER');
        $pass = self::env('DB_PASSWORD');

        self::$pdo = new PDO(
            "mysql:host={$host};dbname={$name};charset=utf8mb4",
            $user,
            $pass,
            [
                // Throw exceptions on errors instead of failing silently.
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                // Return rows as associative arrays ($row['title']).
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Use real prepared statements (safer against SQL injection).
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );

        return self::$pdo;
    }

    /** Read a required environment variable, or fail if it is missing. */
    private static function env(string $key): string
    {
        $value = getenv($key);
        if ($value === false || $value === '') {
            throw new RuntimeException("Missing required environment variable: {$key}");
        }
        return $value;
    }
}
