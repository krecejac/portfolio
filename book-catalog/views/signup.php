<?php
/**
 * @var array<string, string> $errors  field => message (empty on first load)
 * @var array<string, string> $old     previous input, to refill the form
 * @var string                $csrf    CSRF token
 */
$pageTitle = 'Sign up — Book Catalog';
require __DIR__ . '/partials/header.php';
?>
<form class="auth" method="post" action="/signup">
    <h1>Sign up</h1>

    <label>Username
        <input type="text" name="username" value="<?= e($old['username']) ?>" required autofocus>
        <?php if (isset($errors['username'])): ?>
            <span class="field-error"><?= e($errors['username']) ?></span>
        <?php endif; ?>
    </label>
    <label>Password (at least 8 characters)
        <input type="password" name="password" required>
        <?php if (isset($errors['password'])): ?>
            <span class="field-error"><?= e($errors['password']) ?></span>
        <?php endif; ?>
    </label>

    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <button type="submit" class="btn">Create account</button>
    <p class="hint">Already have an account? <a href="/login">Sign in</a></p>
</form>
<?php require __DIR__ . '/partials/footer.php'; ?>
