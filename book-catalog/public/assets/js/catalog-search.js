// Instant client-side filtering of the book list. Each row carries a
// lowercase "data-search" string (title + author); we show only the rows that
// contain what was typed, and keep the heading count in sync.
(function () {
    'use strict';

    var input = document.getElementById('book-search');
    var table = document.getElementById('book-table');
    if (!input || !table) {
        return;
    }

    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr[data-search]'));
    var noResults = document.getElementById('no-results');
    var count = document.getElementById('count');

    input.addEventListener('input', function () {
        var query = input.value.trim().toLowerCase();
        var shown = 0;

        rows.forEach(function (row) {
            var match = row.getAttribute('data-search').indexOf(query) !== -1;
            row.hidden = !match;
            if (match) {
                shown++;
            }
        });

        if (noResults) {
            noResults.hidden = shown !== 0;
        }
        if (count) {
            count.textContent = String(shown);
        }
    });
})();
