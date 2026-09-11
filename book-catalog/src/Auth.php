<?php
declare(strict_types=1);

require_once __DIR__ . '/UserRepository.php';

/**
 * Session-based authentication for the admin area.
 *
 * The server keeps the "who is logged in" state in the session; the browser
 * only holds a random session id in a cookie. The cookie options below harden
 * that cookie against the common attacks (XSS theft, CSRF).
 */
final class Auth
{
    /**
     * Start the session with safe cookie options. Must run before any output.
     */
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        session_set_cookie_params([
            'httponly' => true,   // JavaScript can't read the cookie -> XSS can't steal it
            'samesite' => 'Lax',  // browser won't send it on cross-site POSTs -> CSRF defense
            'secure'   => (($_SERVER['HTTPS'] ?? '') !== ''), // HTTPS-only when we're on HTTPS
        ]);
        session_start();
    }

    /**
     * Verify a username/password pair. On success, log the user in and return
     * true; on failure, change nothing and return false.
     */
    public static function attempt(string $username, string $password): bool
    {
        $user = (new UserRepository())->findByUsername($username);

        // password_verify hashes the given password the same way and compares it
        // against the stored bcrypt hash. Never compare passwords with ===.
        if ($user === null || !password_verify($password, $user['password_hash'])) {
            return false;
        }

        // Fresh session id on login so a pre-login (possibly fixed) id can't be
        // reused to ride the new authenticated session (session fixation).
        session_regenerate_id(true);
        $_SESSION['user_id']  = (int) $user['id'];
        $_SESSION['username'] = $user['username'];
        return true;
    }

    /** Is someone logged in right now? */
    public static function check(): bool
    {
        return isset($_SESSION['user_id']);
    }

    /**
     * Guard for admin pages: if nobody is logged in, redirect to the login
     * form and stop. Call it at the top of every protected route.
     */
    public static function requireLogin(): void
    {
        if (!self::check()) {
            header('Location: /admin/login');
            exit;
        }
    }

    /** Username of the logged-in user, or null if nobody is logged in. */
    public static function username(): ?string
    {
        return $_SESSION['username'] ?? null;
    }

    /** Log out: clear the session data and destroy the session. */
    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }
}
