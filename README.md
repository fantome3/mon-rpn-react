# MON-RPN

**MON-RPN** est une plateforme web de solidarité permettant de gérer les cotisations, les annonces de décès, et le rapatriement des corps à travers un réseau communautaire. Elle offre une interface pour les membres, les administrateurs, et des statistiques détaillées.

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
