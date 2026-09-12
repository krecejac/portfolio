<?php
declare(strict_types=1);

/**
 * Minimal path-based router.
 *
 * The front controller registers one handler per URL path and then dispatches
 * the current request to it. This deliberately stays a plain lookup table, not a
 * framework: there is no regex matching, no middleware stack and no dependency
 * container. Each handler decides for itself how to treat the HTTP method (many
 * pages serve a form on GET and process it on POST), which keeps the behaviour
 * identical to the switch this replaced.
 */
final class Router
{
    /** @var array<string, callable> path => handler */
    private array $routes = [];

    /** @var array<string, string> path => redirect target (kept for old URLs) */
    private array $redirects = [];

    /** Register the handler that answers a path. */
    public function on(string $path, callable $handler): void
    {
        $this->routes[$path] = $handler;
    }

    /** Permanently point an old path at a new one (302 redirect). */
    public function redirect(string $from, string $to): void
    {
        $this->redirects[$from] = $to;
    }

    /** Run the handler for $path, or send a redirect / 404 if there is none. */
    public function dispatch(string $path): void
    {
        if (isset($this->redirects[$path])) {
            header('Location: ' . $this->redirects[$path]);
            return;
        }

        $handler = $this->routes[$path] ?? null;
        if ($handler === null) {
            http_response_code(404);
            echo 'Page not found.';
            return;
        }

        $handler();
    }
}
