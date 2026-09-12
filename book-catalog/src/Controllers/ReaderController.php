<?php
declare(strict_types=1);

/**
 * The things a signed-in reader can do to a book: keep a favourites shelf and
 * give a book their own 1-5 rating. Every action here requires a login and, for
 * the writes, a valid CSRF token; each write redirects afterwards (PRG) so a
 * refresh never re-submits.
 */
final class ReaderController
{
    /** GET /favourites — the current user's saved books. */
    public static function favourites(): void
    {
        Auth::requireLogin();
        $books = (new FavouriteRepository())->booksForUser(Auth::id());
        $csrf = Csrf::token();
        require view_path('favourites');
    }

    /** POST /favourite — toggle a book on/off the shelf, then return to it. */
    public static function toggleFavourite(): void
    {
        Auth::requireLogin();
        $bookId = filter_input(INPUT_POST, 'book_id', FILTER_VALIDATE_INT);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null) || !$bookId) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        (new FavouriteRepository())->toggle(Auth::id(), $bookId);
        // Come back to whichever page the heart was clicked on (a card in the
        // grid, the favourites page, or the detail), guarded against open redirect.
        header('Location: ' . safe_return($_POST['return'] ?? '', '/?id=' . $bookId));
        exit;
    }

    /** POST /rate — record this user's 1-5 rating for a book, then return to it. */
    public static function rate(): void
    {
        Auth::requireLogin();
        $bookId = filter_input(INPUT_POST, 'book_id', FILTER_VALIDATE_INT);
        $rating = filter_input(INPUT_POST, 'rating', FILTER_VALIDATE_INT);
        if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !Csrf::check($_POST['csrf'] ?? null)
            || !$bookId || $rating === false || $rating < 1 || $rating > 5) {
            http_response_code(400);
            echo 'Bad request.';
            exit;
        }
        (new RatingRepository())->rate(Auth::id(), $bookId, $rating);
        header('Location: /?id=' . $bookId);
        exit;
    }
}
