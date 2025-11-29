# 🧪 Guide de Test - Nouveau Workflow de Notification

## 📋 Plan de Test Complet

Ce guide vous permet de tester toutes les fonctionnalités du nouveau workflow.

---

## ✅ Test 1 : Sélection Simple (1 restaurant)

### Objectif
Créer une notification pour un seul restaurant.

### Étapes
1. ✅ Cliquer sur "📬 Enregistrer une notification"
2. ✅ Vérifier l'affichage de la page 1 avec 20 restaurants
3. ✅ Sélectionner 1 restaurant (ex: "Auberge de Cendrillon")
4. ✅ Vérifier que l'emoji change de 🍽️ à ✅
5. ✅ Vérifier le compteur : "1/5 restaurant(s) sélectionné(s)"
6. ✅ Cliquer sur "Continuer avec 1 restaurant(s)"
7. ✅ Dans le modal, saisir :
   - Date : `24/12/2025`
   - Convives : `4`
8. ✅ Sélectionner "Dîner"
9. ✅ Vérifier le récapitulatif
10. ✅ Cliquer sur "✅ Confirmer et créer la notification"
11. ✅ Vérifier le message de succès avec ID de notification

### Résultat Attendu
- Notification créée pour 1 restaurant
- Message de succès affiché
- Cache nettoyé

---

## ✅ Test 2 : Sélection Multiple (5 restaurants max)

### Objectif
Tester la limite de 5 restaurants.

### Étapes
1. ✅ Démarrer le workflow
2. ✅ Sélectionner 3 restaurants sur la page 1
3. ✅ Vérifier le compteur : "3/5 restaurant(s) sélectionné(s)"
4. ✅ Naviguer vers la page 2
5. ✅ Sélectionner 2 restaurants supplémentaires
6. ✅ Vérifier le compteur : "5/5 restaurant(s) sélectionné(s)"
7. ✅ Essayer de sélectionner un 6ème restaurant
8. ✅ Vérifier que c'est impossible (max 5)
9. ✅ Continuer le workflow normalement
10. ✅ Vérifier que tous les 5 restaurants apparaissent dans le récapitulatif

### Résultat Attendu
- Maximum 5 restaurants sélectionnables
- Tous les restaurants affichés dans le récapitulatif
- Notification créée avec 5 restaurants

---

## ✅ Test 3 : Pagination

### Objectif
Tester la navigation entre les pages.

### Étapes
1. ✅ Démarrer le workflow
2. ✅ Vérifier l'affichage "Page 1/X" (X dépend du nombre total de restaurants)
3. ✅ Vérifier que le bouton "Page précédente" n'existe PAS
4. ✅ Vérifier que le bouton "Page suivante" existe SI plus de 20 restaurants
5. ✅ Cliquer sur "Page suivante"
6. ✅ Vérifier l'affichage "Page 2/X"
7. ✅ Vérifier que les deux boutons existent maintenant
8. ✅ Sélectionner un restaurant sur la page 2
9. ✅ Revenir à la page 1 avec "Page précédente"
10. ✅ Vérifier que le restaurant de la page 2 est toujours sélectionné dans le compteur

### Résultat Attendu
- Navigation fluide entre les pages
- Sélection persistante entre les pages
- Boutons affichés de manière contextuelle

---

## ✅ Test 4 : Validation de Date

### Objectif
Tester toutes les validations de date.

### Sous-test 4.1 : Format Invalide
1. ✅ Arriver au modal de date
2. ✅ Saisir `25-12-2025` (mauvais format)
3. ✅ Vérifier le message d'erreur avec format attendu

### Sous-test 4.2 : Date Passée
1. ✅ Saisir `01/01/2024` (date passée)
2. ✅ Vérifier le message d'erreur "Date dans le passé"

### Sous-test 4.3 : Date Trop Lointaine
1. ✅ Saisir une date > 90 jours dans le futur
2. ✅ Vérifier le message d'erreur "Date trop lointaine"

### Sous-test 4.4 : Date Valide
1. ✅ Saisir `24/12/2025` (format correct, dans le futur, < 90 jours)
2. ✅ Vérifier que ça fonctionne

### Résultat Attendu
- Toutes les validations fonctionnent
- Messages d'erreur clairs et utiles

---

## ✅ Test 5 : Validation Nombre de Convives

### Objectif
Tester les limites de convives.

### Sous-test 5.1 : Trop Petit
1. ✅ Saisir `0` personnes
2. ✅ Vérifier l'erreur "Minimum : 1 personne"

### Sous-test 5.2 : Trop Grand
1. ✅ Saisir `11` personnes
2. ✅ Vérifier l'erreur "Maximum : 10 personnes"

### Sous-test 5.3 : Non Numérique
1. ✅ Saisir `abc`
2. ✅ Vérifier l'erreur

### Sous-test 5.4 : Valide
1. ✅ Saisir `4`
2. ✅ Vérifier que ça fonctionne

### Résultat Attendu
- Validation stricte entre 1 et 10
- Messages d'erreur appropriés

---

## ✅ Test 6 : Retour en Arrière

### Objectif
Tester la navigation retour.

### Étapes
1. ✅ Sélectionner 3 restaurants
2. ✅ Saisir date et convives
3. ✅ Sélectionner la période de repas
4. ✅ Arriver au récapitulatif
5. ✅ Cliquer sur "Modifier"
6. ✅ Vérifier qu'on retourne à la sélection de restaurants
7. ✅ Vérifier que les 3 restaurants sont toujours sélectionnés

### Résultat Attendu
- Navigation retour fonctionnelle
- Sélection précédente conservée

---

## ✅ Test 7 : Annulation

### Objectif
Tester l'annulation à différentes étapes.

### Sous-test 7.1 : Annulation Précoce
1. ✅ Sélectionner 2 restaurants
2. ✅ Cliquer sur "Annuler"
3. ✅ Vérifier le message de confirmation
4. ✅ Vérifier que le cache est nettoyé

### Sous-test 7.2 : Annulation Tardive
1. ✅ Aller jusqu'au récapitulatif final
2. ✅ Cliquer sur "Annuler"
3. ✅ Vérifier l'annulation complète

### Résultat Attendu
- Annulation possible à tout moment
- Cache correctement nettoyé

---

## ✅ Test 8 : Cache Redis

### Objectif
Tester la persistance et l'expiration du cache.

### Sous-test 8.1 : Persistance
1. ✅ Sélectionner 2 restaurants
2. ✅ Fermer Discord (ou attendre)
3. ✅ Rouvrir et recommencer le workflow
4. ✅ Vérifier que la sélection est conservée (dans les 15 min)

### Sous-test 8.2 : Expiration
1. ✅ Sélectionner 2 restaurants
2. ✅ Attendre 16 minutes
3. ✅ Recommencer le workflow
4. ✅ Vérifier que la sélection est vide

### Résultat Attendu
- Cache persiste pendant 15 minutes
- Expire correctement après

---

## ✅ Test 9 : Gestion d'Erreurs

### Objectif
Tester la robustesse face aux erreurs.

### Sous-test 9.1 : API Restaurants Down
1. ✅ Couper temporairement l'API
2. ✅ Démarrer le workflow
3. ✅ Vérifier le message d'erreur
4. ✅ Vérifier le bouton "Réessayer"
5. ✅ Rallumer l'API
6. ✅ Cliquer sur "Réessayer"
7. ✅ Vérifier que ça fonctionne

### Sous-test 9.2 : API Alerts Down
1. ✅ Aller jusqu'à la validation finale
2. ✅ Couper l'API
3. ✅ Cliquer sur "Confirmer"
4. ✅ Vérifier le message d'erreur générique
5. ✅ Vérifier que Sentry a loggé l'erreur

### Résultat Attendu
- Messages d'erreur appropriés
- Logging dans Sentry
- Possibilité de réessayer

---

## ✅ Test 10 : Multi-utilisateurs

### Objectif
Vérifier l'isolation entre utilisateurs.

### Étapes
1. ✅ Utilisateur A sélectionne 3 restaurants
2. ✅ Utilisateur B démarre le workflow
3. ✅ Vérifier que B ne voit PAS la sélection de A
4. ✅ Utilisateur B sélectionne 2 restaurants
5. ✅ Utilisateur A continue son workflow
6. ✅ Vérifier que A a toujours ses 3 restaurants

### Résultat Attendu
- Cache isolé par utilisateur (userId)
- Aucune interférence entre utilisateurs

---

## ✅ Test 11 : Performance

### Objectif
Tester avec beaucoup de restaurants.

### Étapes
1. ✅ Vérifier le temps de réponse initial
2. ✅ Naviguer entre plusieurs pages
3. ✅ Vérifier qu'il n'y a pas de timeout Discord (3 secondes)
4. ✅ Vérifier l'utilisation du cache (logs)

### Résultat Attendu
- Réponse < 3 secondes
- Cache utilisé correctement
- Pas de timeout Discord

---

## ✅ Test 12 : Intégration Complète

### Objectif
Test end-to-end complet.

### Étapes
1. ✅ Démarrer depuis l'onboarding
2. ✅ Sélectionner 3 restaurants sur 2 pages différentes
3. ✅ Saisir une date valide
4. ✅ Saisir 6 convives
5. ✅ Choisir "Déjeuner"
6. ✅ Vérifier le récapitulatif complet
7. ✅ Confirmer la création
8. ✅ Vérifier le message de succès
9. ✅ Copier l'ID de notification
10. ✅ Aller dans "Mes notifications"
11. ✅ Vérifier que la notification apparaît

### Résultat Attendu
- Workflow complet fonctionnel
- Notification visible dans la liste
- Toutes les données correctes

---

## 📊 Checklist de Test

### Fonctionnalités Core
- [ ] Sélection simple (1 restaurant)
- [ ] Sélection multiple (2-5 restaurants)
- [ ] Pagination fonctionnelle
- [ ] Persistance du cache
- [ ] Expiration du cache (15 min)
- [ ] Validation de date
- [ ] Validation de convives
- [ ] Sélection de période de repas
- [ ] Récapitulatif complet
- [ ] Création de notification

### Navigation
- [ ] Boutons de pagination contextuels
- [ ] Retour en arrière
- [ ] Modification depuis récapitulatif
- [ ] Annulation

### Gestion d'Erreurs
- [ ] Format de date invalide
- [ ] Date passée
- [ ] Date trop lointaine
- [ ] Nombre de convives invalide
- [ ] API restaurants down
- [ ] API alerts down
- [ ] Messages d'erreur clairs
- [ ] Logging Sentry

### UX
- [ ] Emojis corrects (✅/🍽️)
- [ ] Compteur de sélection
- [ ] Bouton "Continuer" dynamique
- [ ] Rich embeds à chaque étape
- [ ] Thumbnails/images
- [ ] Footers informatifs
- [ ] Indicateurs de progression

### Performance
- [ ] Temps de réponse < 3s
- [ ] Pas de timeout Discord
- [ ] Cache utilisé
- [ ] Pagination performante

### Isolation
- [ ] Cache par utilisateur
- [ ] Pas d'interférence multi-utilisateurs

---

## 🐛 Bugs Potentiels à Surveiller

### Erreurs de Parsing
- [ ] CustomId mal formaté
- [ ] IDs de restaurants invalides
- [ ] Date mal parsée

### Race Conditions
- [ ] Double clic sur "Confirmer"
- [ ] Navigation rapide entre pages
- [ ] Cache concurrent

### Discord Limitations
- [ ] Plus de 25 options dans un select menu
- [ ] Timeout 3 secondes
- [ ] Messages trop longs

---

## 📝 Template de Rapport de Bug

```markdown
### 🐛 Bug Trouvé

**Titre:** [Titre court et descriptif]

**Sévérité:** Critique / Majeure / Mineure

**Étapes pour Reproduire:**
1. ...
2. ...
3. ...

**Résultat Actuel:**
[Ce qui se passe]

**Résultat Attendu:**
[Ce qui devrait se passer]

**Logs/Erreurs:**
```
[Copier les logs ici]
```

**Environnement:**
- Bot version: 2.0.0
- Node version: ...
- Redis version: ...

**Screenshots:**
[Si applicable]
```

---

## ✅ Critères de Validation

Le workflow est considéré comme validé si :

1. ✅ Tous les tests passent sans erreur
2. ✅ Aucun bug critique trouvé
3. ✅ Performance acceptable (< 3s)
4. ✅ UX fluide et intuitive
5. ✅ Gestion d'erreurs robuste
6. ✅ Logging complet
7. ✅ Isolation multi-utilisateurs fonctionnelle

---

## 🚀 Prêt pour la Production

Une fois tous les tests validés :

1. ✅ Créer une branche de release
2. ✅ Merger dans main
3. ✅ Tagger la version (v2.0.0)
4. ✅ Déployer en production
5. ✅ Monitorer les logs Sentry
6. ✅ Surveiller les métriques Redis
7. ✅ Collecter les retours utilisateurs

---

**Bon courage pour les tests ! 🎯**

