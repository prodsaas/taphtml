# VPS Deployment Guide

## 1. Linux

Update system packages:

```bash
sudo apt update
sudo apt upgrade
```

## 2. Node (NVM + PM2)

NVM Installation Guide:
[https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)

### Install NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
```

### Load NVM

```bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

### Install Node (LTS)

```bash
nvm --version
nvm install --lts
node -v
```

### Install PM2

```bash
npm install -g pm2
pm2 -v
```

## 3. Folder Structure

```bash
mkdir -p /root/taphtml/api
mkdir -p /var/www/taphtml/dashboard
mkdir -p /var/www/taphtml/landing
mkdir -p /var/www/taphtml/widget
```

## 4. GitHub Actions (SSH Setup)

### Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions"
```

### Add Public Key

```bash
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
```

### Get Private Key

```bash
cat ~/.ssh/id_ed25519
```

### GitHub Secrets Setup

* Go to **Repository Settings**
* Navigate to **Secrets & variables**, then **Actions**

Add the following secrets:

| Name        | Value          |
| ----------- | -------------- |
| VPS_SSH_KEY | Private Key    |
| VPS_HOST    | VPS IP Address |
| VPS_USER    | VPS User       |

## 5. Nginx

### Install

```bash
sudo apt install nginx
```

### Remove Default Config

```bash
cd /etc/nginx/sites-available/
rm default
```

### Create Config Files

#### VPS IP Config

```bash
nano <YOUR_VPS_IP_ADDRESS>.conf
```

```nginx
server {
    listen 80;
    root /var/www/taphtml/landing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

#### Main Domain

```bash
nano <YOUR_DOMAIN>.conf
```

```nginx
server {
    listen 80;
    server_name <YOUR_DOMAIN> www.<YOUR_DOMAIN>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name <YOUR_DOMAIN> www.<YOUR_DOMAIN>;

    root /var/www/taphtml/landing;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

#### API Subdomain

```bash
nano api.<YOUR_DOMAIN>.conf
```

```nginx
server {
    listen 80;
    server_name api.<YOUR_DOMAIN>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api.<YOUR_DOMAIN>;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Dashboard Subdomain

```bash
nano dashboard.<YOUR_DOMAIN>.conf
```

```nginx
server {
    listen 80;
    server_name dashboard.<YOUR_DOMAIN>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dashboard.<YOUR_DOMAIN>;

    root /var/www/taphtml/dashboard;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

#### Widget Subdomain

```bash
nano widget.<YOUR_DOMAIN>.conf
```

```nginx
server {
    listen 80;
    server_name widget.<YOUR_DOMAIN>;

    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name widget.<YOUR_DOMAIN>;

    root /var/www/taphtml/widget;

    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    add_header Access-Control-Allow-Headers "*";

    location = / {
        default_type application/javascript;
        try_files /widget.js =404;
    }

    location / {
        try_files $uri =404;
    }
}
```

### Enable Sites

```bash
cd /etc/nginx/sites-enabled
rm default

ln -s ../sites-available/<YOUR_VPS_IP_ADDRESS>.conf .
ln -s ../sites-available/<YOUR_DOMAIN>.conf  .
ln -s ../sites-available/api.<YOUR_DOMAIN>.conf  .
ln -s ../sites-available/dashboard.<YOUR_DOMAIN>.conf .
ln -s ../sites-available/widget.<YOUR_DOMAIN>.conf .
```

### Test & Reload

```bash
nginx -t
systemctl reload nginx
```

## 6. API Environment

```bash
cd /root/taphtml/api
nano .env
```

Paste your `.env` file.

## 7. Install PostgreSQL

```bash
apt install postgresql postgresql-contrib -y
systemctl enable postgresql
systemctl start postgresql
```

## 8. Install Redis

```bash
apt install redis-server -y
systemctl enable redis-server
systemctl start redis-server
```

## 9. PostgreSQL Database Setup

### Switch User

```bash
sudo -i -u postgres
psql
```

### Create DB & User

```sql
CREATE DATABASE <DB_NAME>;
CREATE USER <DB_USER> WITH ENCRYPTED PASSWORD '<DB_PASS>';

ALTER ROLE <DB_USER> SET client_encoding TO 'utf8';
ALTER ROLE <DB_USER> SET default_transaction_isolation TO 'read committed';
ALTER ROLE <DB_USER> SET timezone TO 'UTC';

GRANT ALL PRIVILEGES ON DATABASE <DB_NAME> TO <DB_USER>;

\c <DB_NAME>

GRANT ALL ON SCHEMA public TO <DB_USER>;
ALTER SCHEMA public OWNER TO <DB_USER>;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO <DB_USER>;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO <DB_USER>;
```

### Exit

```bash
\q
exit
```

### Update Authentication Method

```bash
nano /etc/postgresql/*/main/pg_hba.conf
```

Find:

```
local   all             all                                     peer
```

Replace with:

```
local   all             all                                     md5
```

### Restart PostgreSQL

```bash
systemctl restart postgresql
```