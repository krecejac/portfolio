<?php
/**
 * @var array<string, string> $errors  field => error message (empty on first load)
 * @var array<string, string> $old     previously submitted values, to refill the form
 * @var string                $csrf    CSRF token, all provided by index.php
 */
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Add book — Book Catalog</title>
    <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
    <p><a class="back-link" href="/admin">&larr; Back to admin</a></p>

    <form class="auth auth--wide" method="post" action="/admin/add">
        <h1>Add book</h1>

        <label>Title
            <input type="text" name="title"
                   value="<?= htmlspecialchars($old['title'], ENT_QUOTES, 'UTF-8') ?>">
            <?php if (isset($errors['title'])): ?>
                <span class="field-error"><?= htmlspecialchars($errors['title'], ENT_QUOTES, 'UTF-8') ?></span>
            <?php endif; ?>
        </label>

        <label>Author
            <input type="text" name="author"
                   value="<?= htmlspecialchars($old['author'], ENT_QUOTES, 'UTF-8') ?>">
            <?php if (isset($errors['author'])): ?>
                <span class="field-error"><?= htmlspecialchars($errors['author'], ENT_QUOTES, 'UTF-8') ?></span>
            <?php endif; ?>
        </label>

        <label>Year
            <input type="number" name="year"
                   value="<?= htmlspecialchars($old['year'], ENT_QUOTES, 'UTF-8') ?>">
            <?php if (isset($errors['year'])): ?>
                <span class="field-error"><?= htmlspecialchars($errors['year'], ENT_QUOTES, 'UTF-8') ?></span>
            <?php endif; ?>
        </label>

        <label>Rating (1&ndash;5, optional)
            <input type="number" name="rating"
                   value="<?= htmlspecialchars($old['rating'], ENT_QUOTES, 'UTF-8') ?>">
            <?php if (isset($errors['rating'])): ?>
                <span class="field-error"><?= htmlspecialchars($errors['rating'], ENT_QUOTES, 'UTF-8') ?></span>
            <?php endif; ?>
        </label>

        <label>Annotation (optional)
            <textarea name="annotation"><?= htmlspecialchars($old['annotation'], ENT_QUOTES, 'UTF-8') ?></textarea>
        </label>

        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">
        <button type="submit" class="btn">Add book</button>
    </form>
</body>
</html>
