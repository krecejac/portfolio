<?php
declare(strict_types=1);

/**
 * Sign-in, sign-up, sign-out, and accepting an admin invite. All four set up or
 * tear down the session identity that the rest of the app reads through Auth.
 */
final class AuthController
{
    /** GET/POST /login — show the form, and on POST try to sign the user in. */
    public static function login(): void
    {
        if (Auth::check()) {
            header('Location: /');
            exit;
        }
        // One-shot notice, e.g. "account created" handed over from sign-up/accept.
        $notice = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);
        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $username = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            if (Auth::attempt($username, $password)) {
                header('Location: ' . (Auth::isAdmin() ? '/admin' : '/'));
                exit;
            }
            $error = 'Invalid username or password.';
        }
        require view_path('login');
    }

    /** GET/POST /signup — create a normal user account and sign them in. */
    public static function signup(): void
    {
        if (Auth::check()) {
            header('Location: /');
            exit;
        }
        $errors = [];
        $old = ['username' => ''];
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }
            $old['username'] = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $users = new UserRepository();

            if ($old['username'] === '') {
                $errors['username'] = 'Username is required.';
            } elseif (mb_strlen($old['username']) > 50) {
                $errors['username'] = 'Username is too long (max 50 characters).';
            } elseif ($users->findByUsername($old['username']) !== null) {
                $errors['username'] = 'That username is already taken.';
            }
            if (mb_strlen($password) < 8) {
                $errors['password'] = 'Password must be at least 8 characters.';
            }

            if ($errors === []) {
                $id = $users->create($old['username'], password_hash($password, PASSWORD_DEFAULT), 'user');
                Auth::login($id, $old['username'], 'user');
                header('Location: /');
                exit;
            }
        }
        $csrf = Csrf::token();
        require view_path('signup');
    }

    /** Any method /logout — clear the session and go home. */
    public static function logout(): void
    {
        Auth::logout();
        header('Location: /');
        exit;
    }

    /**
     * GET/POST /admin/accept — a link handed out by an admin lets the recipient
     * pick their own username and password and become an admin. The invite is
     * matched by the sha256 of the token (the raw token is never stored) and is
     * consumed once used.
     */
    public static function acceptInvite(): void
    {
        $token = (string) ($_POST['token'] ?? $_GET['token'] ?? '');
        $invite = (new InviteRepository())->findUsable(hash('sha256', $token));
        $errors = [];
        $old = ['username' => ''];
        if ($invite === null) {
            http_response_code(400);
            $invalidInvite = true;
            require view_path('admin/accept');
            return;
        }
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }
            $old['username'] = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            $users = new UserRepository();
            if ($old['username'] === '') {
                $errors['username'] = 'Username is required.';
            } elseif (mb_strlen($old['username']) > 50) {
                $errors['username'] = 'Username is too long (max 50 characters).';
            } elseif ($users->findByUsername($old['username']) !== null) {
                $errors['username'] = 'That username is already taken.';
            }
            if (mb_strlen($password) < 8) {
                $errors['password'] = 'Password must be at least 8 characters.';
            }
            if ($errors === []) {
                $users->create($old['username'], password_hash($password, PASSWORD_DEFAULT), 'admin');
                (new InviteRepository())->markUsed((int) $invite['id']);
                $_SESSION['flash'] = 'Account created. You can now log in.';
                header('Location: /login');
                exit;
            }
        }
        $invalidInvite = false;
        $csrf = Csrf::token();
        require view_path('admin/accept');
    }
}
