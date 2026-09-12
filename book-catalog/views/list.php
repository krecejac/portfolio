<?php
/**
 * @var array<int, array<string, mixed>> $books   provided by index.php
 * @var array<int, int>                  $favIds  book ids the current user favourited
 * @var string                           $csrf    CSRF token (when signed in)
 */
$favIds = $favIds ?? [];
$csrf   = $csrf ?? '';
$pageTitle = 'Book Catalog';
$navRight  = '<button type="button" class="btn btn--sm btn--ghost" onclick="window.print()">Print</button>';
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
            <?php
            $hue = abs(crc32((string) $book['title'])) % 360;
            $isFav = in_array((int) $book['id'], $favIds, true);
            ?>
            <div class="book-card" data-search="<?= e(mb_strtolower($book['title'] . ' ' . $book['author'])) ?>">
                <a class="book-card__link" href="/?id=<?= (int) $book['id'] ?>">
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
                <?php if (Auth::check()): ?>
                    <form class="fav-toggle" method="post" action="/favourite">
                        <input type="hidden" name="book_id" value="<?= (int) $book['id'] ?>">
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <input type="hidden" name="return" value="/">
                        <button type="submit" class="fav-toggle__btn <?= $isFav ? 'is-on' : '' ?>"
                                aria-pressed="<?= $isFav ? 'true' : 'false' ?>"
                                aria-label="<?= $isFav ? 'Remove from favourites' : 'Add to favourites' ?>">
                            <?= $isFav ? '&#9829;' : '&#9825;' ?>
                        </button>
                    </form>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
    </div>

    <p class="empty" id="no-results" hidden>No books match your search.</p>

    <!-- Print-only: a clean list of the catalogue. The screen shows the cover
         grid; on paper a table reads better and prints reliably. -->
    <table class="print-list">
        <thead>
            <tr><th>Title</th><th>Author</th><th>Year</th><th>Rating</th></tr>
        </thead>
        <tbody>
            <?php foreach ($books as $book): ?>
                <tr>
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
