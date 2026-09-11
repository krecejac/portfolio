<?php
/**
 * @var array<string, mixed>|null $book         provided by index.php
 * @var bool                      $isFavourite  is it in the current user's favourites
 * @var int|null                  $userRating   the current user's own rating, or null
 * @var string                    $csrf         CSRF token (when signed in)
 */
$pageTitle = $book !== null ? $book['title'] . ' — Book Catalog' : 'Book not found — Book Catalog';
require __DIR__ . '/partials/header.php';
?>
<p><a class="back-link" href="/">&lsaquo; Back to catalogue</a></p>

<?php if ($book === null): ?>
    <section class="empty-state">
        <h1>Book not found</h1>
        <p class="annotation">No book with this id exists.</p>
    </section>
<?php else: ?>
    <?php $hue = abs(crc32((string) $book['title'])) % 360; ?>
    <article class="book-detail">
        <span class="cover" style="--hue: <?= $hue ?>">
            <span class="cover-title"><?= e($book['title']) ?></span>
            <span class="cover-author"><?= e($book['author']) ?></span>
        </span>
        <div class="book-detail__body">
            <h1><?= e($book['title']) ?></h1>
            <p class="author"><?= e($book['author']) ?></p>
            <p class="meta">
                <span>Published <?= e((string) $book['year']) ?></span>
                <?php if ((int) $book['rating_count'] > 0): ?>
                    <span class="rating">
                        <?= stars((int) $book['avg_rating']) ?>
                        <span class="rating-count"><?= (int) $book['rating_count'] ?> rating<?= (int) $book['rating_count'] === 1 ? '' : 's' ?></span>
                    </span>
                <?php else: ?>
                    <span class="stars--none">No ratings yet</span>
                <?php endif; ?>
            </p>

            <?php if (Auth::check()): ?>
                <div class="book-actions">
                    <form method="post" action="/favourite">
                        <input type="hidden" name="book_id" value="<?= (int) $book['id'] ?>">
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <button type="submit" class="fav-btn <?= $isFavourite ? 'is-on' : '' ?>">
                            <?= $isFavourite ? '&#9829; Favourited' : '&#9825; Add to favourites' ?>
                        </button>
                    </form>

                    <form class="rate" method="post" action="/rate">
                        <input type="hidden" name="book_id" value="<?= (int) $book['id'] ?>">
                        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                        <span class="rate-label">Your rating</span>
                        <?php for ($i = 1; $i <= 5; $i++): ?>
                            <button type="submit" name="rating" value="<?= $i ?>"
                                    class="star-btn <?= ($userRating !== null && $i <= $userRating) ? 'on' : '' ?>"
                                    aria-label="Rate <?= $i ?> of 5">★</button>
                        <?php endfor; ?>
                    </form>
                </div>
            <?php else: ?>
                <p class="signin-hint"><a href="/login">Sign in</a> to rate and favourite this book.</p>
            <?php endif; ?>

            <?php if ($book['annotation'] !== null && $book['annotation'] !== ''): ?>
                <p class="annotation"><?= nl2br(e($book['annotation'])) ?></p>
            <?php endif; ?>
        </div>
    </article>
<?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
