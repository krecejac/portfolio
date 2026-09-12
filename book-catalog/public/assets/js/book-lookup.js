// Title autocomplete for the admin add/edit form, backed by our /admin/book-lookup
// proxy (Open Library). Picking a suggestion fills author, year, genre and the
// hidden cover_url. Progressive enhancement: the form works fully without this.
(function () {
    'use strict';

    var form = document.querySelector('form.auth');
    if (!form) {
        return;
    }
    var title = form.querySelector('input[name="title"]');
    var results = form.querySelector('.lookup-results');
    if (!title || !results) {
        return;
    }
    var author = form.querySelector('input[name="author"]');
    var year = form.querySelector('input[name="year"]');
    var genre = form.querySelector('input[name="genre"]');
    var cover = form.querySelector('input[name="cover_url"]');

    var timer = null;
    var lastQuery = '';

    function close() {
        results.hidden = true;
        results.innerHTML = '';
    }

    function render(items) {
        results.innerHTML = '';
        if (!items || !items.length) {
            close();
            return;
        }
        items.forEach(function (item) {
            var option = document.createElement('button');
            option.type = 'button';
            option.className = 'lookup-option';

            if (item.cover_url) {
                var img = document.createElement('img');
                img.src = item.cover_url;
                img.alt = '';
                img.loading = 'lazy';
                img.onerror = function () { img.style.visibility = 'hidden'; };
                option.appendChild(img);
            } else {
                var placeholder = document.createElement('span');
                placeholder.className = 'lookup-nocover';
                option.appendChild(placeholder);
            }

            var text = document.createElement('span');
            text.className = 'lookup-text';
            var t = document.createElement('span');
            t.className = 'lookup-title';
            t.textContent = item.title;               // textContent = safe against HTML
            var m = document.createElement('span');
            m.className = 'lookup-meta';
            m.textContent = [item.author, item.year].filter(Boolean).join(' · ');
            text.appendChild(t);
            text.appendChild(m);
            option.appendChild(text);

            option.addEventListener('click', function () {
                title.value = item.title || '';
                if (author) { author.value = item.author || ''; }
                if (year && item.year) { year.value = item.year; }
                if (genre && item.genre) { genre.value = item.genre; }
                if (cover) { cover.value = item.cover_url || ''; }
                close();
                title.focus();
            });

            results.appendChild(option);
        });
        results.hidden = false;
    }

    title.addEventListener('input', function () {
        var query = title.value.trim();
        clearTimeout(timer);
        if (query.length < 2) {
            close();
            return;
        }
        timer = setTimeout(function () {
            if (query === lastQuery) { return; }
            lastQuery = query;
            fetch('/admin/book-lookup?q=' + encodeURIComponent(query))
                .then(function (r) { return r.json(); })
                .then(render)
                .catch(close);
        }, 300);
    });

    title.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { close(); }
    });
    document.addEventListener('click', function (event) {
        if (!results.contains(event.target) && event.target !== title) { close(); }
    });
})();
