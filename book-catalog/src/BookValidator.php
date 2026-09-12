<?php
declare(strict_types=1);

/**
 * Validation rules for a book, shared by the add-book form and the JSON import
 * so the two can never drift apart.
 *
 * It takes raw input (form fields or a decoded JSON row) and returns both the
 * validation errors and the cleaned-up values ready for the repository.
 */
final class BookValidator
{
    /**
     * @param  array<string, mixed> $input  raw title/author/year/rating/annotation
     * @return array{
     *     errors: array<string, string>,
     *     clean: array{title: string, author: string, year: int, rating: ?int, annotation: ?string, genre: ?string, cover_url: ?string}
     * }  errors is empty when the input is valid
     */
    public static function validate(array $input): array
    {
        $title      = trim((string) ($input['title'] ?? ''));
        $author     = trim((string) ($input['author'] ?? ''));
        $yearRaw    = (string) ($input['year'] ?? '');
        $ratingRaw  = (string) ($input['rating'] ?? '');
        $annotation = trim((string) ($input['annotation'] ?? ''));
        $genre      = trim((string) ($input['genre'] ?? ''));
        $coverUrl   = trim((string) ($input['cover_url'] ?? ''));

        $errors = [];

        if ($title === '') {
            $errors['title'] = 'Title is required.';
        } elseif (mb_strlen($title) > 255) {
            $errors['title'] = 'Title is too long (max 255 characters).';
        }

        if ($author === '') {
            $errors['author'] = 'Author is required.';
        } elseif (mb_strlen($author) > 255) {
            $errors['author'] = 'Author is too long (max 255 characters).';
        }

        $year = filter_var($yearRaw, FILTER_VALIDATE_INT);
        if ($yearRaw === '') {
            $errors['year'] = 'Year is required.';
        } elseif ($year === false || $year < 1 || $year > 2100) {
            $errors['year'] = 'Year must be a whole number between 1 and 2100.';
        }

        // Rating is optional; validate it only when something was entered.
        $rating = null;
        if ($ratingRaw !== '') {
            $rating = filter_var($ratingRaw, FILTER_VALIDATE_INT);
            if ($rating === false || $rating < 1 || $rating > 5) {
                $errors['rating'] = 'Rating must be a whole number between 1 and 5.';
                $rating = null;
            }
        }

        // Genre is optional free text (used for filtering).
        if (mb_strlen($genre) > 100) {
            $errors['genre'] = 'Genre is too long (max 100 characters).';
        }

        // Cover URL is optional; when present it must be a plain http(s) URL.
        if ($coverUrl !== '') {
            if (mb_strlen($coverUrl) > 500 || !preg_match('#^https?://#i', $coverUrl)) {
                $errors['cover_url'] = 'Cover URL must be a valid http(s) link.';
                $coverUrl = '';
            }
        }

        return [
            'errors' => $errors,
            'clean'  => [
                'title'      => $title,
                'author'     => $author,
                'year'       => $year === false ? 0 : (int) $year,
                'rating'     => $rating,
                'annotation' => $annotation === '' ? null : $annotation,
                'genre'      => $genre === '' ? null : $genre,
                'cover_url'  => $coverUrl === '' ? null : $coverUrl,
            ],
        ];
    }
}
