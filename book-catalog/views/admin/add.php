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

    <label>Title
        <input type="text" name="title" value="<?= e($old['title']) ?>">
        <?php if (isset($errors['title'])): ?>
            <span class="field-error"><?= e($errors['title']) ?></span>
        <?php endif; ?>
    </label>

    <label>Author
        <input type="text" name="author" value="<?= e($old['author']) ?>">
        <?php if (isset($errors['author'])): ?>
            <span class="field-error"><?= e($errors['author']) ?></span>
        <?php endif; ?>
    </label>

    <label>Year
        <input type="number" name="year" value="<?= e($old['year']) ?>">
        <?php if (isset($errors['year'])): ?>
            <span class="field-error"><?= e($errors['year']) ?></span>
        <?php endif; ?>
    </label>

    <div class="rating-field">
        <span class="rating-field__label">Rating (optional)</span>
        <?php require __DIR__ . '/../partials/rating-input.php'; ?>
        <?php if (isset($errors['rating'])): ?>
            <span class="field-error"><?= e($errors['rating']) ?></span>
        <?php endif; ?>
    </div>

    <label>Annotation (optional)
        <textarea name="annotation"><?= e($old['annotation']) ?></textarea>
    </label>

    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <button type="submit" class="btn">Add book</button>
</form>

<!-- Progressive enhancement: instant validation. The server validates too. -->
<script src="<?= e(asset('/assets/js/add-validation.js')) ?>" defer></script>
<?php require __DIR__ . '/../partials/footer.php'; ?>
