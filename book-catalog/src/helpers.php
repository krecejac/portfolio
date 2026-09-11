<?php
declare(strict_types=1);

/**
 * Small view helpers, shared by the templates.
 */

/** Escape a string for safe output in HTML. */
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/**
 * Render a 0–5 rating as filled/empty stars with an accessible label, or a
 * dash when there is no rating. Used by both the list and the detail page.
 */
function stars(?int $rating): string
{
    if ($rating === null) {
        return '<span class="stars stars--none" aria-label="No rating">&mdash;</span>';
    }
    $r = max(0, min(5, $rating));
    return '<span class="stars" role="img" aria-label="Rating ' . $r . ' of 5">'
        . '<span class="stars__on">' . str_repeat('★', $r) . '</span>'
        . '<span class="stars__off">' . str_repeat('☆', 5 - $r) . '</span>'
        . '</span>';
}
