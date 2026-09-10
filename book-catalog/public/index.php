<?php
declare(strict_types=1);

require __DIR__ . '/../src/BookRepository.php';

$repository = new BookRepository();

// Read ?id= from the URL. FILTER_VALIDATE_INT returns the int, or false/null
// if it is missing or not a valid number.
$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if ($id) {
    // Detail route: show one book (or a not-found message).
    $book = $repository->find($id);
    require __DIR__ . '/../views/detail.php';
} else {
    // List route: show all books.
    $books = $repository->all();
    require __DIR__ . '/../views/list.php';
}
