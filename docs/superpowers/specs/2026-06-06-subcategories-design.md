# Sous-catégories (subcategories)

**Date:** 2026-06-06 · **App:** `apps/website` · **Branche:** `worktree-subcategories`

## Objectif

Sous certaines catégories parentes (ex: Video), proposer des sous-catégories
(UGC, Product animation…). Cliquer une catégorie parente sur la home révèle une
**2e rangée de sous-chips** pour affiner. Gérables dans une page admin dédiée.
Catégorie sans sous-catégorie → pas de 2e rangée (« si rien ajouté, rien »).

## Modèle de données

`PromptCategory` (déjà `{ key, label }`, stocké en site-settings sous
`prompt_categories`) gagne **`parent?: string`** :
```
{ key: "VIDEO", label: "Video" }                     // parente
{ key: "UGC", label: "UGC", parent: "VIDEO" }        // sous-catégorie
```
Back-compat total : entrées sans `parent` = top-level. Une sous-cat a un seul
parent. Les clés restent globalement uniques (`labelToKey`).

## Modèle d'appartenance : **inclusif**

Un prompt tagué d'une sous-cat porte **les deux clés** dans son array
`categories` : `["VIDEO", "UGC"]`.
- `?cat=VIDEO` → tous les videos (la requête `categories @> [VIDEO]` les attrape
  tous, avec ou sans sous-cat). **Inchangée.**
- `?sub=UGC` → affine (`categories @> [UGC]`).
- Bénéfice : `getActiveCategoryKeys()` renvoie déjà toutes les clés présentes sur
  les prompts publiés → **les sous-clés actives y sont déjà**, aucun changement.

## Data layer (Phase 1)

- `types.ts` : `parent?` sur `PromptCategory` + helpers purs `topLevel(cats)` et
  `subsOf(cats, parentKey)`.
- `site-settings.ts` : `getPromptCategories` préserve `parent` (le filtre actuel
  garde déjà l'objet entier). Nouvelle `savePromptCategories(list)` : valide
  (clés uniques non vides, labels non vides, `parent` pointe vers une parente
  existante, pas de sub-de-sub) puis `setSiteSetting`. `addPromptCategory`
  (inline) conservée.
- `/api/admin/categories` : nouveau **PUT** (admin) = sauver la liste complète
  éditée. POST {label} conservé pour l'ajout inline.
- `/api/prompts` : lit `sub` (validé par `CAT_RE`) → `listPrompts`.
- `queries.ts` : `listPrompts` ajoute `args.subcategory` →
  `categories @> [sub]`.

## Admin — inline dans le formulaire de prompt (Phase 2)

**Pas de page de gestion dédiée** (décision révisée 2026-06-06). On réutilise le
pattern existant « chips + `+ Add new` » du formulaire de prompt.

- `addPromptSubcategory(parentKey, label)` dans `site-settings` (miroir de
  `addPromptCategory`, stampe `parent`).
- `/api/admin/categories` **POST** accepte un `parent` optionnel → ajoute une
  sous-cat sous la parente, sinon une parente (comportement existant).
- `PromptForm` : sélecteur **hiérarchique**. Parents en chips (+ `Add new`
  parente, existant). Sous une parente cochée : ses sous-cat en chips imbriqués
  **+ un `Add new`** qui crée une sous-cat à la volée (window.prompt → POST avec
  `parent`) et l'assigne. Cocher une sous-cat **auto-coche la parente** ;
  décocher la parente retire ses sous-cat sélectionnées. Aucune sous-cat → juste
  le `Add new` sous la parente.

## Public UI (Phase 3)

- `CategoriesContext` : `useParentCategories()` (sans `parent`),
  `useSubcategories(parentKey)`.
- `PromptFilters` :
  - Rangée principale = **parents actifs** uniquement.
  - Nouveau param URL **`?sub=<key>`**.
  - Si `cat` actif est une parente qui a des sous-cat **actives** (dans
    `activeCategoryKeys`) → 2e rangée : `[Tout] [sub…]`. « Tout » / re-clic
    parente / changement de parente efface `sub`.
  - Auto-reset `sub` si la sous-cat sort de `activeCategoryKeys` (comme `cat`).
- `PromptGrid` : passe `sub` à `/api/prompts`.

## Hors scope

- Profondeur > 1 niveau (pas de sous-sous-catégories).
- Réordonnancement drag-and-drop sophistiqué (boutons ↑/↓ suffisent).

## Vérification

- `tsc --noEmit` + `eslint` (fichiers touchés) + `next build` (Turbopack).
- Pas de runner de tests dans le repo (inchangé) ; helpers purs de `types.ts`
  vérifiables par lecture.
- Test navigateur : créer Video › UGC en admin, taguer un prompt, voir la 2e
  rangée filtrer sur la home ; vérifier qu'une cat sans sous-cat n'affiche pas
  de 2e rangée.

## Phasage (≤5 fichiers/phase)

1. **Data** : types (`parent` + helpers), site-settings (`addPromptSubcategory`), /api/admin/categories (POST + `parent`), /api/prompts (`sub`), queries (`subcategory`).
2. **Admin inline** : PromptForm (sélecteur hiérarchique + `Add new` sous-cat).
3. **Public** : PromptFilters (2e rangée), PromptGrid (`sub`).
