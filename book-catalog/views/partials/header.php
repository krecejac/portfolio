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
    <script>
        // Set the theme before paint (stored choice, else the system preference)
        // so there is no flash of the wrong colours.
        (function () {
            try {
                var t = localStorage.getItem('theme');
                if (t !== 'light' && t !== 'dark') {
                    t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', t);
            } catch (e) {}
        })();
    </script>
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
                <button type="button" class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle light or dark theme"></button>
                <?php if (Auth::check()): ?>
                    <a class="nav-link" href="/favourites">Favourites</a>
                    <details class="user-menu">
                        <summary>
                            <span class="avatar"><?= e(mb_strtoupper(mb_substr((string) Auth::username(), 0, 1))) ?></span>
                            <span class="user-menu__name"><?= e(Auth::username()) ?></span>
                        </summary>
                        <div class="user-menu__panel">
                            <?php if (Auth::isAdmin()): ?>
                                <a href="/admin">Admin</a>
                            <?php endif; ?>
                            <a href="/logout">Log out</a>
                        </div>
                    </details>
                <?php else: ?>
                    <a class="nav-link" href="/login">Sign in</a>
                    <a class="btn btn--sm" href="/signup">Sign up</a>
                <?php endif; ?>
            </nav>
        </div>
    </header>
    <main class="wrap">
