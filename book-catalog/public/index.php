<?php
declare(strict_types=1);

/**
 * Front controller.
 *
 * Apache sends every request that isn't a real file to this script (see
 * public/.htaccess). It looks at the URL path and renders the matching view:
 * the public book list/detail, or the session-protected admin pages.
 */

require __DIR__ . '/../src/BookRepository.php';
require __DIR__ . '/../src/Auth.php';
require __DIR__ . '/../src/Csrf.php';
require __DIR__ . '/../src/BookValidator.php';
require __DIR__ . '/../src/InviteRepository.php';

// REQUEST_URI looks like "/admin/login?foo=bar"; keep only the path and drop a
// trailing slash so "/admin/" and "/admin" resolve to the same route.
$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// The whole admin area (including the public "accept invite" page) uses a
// session — for login state and for CSRF tokens on its forms.
if (str_starts_with($path, '/admin')) {
    Auth::start();
}

$repository = new BookRepository();

switch ($path) {
    // Public: one book's detail (?id=NN), or the full list when there is no id.
    case '':
        $id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        if ($id) {
            $book = $repository->find($id);
            require __DIR__ . '/../views/detail.php';
        } else {
            $books = $repository->all();
            require __DIR__ . '/../views/list.php';
        }
        break;

    // Admin login: show the form (GET) or check the credentials (POST).
    case '/admin/login':
        if (Auth::check()) {
            header('Location: /admin');   // already logged in
            exit;
        }
        // A one-off info message, e.g. after creating an account via an invite.
        $notice = $_SESSION['flash'] ?? null;
        unset($_SESSION['flash']);

        $error = null;
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $username = trim((string) ($_POST['username'] ?? ''));
            $password = (string) ($_POST['password'] ?? '');
            if (Auth::attempt($username, $password)) {
                header('Location: /admin');
                exit;
            }
            $error = 'Invalid username or password.';
        }
        require __DIR__ . '/../views/admin/login.php';
        break;

    // Admin logout: end the session and return to the login form.
    case '/admin/logout':
        Auth::logout();
        header('Location: /admin/login');
        exit;

    // Admin dashboard (protected).
    case '/admin':
        Auth::requireLogin();
        $username = Auth::username();
        // Read and clear the one-off messages (set after add/import/invite).
        $flash = $_SESSION['flash'] ?? null;
        $inviteLink = $_SESSION['invite_link'] ?? null;
        unset($_SESSION['flash'], $_SESSION['invite_link']);
        $csrf = Csrf::token();   // for the import/invite forms
        require __DIR__ . '/../views/admin/dashboard.php';
        break;

    // Admin: add a book. GET shows the form, POST validates and saves it.
    case '/admin/add':
        Auth::requireLogin();

        $errors = [];
        $old = ['title' => '', 'author' => '', 'year' => '', 'rating' => '', 'annotation' => ''];

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Reject the request outright if the CSRF token is missing or wrong.
            if (!Csrf::check($_POST['csrf'] ?? null)) {
                http_response_code(400);
                echo 'Invalid CSRF token.';
                exit;
            }

            // Keep the trimmed input so we can refill the form on error.
            foreach (array_keys($old) as $field) {
                $old[$field] = trim((string) ($_POST[$field] ?? ''));
            }

            // Server-side validation is the source of truth (see BookValidator).
            $result = BookValidator::validate($old);
            $errors = $result['errors'];

            // No errors -> save, then redirect (PRG) with a flash message.
            if ($errors === []) {
                $book = $result['clean'];
                $repository->create($book['title'], $book['author'], $book['year'], $book['rating'], $book['annotation']);
                $_SESSION['flash'] = 'Book added.';
                header('Location: /admin');
                exit;
            }
        }

        $csrf = Csrf::token();
        require __DIR__ . '/../views/admin/add.php';
        break;

    // Admin: import books from the prepared books.json file.
    case '/admin/import':
        Auth::requireLogin();
        // State-changing action: require a POST with a valid CSRF token.
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null)) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }

        $data = json_decode((string) @file_get_contents(__DIR__ . '/../books.json'), true);
        if (!is_array($data)) {
            $_SESSION['flash'] = 'Import failed: books.json is missing or not valid JSON.';
            header('Location: /admin');
            exit;
        }

        $imported = 0;
        $skipped  = 0;
        foreach ($data as $row) {
            // Validate each entry with the same rules as the form, and skip
            // anything invalid or already in the catalogue (safe to re-run).
            if (!is_array($row)) {
                $skipped++;
                continue;
            }
            $result = BookValidator::validate($row);
            $book   = $result['clean'];
            if ($result['errors'] !== [] || $repository->existsSame($book['title'], $book['author'], $book['year'])) {
                $skipped++;
                continue;
            }

            $repository->create($book['title'], $book['author'], $book['year'], $book['rating'], $book['annotation']);
            $imported++;
        }

        $_SESSION['flash'] = "Import done: {$imported} added, {$skipped} skipped.";
        header('Location: /admin');
        exit;

    // Admin: create a one-time invite link for a new admin account.
    case '/admin/invite':
        Auth::requireLogin();
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null)) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }

        // The raw token goes into the link; only its hash is stored, with a
        // 24-hour expiry. (No email server here, so we show the link on screen.)
        $token = bin2hex(random_bytes(32));
        $expiresAt = (new DateTimeImmutable('+24 hours'))->format('Y-m-d H:i:s');
        (new InviteRepository())->create(hash('sha256', $token), $expiresAt);

        $_SESSION['invite_link'] = 'http://' . $_SERVER['HTTP_HOST'] . '/admin/accept?token=' . $token;
        header('Location: /admin');
        exit;

    // Public: accept an invite and set up your own admin account.
    case '/admin/accept':
        $token = (string) ($_POST['token'] ?? $_GET['token'] ?? '');
        $invite = (new InviteRepository())->findUsable(hash('sha256', $token));

        $errors = [];
        $old = ['username' => ''];

        // Bad/expired/used token: show a dead-end page, nothing else.
        if ($invite === null) {
            http_response_code(400);
            $invalidInvite = true;
            require __DIR__ . '/../views/admin/accept.php';
            break;
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
                $users->create($old['username'], password_hash($password, PASSWORD_DEFAULT));
                (new InviteRepository())->markUsed((int) $invite['id']);
                $_SESSION['flash'] = 'Account created. You can now log in.';
                header('Location: /admin/login');
                exit;
            }
        }

        $invalidInvite = false;
        $csrf = Csrf::token();
        require __DIR__ . '/../views/admin/accept.php';
        break;

    // Unknown route.
    default:
        http_response_code(404);
        echo 'Page not found.';
}
