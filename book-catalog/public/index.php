<?php
declare(strict_types=1);

require __DIR__ . '/../src/BookRepository.php';
require __DIR__ . '/../src/Auth.php';

// Work out which route was requested. REQUEST_URI looks like
// "/admin/login?foo=bar"; we keep only the path and drop any trailing slash
// so that "/admin/" and "/admin" are treated as the same route.
$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Only the admin area needs a session, so we don't set a cookie for anonymous
// visitors browsing the public list.
if (str_starts_with($path, '/admin')) {
    Auth::start();
}

$repository = new BookRepository();

// Tiny router: match the path and render the matching view. Everything not
// listed here falls through to a 404.
switch ($path) {
    // Public: book detail (?id=NN) or, without an id, the full list.
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

    // Admin logout: end the session and go back to the login form.
    case '/admin/logout':
        Auth::logout();
        header('Location: /admin/login');
        exit;

    // Admin dashboard: protected — only reachable once logged in.
    case '/admin':
        if (!Auth::check()) {
            header('Location: /admin/login');
            exit;
        }
        $username = Auth::username();
        require __DIR__ . '/../views/admin/dashboard.php';
        break;

    // Unknown route.
    default:
        http_response_code(404);
        echo 'Page not found.';
}
