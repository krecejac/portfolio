<?php
/** @var array<int, array<string, mixed>> $books  provided by index.php */
$pageTitle = 'Book Catalog';
$navRight  = '<button type="button" class="btn btn--sm btn--secondary" onclick="window.print()">Print</button>';
require __DIR__ . '/partials/header.php';
$count = count($books);
?>
<section class="hero">
    <h1>Book Catalog</h1>
    <p class="count"><span id="count"><?= $count ?></span> book<?= $count === 1 ? '' : 's' ?></p>
</section>

<?php if ($books === []): ?>
    <div class="list-card">
        <table class="book-table">
            <tbody><tr class="empty-row"><td>No books in the catalogue yet.</td></tr></tbody>
        </table>
    </div>
<?php else: ?>
    <div class="search">
        <input type="search" id="book-search" placeholder="Search by title or author"
               aria-label="Search books" autocomplete="off">
    </div>

    <div class="list-card">
        <table class="book-table" id="book-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Year</th>
                    <th>Rating</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($books as $book): ?>
                    <tr data-search="<?= e(mb_strtolower($book['title'] . ' ' . $book['author'])) ?>">
                        <td class="col-title">
                            <a href="/?id=<?= (int) $book['id'] ?>"><?= e($book['title']) ?></a>
                        </td>
                        <td class="col-author"><?= e($book['author']) ?></td>
                        <td class="col-year"><?= e((string) $book['year']) ?></td>
                        <td class="col-rating"><?= stars($book['rating'] === null ? null : (int) $book['rating']) ?></td>
                    </tr>
                <?php endforeach; ?>
                <tr class="empty-row" id="no-results" hidden>
                    <td colspan="4">No books match your search.</td>
                </tr>
            </tbody>
        </table>
    </div>

    <script src="/assets/js/catalog-search.js" defer></script>
<?php endif; ?>
<?php require __DIR__ . '/partials/footer.php'; ?>
