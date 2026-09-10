<?php /** @var array<string, mixed>|null $book  provided by index.php */ ?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Book detail — Book Catalog</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 50rem; margin: 3rem auto; padding: 0 1rem; }
        a    { color: #2563eb; }
        .meta { color: #555; }
    </style>
</head>
<body>
    <p><a href="/">&larr; Back to list</a></p>

    <?php if ($book === null): ?>
        <h1>Book not found</h1>
        <p>No book with this id exists.</p>
    <?php else: ?>
        <h1><?= htmlspecialchars($book['title'], ENT_QUOTES, 'UTF-8') ?></h1>
        <p class="meta">
            <?= htmlspecialchars($book['author'], ENT_QUOTES, 'UTF-8') ?>,
            <?= htmlspecialchars((string) $book['year'], ENT_QUOTES, 'UTF-8') ?>
        </p>
        <?php if ($book['rating'] !== null): ?>
            <p>Rating: <?= htmlspecialchars((string) $book['rating'], ENT_QUOTES, 'UTF-8') ?></p>
        <?php endif; ?>
        <?php if ($book['annotation'] !== null): ?>
            <p><?= nl2br(htmlspecialchars($book['annotation'], ENT_QUOTES, 'UTF-8')) ?></p>
        <?php endif; ?>
    <?php endif; ?>
</body>
</html>
