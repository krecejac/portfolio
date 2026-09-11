<?php
/**
 * Shared page top: opens the document and renders the frosted sticky nav bar.
 * Before requiring this, a view may set:
 *   $pageTitle (string)           browser tab title
 *   $navRight  (string, optional) HTML for the right-hand side of the nav
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
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <header class="site-header">
        <div class="site-header__inner">
            <a class="wordmark" href="/">Book Catalog</a>
            <nav class="site-nav"><?= $navRight ?></nav>
        </div>
    </header>
    <main class="wrap">
