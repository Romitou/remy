# 🏗️ Architecture

Rémy est un bot Discord (discord.js v14 + Sapphire v5) qui sert d'interface à l'API
[DisneyTables](https://github.com/Romitou/DisneyTables) : les utilisateurs y gèrent leurs alertes, et
DisneyTables publie sur Redis les disponibilités trouvées, que Rémy transmet en message privé.

```
Utilisateur ──▶ Discord ──▶ Rémy ──HTTP──▶ API DisneyTables
                              ▲                   │
                              └──── Redis pub/sub ◀┘  (canal "restaurant-notifications")
```

## Parcours utilisateur

### Créer une alerte (2 étapes)

Point d'entrée : bouton **Créer une alerte** du message d'accueil, ou commande `/alerte [restaurant]`
(avec autocomplétion : le formulaire s'ouvre directement).

1. **Choix du restaurant** (`restaurantPicker`) : menu de 25 restaurants par page, boutons
   précédent/suivant, et **Rechercher** (`searchRestaurant` → `searchRestaurantForm`), insensible
   aux accents et à la casse.
2. **Formulaire** (`pickRestaurant` / `openAlertForm` → `submitAlertForm`) : date, nombre de
   convives et repas dans une seule fenêtre. La date accepte `24/12`, `24/12/26`, `24-12-2026`…
   Le formulaire est pré-rempli avec les dernières valeurs saisies (brouillon Redis, 24 h).

À la validation :

- erreurs listées toutes ensemble, avec un bouton **Corriger** qui rouvre le formulaire pré-rempli ;
- refus des doublons et au-delà de 10 alertes actives ;
- création de l'alerte, puis **message privé de confirmation**. S'il échoue (MP fermés),
  l'utilisateur est averti immédiatement qu'il ne recevra pas de notification ;
- boutons **Annuler**, **Nouvelle alerte** (formulaire pré-rempli : pratique pour plusieurs
  restaurants le même jour) et **Mes alertes**.

### Gérer ses alertes

Bouton **Mes alertes** ou commande `/mes-alertes` (`myAlerts`) : liste triée par date, puis pour
chaque alerte (`manageAlert`) **Modifier** (formulaire pré-rempli, l'ancienne alerte est remplacée),
**Supprimer** ou **Retour**. **Tout supprimer** demande une confirmation (`deleteAlert`).

### Notification

DisneyTables publie un message JSON validé par zod (`core/bookNotifications.ts`). Rémy l'envoie en
MP avec trois boutons : **Réserver** (lien), **J'ai réservé** et **Arrêter l'alerte**
(`closeAlertFromNotification`). Sans action, l'alerte reste active.

## Principes

- **Un message par parcours** : une interaction issue d'un message éphémère du bot le remplace
  (`lib/respond.ts`) au lieu d'empiler de nouveaux messages.
- **Vues pures** (`lib/views.ts`) : chaque écran est une fonction sans appel réseau, testée
  (`test/views.test.ts`) contre les limites de Discord.
- **customIds** centralisés dans `lib/customId.ts` (`préfixe-arg1-arg2`). Les composants des
  anciennes versions affichent « Ce message a expiré » (`legacyComponents`) au lieu d'échouer.
- **Propriété** : toute action sur une alerte vérifie qu'elle appartient à l'utilisateur.

## Arborescence

```
src/
├── commands/              # /alerte, /mes-alertes
├── config/                # Variables d'environnement (zod) et logger (pino)
├── constants/             # Couleurs, emojis, limites, textes communs
├── core/                  # API (axios), Redis, notifications, statistiques
├── interaction-handlers/  # Boutons, menus et formulaires
├── lib/                   # Vues, dates, brouillon, recherche, customIds, erreurs
├── tasks/                 # Présence, message d'accueil, rapport quotidien
├── typings/
├── instrument.ts          # Initialisation de Sentry, chargée en premier
└── main.ts
```
