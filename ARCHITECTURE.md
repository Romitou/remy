# Architecture et fonctionnement interne

Rémy est conçu comme un client événementiel pour l'écosystème DisneyTables. Le bot ne sonde pas lui-même les serveurs de Disneyland Paris : il délègue la détection des créneaux à DisneyTables et se concentre sur l'expérience utilisateur Discord (création d'alertes, routage d'interactions et expédition des notifications).

## Flux d'information

Le traitement des alertes repose sur deux flux distincts :

1. **Gestion des alertes (requêtes HTTP sortantes)** :
   Lorsque l'utilisateur configure, modifie ou supprime une alerte via l'interface Discord, Rémy effectue des appels REST authentifiés auprès de l'API DisneyTables. Les opérations réseau sont encapsulées dans `src/core/` avec une politique de retry automatique en cas d'erreur réseau transitoire.

2. **Réception des disponibilités (Redis Pub/Sub)** :
   Dès que DisneyTables repère une table libre, il émet un événement JSON sur le canal Redis `restaurant-notifications`. Rémy maintient une connexion permanente d'écoute. Le payload entrant est validé par un schéma Zod (`src/core/bookNotifications.ts`), puis envoyé en message privé aux utilisateurs concernés.

## Parcours utilisateur et interactions Discord

L'interface s'appuie sur le framework Sapphire (`@sapphire/framework`) pour découpler les commandes slash des interactions de composants (boutons, formulaires modaux, menus déroulants).

### Création d'alerte

L'utilisateur peut démarrer de deux façons :
- Via le bouton du panneau d'accueil ou la commande `/alerte` sans argument : ouvre un sélecteur paginé (`restaurantPicker`) listant les restaurants par tranche de 25, avec possibilité de faire une recherche textuelle insensible à la casse et aux accents.
- Via `/alerte [restaurant]` : utilise l'autocomplétion native de Discord pour choisir le restaurant directement et ouvrir le formulaire sans passer par la liste.

Le formulaire modal rassemble l'ensemble des critères nécessaires (date de visite, période de repas, taille du groupe) :
- Les formats de date courants sont tolérés (`24/12`, `24/12/26`, `24-12-2026`). Si l'année est omise, le bot cible la prochaine occurrence à venir.
- Les valeurs saisies sont temporairement mémorisées dans Redis sous forme de brouillon (durée de vie 24 h), permettant de pré-remplir les formulaires ultérieurs pour faciliter les réservations multiples sur une même journée.
- Si l'envoi du message privé de confirmation échoue (messages privés désactivés sur le serveur), un avertissement visible informe immédiatement l'utilisateur.

### Gestion et cycle de vie

La commande `/mes-alertes` affiche les alertes enregistrées par l'utilisateur. Chaque alerte peut être inspectée, modifiée (réouverture du formulaire pré-rempli) ou supprimée unitairement. Une option de suppression globale avec confirmation est également proposée.

Chaque interaction vérifie systématiquement que l'utilisateur qui clique est bien le propriétaire de l'alerte ciblée.

### Réception d'une notification

Lorsqu'un créneau correspond à une alerte active, le bot transmet un message privé contenant les détails de la réservation et trois actions possibles :
- Un lien externe menant à la réservation Disneyland Paris.
- Un bouton confirmant la réservation (qui clôture l'alerte).
- Un bouton de désactivation si l'utilisateur n'est plus intéressé.

## Choix de conception

- **Mise à jour en place des messages** : pour éviter de polluer le canal ou les messages privés de l'utilisateur avec des réponses successives, les interactions éphémères mettent à jour le message d'origine (`src/lib/respond.ts`) plutôt que d'en créer de nouveaux.
- **Rendu découplé (vues pures)** : la construction des embeds et des composants interactifs est isolée dans `src/lib/views.ts`. Ces fonctions de rendu sont synchrones, sans dépendance réseau, ce qui permet de les tester unitairement face aux contraintes de format de l'API Discord (longueur de titre, nombre maximal d'options par menu).
- **Format uniforme des identifiants personnalisés** : les `customId` des composants suivent la convention `action:arg1:arg2` (`src/lib/customId.ts`), facilitant le routage des événements et la transmission d'état sans persistance superflue. Les interactions datant d'une version antérieure du bot sont interceptées pour afficher un message d'expiration explicite.
- **Résilience** : les connexions Redis et les erreurs Discord critiques font l'objet d'une reconnexion gérée et de remontées Sentry pour assurer la continuité de service en production.
