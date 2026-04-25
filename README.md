# url-shortener-api

> /!\ **PROJET EN COURS DE DEVELOPPEMENT**

Backend REST API pour [ShortLink](https://github.com/ahmed/url-shortener-app) — un URL shortener avec analytics en temps réel.

## Stack

- **Runtime** : Node.js 22 + TypeScript
- **Framework** : Express
- **Base de données** : PostgreSQL (TypeORM)
- **Cache** : Redis (ioredis)
- **Conteneurisation** : Docker

## Endpoints

| Méthode | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/shorten` | Créer un lien court |
| `GET` | `/:code` | Redirection 302 |
| `GET` | `/api/stats/:code` | Analytics du lien |

## Lancer en local

```bash
# Cloner le repo
git clone https://github.com/ahmed/url-shortener-api

# Copier les variables d'env
cp .env.example .env

# Lancer avec Docker
docker-compose up
```

API disponible sur `http://localhost:3001`

## Projet lié

Frontend : [url-shortener-app](https://github.com/adem02/url-shortener-app)