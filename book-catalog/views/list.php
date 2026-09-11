<?php
/** @var array<int, array<string, mixed>> $books  provided by index.php */
$pageTitle = 'Book Catalog';
$navRight  = '<a class="nav-link" href="/admin/login">Sign in</a>'
           . '<button type="button" class="btn btn--sm btn--ghost" onclick="window.print()">Print</button>';
require __DIR__ . '/partials/header.php';
$count = count($books);
?>
<section class="hero">
    <h1>Book Catalog</h1>
    <p class="lede">Browse the collection, open a book for its details, or print the list.</p>
    <p class="count"><strong id="count"><?= $count ?></strong> book<?= $count === 1 ? '' : 's' ?></p>
</section>

<?php if ($books === []): ?>
    <p class="empty">No books in the catalogue yet.</p>
<?php else: ?>
    <div class="search">
        <input type="search" id="book-search" placeholder="Search by title or author"
               aria-label="Search books" autocomplete="off">
    </div>

    <div class="cover-grid">
        <?php foreach ($books as $book): ?>
            <?php $hue = abs(crc32((string) $book['title'])) % 360; ?>
            <a class="book-card" href="/?id=<?= (int) $book['id'] ?>"
               data-search="<?= e(mb_strtolower($book['title'] . ' ' . $book['author'])) ?>">
                <span class="cover" style="--hue: <?= $hue ?>">
                    <span class="cover-title"><?= e($book['title']) ?></span>
                    <span class="cover-author"><?= e($book['author']) ?></span>
                </span>
                <span class="info">
                    <span class="a"><?= e($book['author']) ?></span>
                    <span class="r">
                        <?= stars($book['rating'] === null ? null : (int) $book['rating']) ?>
                        <span class="year"><?= e((string) $book['year']) ?></span>
                    </span>
                </span>
            </a>
        <?php endforeach; ?>
    </div>

    <p class="empty" id="no-results" hidden>No books match your search.</p>
    <script src="/assets/js/catalog-search.js" defer></script>
<?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
