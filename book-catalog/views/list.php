<?php /** @var array<int, array<string, mixed>> $books  provided by index.php */ ?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Book Catalog</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <h1>Book Catalog</h1>

    <table class="book-table">
        <thead>
            <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Year</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($books as $book): ?>
                <tr>
                    <td>
                        <a href="/?id=<?= (int) $book['id'] ?>">
                            <?= htmlspecialchars($book['title'], ENT_QUOTES, 'UTF-8') ?>
                        </a>
                    </td>
                    <td><?= htmlspecialchars($book['author'], ENT_QUOTES, 'UTF-8') ?></td>
                    <td><?= htmlspecialchars((string) $book['year'], ENT_QUOTES, 'UTF-8') ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</body>
</html>
