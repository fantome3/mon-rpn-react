# ACQ-RPN

**ACQ-RPN** est une plateforme web de solidarité permettant de gérer les cotisations, les annonces de décès, et le rapatriement des corps à travers un réseau communautaire. Elle offre une interface pour les membres, les administrateurs, et des statistiques détaillées.

---

## 🚀 Fonctionnalités principales

- Gestion des membres et personnes à charge
- Publication d’annonces de décès
- Système de cotisations annuelles & prélèvements automatiques
- Tableau de bord utilisateur
- Bilan financier global & analytique
- Parrainage et invitations

---

## 📚 Table des matières

- [Fonctionnalités principales](#-fonctionnalités-principales)
- [Technologies utilisées](#-technologies-utilisées)
- [Architecture du frontend](#-architecture-du-frontend-clientsrc)
- [Architecture du backend](#-architecture-du-backend)
- [Installation & configuration](#️-setup)
- [Fichier .env](#configuration-fichier-env-dans-le-dossier-server)
- [Lancement du projet](#lancement-du-projet)

---

## 🌐 Technologies utilisées

### Frontend

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/) – graphiques analytiques

### Backend

- **Node.js** + **Express**
- **MongoDB** via **Mongoose / Typegoose**
- **TypeScript** (strict typing)
- **Nodemailer** (emails de rappel, envoi de mot de passe)
- **node-cron** (rappels automatiques)
- **JWT** pour l'authentification
- **bcryptjs** pour crypter les mots de passe
- **Cloudinary, multer, streamifier** pour uploader les images

---

## 📁 Architecture du frontend (`client/src`)

```bash
src/
├── assets/ # Images et fichiers statiques
├── components/ # Composants réutilisables
│ ├── ui/ # Sections d’interface réutilisées (Header, Footer, etc.)
│ └── ... # Autres composants organisés par fonctionnalité
├── hooks/ # Custom React hooks pour appels API
├── lib/ # Fonctions utilitaires, Store global, i18n
├── pages/ # Pages organisées par fonctionnalité (auth, profil, admin, etc.)
│ ├── account/ # Méthodes de paiement, infos personnelles
│ ├── admin/ # Pages admin : transactions, annonces, comptes
│ ├── auth/ # Login, register, reset password, etc.
│ ├── profil/ # Dépendants et parrainage
│ ├── transactions/ # Pages liées aux opérations financières
├── types/ # Déclarations TypeScript pour les données
├── App.tsx # Application root
├── main.tsx # Entrée React
├── apiClient.ts # Axios instance ou fetch API setup

```

## 📁 Architecture du backend

```bash

server/
├── src/
│ ├── cron/ # Tâches automatisées (rappels)
│ │ └── membershipReminder.ts
│ ├── models/ # Modèles Mongoose / Typegoose
│ │ └── userModel.ts, transactionModel.ts, ...
│ ├── routers/ # Routes Express
│ │ └── userRouter.ts, transactionRouter.ts, ...
│ ├── services/ # Logique métier (rappels, contrôles)
│ │ └── membershipService.ts, checkMinimumBalanceAlert.ts
│ ├── types/ # Types TypeScript partagés
│ ├──mailer/
│ │ └── alert.ts, auth.ts, core.ts, index.ts, notification.ts, ...
│ └── utils.ts # Fonctions utilitaires
├── .env # Variables d’environnement
├── package.json # Dépendances et scripts
└── tsconfig.json # Configuration TypeScript

```

---

## ⚙️ Setup

### Installation

```bash
cd server
npm install
```

```bash
cd client
npm install

```

---

### Configuration fichier .env dans le dossier server

```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/monrpn
JWT_SECRET=supersecret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=contact@example.com
SMTP_PASS=yourpassword

```

## Lancement du projet

### Dans le dossier client

```bash
- `npm run dev` : démarre le frontend (Vite)
- `npm run build` : build de production
- `npm run lint` : vérifie les erreurs de style

```

### Dans le dossier server

```bash
- `npm run dev` : démarre le serveur en mode développement (ts-node)
- `npm run build` : transpile le TypeScript en JavaScript

```

# DÉPLOIEMENT SUR VPS

## 📁 Arborescence du projet

```bash
monrpn/
├── client/                 # App React (Vite)
│   ├── Dockerfile          # Build + Nginx
│   └── nginx.conf          # Proxy vers /api
├── server/                 # API Node.js + Express + Mongo
│   ├── Dockerfile
│   └── .env                # Variables d'env serveur
├── docker-compose.yml
└── README.md
```

## ⚙️ Prérequis VPS

### Serveur Linux (ex: Contabo, DigitalOcean)

### Docker et Docker Compose installés :

```bash
sudo apt update && sudo apt install docker.io docker-compose -y

```

### 🧱 Étape 1 – Construire les images

```bash
docker-compose build
```

### 🔐 Étape 2 – Créer .env dans /server

```bash
MONGODB_URI=mongodb://monrpn-mongo:27017/monrpn
PORT=5010
...
```

### 🚀 Étape 3 – Lancer les services

```bash
docker-compose up -d
```

### monrpn-client → Serveur Nginx sur http://<ip_du_serveur>:3000

### monrpn-server → Serveur Express en fond (port 5010)

### monrpn-mongo → Base de données MongoDB

### 📦 Dockerfile client/Dockerfile (Vite + Nginx)

```bash
# Build client
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Serve via Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

```

### 📦 Dockerfile server/Dockerfile

```bash
# Étape 1 : build TypeScript
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Étape 2 : image minimale de production
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/build ./build


EXPOSE 5010

CMD ["node", "build/index.js"]

```

### Exemple client/nginx.conf

```bash
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api/ {
    proxy_pass http://monrpn-server:5010;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}


```

### 📂 docker-compose.yml

```bash
services:
  client:
    build: ./client
    container_name: monrpn-client
    ports:
      - '3000:80'
    depends_on:
      - server

  server:
    build: ./server
    container_name: monrpn-server
    ports:
      - '5010:5010'
    env_file:
      - ./server/.env
    depends_on:
      - mongo

  mongo:
    image: mongo:6.0
    container_name: monrpn-mongo
    ports:
      - '27017:27017'
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:

```
