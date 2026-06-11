# Spécification UX & Technique — Fonctionnalité d'Adaptation des Quantités de Recette

## Document de Spécification Produit

**Version:** 1.0  
**Date:** 10 juin 2026  
**Auteur:** Équipe Produit Umami Recipe  
**Statut:** Prêt pour implémentation

---

## Table des Matières

1. [Vue d'Ensemble de la Fonctionnalité](#1-vue-densemble-de-la-fonctionnalité)
2. [Objectifs Utilisateur](#2-objectifs-utilisateur)
3. [Principes UX](#3-principes-ux)
4. [Flux UX Principaux](#4-flux-ux-principaux)
5. [Composants UX](#5-composants-ux)
6. [Détails d'Interaction](#6-détails-dinteraction)
7. [Règles de Calcul](#7-règles-de-calcul)
8. [Règles d'Arrondi](#8-règles-darrondi)
9. [Gestion des Ingrédients Non Scalables](#9-gestion-des-ingrédients-non-scalables)
10. [Cas Limites](#10-cas-limites)
11. [Modèle de Données](#11-modèle-de-données)
12. [Logique Technique](#12-logique-technique)
13. [Règles de Validation](#13-règles-de-validation)
14. [Messages d'Erreur](#14-messages-derreur)
15. [Exigences d'Accessibilité](#15-exigences-daccessibilité)
16. [Exigences UX Mobile](#16-exigences-ux-mobile)
17. [Design de Contenu / Copie UX](#17-design-de-contenu--copie-ux)
18. [Critères d'Acceptation](#18-critères-dacceptation)
19. [Périmètre MVP](#19-périmètre-mvp)
20. [Fonctionnalités Avancées](#20-fonctionnalités-avancées)
21. [Contraintes Techniques](#21-contraintes-techniques)
22. [Livrable Final](#22-livrable-final)

---

## 1. Vue d'Ensemble de la Fonctionnalité

### 1.1 Objectif

La fonctionnalité d'adaptation des quantités permet aux utilisateurs d'ajuster automatiquement les quantités d'ingrédients d'une recette selon leurs besoins, sans calculs manuels. Cette fonctionnalité répond à deux cas d'usage principaux :

1. **Adapter le nombre de portions** : L'utilisateur souhaite préparer plus ou moins de portions que la recette originale
2. **Adapter selon un ingrédient disponible** : L'utilisateur possède une quantité spécifique d'un ingrédient et souhaite adapter toute la recette en conséquence

### 1.2 Adaptation par Nombre de Portions

**Principe de fonctionnement :**

Une recette est conçue pour un nombre de portions initial (par exemple, 4 portions). L'utilisateur modifie ce nombre (par exemple, 6 portions). Le système calcule un facteur d'échelle et multiplie toutes les quantités d'ingrédients par ce facteur.

**Formule :**
```text
Facteur d'échelle = Portions cibles / Portions originales
Quantité ajustée = Quantité originale × Facteur d'échelle
```

**Exemple concret :**
```text
Recette originale : 4 portions
Portions souhaitées : 6 portions
Facteur d'échelle : 6 / 4 = 1,5

Ingrédients :
- Farine : 400 g → 600 g
- Sucre : 100 g → 150 g
- Beurre : 200 g → 300 g
- Œufs : 3 → 4,5 (arrondi à 5)
```

### 1.3 Adaptation par Ingrédient de Référence

**Principe de fonctionnement :**

L'utilisateur sélectionne un ingrédient comme « ancre » et indique la quantité dont il dispose. Le système calcule le facteur d'échelle à partir de cet ingrédient et ajuste tous les autres ingrédients proportionnellement.

**Formule :**
```text
Facteur d'échelle = Quantité disponible / Quantité originale de l'ingrédient ancre
Quantité ajustée = Quantité originale × Facteur d'échelle
Portions estimées = Portions originales × Facteur d'échelle
```

**Exemple concret :**
```text
Recette originale : 4 portions
Ingrédient ancre : Farine
Quantité originale de farine : 400 g
Quantité disponible : 250 g
Facteur d'échelle : 250 / 400 = 0,625

Ingrédients ajustés :
- Farine : 400 g → 250 g (ingrédient de référence)
- Sucre : 100 g → 62,5 g
- Beurre : 200 g → 125 g
- Œufs : 3 → 1,875 (arrondi à 2)

Portions estimées : 4 × 0,625 = 2,5 portions
```

L'ingrédient sélectionné devient le point de référence pour toute la recette. Cette méthode est particulièrement utile pour éviter le gaspillage alimentaire et cuisiner avec les ingrédients disponibles.

---

## 2. Objectifs Utilisateur

Les objectifs principaux des utilisateurs sont :

### 2.1 Objectifs Fonctionnels
- **Adapter une recette rapidement** sans sortir une calculatrice
- **Éviter les calculs mentaux** et les erreurs de conversion
- **Cuisiner avec les ingrédients disponibles** à la maison
- **Réduire le gaspillage alimentaire** en utilisant exactement ce qu'on a
- **Maintenir les proportions de la recette** pour garantir le résultat
- **Préparer la bonne quantité** selon le nombre de convives

### 2.2 Objectifs de Compréhension
- **Comprendre comment les quantités ont été recalculées**
- **Voir clairement les quantités originales et ajustées**
- **Identifier l'ingrédient de référence** le cas échéant
- **Connaître le facteur d'échelle appliqué**

### 2.3 Objectifs de Contrôle
- **Revenir à la recette originale à tout moment**
- **Changer facilement de mode d'adaptation**
- **Corriger une erreur de saisie** sans perdre le contexte
- **Avoir confiance dans les valeurs ajustées**

---

## 3. Principes UX

### 3.1 Clarté

**Application :**
- Les deux modes d'adaptation doivent être clairement distingués
- Les labels doivent être explicites et sans ambiguïté
- Les quantités originales et ajustées doivent être visuellement différenciées
- Le facteur d'échelle doit être affiché de manière visible

**Exemple :**
```text
Mode actif : Adapter par portions
Facteur d'échelle : ×1,5
```

### 3.2 Feedback Immédiat

**Application :**
- Les quantités se mettent à jour instantanément après une modification valide
- Les erreurs sont signalées immédiatement
- Les changements d'état sont visuellement perceptibles
- Les animations subtiles renforcent la compréhension

**Exemple :**
```text
[Utilisateur change 4 → 6 portions]
→ Animation de mise à jour des quantités
→ Affichage du nouveau facteur d'échelle
```

### 3.3 Transparence du Calcul

**Application :**
- Le facteur d'échelle est toujours visible
- Les quantités originales restent affichées
- L'ingrédient de référence est clairement identifié
- Les règles d'arrondi sont cohérentes et prévisibles

**Exemple :**
```text
Farine
400 g → 600 g
[Badge : Ingrédient de référence]
```

### 3.4 Réversibilité

**Application :**
- Un bouton « Réinitialiser » est toujours accessible
- La réinitialisation restaure l'état original complet
- Aucune action n'est irréversible
- L'utilisateur garde le contrôle total

**Exemple :**
```text
[Bouton : Réinitialiser la recette]
→ Restaure les portions originales
→ Efface l'ingrédient de référence
→ Réinitialise toutes les quantités
```

### 3.5 Prévention des Erreurs

**Application :**
- Validation en temps réel des saisies
- Limites raisonnables sur les valeurs acceptées
- Messages d'erreur clairs et constructifs
- Désactivation des options invalides avec explication

**Exemple :**
```text
[Utilisateur saisit 0]
→ Message : "La quantité doit être supérieure à 0 g"
→ Les quantités ne sont pas recalculées
```

### 3.6 Accessibilité

**Application :**
- Navigation au clavier complète
- Support des lecteurs d'écran
- Contrastes suffisants
- Zones de clic généreuses sur mobile
- Messages d'état annoncés aux technologies d'assistance

**Exemple :**
```text
[Annonce lecteur d'écran]
"Les quantités ont été mises à jour pour 6 portions"
```

### 3.7 Mobile-First

**Application :**
- Interface optimisée pour les petits écrans
- Contrôles tactiles adaptés
- Clavier numérique pour les saisies de quantité
- Bottom sheets pour les sélections complexes
- Pas de survol requis pour accéder aux fonctionnalités

### 3.8 Confiance dans les Valeurs Ajustées

**Application :**
- Arrondis cohérents et prévisibles
- Avertissements pour les cas limites
- Indication des quantités approximatives
- Notes pour les ingrédients sensibles

**Exemple :**
```text
Levure chimique : 8 g → 12 g
[Note : À ajuster selon le goût]
```

---

## 4. Flux UX Principaux

### 4.1 Flux A — Adaptation par Nombre de Portions

**Étapes détaillées :**

1. **Ouverture de la recette**
   - L'utilisateur accède à une recette
   - Le nombre de portions original est affiché : "4 portions"
   - Toutes les quantités sont à leur valeur originale

2. **Identification du contrôle**
   - L'utilisateur repère le sélecteur de portions
   - Le contrôle affiche clairement le nombre actuel
   - Des boutons +/- sont visibles et accessibles

3. **Modification du nombre de portions**
   - L'utilisateur clique sur le bouton "+" ou "-"
   - OU l'utilisateur saisit directement un nombre
   - Le système valide la saisie en temps réel

4. **Calcul du facteur d'échelle**
   - Le système calcule : `facteur = 6 / 4 = 1,5`
   - Le facteur est affiché : "×1,5"
   - Le calcul est instantané

5. **Mise à jour des quantités**
   - Toutes les quantités d'ingrédients scalables sont recalculées
   - Les quantités s'animent subtilement pour indiquer le changement
   - Les quantités originales restent visibles en grisé

6. **Affichage des résultats**
   - Chaque ingrédient montre : `400 g → 600 g`
   - Les ingrédients non scalables affichent une note
   - Le nombre de portions cible est mis en évidence

7. **Option de réinitialisation**
   - Un bouton "Réinitialiser" est disponible
   - L'utilisateur peut revenir à l'original à tout moment

**Exemple avec valeurs :**

```text
État initial :
Portions : 4
Farine : 400 g
Sucre : 100 g
Beurre : 200 g
Sel : 1 pincée

[Utilisateur change à 6 portions]

État après adaptation :
Portions : 6 (×1,5)
Farine : 400 g → 600 g
Sucre : 100 g → 150 g
Beurre : 200 g → 300 g
Sel : 1 pincée [À ajuster selon le goût]
```

**Cas particuliers :**

- **Portions décimales** : Si l'utilisateur saisit 2,5 portions, le système accepte et calcule avec précision
- **Portions très élevées** : Au-delà de 20 portions, un avertissement suggère de vérifier les temps de cuisson
- **Portions très faibles** : En dessous de 0,5 portion, un avertissement indique les difficultés de mesure

### 4.2 Flux B — Adaptation par Ingrédient de Référence

**Étapes détaillées :**

1. **Activation du mode**
   - L'utilisateur sélectionne "Adapter selon un ingrédient disponible"
   - L'interface bascule vers le mode ancrage
   - Un sélecteur d'ingrédient apparaît

2. **Sélection de l'ingrédient ancre**
   - L'utilisateur ouvre le sélecteur d'ingrédients
   - Une liste des ingrédients éligibles s'affiche
   - Les ingrédients non éligibles sont désactivés avec explication
   - L'utilisateur choisit un ingrédient (ex : Farine)

3. **Saisie de la quantité disponible**
   - Un champ de saisie numérique apparaît
   - Le placeholder indique l'unité : "Quantité en grammes"
   - L'utilisateur saisit la quantité : 250
   - Le clavier numérique s'affiche automatiquement sur mobile

4. **Validation de la saisie**
   - Le système vérifie que la valeur est > 0
   - Le système vérifie que la valeur est numérique
   - Si invalide, un message d'erreur s'affiche
   - Si valide, le calcul se déclenche

5. **Calcul du facteur d'échelle**
   - Le système calcule : `facteur = 250 / 400 = 0,625`
   - Le facteur est affiché : "×0,625"
   - Les portions estimées sont calculées : `4 × 0,625 = 2,5 portions`

6. **Recalcul de tous les ingrédients**
   - Tous les ingrédients scalables sont ajustés
   - L'ingrédient ancre affiche sa nouvelle valeur (qui correspond à la saisie)
   - Les autres ingrédients affichent leurs valeurs recalculées

7. **Marquage visuel de l'ancre**
   - L'ingrédient de référence reçoit un badge distinctif
   - Il est visuellement mis en évidence
   - Un indicateur montre qu'il est "verrouillé"

8. **Options de modification**
   - L'utilisateur peut changer d'ingrédient ancre
   - L'utilisateur peut modifier la quantité disponible
   - L'utilisateur peut réinitialiser complètement

**Exemple avec valeurs :**

```text
État initial :
Portions : 4
Farine : 400 g
Sucre : 100 g
Beurre : 200 g
Œufs : 3

[Utilisateur sélectionne Farine comme ancre]
[Utilisateur saisit 250 g]

État après adaptation :
Portions estimées : 2,5 (×0,625)
Farine : 400 g → 250 g [Ingrédient de référence]
Sucre : 100 g → 62,5 g
Beurre : 200 g → 125 g
Œufs : 3 → 2 (arrondi)
```

**Cas particuliers :**

- **Quantité supérieure à l'original** : Si l'utilisateur a 600 g de farine au lieu de 400 g, le facteur est 1,5 et toutes les quantités augmentent
- **Changement d'ancre** : Si l'utilisateur change d'ingrédient ancre, le système recalcule tout à partir du nouvel ingrédient
- **Ingrédient sans quantité originale** : Ces ingrédients ne peuvent pas être sélectionnés comme ancre

---

## 5. Composants UX

### 5.1 Sélecteur de Portions

**Description :**
Contrôle permettant de modifier le nombre de portions de la recette.

**Éléments constitutifs :**
- Label : "Portions"
- Valeur actuelle : affichée en grand
- Valeur originale : affichée en petit, grisée
- Bouton décrémentation : "-"
- Bouton incrémentation : "+"
- Champ de saisie directe : optionnel
- Bouton de réinitialisation : icône ou texte

**Exemple de rendu :**

```text
┌─────────────────────────────┐
│ Portions                    │
│                             │
│  [ - ]    6    [ + ]        │
│                             │
│  Recette originale :        │
│  4 portions                 │
└─────────────────────────────┘
```

**Comportement :**
- Clic sur "-" : décrémente de 1 (ou 0,5 selon configuration)
- Clic sur "+" : incrémente de 1 (ou 0,5 selon configuration)
- Saisie directe : validation en temps réel
- Minimum : 0,5 portion
- Maximum : 50 portions
- Valeurs décimales : autorisées (ex : 2,5)

**États :**
- Normal : contrôles actifs
- Désactivé : si la recette n'a pas de nombre de portions original
- Erreur : si la saisie est invalide

**Copie UX :**
```text
Label : "Portions"
Placeholder : "Nombre de portions"
Aide : "Ajustez le nombre de portions souhaité"
Erreur : "Le nombre de portions doit être compris entre 0,5 et 50"
```

### 5.2 Sélecteur de Mode d'Adaptation

**Description :**
Contrôle permettant de basculer entre les deux modes d'adaptation.

**Options :**
1. "Adapter par portions"
2. "Adapter selon un ingrédient disponible"

**Patterns recommandés :**

**Desktop :**
- Segmented control (boutons radio visuels)
- Tabs horizontales

**Mobile :**
- Segmented control compact
- Dropdown si l'espace est limité

**Exemple de rendu (Segmented Control) :**

```text
┌─────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────────┐  │
│ │   Par        │ │  Par ingrédient      │  │
│ │   portions   │ │  disponible          │  │
│ └──────────────┘ └──────────────────────┘  │
│      [Actif]           [Inactif]            │
└─────────────────────────────────────────────┘
```

**Comportement :**
- Clic sur une option : bascule vers ce mode
- Le mode actif est visuellement mis en évidence
- Le changement de mode peut réinitialiser certains états

**Règles de transition :**
- Passage de "Par portions" à "Par ingrédient" : conserve les portions actuelles comme référence
- Passage de "Par ingrédient" à "Par portions" : conserve le facteur d'échelle si possible

### 5.3 Sélecteur d'Ingrédient Ancre

**Description :**
Dropdown permettant de choisir l'ingrédient qui servira de référence pour l'adaptation.

**Éléments constitutifs :**
- Label : "Ingrédient de référence"
- Dropdown avec recherche
- Liste des ingrédients éligibles
- Ingrédients désactivés avec raison
- Icône de validation

**Exemple de rendu :**

```text
┌─────────────────────────────────────┐
│ Ingrédient de référence             │
│ ┌─────────────────────────────────┐ │
│ │ Farine                      ▼   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

[Dropdown ouvert]
┌─────────────────────────────────────┐
│ 🔍 Rechercher...                    │
├─────────────────────────────────────┤
│ ✓ Farine                            │
│   Sucre                             │
│   Beurre                            │
│   Œufs                              │
│ ⊘ Sel                               │
│   (quantité non précise)            │
└─────────────────────────────────────┘
```

**Critères d'éligibilité :**
Un ingrédient peut être ancre si :
- Il possède une quantité originale en grammes
- Il est marqué comme `canBeAnchor: true`
- Sa quantité est précise (pas "une pincée")

**Ingrédients désactivés :**
- Affichés en grisé
- Icône de désactivation
- Tooltip explicatif au survol
- Raison affichée en dessous

**Exemples de raisons :**
```text
Sel — quantité non précise
Poivre — ingrédient non scalable
Décoration — quantité indicative
```

### 5.4 Champ de Saisie de Quantité Ancre

**Description :**
Champ numérique pour saisir la quantité disponible de l'ingrédient ancre.

**Éléments constitutifs :**
- Label : "Quantité disponible"
- Champ de saisie numérique
- Unité : "g" (affichée à droite)
- Validation en temps réel
- Message d'erreur si invalide

**Exemple de rendu :**

```text
┌─────────────────────────────────────┐
│ Quantité disponible                 │
│ ┌─────────────────────────────────┐ │
│ │ 250                          g  │ │
│ └─────────────────────────────────┘ │
│ Quantité originale : 400 g          │
└─────────────────────────────────────┘
```

**Comportement :**
- Type : `number`
- Inputmode : `decimal` (clavier numérique sur mobile)
- Min : 0.1
- Max : 99999
- Step : 0.1
- Validation : en temps réel
- Recalcul : déclenché après validation

**États d'erreur :**

```text
[Erreur : valeur = 0]
┌─────────────────────────────────────┐
│ Quantité disponible                 │
│ ┌─────────────────────────────────┐ │
│ │ 0                            g  │ │
│ └─────────────────────────────────┘ │
│ ⚠ La quantité doit être supérieure  │
│   à 0 g                             │
└─────────────────────────────────────┘
```

**Placeholder :**
```text
"Ex : 250"
```

**Aide contextuelle :**
```text
"Indiquez la quantité que vous avez"
```

### 5.5 Affichage des Quantités d'Ingrédients

**Description :**
Affichage des quantités originales et ajustées pour chaque ingrédient.

**Variantes d'affichage :**

**1. Ingrédient standard ajusté :**
```text
Farine
400 g → 600 g
```

**2. Ingrédient ancre :**
```text
Farine
400 g → 250 g
[Badge : Ingrédient de référence]
```

**3. Ingrédient non scalable :**
```text
Sel
1 pincée
[Note : À ajuster selon le goût]
```

**4. Ingrédient avec avertissement :**
```text
Levure chimique
8 g → 12 g
[Badge : Quantité indicative]
```

**Traitement visuel recommandé :**

- **Quantité originale** : 
  - Taille de police : 14px
  - Couleur : gris moyen (#6B7280)
  - Poids : normal

- **Flèche de transition** :
  - Symbole : "→"
  - Couleur : gris clair (#9CA3AF)

- **Quantité ajustée** :
  - Taille de police : 16px
  - Couleur : noir (#111827)
  - Poids : semi-bold

- **Badge ingrédient de référence** :
  - Fond : bleu clair (#DBEAFE)
  - Texte : bleu foncé (#1E40AF)
  - Icône : 📌 ou 🔒

- **Badge quantité indicative** :
  - Fond : orange clair (#FED7AA)
  - Texte : orange foncé (#C2410C)
  - Icône : ⚠️

**Layout mobile :**
```text
┌─────────────────────────────┐
│ Farine                      │
│ 400 g → 600 g               │
│ [Ingrédient de référence]   │
├─────────────────────────────┤
│ Sucre                       │
│ 100 g → 150 g               │
├─────────────────────────────┤
│ Sel                         │
│ 1 pincée                    │
│ [À ajuster selon le goût]   │
└─────────────────────────────┘
```

### 5.6 Action de Réinitialisation

**Description :**
Bouton permettant de restaurer la recette à son état original.

**Emplacement :**
- Toujours visible
- Positionné près des contrôles d'adaptation
- Accessible au clavier

**Variantes de présentation :**

**1. Bouton texte :**
```text
[Réinitialiser la recette]
```

**2. Bouton icône + texte :**
```text
[↺ Réinitialiser]
```

**3. Lien texte :**
```text
Réinitialiser la recette
```

**Comportement :**
- Clic : ouvre une confirmation (optionnel pour MVP)
- Confirmation : restaure l'état original
- Feedback : message de succès

**Confirmation (optionnelle) :**
```text
┌─────────────────────────────────────┐
│ Réinitialiser la recette ?          │
│                                     │
│ Toutes les adaptations seront       │
│ annulées et les quantités           │
│ originales seront restaurées.       │
│                                     │
│ [Annuler]  [Réinitialiser]          │
└─────────────────────────────────────┘
```

**Effet de la réinitialisation :**
- Portions : retour à la valeur originale
- Mode : retour à "Par portions"
- Ingrédient ancre : effacé
- Quantité ancre : effacée
- Toutes les quantités : restaurées
- Facteur d'échelle : 1
- Messages d'erreur : effacés

**Message de succès :**
```text
✓ La recette a été réinitialisée
```

---

## 6. Détails d'Interaction

### 6.1 Mise à Jour Instantanée

**Principe :**
Les quantités doivent se mettre à jour immédiatement après une saisie valide, sans nécessiter de clic sur un bouton "Valider".

**Déclencheurs :**
- Changement du nombre de portions
- Sélection d'un ingrédient ancre
- Saisie d'une quantité ancre valide
- Changement de mode d'adaptation

**Animation :**
- Transition douce : 200ms
- Effet de "pulse" subtil sur les valeurs modifiées
- Pas d'animation trop distrayante

**Exemple de séquence :**
```text
1. Utilisateur change 4 → 6 portions
2. Délai de debounce : 300ms (si saisie directe)
3. Validation de la valeur
4. Calcul du facteur d'échelle
5. Animation de mise à jour (200ms)
6. Affichage des nouvelles valeurs
7. Annonce au lecteur d'écran
```

### 6.2 Gestion des Saisies Invalides

**Principe :**
Les saisies invalides ne doivent jamais déclencher de recalcul. L'utilisateur doit être informé de l'erreur sans perdre son contexte.

**Comportements :**

**Saisie de 0 :**
- Message : "La quantité doit être supérieure à 0"
- Pas de recalcul
- Le champ reste en état d'erreur
- Focus conservé sur le champ

**Saisie de texte :**
- Validation HTML5 : `type="number"`
- Si contournée : message "Veuillez saisir un nombre"
- Pas de recalcul

**Saisie hors limites :**
- Portions < 0,5 : "Le nombre de portions doit être au moins 0,5"
- Portions > 50 : "Le nombre de portions ne peut pas dépasser 50"
- Quantité > 99999 : "La quantité semble trop élevée"

### 6.3 Changement de Mode d'Adaptation

**Règles de transition :**

**De "Par portions" vers "Par ingrédient" :**
- Conserver : le facteur d'échelle actuel comme référence
- Effacer : aucune donnée (tout est compatible)
- Afficher : le sélecteur d'ingrédient ancre
- Masquer : le sélecteur de portions (ou le griser)

**De "Par ingrédient" vers "Par portions" :**
- Conserver : les portions estimées deviennent les portions cibles
- Effacer : l'ingrédient ancre et sa quantité
- Afficher : le sélecteur de portions actif
- Masquer : le sélecteur d'ingrédient ancre

**Exemple de transition :**
```text
État initial (Par portions) :
- Portions : 6
- Facteur : ×1,5

[Utilisateur bascule vers "Par ingrédient"]

État après transition :
- Portions estimées : 6 (conservées)
- Ingrédient ancre : non sélectionné
- Quantité ancre : vide
- Facteur : ×1,5 (conservé temporairement)
```

### 6.4 Affichage du Facteur d'Échelle

**Emplacement :**
Le facteur d'échelle doit être visible en permanence quand une adaptation est active.

**Format d'affichage :**
```text
Facteur d'échelle : ×1,5
```

ou

```text
×1,5
```

**Variations :**
- Facteur > 1 : couleur verte ou neutre
- Facteur < 1 : couleur orange ou neutre
- Facteur = 1 : masqué ou grisé

**Positionnement recommandé :**
- À côté du sélecteur de portions
- Dans un badge distinct
- Dans une zone d'information récapitulative

### 6.5 Prévention des Changements Surprenants

**Principe :**
L'utilisateur doit toujours comprendre pourquoi les quantités ont changé.

**Stratégies :**

1. **Affichage du contexte :**
   - Toujours montrer le mode actif
   - Toujours montrer le facteur d'échelle
   - Toujours montrer l'ingrédient ancre si applicable

2. **Feedback visuel :**
   - Animation lors des changements
   - Mise en évidence temporaire des valeurs modifiées
   - Badge "Modifié" pendant quelques secondes

3. **Annonces accessibles :**
   - Lecteur d'écran : "Les quantités ont été mises à jour"
   - Préciser la raison : "pour 6 portions" ou "selon 250 g de farine"

4. **Historique visuel :**
   - Toujours afficher les quantités originales
   - Utiliser une flèche pour montrer la transformation
   - Ne jamais masquer l'information d'origine

---

## 7. Règles de Calcul

### 7.1 Adaptation par Portions

**Formule principale :**
```typescript
scalingFactor = targetServings / originalServings
adjustedAmount = originalAmount × scalingFactor
```

**Exemple détaillé :**
```typescript
// Données d'entrée
const originalServings = 4
const targetServings = 6

// Calcul du facteur
const scalingFactor = targetServings / originalServings
// scalingFactor = 6 / 4 = 1.5

// Application aux ingrédients
const flour = {
  originalAmount: 400,
  adjustedAmount: 400 × 1.5 = 600
}

const sugar = {
  originalAmount: 100,
  adjustedAmount: 100 × 1.5 = 150
}

const butter = {
  originalAmount: 200,
  adjustedAmount: 200 × 1.5 = 300
}
```

**Cas particuliers :**

**Portions décimales :**
```typescript
originalServings = 4
targetServings = 2.5
scalingFactor = 2.5 / 4 = 0.625

flour: 400 g × 0.625 = 250 g
```

**Portions très faibles :**
```typescript
originalServings = 4
targetServings = 0.5
scalingFactor = 0.5 / 4 = 0.125

flour: 400 g × 0.125 = 50 g
// Avertissement : quantités très petites
```

### 7.2 Adaptation par Ingrédient de Référence

**Formule principale :**
```typescript
scalingFactor = targetAnchorAmount / originalAnchorAmount
adjustedAmount = originalAmount × scalingFactor
estimatedServings = originalServings × scalingFactor
```

**Exemple détaillé :**
```typescript
// Données d'entrée
const originalServings = 4
const anchorIngredient = {
  name: "Farine",
  originalAmount: 400,
  targetAmount: 250
}

// Calcul du facteur
const scalingFactor = anchorIngredient.targetAmount / anchorIngredient.originalAmount
// scalingFactor = 250 / 400 = 0.625

// Calcul des portions estimées
const estimatedServings = originalServings × scalingFactor
// estimatedServings = 4 × 0.625 = 2.5

// Application aux autres ingrédients
const sugar = {
  originalAmount: 100,
  adjustedAmount: 100 × 0.625 = 62.5
}

const butter = {
  originalAmount: 200,
  adjustedAmount: 200 × 0.625 = 125
}

const eggs = {
  originalAmount: 3,
  adjustedAmount: 3 × 0.625 = 1.875
  // Sera arrondi à 2 selon les règles d'arrondi
}
```

**Cas particuliers :**

**Quantité supérieure à l'original :**
```typescript
originalAnchorAmount = 400
targetAnchorAmount = 600
scalingFactor = 600 / 400 = 1.5

// Toutes les quantités augmentent
estimatedServings = 4 × 1.5 = 6
```

**Quantité très faible :**
```typescript
originalAnchorAmount = 400
targetAnchorAmount = 50
scalingFactor = 50 / 400 = 0.125

// Avertissement : facteur très faible
estimatedServings = 4 × 0.125 = 0.5
```

### 7.3 Précision des Calculs

**Principe :**
Les calculs internes doivent conserver la précision maximale. Seul l'affichage doit être arrondi.

**Implémentation :**
```typescript
interface Ingredient {
  originalAmount: number        // Précision complète
  calculatedAmount: number      // Précision complète (non arrondie)
  displayAmount: number         // Arrondie pour l'affichage
  unit: string
}

// Exemple
const flour = {
  originalAmount: 400,
  calculatedAmount: 400 × 0.625,  // 250 (exact)
  displayAmount: 250,              // 250 (arrondi)
  unit: "g"
}

const sugar = {
  originalAmount: 100,
  calculatedAmount: 100 × 0.625,  // 62.5 (exact)
  displayAmount: 62.5,             // 62.5 (arrondi)
  unit: "g"
}
```

**Raison :**
Si l'utilisateur change à nouveau le facteur d'échelle, les calculs doivent repartir des valeurs originales, pas des valeurs arrondies, pour éviter l'accumulation d'erreurs.

---

## 8. Règles d'Arrondi

### 8.1 Principe Général

Les règles d'arrondi doivent produire des valeurs pratiques et mesurables en cuisine, tout en restant suffisamment précises.

### 8.2 Règles pour les Grammes

**Règle 1 : Quantités < 10 g**
- Afficher 1 décimale
- Arrondir au dixième le plus proche

```typescript
2.375 g → 2.4 g
5.82 g → 5.8 g
0.625 g → 0.6 g
```

**Règle 2 : Quantités ≥ 10 g et < 100 g**
- Arrondir au demi-gramme le plus proche (0.5 g)

```typescript
62.48 g → 62.5 g
45.2 g → 45 g
78.75 g → 79 g
```

**Règle 3 : Quantités ≥ 100 g**
- Arrondir au gramme entier le plus proche

```typescript
187.6 g → 188 g
250.3 g → 250 g
1247.8 g → 1248 g
```

### 8.3 Implémentation TypeScript

```typescript
function roundAmount(amount: number, unit: string): number {
  if (unit !== 'g') {
    // Pour les autres unités, arrondir à 1 décimale
    return Math.round(amount * 10) / 10
  }

  // Règles spécifiques pour les grammes
  if (amount < 10) {
    // Arrondir à 1 décimale
    return Math.round(amount * 10) / 10
  } else if (amount < 100) {
    // Arrondir au demi-gramme
    return Math.round(amount * 2) / 2
  } else {
    // Arrondir au gramme entier
    return Math.round(amount)
  }
}
```

### 8.4 Exemples d'Application

**Scénario 1 : Facteur 1.5**
```typescript
Farine : 400 g × 1.5 = 600 g → 600 g
Sucre : 100 g × 1.5 = 150 g → 150 g
Levure : 8 g × 1.5 = 12 g → 12 g
Sel : 2 g × 1.5 = 3 g → 3 g
```

**Scénario 2 : Facteur 0.625**
```typescript
Farine : 400 g × 0.625 = 250 g → 250 g
Sucre : 100 g × 0.625 = 62.5 g → 62.5 g
Beurre : 200 g × 0.625 = 125 g → 125 g
Levure : 8 g × 0.625 = 5 g → 5 g
Sel : 2 g × 0.625 = 1.25 g → 1.3 g
```

**Scénario 3 : Facteur 0.333**
```typescript
Farine : 400 g × 0.333 = 133.2 g → 133 g
Sucre : 100 g × 0.333 = 33.3 g → 33.5 g
Beurre : 200 g × 0.333 = 66.6 g → 66.5 g
Levure : 8 g × 0.333 = 2.664 g → 2.7 g
```

### 8.5 Cas Particuliers

**Unités non-grammes :**
Pour les unités comme "pièce", "cuillère", etc., arrondir à l'entier le plus proche ou au demi selon le contexte.

```typescript
Œufs : 3 × 0.625 = 1.875 → 2 pièces
Cuillères à soupe : 2 × 1.5 = 3 → 3 cuillères
```

**Quantités très petites :**
En dessous de 0.5 g, afficher un avertissement suggérant d'ajuster au goût.

```typescript
Safran : 0.2 g × 0.625 = 0.125 g
→ Afficher : "< 0.5 g" avec note "À ajuster selon le goût"
```

---

## 9. Gestion des Ingrédients Non Scalables

### 9.1 Définition

Certains ingrédients ne doivent pas être adaptés linéairement car leur quantité dépend du goût, de la chimie de la recette, ou d'autres facteurs.

### 9.2 Catégories d'Ingrédients Non Scalables

**1. Assaisonnements au goût :**
- Sel
- Poivre
- Épices
- Herbes aromatiques

**Raison :** La quantité dépend du goût personnel et ne scale pas linéairement.

**2. Agents levants :**
- Levure chimique
- Bicarbonate de soude
- Levure de boulanger

**Raison :** La quantité dépend de la chimie de la recette et du volume, pas du poids.

**3. Liquides d'ajustement :**
- Eau (dans certains cas)
- Lait (pour ajuster la consistance)

**Raison :** La quantité peut varier selon l'humidité, la farine utilisée, etc.

**4. Éléments de décoration :**
- Glaçage
- Décoration
- Garniture optionnelle

**Raison :** Quantité esthétique, non structurelle.

**5. Ingrédients optionnels :**
- Toppings
- Accompagnements
- Extras

**Raison :** Quantité au choix de l'utilisateur.

### 9.3 Comportement dans l'Interface

**Affichage :**
```text
Sel
1 pincée
[Badge : À ajuster selon le goût]
```

**Calcul :**
- L'ingrédient n'est PAS recalculé automatiquement
- La quantité originale est affichée
- Un badge ou une note explicative est ajouté

**Sélection comme ancre :**
- L'ingrédient est désactivé dans le sélecteur d'ancre
- Une explication est fournie : "Cet ingrédient ne peut pas servir de référence"

### 9.4 Configuration dans le Modèle de Données

```typescript
interface Ingredient {
  id: string
  name: string
  originalAmount: number | null
  unit: string
  scalable: boolean           // false pour les ingrédients non scalables
  canBeAnchor: boolean        // false si ne peut pas être ancre
  scalingNote?: string        // Note explicative
}

// Exemple
const salt = {
  id: "salt",
  name: "Sel",
  originalAmount: null,       // Quantité non précise
  unit: "pincée",
  scalable: false,
  canBeAnchor: false,
  scalingNote: "À ajuster selon le goût"
}

const bakingPowder = {
  id: "baking-powder",
  name: "Levure chimique",
  originalAmount: 8,
  unit: "g",
  scalable: true,             // Peut être scalé
  canBeAnchor: false,         // Mais ne peut pas être ancre
  scalingNote: "Quantité indicative, peut nécessiter un ajustement"
}
```

### 9.5 Messages Utilisateur

**Pour les ingrédients non scalables :**
```text
À ajuster selon le goût
Quantité indicative
Ajuster selon la consistance souhaitée
Quantité au choix
```

**Pour les ingrédients non éligibles comme ancre :**
```text
Cet ingrédient ne peut pas servir de référence
Quantité non précise
Ingrédient non scalable
Quantité variable selon le goût
```

### 9.6 Stratégie MVP vs Avancée

**MVP :**
- Liste prédéfinie d'ingrédients non scalables
- Configuration manuelle par type d'ingrédient
- Messages génériques

**Version avancée :**
- Configuration par recette
- Suggestions intelligentes basées sur le contexte
- Explications personnalisées
- Possibilité pour l'utilisateur de forcer le scaling

---

## 10. Cas Limites

### 10.1 Nombre de Portions Original Manquant

**Situation :**
La recette n'a pas de nombre de portions défini dans les données.

**Comportement :**
- Le mode "Adapter par portions" est désactivé
- Un message explicatif est affiché
- Le mode "Adapter par ingrédient" reste disponible

**Message :**
```text
Le nombre de portions d'origine est nécessaire pour adapter la recette par portions.
Vous pouvez toutefois adapter selon un ingrédient disponible.
```

**Interface :**
```text
┌─────────────────────────────────────┐
│ Adapter la recette                  │
│                                     │
│ ⊘ Adapter par portions              │
│   (nombre de portions non défini)   │
│                                     │
│ ✓ Adapter selon un ingrédient       │
│   disponible                        │
└─────────────────────────────────────┘
```

### 10.2 Ingrédient sans Quantité Originale

**Situation :**
Un ingrédient a une quantité non numérique (ex : "une pincée", "au goût").

**Comportement :**
- L'ingrédient ne peut pas être sélectionné comme ancre
- L'ingrédient n'est pas recalculé lors de l'adaptation
- Une note explicative est affichée

**Exemple :**
```text
Sel
Une pincée
[Note : Quantité non recalculée automatiquement]
```

**Dans le sélecteur d'ancre :**
```text
⊘ Sel
  (quantité non précise)
```

### 10.3 Utilisateur Saisit Zéro

**Situation :**
L'utilisateur entre 0 comme quantité disponible ou nombre de portions.

**Comportement :**
- La saisie est rejetée
- Un message d'erreur s'affiche
- Les quantités ne sont pas recalculées
- Le focus reste sur le champ

**Message d'erreur :**
```text
⚠ La quantité doit être supérieure à 0 g
```

ou

```text
⚠ Le nombre de portions doit être supérieur à 0
```

**État visuel :**
- Bordure rouge sur le champ
- Icône d'erreur
- Message en rouge sous le champ

### 10.4 Utilisateur Saisit une Très Grande Quantité

**Situation :**
L'utilisateur entre une valeur très élevée (ex : 50 portions, 10 kg de farine).

**Comportement :**
- La valeur est acceptée si dans les limites (≤ 50 portions, ≤ 99999 g)
- Un avertissement est affiché
- Les quantités sont recalculées normalement

**Avertissement :**
```text
⚠ Pour de grandes quantités, les temps de cuisson et les proportions 
  sensibles (levure, sel) peuvent nécessiter un ajustement manuel.
```

**Limites recommandées :**
- Portions : maximum 50
- Quantité en grammes : maximum 99999 g (≈ 100 kg)

### 10.5 Utilisateur Saisit une Très Petite Quantité

**Situation :**
L'utilisateur entre une valeur très faible (ex : 0,25 portion, 10 g de farine pour une recette qui en demande 400 g).

**Comportement :**
- La valeur est acceptée si dans les limites (≥ 0,5 portion, ≥ 0,1 g)
- Un avertissement est affiché
- Les quantités sont recalculées normalement

**Avertissement :**
```text
⚠ Les très petites quantités peuvent être difficiles à mesurer 
  précisément. Certains ingrédients peuvent nécessiter un ajustement.
```

**Limites recommandées :**
- Portions : minimum 0,5
- Quantité en grammes : minimum 0,1 g

### 10.6 Unité Différente des Grammes

**Situation :**
Un ingrédient utilise une unité autre que les grammes (ex : cuillères, pièces, ml).

**Comportement MVP :**
- Seuls les ingrédients en grammes sont adaptés automatiquement
- Les autres unités affichent une note explicative
- Une limitation claire est communiquée

**Message :**
```text
Œufs
3 pièces
[Note : Seules les quantités en grammes sont adaptées automatiquement]
```

**Comportement avancé (future version) :**
- Support de la conversion d'unités
- Adaptation des pièces, cuillères, ml, etc.
- Règles d'arrondi spécifiques par unité

### 10.7 Facteur d'Échelle Extrême

**Situation :**
Le facteur d'échelle calculé est très élevé (> 5) ou très faible (< 0,1).

**Comportement :**
- Le calcul est effectué normalement
- Un avertissement global est affiché
- Suggestion de vérifier la cohérence

**Avertissement (facteur > 5) :**
```text
⚠ Facteur d'échelle élevé (×8,5)
  Vérifiez que les quantités calculées sont cohérentes avec votre 
  matériel de cuisson et vos besoins.
```

**Avertissement (facteur < 0,1) :**
```text
⚠ Facteur d'échelle très faible (×0,06)
  Les quantités résultantes sont très petites et peuvent être 
  difficiles à mesurer avec précision.
```

### 10.8 Changement Rapide de Valeurs

**Situation :**
L'utilisateur modifie rapidement les valeurs (ex : utilise les flèches du clavier).

**Comportement :**
- Debounce de 300ms sur les saisies directes
- Pas de debounce sur les boutons +/-
- Éviter les recalculs multiples inutiles
- Maintenir la réactivité de l'interface

**Implémentation :**
```typescript
// Debounce pour saisie directe
const debouncedRecalculate = debounce(recalculate, 300)

// Pas de debounce pour boutons
function handleIncrement() {
  recalculate() // Immédiat
}
```

### 10.9 Données de Recette Incomplètes

**Situation :**
La recette a des données manquantes ou incohérentes.

**Comportement :**
- Désactiver les fonctionnalités qui nécessitent ces données
- Afficher des messages explicatifs
- Permettre l'utilisation partielle de la fonctionnalité

**Exemples :**

**Pas de portions ET pas de quantités en grammes :**
```text
⚠ Cette recette ne peut pas être adaptée automatiquement.
  Les informations nécessaires sont manquantes.
```

**Quelques ingrédients sans quantité :**
```text
✓ Adaptation possible
⚠ Certains ingrédients ne seront pas recalculés automatiquement.
```

### 10.10 Conflit entre Modes

**Situation :**
L'utilisateur a adapté par portions, puis bascule vers le mode ingrédient.

**Comportement :**
- Conserver le facteur d'échelle actuel comme base
- Permettre la sélection d'un ingrédient ancre
- Recalculer à partir du nouvel ancre
- Afficher clairement le changement de mode

**Séquence :**
```text
1. Utilisateur adapte à 6 portions (facteur ×1,5)
2. Utilisateur bascule vers "Par ingrédient"
3. Les quantités actuelles (déjà ×1,5) sont conservées
4. Utilisateur sélectionne Farine (600 g actuellement)
5. Utilisateur saisit 500 g
6. Nouveau facteur : 500 / 400 = 1,25
7. Toutes les quantités sont recalculées avec ×1,25
```

---
