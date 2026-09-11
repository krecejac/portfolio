<?php
declare(strict_types=1);

require __DIR__ . '/../src/BookRepository.php';

// Work out which route was requested. REQUEST_URI looks like
// "/admin/login?foo=bar"; we keep only the path and drop any trailing slash
// so that "/admin/" and "/admin" are treated as the same route.
$path = rtrim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

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

    // Admin login. Real authentication is wired up in the next step (7c);
    // for now this proves the route reaches the front controller.
    case '/admin/login':
        echo 'Admin login — coming in the next step.';
        break;

    // Unknown route.
    default:
        http_response_code(404);
        echo 'Page not found.';
}
