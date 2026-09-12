<?php
/**
 * Shared fields for the add and edit book forms, so the two never drift.
 *
 * @var array<string, string> $old     current field values
 * @var array<string, string> $errors  field => error message
 */
?>
<label class="lookup-field">Title
    <input type="text" name="title" value="<?= e($old['title']) ?>" autocomplete="off">
    <!-- Open Library suggestions (book-lookup.js); the form works without it. -->
    <div class="lookup-results" hidden></div>
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

<label>Genre (optional)
    <input type="text" name="genre" value="<?= e($old['genre']) ?>" list="genre-options" autocomplete="off">
    <datalist id="genre-options">
        <?php foreach (['Fiction', 'Non-fiction', 'Fantasy', 'Science Fiction', 'Mystery',
                        'Thriller', 'Romance', 'Biography', 'History', 'Programming',
                        'Software Architecture', 'Science', 'Poetry', 'Philosophy', 'Self-help'] as $g): ?>
            <option value="<?= e($g) ?>"></option>
        <?php endforeach; ?>
    </datalist>
    <?php if (isset($errors['genre'])): ?>
        <span class="field-error"><?= e($errors['genre']) ?></span>
    <?php endif; ?>
</label>

<div class="rating-field">
    <span class="rating-field__label">Rating (optional)</span>
    <?php require __DIR__ . '/rating-input.php'; ?>
    <?php if (isset($errors['rating'])): ?>
        <span class="field-error"><?= e($errors['rating']) ?></span>
    <?php endif; ?>
</div>

<label>Annotation (optional)
    <textarea name="annotation"><?= e($old['annotation']) ?></textarea>
</label>

<!-- Set by book-lookup.js when a suggestion is picked; falls back to a generated cover. -->
<input type="hidden" name="cover_url" value="<?= e($old['cover_url']) ?>">
<?php if (isset($errors['cover_url'])): ?>
    <span class="field-error"><?= e($errors['cover_url']) ?></span>
<?php endif; ?>
