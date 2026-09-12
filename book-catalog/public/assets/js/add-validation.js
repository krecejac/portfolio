// Client-side validation for the add-book form.
//
// Convenience layer only: it gives instant feedback without a page reload, but
// the server (src/BookValidator.php) stays the source of truth, so the form
// still works with JavaScript disabled.
(function () {
    'use strict';

    var form = document.querySelector('form.auth');
    if (!form) {
        return;
    }

    // Same rules as src/BookValidator.php. Returns '' when the field is valid.
    function validate(field) {
        var value = field.value.trim();
        switch (field.name) {
            case 'title':
                if (value === '') return 'Title is required.';
                if (value.length > 255) return 'Title is too long (max 255 characters).';
                return '';
            case 'author':
                if (value === '') return 'Author is required.';
                if (value.length > 255) return 'Author is too long (max 255 characters).';
                return '';
            case 'year':
                if (value === '') return 'Year is required.';
                if (!/^\d+$/.test(value) || +value < 1 || +value > 2100)
                    return 'Year must be a whole number between 1 and 2100.';
                return '';
            case 'rating':
                if (value === '') return '';   // optional
                if (!/^\d+$/.test(value) || +value < 1 || +value > 5)
                    return 'Rating must be a whole number between 1 and 5.';
                return '';
            default:
                return '';
        }
    }

    // Add, update, or remove the error message under one field.
    function showError(field, message) {
        var label = field.closest('label');
        if (!label) {
            return;   // e.g. the hidden CSRF input has no label
        }
        var span = label.querySelector('.field-error');
        if (message === '') {
            if (span) span.remove();
            return;
        }
        if (!span) {
            span = document.createElement('span');
            span.className = 'field-error';
            label.appendChild(span);
        }
        span.textContent = message;
    }

    // Visible text fields only — skip hidden inputs (CSRF) and the rating radios
    // (the star picker), which the server validates on its own.
    var fields = form.querySelectorAll(
        'input[name]:not([type="hidden"]):not([type="radio"]), textarea[name]'
    );

    // Validate a field once the user leaves it.
    fields.forEach(function (field) {
        field.addEventListener('blur', function () {
            showError(field, validate(field));
        });
    });

    // On submit: validate everything, and if anything is wrong block the send
    // and focus the first bad field.
    form.addEventListener('submit', function (event) {
        var firstInvalid = null;
        fields.forEach(function (field) {
            var message = validate(field);
            showError(field, message);
            if (message !== '' && firstInvalid === null) {
                firstInvalid = field;
            }
        });
        if (firstInvalid) {
            event.preventDefault();
            firstInvalid.focus();
        }
    });
})();
