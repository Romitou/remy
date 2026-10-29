# Rémy

Rémy est un bot Discord qui permet de recevoir des notifications dès qu'une table se libère dans les restaurants de Disneyland Paris.

Il fonctionne conjointement avec [DisneyTables](https://github.com/Romitou/DisneyTables), un service qui surveille les disponibilités en continu et publie les ouvertures de créneaux sur Redis. Rémy consomme ces événements et prévient directement les utilisateurs en message privé avec le lien de réservation officiel.

Le bot est déployé en production sur le serveur Discord [DLP HELP - Notifications et entraides](https://discord.gg/disneyland-paris-notifications-et-entraide-899677077287075930).

---

## Fonctionnalités

- **Alertes personnalisées** : choix du restaurant (par recherche textuelle ou navigation par page), de la date, du créneau (midi, soir, etc.) et du nombre de convives.
- **Notifications en temps réel** : réception d'un message privé dès qu'un créneau correspondant est détecté.
- **Gestion des alertes** : consultation, modification et suppression (unitaire ou globale) via la commande `/mes-alertes`.
- **Création rapide** : commande `/alerte` avec autocomplétion des restaurants pour ouvrir directement le formulaire de réservation.
- **Gestion des messages privés fermés** : détection et avertissement si l'utilisateur a bloqué les messages privés du bot, évitant la perte d'alertes.
- **Suivi et présence** : mise à jour dynamique de l'activité du bot avec le nombre d'alertes surveillées et envoi d'un rapport quotidien à l'administrateur.

---

## Comment ça marche

1. **DisneyTables** scrute les disponibilités de Disneyland Paris et publie les nouveaux créneaux sur un canal Redis pub/sub (`restaurant-notifications`).
2. **Rémy** écoute ce canal et compare chaque créneau disponible aux alertes actives enregistrées en base.
3. Dès qu'une alerte correspond (même restaurant, date, créneau et capacité suffisante), le bot envoie un message privé à l'utilisateur avec un lien direct vers la réservation.
4. L'utilisateur peut alors valider sa réservation ou supprimer son alerte directement depuis les boutons du message reçu.

Pour le détail des interactions Discord et des choix techniques, voir [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Prérequis

- Node.js 20 ou supérieur
- Un serveur Redis
- Une instance de l'API DisneyTables
- Une application Discord avec un bot configuré (privilèges `Guilds`, scopes `bot` et `applications.commands`)

---

## Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/Romitou/Remy.git
   cd Remy
   ```

2. Installer les dépendances :
   ```bash
   npm ci
   ```

3. Créer le fichier d'environnement :
   ```bash
   cp .env.example .env
   ```

4. Configurer les variables dans `.env` :

| Variable | Description | Requis |
| --- | --- | :---: |
| `DISCORD_TOKEN` | Jeton d'authentification du bot Discord | Oui |
| `BASE_API` | URL de l'API DisneyTables | Oui |
| `WEBSERVER_TOKEN` | Jeton d'authentification pour DisneyTables | Oui |
| `REDIS_URL` | URL de connexion Redis (`redis://localhost:6379`) | Oui |
| `REDIS_PASSWORD` | Mot de passe de la base Redis si configuré | Non |
| `SENTRY_DSN` | DSN Sentry pour le suivi des erreurs | Non |
| `NODE_ENV` | Environnement (`development`, `production`, `test`) | Non |
| `LOG_LEVEL` | Niveau de journalisation (`info`, `debug`, `warn`, `error`) | Non |
| `OWNER_ID` | Identifiant Discord pour l'envoi du rapport quotidien | Non |
| `CHANNEL_ID` | Salon Discord accueillant le message d'onboarding | Non |
| `FEEDBACK_CHANNEL_ID` | Salon mentionné après une réservation confirmée | Non |
| `GUILD_ID` | Identifiant du serveur pour les scripts de maintenance | Non |

*Les variables laissées vides sont ignorées.*

---

## Démarrage

### En développement

```bash
npm run dev
```

### En production

```bash
npm run build
npm start
```

### Avec Docker

Un fichier `docker-compose.yml` est fourni pour démarrer le bot et un serveur Redis :

```bash
docker compose up -d --build
```

---

## Commandes disponibles

- `npm run dev` : lance le bot avec rechargement à chaud (`tsx`).
- `npm run build` : compile le code TypeScript dans le dossier `build/`.
- `npm start` : exécute la version compilée.
- `npm test` : lance la suite de tests unitaires avec le runner Node.js (`node:test`).
- `npm run lint` / `npm run lint:fix` : analyse le code avec ESLint et corrige les erreurs simples.
- `npm run format` / `npm run format:check` : formate le code source avec Prettier.
- `npm run type-check` : effectue la vérification statique des types TypeScript.
- `npm run validate` : exécute les vérifications complètes (types, lint, format, tests).

---

## Structure du projet

```text
remy/
├── src/
│   ├── commands/              # Commandes slash (/alerte, /mes-alertes)
│   ├── config/                # Validation Zod des variables et configuration Pino
│   ├── constants/             # Constantes, textes et limites Discord
│   ├── core/                  # Clients Redis, Axios et appels à l'API DisneyTables
│   ├── interaction-handlers/  # Gestionnaires des interactions Discord (boutons, modales, listes)
│   ├── lib/                   # Utilitaires (dates, recherche, pagination, brouillons)
│   ├── tasks/                 # Tâches planifiées (présence, onboarding, rapport)
│   ├── typings/               # Définitions TypeScript
│   ├── instrument.ts          # Initialisation de Sentry
│   └── main.ts                # Point d'entrée de l'application
├── test/                      # Tests unitaires
├── tools/                     # Scripts utilitaires et maintenance
├── Dockerfile                 # Configuration Docker de production
└── docker-compose.yml         # Déploiement combiné bot et Redis
```

---

## Licence

Ce projet est publié sous licence GNU General Public License v3.0. Consultez le fichier [LICENSE](./LICENSE) pour plus d'informations.
