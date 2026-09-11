<?php
/**
 * @var bool                   $invalidInvite  true if the token is bad/expired/used
 * @var array<string, string>  $errors         field => message (valid invite only)
 * @var array<string, string>  $old            previous input, to refill the form
 * @var string                 $token          the invite token (valid invite only)
 * @var string                 $csrf           CSRF token (valid invite only)
 */
$pageTitle = 'Accept invite — Book Catalog';
require __DIR__ . '/../partials/header.php';
?>
<?php if ($invalidInvite): ?>
    <div class="auth">
        <h1>Invite not valid</h1>
        <p class="auth__error">This invite link is invalid, expired, or has already been used.</p>
        <p><a href="/">&lsaquo; Back to the catalogue</a></p>
    </div>
<?php else: ?>
    <form class="auth" method="post" action="/admin/accept">
        <h1>Create your account</h1>

        <label>Username
            <input type="text" name="username" value="<?= e($old['username']) ?>" autofocus>
            <?php if (isset($errors['username'])): ?>
                <span class="field-error"><?= e($errors['username']) ?></span>
            <?php endif; ?>
        </label>

        <label>Password (at least 8 characters)
            <input type="password" name="password">
            <?php if (isset($errors['password'])): ?>
                <span class="field-error"><?= e($errors['password']) ?></span>
            <?php endif; ?>
        </label>

        <input type="hidden" name="token" value="<?= e($token) ?>">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <button type="submit" class="btn">Create account</button>
    </form>
<?php endif; ?>
<?php require __DIR__ . '/../partials/footer.php'; ?>
