FROM php:8.4-fpm

# Arguments defined in docker-compose.yml
ARG user=www-data
ARG uid=1000

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    supervisor \
    nodejs \
    npm \
    nginx

# Clear cache and default nginx site
RUN apt-get clean && rm -rf /var/lib/apt/lists/* && \
    rm /etc/nginx/sites-enabled/default

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory contents
COPY . /var/www/html

# Copy existing application directory permissions
COPY --chown=www-data:www-data . /var/www/html

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
RUN npm install && npm run build

# Supervisor configurations (from Step 4)
COPY docker/supervisor/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/supervisor/laravel-worker.conf /etc/supervisor/conf.d/laravel-worker.conf
COPY docker/supervisor/php-fpm.conf /etc/supervisor/conf.d/php-fpm.conf
COPY docker/supervisor/nginx.conf /etc/supervisor/conf.d/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Set permissions for logs
RUN touch /var/www/html/storage/logs/worker.log && \
    chmod -R 775 /var/www/html/storage/ && \
    chown -R www-data:www-data /var/www/html/storage/

# Expose port 80
EXPOSE 80

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/supervisord.conf"]
