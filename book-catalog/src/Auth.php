<?php
declare(strict_types=1);

require_once __DIR__ . '/UserRepository.php';

/**
 * Session-based authentication.
 *
 * The server keeps the "who is logged in" state in the session; the browser
 * only holds a random session id in a cookie, hardened below (HttpOnly,
 * SameSite) against the common attacks.
 */
final class Auth
{
    /** Start the session with safe cookie options. Must run before any output. */
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        session_set_cookie_params([
            'httponly' => true,   // JavaScript can't read the cookie -> XSS can't steal it
            'samesite' => 'Lax',  // not sent on cross-site POSTs -> CSRF defense
            'secure'   => (($_SERVER['HTTPS'] ?? '') !== ''),
        ]);
        session_start();
    }

    /**
     * Verify a username/password pair. On success log the user in (recording
     * their id, name and role) and return true; otherwise return false.
     */
    public static function attempt(string $username, string $password): bool
    {
        $user = (new UserRepository())->findByUsername($username);
        if ($user === null || !password_verify($password, $user['password_hash'])) {
            return false;
        }

        session_regenerate_id(true);   // new id on login -> guards against fixation
        $_SESSION['user_id']  = (int) $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role']     = $user['role'];
        return true;
    }

    /** Log a freshly created user in (used right after sign-up). */
    public static function login(int $id, string $username, string $role): void
    {
        session_regenerate_id(true);
        $_SESSION['user_id']  = $id;
        $_SESSION['username'] = $username;
        $_SESSION['role']     = $role;
    }

    /** Is someone logged in right now? */
    public static function check(): bool
    {
        return isset($_SESSION['user_id']);
    }

    /** Id of the logged-in user, or null. */
    public static function id(): ?int
    {
        return $_SESSION['user_id'] ?? null;
    }

    /** Username of the logged-in user, or null. */
    public static function username(): ?string
    {
        return $_SESSION['username'] ?? null;
    }

    /** Is the logged-in user an admin? */
    public static function isAdmin(): bool
    {
        return (($_SESSION['role'] ?? null) === 'admin');
    }

    /** Guard for any logged-in area: redirect to the login page if not signed in. */
    public static function requireLogin(): void
    {
        if (!self::check()) {
            header('Location: /login');
            exit;
        }
    }

    /** Guard for admin-only pages: redirect unless signed in as an admin. */
    public static function requireAdmin(): void
    {
        if (!self::isAdmin()) {
            header('Location: /login');
            exit;
        }
    }

    /** Log out: clear the session data and destroy the session. */
    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
    }
}
