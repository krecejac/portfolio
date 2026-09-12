<?php
declare(strict_types=1);

/**
 * Small view helpers, shared by the templates.
 */

/**
 * Absolute path to a template under views/. Controllers live in src/Controllers/
 * while the templates live in views/, so this resolves the path from the project
 * root rather than from wherever the caller sits. Pass a name without the
 * extension, e.g. "detail" or "admin/dashboard".
 */
function view_path(string $name): string
{
    return dirname(__DIR__) . '/views/' . $name . '.php';
}

/** Escape a string for safe output in HTML. */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Cache-busting URL for a file under public/. Appends the file's last-modified
 * time as ?v=..., so the browser fetches a fresh copy whenever we recompile the
 * CSS or change a script, but still caches it between changes.
 */
function asset(string $path): string
{
    $mtime = @filemtime(__DIR__ . '/../public' . $path);
    return $mtime ? $path . '?v=' . $mtime : $path;
}

/**
 * Sanitise a "return to this page after the action" value. Only a same-site
 * path is allowed (must start with a single "/"), so it can never be turned
 * into an open redirect to another host; anything else falls back to $default.
 */
function safe_return(string $return, string $default): string
{
    if ($return !== '' && $return[0] === '/' && !str_starts_with($return, '//')) {
        return $return;
    }
    return $default;
}

/**
 * Render a 0–5 rating as filled/empty stars with an accessible label. When
 * there is no rating we still draw five empty stars (rather than a dash) so the
 * cards line up consistently. Used by the list, favourites and detail pages.
 */
function stars(?int $rating): string
{
    if ($rating === null) {
        return '<span class="stars stars--none" role="img" aria-label="No rating yet">'
            . '<span class="stars__off">' . str_repeat('☆', 5) . '</span>'
            . '</span>';
    }
    $r = max(0, min(5, $rating));
    return '<span class="stars" role="img" aria-label="Rating ' . $r . ' of 5">'
        . '<span class="stars__on">' . str_repeat('★', $r) . '</span>'
        . '<span class="stars__off">' . str_repeat('☆', 5 - $r) . '</span>'
        . '</span>';
}
