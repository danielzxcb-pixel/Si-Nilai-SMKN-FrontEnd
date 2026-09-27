FROM php:8.2-apache

# 1. Install ekstensi yang dibutuhkan CodeIgniter 4
RUN apt-get update && apt-get install -y \
    libicu-dev \
    git \
    unzip \
    && docker-php-ext-install intl pdo pdo_mysql mysqli \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Atasi bentrok MPM: Matikan worker/event, paksa hanya MPM prefork
RUN a2dismod mpm_event mpm_worker || true && a2enmod mpm_prefork rewrite

# 3. Ubah DocumentRoot Apache ke folder public CI4 via environment variable
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 4. Copy semua file aplikasi ke server
COPY . /var/www/html/

# 5. Buat struktur folder writable dan public agar tidak missing, lalu atur permission
RUN mkdir -p /var/www/html/writable/cache \
    /var/www/html/writable/logs \
    /var/www/html/writable/session \
    /var/www/html/writable/uploads \
    /var/www/html/public && \
    chown -R www-data:www-data /var/www/html/writable /var/www/html/public && \
    chmod -R 775 /var/www/html/writable

EXPOSE 80
CMD ["apache2-foreground"]