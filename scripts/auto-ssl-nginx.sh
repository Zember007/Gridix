#!/bin/bash

# Автоматическая настройка Nginx и SSL для доменов
# Использование: 
#   ./auto-ssl-nginx.sh add domain.com
#   ./auto-ssl-nginx.sh remove domain.com
#   ./auto-ssl-nginx.sh status domain.com

set -e  # Выход при ошибке

ACTION=$1
DOMAIN=$2
EMAIL="${SSL_EMAIL:-admin@gridix.live}"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"
WEBROOT="/var/www/html"
SITE_ROOT="/var/www/floorplan-wizard-builder/dist"

# Функция для возврата JSON статуса
return_status() {
    local status=$1
    local message=$2
    local error_type=$3
    
    cat << EOF
{
    "status": "$status",
    "message": "$message",
    "error_type": "$error_type",
    "domain": "$DOMAIN",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    exit $([ "$status" = "success" ] && echo 0 || echo 1)
}

# Проверка параметров
if [ -z "$ACTION" ] || [ -z "$DOMAIN" ]; then
    return_status "error" "Использование: $0 {add|remove|status} domain.com" "invalid_parameters"
fi

if [ "$ACTION" != "add" ] && [ "$ACTION" != "remove" ] && [ "$ACTION" != "status" ]; then
    return_status "error" "Неверное действие. Используйте: add, remove или status" "invalid_action"
fi

# Проверка прав суперпользователя
if [ "$EUID" -ne 0 ]; then
    return_status "error" "Этот скрипт должен запускаться с правами root" "permission_denied"
fi

# Функция проверки статуса домена
check_domain_status() {
    local domain=$1
    local nginx_config_exists=false
    local nginx_enabled=false
    local ssl_cert_exists=false
    local ssl_cert_valid=false
    
    if [ -f "$NGINX_CONFIG_DIR/$domain" ]; then
        nginx_config_exists=true
    fi
    
    if [ -L "$NGINX_ENABLED_DIR/$domain" ]; then
        nginx_enabled=true
    fi
    
    if [ -f "/etc/letsencrypt/live/$domain/fullchain.pem" ]; then
        ssl_cert_exists=true
        if openssl x509 -in "/etc/letsencrypt/live/$domain/fullchain.pem" -text -noout >/dev/null 2>&1; then
            ssl_cert_valid=true
        fi
    fi
    
    local overall_status="unknown"
    if [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = true ] && [ "$ssl_cert_exists" = true ] && [ "$ssl_cert_valid" = true ]; then
        overall_status="active"
    elif [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = true ] && [ "$ssl_cert_exists" = true ] && [ "$ssl_cert_valid" = false ]; then
        overall_status="ssl_invalid"
    elif [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = true ] && [ "$ssl_cert_exists" = false ]; then
        overall_status="no_ssl"
    elif [ "$nginx_config_exists" = true ] && [ "$nginx_enabled" = false ]; then
        overall_status="disabled"
    elif [ "$nginx_config_exists" = false ]; then
        overall_status="not_configured"
    fi
    
    cat << EOF
{
    "status": "success",
    "domain": "$domain",
    "overall_status": "$overall_status",
    "nginx": {
        "config_exists": $nginx_config_exists,
        "enabled": $nginx_enabled
    },
    "ssl": {
        "certificate_exists": $ssl_cert_exists,
        "certificate_valid": $ssl_cert_valid
    },
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
}

# Функция удаления домена
remove_domain() {
    local domain=$1
    
    echo "🗑️ Удаляем конфигурацию для домена: $domain"
    
    if [ ! -f "$NGINX_CONFIG_DIR/$domain" ]; then
        return_status "error" "Конфигурация для домена $domain не найдена" "config_not_found"
    fi
    
    if [ -L "$NGINX_ENABLED_DIR/$domain" ]; then
        rm -f "$NGINX_ENABLED_DIR/$domain"
        echo "✅ Конфигурация отключена"
    fi
    
    rm -f "$NGINX_CONFIG_DIR/$domain"
    echo "✅ Конфигурационный файл удален"
    
    if [ -d "/etc/letsencrypt/live/$domain" ]; then
        certbot delete --cert-name "$domain" --non-interactive
        echo "✅ SSL сертификат удален"
    fi
    
    if ! test_nginx_config; then
        return_status "error" "Ошибка в конфигурации Nginx после удаления" "nginx_config_error"
    fi
    
    if ! reload_nginx; then
        return_status "error" "Ошибка при перезагрузке Nginx" "nginx_reload_error"
    fi
    
    return_status "success" "Домен $domain успешно удален" ""
}

# Обработка команд
case "$ACTION" in
    "status")
        check_domain_status "$DOMAIN"
        exit 0
        ;;
    "remove")
        remove_domain "$DOMAIN"
        ;;
    "add")
        echo "🚀 Начинаем автоматическую настройку для домена: $DOMAIN"
        ;;
esac

# Этап 1: Создаем HTTP-only конфигурацию для получения сертификата
create_http_config() {
    local domain=$1
    local config_file="$NGINX_CONFIG_DIR/$domain"
    
    echo "📝 Создаем временную HTTP конфигурацию для $domain"
    
    if ! cat > "$config_file" << EOF
# Временная HTTP конфигурация для получения SSL сертификата
server {
    listen 80;
    listen [::]:80;
    server_name $domain www.$domain;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    location / {
        return 200 "Domain setup in progress for $domain...";
        add_header Content-Type text/plain;
    }
}
EOF
    then
        echo "❌ Не удалось записать временную конфигурацию"
        return 1
    fi

    if ! ln -sf "$config_file" "$NGINX_ENABLED_DIR/$domain"; then
        echo "❌ Не удалось создать символическую ссылку для конфигурации"
        return 1
    fi
    echo "✅ Временная HTTP конфигурация создана"
    return 0
}

# Этап 2: Создаем полную конфигурацию с SSL
create_full_config() {
    local domain=$1
    local config_file="$NGINX_CONFIG_DIR/$domain"
    
    echo "📝 Создаем полную конфигурацию с SSL для $domain"
    
    if ! cat > "$config_file" << EOF
# HTTP редирект на HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $domain www.$domain;
    
    location /.well-known/acme-challenge/ {
        root $WEBROOT;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $domain www.$domain;
    
    ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    root $SITE_ROOT;
    index index.html index.htm index.nginx-debian.html;
    
    location / {
        try_files \$uri /index.html;
    }

    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF
    then
        echo "❌ Не удалось записать SSL конфигурацию"
        return 1
    fi

    echo "✅ Полная конфигурация с SSL создана"
    return 0
}

# Проверяем и создаем директорию сайта
create_site_directory() {
    local site_dir="$SITE_ROOT"
    
    echo "📁 Проверяем директорию сайта: $site_dir"
    
    if [ ! -d "$site_dir" ]; then
        echo "📁 Создаем директорию: $site_dir"
        mkdir -p "$site_dir" || return 1
        chown -R www-data:www-data "$site_dir" || return 1
        chmod -R 755 "$site_dir" || return 1
    fi
    
    if [ ! -f "$site_dir/index.html" ]; then
        echo "📄 Создаем базовый index.html"
        cat > "$site_dir/index.html" << EOF
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>$DOMAIN - Floorplan Wizard Builder</title>
</head>
<body>
<h1>✅ Домен $DOMAIN успешно настроен!</h1>
<p>SSL сертификат активен</p>
</body>
</html>
EOF
        chown www-data:www-data "$site_dir/index.html"
        chmod 644 "$site_dir/index.html"
    fi
    return 0
}

install_certbot() {
    if ! command -v certbot &> /dev/null; then
        echo "📦 Устанавливаем certbot..."
        apt update && apt install -y certbot python3-certbot-nginx || return 1
    fi
    return 0
}

get_ssl_certificate() {
    local domain=$1
    echo "🔒 Получаем SSL сертификат для $domain"
    
    mkdir -p "$WEBROOT" || return 1
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$domain,www.$domain" \
        --non-interactive
}

test_nginx_config() {
    nginx -t
}

reload_nginx() {
    systemctl reload nginx
}

check_domain_availability() {
    local domain=$1
    echo "🌐 Проверяем доступность домена $domain..."
    if dig +short A "$domain" | grep -q .; then
        echo "✅ A запись найдена"
    else
        echo "⚠️  A запись не найдена"
    fi
}

main() {
    check_domain_availability "$DOMAIN"
    create_site_directory || return_status "error" "Ошибка создания директории" "dir_failed"
    install_certbot || return_status "error" "Не удалось установить certbot" "certbot_failed"
    create_http_config "$DOMAIN" || return_status "error" "Ошибка HTTP конфигурации" "nginx_http_failed"
    test_nginx_config || return_status "error" "Ошибка теста Nginx" "nginx_test_failed"
    reload_nginx || return_status "error" "Ошибка перезагрузки Nginx" "nginx_reload_failed"
    sleep 5
    get_ssl_certificate "$DOMAIN" || return_status "error" "Ошибка получения сертификата" "ssl_failed"
    create_full_config "$DOMAIN" || return_status "error" "Ошибка создания SSL конфигурации" "nginx_ssl_failed"
    test_nginx_config || return_status "error" "Ошибка теста финальной конфигурации" "nginx_final_failed"
    reload_nginx || return_status "error" "Ошибка финальной перезагрузки" "nginx_final_reload_failed"
    return_status "success" "Домен $DOMAIN успешно настроен с SSL" ""
}

cleanup() {
    echo "🧹 Очистка при ошибке..."
    rm -f "$NGINX_ENABLED_DIR/$DOMAIN" "$NGINX_CONFIG_DIR/$DOMAIN"
    systemctl reload nginx
}

trap cleanup ERR
main
echo "✨ Автоматическая настройка завершена!"
