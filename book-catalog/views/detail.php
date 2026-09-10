<?php /** @var array<string, mixed>|null $book  provided by index.php */ ?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Book detail — Book Catalog</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <p><a class="back-link" href="/">&larr; Back to list</a></p>

    <?php if ($book === null): ?>
        <h1>Book not found</h1>
        <p>No book with this id exists.</p>
    <?php else: ?>
        <article class="book-detail">
            <h1><?= htmlspecialchars($book['title'], ENT_QUOTES, 'UTF-8') ?></h1>
            <p class="meta">
                <?= htmlspecialchars($book['author'], ENT_QUOTES, 'UTF-8') ?>,
                <?= htmlspecialchars((string) $book['year'], ENT_QUOTES, 'UTF-8') ?>
            </p>
            <?php if ($book['rating'] !== null): ?>
                <p class="rating">Rating: <?= htmlspecialchars((string) $book['rating'], ENT_QUOTES, 'UTF-8') ?>/5</p>
            <?php endif; ?>
            <?php if ($book['annotation'] !== null): ?>
                <p class="annotation"><?= nl2br(htmlspecialchars($book['annotation'], ENT_QUOTES, 'UTF-8')) ?></p>
            <?php endif; ?>
        </article>
    <?php endif; ?>
</body>
</html>
