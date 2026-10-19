# 🏗️ Architecture Technique - Workflow de Notification

## 📐 Vue d'Ensemble

Ce document détaille l'architecture technique du nouveau système de création de notifications.

---

## 🔄 Diagramme de Flux de Données

```
┌─────────────────────────────────────────────────────────────────┐
│                        UTILISATEUR DISCORD                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INTERACTION DISCORD                           │
│  (Button/SelectMenu/Modal)                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SAPPHIRE FRAMEWORK                              │
│  - Routing des interactions par customId                         │
│  - Appel du bon InteractionHandler                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌────────┐      ┌──────────┐    ┌──────────┐
   │ Button │      │SelectMenu│    │  Modal   │
   │Handler │      │ Handler  │    │ Handler  │
   └────┬───┘      └─────┬────┘    └────┬─────┘
        │                │              │
        └────────────────┼──────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INTERACTION HANDLERS                            │
│  - selectRestaurants.ts                                          │
│  - toggleRestaurantSelection.ts                                  │
│  - continueToDateSelection.ts                                    │
│  - chooseMealPeriod.ts                                           │
│  - confirmNotification.ts                                        │
│  - validateNotification.ts                                       │
│  - cancelRestaurantSelection.ts                                  │
└────────────────┬───────────────┬────────────────────────────────┘
                 │               │
         ┌───────┘               └───────┐
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│  CACHE REDIS     │            │   API BACKEND    │
│                  │            │                  │
│ - Sélection user │            │ - /restaurants   │
│ - TTL 15 min     │            │ - /discord-alerts│
└──────────────────┘            └──────────────────┘
```

---

## 🗂️ Structure des Fichiers

### Handlers d'Interaction

```typescript
src/interaction-handlers/
│
├── selectRestaurants.ts
│   ├── Type: ButtonHandler
│   ├── CustomIds: "startAlertBook", "selectRestaurants-{page}"
│   ├── Responsabilités:
│   │   - Affichage paginé des restaurants
│   │   - Navigation entre les pages
│   │   - Affichage de la sélection actuelle
│   └── Dépendances: fetchRestaurants(), getCachedRestaurantSelection()
│
├── toggleRestaurantSelection.ts
│   ├── Type: SelectMenuHandler
│   ├── CustomId: "toggleRestaurantSelection"
│   ├── Responsabilités:
│   │   - Mise à jour de la sélection
│   │   - Validation de la limite (5 max)
│   │   - Sauvegarde dans Redis
│   └── Dépendances: cacheRestaurantSelection()
│
├── continueToDateSelection.ts
│   ├── Type: ButtonHandler
│   ├── CustomId: "continueToDateSelection"
│   ├── Responsabilités:
│   │   - Vérification qu'au moins 1 restaurant sélectionné
│   │   - Ouverture du modal date/convives
│   └── Dépendances: getCachedRestaurantSelection()
│
├── chooseMealPeriod.ts
│   ├── Type: ModalSubmitHandler
│   ├── CustomId: "chooseMealPeriod-{restaurantIds}"
│   ├── Responsabilités:
│   │   - Validation de la date
│   │   - Validation du nombre de convives
│   │   - Affichage du menu de période de repas
│   └── Dépendances: fetchRestaurantById(), date validators
│
├── confirmNotification.ts
│   ├── Type: SelectMenuHandler
│   ├── CustomId: "confirmNotification-{restaurantIds}-{date}-{partyMix}"
│   ├── Responsabilités:
│   │   - Affichage du récapitulatif complet
│   │   - Boutons d'action (Confirmer/Modifier/Annuler)
│   └── Dépendances: fetchRestaurantById()
│
├── validateNotification.ts
│   ├── Type: ButtonHandler
│   ├── CustomId: "validateNotification-{params}"
│   ├── Responsabilités:
│   │   - Création de la notification via API
│   │   - Nettoyage du cache
│   │   - Affichage du message de succès
│   └── Dépendances: createBookAlert(), clearCachedRestaurantSelection()
│
└── cancelRestaurantSelection.ts
    ├── Type: ButtonHandler
    ├── CustomId: "cancelRestaurantSelection"
    ├── Responsabilités:
    │   - Nettoyage du cache
    │   - Message de confirmation
    └── Dépendances: clearCachedRestaurantSelection()
```

---

## 🔧 Utilitaires

### restaurantSelection.ts

```typescript
// Fonctions de gestion du cache de sélection

getCachedRestaurantSelection(userId: string): Promise<number[]>
  ├── Redis Key: `restaurant_selection:${userId}`
  ├── Retourne: Array d'IDs de restaurants
  └── Retourne [] si absent ou expiré

cacheRestaurantSelection(userId: string, restaurantIds: number[]): Promise<void>
  ├── Redis Key: `restaurant_selection:${userId}`
  ├── TTL: 900 secondes (15 minutes)
  └── Format: JSON.stringify({ selectedRestaurantIds, timestamp })

clearCachedRestaurantSelection(userId: string): Promise<void>
  └── Supprime la clé Redis

toggleRestaurantSelection(userId: string, restaurantId: number): Promise<number[]>
  ├── Récupère la sélection actuelle
  ├── Ajoute ou retire le restaurant
  └── Sauvegarde et retourne la nouvelle sélection

addRestaurantsToSelection(userId: string, restaurantIds: number[]): Promise<number[]>
  └── Ajoute plusieurs restaurants (déduplique)

removeRestaurantFromSelection(userId: string, restaurantId: number): Promise<number[]>
  └── Retire un restaurant spécifique
```

---

## 🎯 Flux de Données Détaillé

### 1️⃣ Sélection de Restaurants

```
User Click "Enregistrer une notification"
    ↓
[selectRestaurants.parse()] ← customId: "startAlertBook"
    ↓
[selectRestaurants.run()]
    ↓
clearCachedRestaurantSelection(userId) ← Nettoie l'ancien
    ↓
fetchRestaurants() ← API call (avec cache 1h)
    ↓
Sort alphabetically
    ↓
Paginate (20 per page)
    ↓
getCachedRestaurantSelection(userId) ← Charge sélection actuelle
    ↓
Build SelectMenu avec état de chaque restaurant
    ↓
Build Navigation Buttons (prev/next)
    ↓
Build Action Buttons (Continue si selection > 0 / Cancel)
    ↓
interaction.followUp(embed + components)
```

### 2️⃣ Toggle de Sélection

```
User sélectionne des restaurants dans le menu
    ↓
[toggleRestaurantSelection.parse()] ← customId: "toggleRestaurantSelection"
    ↓
[toggleRestaurantSelection.run()]
    ↓
interaction.deferUpdate() ← Évite le timeout
    ↓
Parse interaction.values → Array<restaurantId>
    ↓
Validate: selectedValues.length <= MAX_RESTAURANTS_PER_ALERT
    ↓
cacheRestaurantSelection(userId, selectedValues)
    ├── Redis: setEx(key, 900, JSON.stringify(data))
    └── Log: "User updated restaurant selection"
```

### 3️⃣ Passage à la Date

```
User Click "Continuer avec X restaurant(s)"
    ↓
[continueToDateSelection.parse()] ← customId: "continueToDateSelection"
    ↓
[continueToDateSelection.run()]
    ↓
getCachedRestaurantSelection(userId)
    ↓
if (selectedIds.length === 0) → Error
    ↓
Build Modal avec:
    ├── Date Input (JJ/MM/AAAA)
    └── Party Size Input (1-10)
    ↓
Modal CustomId: `chooseMealPeriod-${restaurantIds.join(',')}`
    ↓
interaction.showModal(modal)
```

### 4️⃣ Validation & Période de Repas

```
User Submit Modal
    ↓
[chooseMealPeriod.parse()] ← customId: "chooseMealPeriod-1,2,3"
    ↓
[chooseMealPeriod.run()]
    ↓
interaction.deferReply({ ephemeral: true })
    ↓
Parse customId → extract restaurantIds
    ↓
Validate Date:
    ├── isValidDateFormat(rawDate)
    ├── parseDateDDMMYYYY(rawDate)
    ├── isAfter(visitDate, today)
    └── isBefore(visitDate, today + 90 days)
    ↓
Validate Party Mix:
    ├── parseInt(rawPartyMix, 10)
    ├── >= LIMITS.PARTY_MIN
    └── <= LIMITS.PARTY_MAX
    ↓
Fetch restaurants by IDs
    ↓
Build SelectMenu (Breakfast/Lunch/Dinner)
    ↓
CustomId: `confirmNotification-${restaurantIds}-${date}-${partyMix}`
    ↓
interaction.followUp(embed + components)
```

### 5️⃣ Confirmation

```
User sélectionne période de repas
    ↓
[confirmNotification.parse()] ← customId: "confirmNotification-..."
    ↓
[confirmNotification.run()]
    ↓
interaction.deferUpdate()
    ↓
Parse customId:
    ├── restaurantIds: "1,2,3" → [1, 2, 3]
    ├── date: "24/12/2025"
    └── partyMix: 4
    ↓
fetchRestaurantById() for each ID
    ↓
Build récapitulatif embed avec:
    ├── Liste restaurants
    ├── Date
    ├── Convives
    └── Période de repas
    ↓
Build action buttons:
    ├── "Confirmer" → validateNotification-{params}
    ├── "Modifier" → startAlertBook
    └── "Annuler" → cancelRestaurantSelection
    ↓
interaction.editReply(embed + buttons)
```

### 6️⃣ Validation Finale

```
User Click "✅ Confirmer"
    ↓
[validateNotification.parse()] ← customId: "validateNotification-..."
    ↓
[validateNotification.run()]
    ↓
interaction.deferUpdate()
    ↓
Parse customId → extract all params
    ↓
createBookAlert(restaurantIds, mealPeriod, date, partyMix, userId)
    ├── API Call: POST /discord-alerts
    ├── Body: { restaurantIds: number[], ... }
    └── Response: RestaurantAlert object
    ↓
clearCachedRestaurantSelection(userId) ← Nettoie le cache
    ↓
fetchRestaurantById() for display
    ↓
Build success embed avec:
    ├── Alert ID
    ├── Tous les détails
    ├── Timestamp
    └── Success image
    ↓
interaction.editReply(success embed)
    ↓
Log: "Book alert created successfully"
```

---

## 🔐 Sécurité & Validation

### Input Sanitization

```typescript
// Date validation
isValidDateFormat(rawDate: string): boolean
  └── Regex: /^\d{2}\/\d{2}\/\d{4}$/

parseDateDDMMYYYY(rawDate: string): Date
  └── Parse et vérifie la validité

// Party mix validation
parseInt(rawPartyMix, 10)
  ├── isNaN() check
  ├── >= LIMITS.PARTY_MIN (1)
  └── <= LIMITS.PARTY_MAX (10)

// Restaurant IDs validation
restaurantIds.map(id => parseInt(id, 10))
  └── Vérifie l'existence via fetchRestaurantById()
```

### CustomId Security

```typescript
// Format attendu
"action-param1-param2-param3"

// Parsing sécurisé
const parts = customId.split('-');
if (parts.length < expectedLength) {
  // Error handling
}
```

### Rate Limiting

```typescript
// Redis TTL limite les sélections fantômes
SELECTION_CACHE_TTL = 900 // 15 minutes

// Discord rate limiting naturel (3s timeout)
interaction.deferReply() // Évite le timeout
```

---

## 📊 Performance

### Optimisations

1. **Cache API Restaurants** (1 heure)
   ```typescript
   // Dans restaurants.ts
   const CACHE_TTL_MS = 60 * 60 * 1000;
   ```

2. **Cache Redis Sélection** (15 minutes)
   ```typescript
   // Dans restaurantSelection.ts
   const SELECTION_CACHE_TTL = 900;
   ```

3. **Pagination**
   - Max 20 restaurants par page
   - Évite le rendering de trop d'options
   - Réduit la taille des messages Discord

4. **Defer Reply**
   - Évite le timeout 3 secondes de Discord
   - Permet les opérations async longues

### Metrics à Surveiller

```typescript
// Logs structurés avec Pino
logger.info({
  userId: string,
  page: number,
  selectedCount: number,
  restaurantIds: number[],
  // ... autres métriques
}, 'Action description');
```

---

## 🐛 Error Handling

### Stratégie Globale

```typescript
try {
  // Handler logic
} catch (error) {
  await handleInteractionError(interaction, error, {
    customId: interaction.customId,
  });
}
```

### Sentry Integration

```typescript
// Capture des exceptions
Sentry.captureException(error);

// Contexte enrichi automatique
// - User ID
// - CustomId
// - Stack trace
```

### Messages d'Erreur

```typescript
// Constantes centralisées
MESSAGES.ERROR = {
  GENERIC: { TITLE, DESCRIPTION },
  INVALID_DATE: { TITLE, DESCRIPTION },
  PAST_DATE: { TITLE, DESCRIPTION },
  // ... etc
}
```

---

## 🔄 État et Cache

### Redis Schema

```
Key Pattern: restaurant_selection:{userId}
Value: JSON {
  selectedRestaurantIds: number[],
  timestamp: number
}
TTL: 900 seconds (15 minutes)

Examples:
restaurant_selection:123456789 → {"selectedRestaurantIds":[1,5,12],"timestamp":1732627200000}
```

### Memory Cache

```typescript
// Dans restaurants.ts
interface RestaurantCache {
  data: Restaurant[];
  timestamp: number;
}

let restaurantCache: RestaurantCache | null = null;
```

---

## 📦 Types TypeScript

### Principales Interfaces

```typescript
// Restaurant
interface Restaurant {
  id: number;
  name: string;
  disneyId: string;
  imageUrl: string | null;
}

// Restaurant Alert
interface RestaurantAlert {
  id: number;
  checks: RestaurantCheck[];
  discordId: string;
  date: string;
  mealPeriod: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  partyMix: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Restaurant Check
interface RestaurantCheck {
  id: number;
  alertId: number;
  restaurantId: number;
  checkedAt: string;
  checkCount: number;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🚀 Déploiement

### Checklist Pré-Déploiement

1. ✅ Compilation TypeScript sans erreurs
2. ✅ Tests unitaires passés
3. ✅ Tests d'intégration passés
4. ✅ Redis accessible
5. ✅ API backend disponible
6. ✅ Sentry configuré
7. ✅ Variables d'environnement définies

### Rollback Strategy

```bash
# Si problème détecté
git revert <commit-hash>
npm run build
pm2 restart remy

# Ou rollback complet
git checkout v1.x.x
npm run build
pm2 restart remy
```

---

## 📚 Documentation Complémentaire

- [README.md](./README.md) - Documentation utilisateur

---

**Architecture conçue pour la scalabilité et la maintenabilité ! 🏗️**

