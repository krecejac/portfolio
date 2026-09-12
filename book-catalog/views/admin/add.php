<?php
/**
 * @var array<string, string> $errors  field => error message (empty on first load)
 * @var array<string, string> $old     previously submitted values, to refill the form
 * @var string                $csrf    CSRF token, all provided by index.php
 */
$pageTitle = 'Add book — Book Catalog';
require __DIR__ . '/../partials/header.php';
?>
<p><a class="back-link" href="/admin">&lsaquo; Dashboard</a></p>

<form class="auth auth--wide" method="post" action="/admin/add">
    <h1>Add book</h1>

    <?php require __DIR__ . '/../partials/book-fields.php'; ?>

    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <button type="submit" class="btn">Add book</button>
</form>

<!-- Progressive enhancement: instant validation + title autocomplete. -->
<script src="<?= e(asset('/assets/js/add-validation.js')) ?>" defer></script>
<script src="<?= e(asset('/assets/js/book-lookup.js')) ?>" defer></script>
<?php require __DIR__ . '/../partials/footer.php'; ?>
