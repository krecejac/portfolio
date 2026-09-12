    </main>
    <script>
        // Light/dark toggle. The initial theme is set in the <head>.
        function toggleTheme() {
            var root = document.documentElement;
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
            updateThemeIcon();
        }
        function updateThemeIcon() {
            var btn = document.querySelector('.theme-toggle');
            if (btn) {
                btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀' : '☾';
            }
        }
        updateThemeIcon();

        // Import: turn the file input + button into a single button that opens
        // the file picker and imports as soon as a file is chosen. Without JS the
        // input and button stay visible and work as a normal two-step form.
        document.querySelectorAll('form.import-upload').forEach(function (form) {
            var file = form.querySelector('input[type="file"]');
            var button = form.querySelector('button[type="submit"]');
            if (!file || !button) { return; }
            file.hidden = true;
            button.addEventListener('click', function (event) {
                if (!file.value) { event.preventDefault(); file.click(); }
            });
            file.addEventListener('change', function () {
                if (file.value) { form.submit(); }
            });
        });

        // Close the account menu when clicking outside it.
        document.addEventListener('click', function (event) {
            document.querySelectorAll('details.user-menu[open]').forEach(function (menu) {
                if (!menu.contains(event.target)) {
                    menu.removeAttribute('open');
                }
            });

            // "Clear" resets an optional star rating on the add/edit forms.
            var clear = event.target.closest && event.target.closest('[data-star-clear]');
            if (clear) {
                clear.closest('.star-input')
                    .querySelectorAll('input[type="radio"]')
                    .forEach(function (radio) { radio.checked = false; });
            }
        });
    </script>
</body>
</html>
