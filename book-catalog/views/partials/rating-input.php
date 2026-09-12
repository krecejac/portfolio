<?php
/**
 * Star rating picker for the add/edit forms.
 *
 * @var array<string, string> $old  form values; $old['rating'] is '' or '1'..'5'
 *
 * Radio buttons (not JavaScript) hold the choice, so it works without JS and
 * posts as a normal `rating` field. The stars are laid out in reverse order in
 * the markup so a pure-CSS `~` selector can light up the hovered/checked star
 * and every lower one. The clear button (JS) resets an optional rating.
 */
$current = $old['rating'] ?? '';
?>
<div class="star-row">
    <div class="star-input" role="radiogroup" aria-label="Rating from 1 to 5 stars">
        <?php for ($i = 5; $i >= 1; $i--): ?>
            <input type="radio" name="rating" id="rating-<?= $i ?>" value="<?= $i ?>"
                   <?= (string) $current === (string) $i ? 'checked' : '' ?>>
            <label for="rating-<?= $i ?>" title="<?= $i ?> star<?= $i === 1 ? '' : 's' ?>">
                <span aria-hidden="true">★</span>
                <span class="sr-only"><?= $i ?> star<?= $i === 1 ? '' : 's' ?></span>
            </label>
        <?php endfor; ?>
    </div>
    <button type="button" class="star-clear" data-star-clear>Clear</button>
</div>
