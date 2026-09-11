<?php
/**
 * @var string      $username    provided by index.php
 * @var string|null $flash       one-off success message, or null
 * @var string|null $inviteLink  a freshly generated invite link to show once, or null
 * @var string      $csrf        CSRF token for the import/invite forms
 */
$pageTitle = 'Admin — Book Catalog';
$navRight  = '<span class="nav-user">' . e($username) . '</span>'
           . '<a class="btn btn--sm btn--secondary" href="/admin/logout">Log out</a>';
require __DIR__ . '/../partials/header.php';
?>
<h1 class="page-title">Admin</h1>

<?php if (!empty($flash)): ?>
    <p class="flash"><?= e($flash) ?></p>
<?php endif; ?>

<?php if (!empty($inviteLink)): ?>
    <div class="notice">
        <p>Invite link (valid 24&nbsp;h, one-time) &mdash; copy it and send it to the new admin:</p>
        <code><?= e($inviteLink) ?></code>
    </div>
<?php endif; ?>

<div class="actions">
    <div class="action-card">
        <h2>Add a book</h2>
        <p>Create a new catalogue entry through a validated form.</p>
        <a class="btn" href="/admin/add">Add book</a>
    </div>

    <div class="action-card">
        <h2>Import books</h2>
        <p>Load and validate entries from the bundled <code>books.json</code>.</p>
        <form method="post" action="/admin/import">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <button type="submit" class="btn">Import from books.json</button>
        </form>
    </div>

    <div class="action-card">
        <h2>Invite an admin</h2>
        <p>Generate a one-time link so a colleague can create their own account.</p>
        <form method="post" action="/admin/invite">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <button type="submit" class="btn">Create invite link</button>
        </form>
    </div>
</div>
<?php require __DIR__ . '/../partials/footer.php'; ?>
