<?php
declare(strict_types=1);

require __DIR__ . '/../src/BookRepository.php';

$repository = new BookRepository();
$books = $repository->all();
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Book Catalog</title>
    <style>
        body  { font-family: system-ui, sans-serif; max-width: 50rem; margin: 3rem auto; padding: 0 1rem; }
        table { border-collapse: collapse; width: 100%; }
        th, td { text-align: left; padding: .5rem .75rem; border-bottom: 1px solid #ddd; }
        th    { border-bottom: 2px solid #333; }
    </style>
</head>
<body>
    <h1>Book Catalog</h1>

    <table>
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
                    <td><?= htmlspecialchars($book['title'], ENT_QUOTES, 'UTF-8') ?></td>
                    <td><?= htmlspecialchars($book['author'], ENT_QUOTES, 'UTF-8') ?></td>
                    <td><?= htmlspecialchars((string) $book['year'], ENT_QUOTES, 'UTF-8') ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</body>
</html>
