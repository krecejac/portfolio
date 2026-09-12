<?php
declare(strict_types=1);

/**
 * Thin client for the public Open Library search API (no API key needed).
 * Used by the admin add/edit form to auto-fill a book's metadata and cover.
 */
final class OpenLibrary
{
    /**
     * Search by title and return a small, normalised list of candidates.
     *
     * @return array<int, array{title: string, author: string, year: ?int, genre: string, cover_url: string}>
     */
    public static function search(string $query, int $limit = 6): array
    {
        $query = trim($query);
        if ($query === '') {
            return [];
        }

        $url = 'https://openlibrary.org/search.json?' . http_build_query([
            'title'  => $query,
            'limit'  => $limit,
            'fields' => 'title,author_name,first_publish_year,cover_i,subject',
        ]);

        $context = stream_context_create(['http' => [
            'timeout' => 5,
            'header'  => "User-Agent: BookCatalog/1.0 (portfolio project)\r\n",
        ]]);
        $json = @file_get_contents($url, false, $context);
        if ($json === false) {
            return [];   // offline or the API is down — the form still works by hand
        }

        $data = json_decode($json, true);
        if (!is_array($data) || !isset($data['docs']) || !is_array($data['docs'])) {
            return [];
        }

        $out = [];
        foreach ($data['docs'] as $doc) {
            if (!is_array($doc)) {
                continue;
            }
            $out[] = [
                'title'     => (string) ($doc['title'] ?? ''),
                'author'    => isset($doc['author_name'][0]) ? (string) $doc['author_name'][0] : '',
                'year'      => isset($doc['first_publish_year']) ? (int) $doc['first_publish_year'] : null,
                'genre'     => self::firstCleanSubject($doc['subject'] ?? []),
                'cover_url' => isset($doc['cover_i'])
                    ? 'https://covers.openlibrary.org/b/id/' . (int) $doc['cover_i'] . '-M.jpg'
                    : '',
            ];
        }
        return $out;
    }

    /**
     * Open Library subjects are noisy ("nyt:bestseller", "Large type books", …).
     * Pick the first short, human-looking one to pre-fill the genre field, which
     * the admin can then edit.
     */
    private static function firstCleanSubject(mixed $subjects): string
    {
        if (!is_array($subjects)) {
            return '';
        }
        foreach ($subjects as $subject) {
            $subject = trim((string) $subject);
            if ($subject === '' || mb_strlen($subject) > 40) {
                continue;
            }
            if (preg_match('/bestseller|large type|reading level|accessible|protected daisy|in library|overdrive|:/i', $subject)) {
                continue;
            }
            return $subject;
        }
        return '';
    }
}
