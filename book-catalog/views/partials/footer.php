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
