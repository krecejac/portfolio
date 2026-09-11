<?php
/** @var array<int, array<string, mixed>> $books  the current user's favourites */
$pageTitle = 'Favourites — Book Catalog';
require __DIR__ . '/partials/header.php';
?>
<section class="hero">
    <h1>Favourites</h1>
    <p class="lede">Books you have saved.</p>
</section>

<?php if ($books === []): ?>
    <p class="empty">No favourites yet. Open a book and tap the heart to save it.</p>
<?php else: ?>
    <div class="cover-grid">
        <?php foreach ($books as $book): ?>
            <?php $hue = abs(crc32((string) $book['title'])) % 360; ?>
            <a class="book-card" href="/?id=<?= (int) $book['id'] ?>">
                <span class="cover" style="--hue: <?= $hue ?>">
                    <span class="cover-title"><?= e($book['title']) ?></span>
                    <span class="cover-author"><?= e($book['author']) ?></span>
                </span>
                <span class="info">
                    <span class="a"><?= e($book['author']) ?></span>
                    <span class="r">
                        <?= stars($book['avg_rating'] === null ? null : (int) $book['avg_rating']) ?>
                        <span class="year"><?= e((string) $book['year']) ?></span>
                    </span>
                </span>
            </a>
        <?php endforeach; ?>
    </div>
<?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
