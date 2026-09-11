<?php
/**
 * Shared page top: opens the document and renders the sticky nav bar. The
 * right-hand side adapts to who is signed in. A view may set before requiring:
 *   $pageTitle (string)           browser tab title
 *   $navRight  (string, optional) extra nav HTML (e.g. a Print button)
 */
$pageTitle = $pageTitle ?? 'Book Catalog';
$navRight  = $navRight ?? '';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= e($pageTitle) ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <header class="site-header">
        <div class="site-header__inner">
            <a class="wordmark" href="/">Book Catalog</a>
            <nav class="site-nav">
                <?= $navRight ?>
                <?php if (Auth::check()): ?>
                    <?php if (Auth::isAdmin()): ?>
                        <a class="nav-link" href="/admin">Admin</a>
                    <?php endif; ?>
                    <a class="nav-link" href="/favourites">Favourites</a>
                    <span class="nav-user"><?= e(Auth::username()) ?></span>
                    <a class="btn btn--sm btn--secondary" href="/logout">Log out</a>
                <?php else: ?>
                    <a class="nav-link" href="/login">Sign in</a>
                    <a class="btn btn--sm" href="/signup">Sign up</a>
                <?php endif; ?>
            </nav>
        </div>
    </header>
    <main class="wrap">
