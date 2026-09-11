<?php
/** @var array<string, mixed>|null $book  provided by index.php */
$pageTitle = $book !== null ? $book['title'] . ' — Book Catalog' : 'Book not found — Book Catalog';
require __DIR__ . '/partials/header.php';
?>
<p><a class="back-link" href="/">&lsaquo; Book Catalog</a></p>

<?php if ($book === null): ?>
    <article class="book-detail">
        <h1>Book not found</h1>
        <p class="annotation">No book with this id exists.</p>
    </article>
<?php else: ?>
    <article class="book-detail">
        <h1><?= e($book['title']) ?></h1>
        <p class="author"><?= e($book['author']) ?></p>
        <p class="meta">
            <span>Published <?= e((string) $book['year']) ?></span>
            <?php if ($book['rating'] !== null): ?>
                <?= stars((int) $book['rating']) ?>
            <?php endif; ?>
        </p>
        <?php if ($book['annotation'] !== null && $book['annotation'] !== ''): ?>
            <p class="annotation"><?= nl2br(e($book['annotation'])) ?></p>
        <?php endif; ?>
    </article>
<?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
