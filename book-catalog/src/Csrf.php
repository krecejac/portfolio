<?php
declare(strict_types=1);

/**
 * CSRF protection for forms.
 *
 * A random token is stored in the session and echoed into every form as a
 * hidden field. On submit we compare the two: a real form has the matching
 * token, a forged cross-site request cannot know it. Assumes the session has
 * already been started (Auth::start()).
 */
final class Csrf
{
    /** Return the session's token, creating one on first use. */
    public static function token(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    /** True if the submitted token matches the one in the session. */
    public static function check(?string $token): bool
    {
        // hash_equals compares in constant time so an attacker can't guess the
        // token byte by byte from how long the comparison takes (timing attack).
        return is_string($token)
            && !empty($_SESSION['csrf'])
            && hash_equals($_SESSION['csrf'], $token);
    }
}
