<?php
/**
 * @var array<int, array<string, mixed>> $books  the current user's favourites
 * @var string                           $csrf   CSRF token
 */
$csrf = $csrf ?? '';
$pageTitle = 'Favourites — Book Catalog';
require __DIR__ . '/partials/header.php';
$count = count($books);
?>
<p><a class="back-link" href="/">&lsaquo; Back to catalogue</a></p>

<section class="hero">
    <h1>Favourites</h1>
    <p class="lede">Books you have saved.</p>
    <p class="count"><strong id="count"><?= $count ?></strong> book<?= $count === 1 ? '' : 's' ?></p>
</section>

<?php if ($books === []): ?>
    <p class="empty">No favourites yet. Open a book and tap the heart to save it.</p>
<?php else: ?>
    <div class="catalogue-toolbar">
        <button type="button" class="btn btn--sm btn--secondary" onclick="window.print()">Print list</button>
    </div>

    <div class="search">
        <input type="search" id="book-search" placeholder="Search your favourites"
               aria-label="Search favourites" autocomplete="off">
    </div>

    <div class="cover-grid">
        <?php foreach ($books as $book): ?>
            <?php $hue = abs(crc32((string) $book['title'])) % 360; ?>
            <div class="book-card"
                 data-id="<?= (int) $book['id'] ?>"
                 data-search="<?= e(mb_strtolower($book['title'] . ' ' . $book['author'])) ?>">
                <a class="book-card__link" href="/?id=<?= (int) $book['id'] ?>">
                    <span class="cover" style="--hue: <?= $hue ?>">
                        <span class="cover-title"><?= e($book['title']) ?></span>
                        <span class="cover-author"><?= e($book['author']) ?></span>
                        <?php if (!empty($book['cover_url'])): ?>
                            <img class="cover-img" src="<?= e($book['cover_url']) ?>" alt="" loading="lazy" onerror="this.remove()">
                        <?php endif; ?>
                    </span>
                    <span class="info">
                        <span class="a"><?= e($book['author']) ?></span>
                        <span class="r">
                            <?= stars($book['avg_rating'] === null ? null : (int) $book['avg_rating']) ?>
                            <span class="year"><?= e((string) $book['year']) ?></span>
                        </span>
                    </span>
                </a>
                <form class="fav-toggle" method="post" action="/favourite">
                    <input type="hidden" name="book_id" value="<?= (int) $book['id'] ?>">
                    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                    <input type="hidden" name="return" value="/favourites">
                    <button type="submit" class="fav-toggle__btn is-on"
                            aria-pressed="true" aria-label="Remove from favourites">&#9829;</button>
                </form>
            </div>
        <?php endforeach; ?>
    </div>

    <p class="empty" id="no-results" hidden>No favourites match your search.</p>

    <!-- Print-only: a clean table of the saved books (follows the search too). -->
    <table class="print-list">
        <thead>
            <tr><th>Title</th><th>Author</th><th>Year</th><th>Rating</th></tr>
        </thead>
        <tbody>
            <?php foreach ($books as $book): ?>
                <tr data-id="<?= (int) $book['id'] ?>">
                    <td><?= e($book['title']) ?></td>
                    <td><?= e($book['author']) ?></td>
                    <td><?= e((string) $book['year']) ?></td>
                    <td><?= stars($book['avg_rating'] === null ? null : (int) $book['avg_rating']) ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <script src="<?= e(asset('/assets/js/catalog-search.js')) ?>" defer></script>
<?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
