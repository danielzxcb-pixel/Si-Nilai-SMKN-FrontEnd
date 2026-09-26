FROM php:8.2-apache

# Install ekstensi MySQL dan intl yang dibutuhkan CI4
RUN apt-get update && apt-get install -y \
    libicu-dev \
    git \
    unzip \
    && docker-php-ext-install intl pdo pdo_mysql mysqli

# Aktifkan mod_rewrite Apache untuk routing CI4
RUN a2enmod rewrite

# Konfigurasi Apache agar membaca folder public CI4
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copy semua file project
COPY . /var/www/html/

# Berikan izin ke folder writable
RUN chown -R www-data:www-data /var/www/html/writable /var/www/html/public

EXPOSE 80
CMD ["apache2-foreground"]