FROM php:8.3-apache

# PDO MySQL driver so PHP can talk to the MariaDB container.
RUN docker-php-ext-install pdo_mysql

# Serve from public/ instead of the whole project so that src/ (app code,
# DB access, secrets) is never reachable directly from the browser.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
 && sed -ri 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable URL rewriting and let the document root's .htaccess use it, so the
# front controller (public/.htaccess -> index.php) can drive clean routes.
RUN a2enmod rewrite \
 && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf
