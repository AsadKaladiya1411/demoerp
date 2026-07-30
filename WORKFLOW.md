# Jolly ERP — Module Workflows

This document describes the in-app workflows, data relationships, and where to find the implementation in the repository. It's intended to help developers and testers understand how each module behaves end-to-end.

---

## Table of Contents
- Overview
- Data models (domain shapes)
- Application context (central state)
- Routes and layout
- Modules and detailed workflows
  - Categories
  - Products (Master)
  - Product Details
  - Manage Flavours (Product-scoped)
  - Flavour Details (Recipes & Production)
  - Flavours (standalone)
  - Recipe Management (standalone)
  - Materials & Material Master
  - Manufacturers
  - Production Planning (high-level)
- How to test flows locally
- Next improvements / TODOs

---

## Overview

The application is a small Manufacturing ERP prototype (Vite + React + TypeScript + Tailwind). The central design principle is that domain objects (Category → Product → Flavour → Recipe) are hierarchical and managed through a single source of truth: the `ErpContext` provider.

Key pages live under `src/pages/` and the app shell lives in `src/components/layout/`.

## Data models (domain shapes)

Primary TypeScript interfaces live in `src/context/ErpContext.tsx` and include:

- `Category` — id, code, name, description, status, createdDate
- `Product` — id, code, name, categoryId, shelfLife, expiryRequired, description, status
- `Flavour` — id, name, productId, status, description (optional)
- `Material` — id, name, type (`Raw Material` | `Packaging Material`), unit, shelfLife, expiryRequired, supplier, status, stock? (number)
- `RecipeMaterial` — materialId, quantity (number), unit
- `Recipe` — id, productId, flavourId, version, masterQuantity (number), materials: RecipeMaterial[]
- `ProductionPlan` — id, productId, flavourId, recipeId, manufacturerId, batch, mfgDate, quantity, type, status

See the live definitions: [src/context/ErpContext.tsx](src/context/ErpContext.tsx)

## Application context (central state)

`ErpContext` is the single provider exposing arrays for categories, products, flavours, manufacturers, materials, recipes, and productionPlans. It also exposes helper functions such as `addProduct`, `addFlavour`, `addRecipe`, `updateRecipe`, `removeRecipe`, `updateMaterial`, etc.

Where to look:
- Implementation: [src/context/ErpContext.tsx](src/context/ErpContext.tsx)
- Use hook: `useErpData()` (returns the context helpers and state)

Notes:
- `Material.stock` was added to track available stock. `updateMaterial` updates material records programmatically.
- Persistence to `localStorage` is not yet implemented (planned next step).

## Routes and layout

Top-level routes are defined in `src/App.tsx` and rendered inside the `AppLayout` shell.

Important routes (workflows):

- `/masters/products` → Products master list (`src/pages/masters/Products.tsx`)
- `/masters/products/:id` → Product details (`src/pages/masters/ProductDetails.tsx`)
- `/masters/products/:id/flavours` → Manage flavours scoped to the product (`src/pages/masters/ManageFlavours.tsx`)
- `/masters/products/:productId/flavours/:flavourId` → Flavour details and recipe management (`src/pages/masters/FlavourDetails.tsx`)
- `/masters/flavours` → Standalone flavours page (restored file) (`src/pages/masters/Flavours.tsx`) — intentionally not linked in sidebar
- `/recipes` → Standalone recipe management (`src/pages/RecipeManagement.tsx`) — restored but not used in primary flow

See routing: [src/App.tsx](src/App.tsx)

Layout files:
- `src/components/layout/AppLayout.tsx` — main content wrapper
- `src/components/layout/Sidebar.tsx` — navigation (Flavours and Recipes removed from sidebar per requirements)
- `src/components/layout/TopNav.tsx` — top navigation

## Modules and detailed workflows

Below are the granular workflows and UI behaviors for each important module.

### Categories

- Purpose: simple reference data for products.
- Where: categories are managed via `ErpContext` and surfaced on product creation/edit.
- Note: Categories are not a complex workflow in the current prototype.

### Products (Master)

- File: [src/pages/masters/Products.tsx](src/pages/masters/Products.tsx)
- Workflow:
  1. The Products page lists existing products with actions: View, Manage Flavours, Edit, Delete.
  2. `Manage Flavours` navigates to `/masters/products/:id/flavours` (product-scoped flavour management).
  3. Add Product uses a modal to create a Product entity via `addProduct` in `ErpContext`.

### Product Details

- File: [src/pages/masters/ProductDetails.tsx](src/pages/masters/ProductDetails.tsx)
- Workflow:
  - Provides a product-scoped view which includes tabs (Flavours, Recipes summary, Product Info).
  - Serves as an entry point back to flavours and recipe summaries for the product.

### Manage Flavours (Product-scoped)

- File: [src/pages/masters/ManageFlavours.tsx](src/pages/masters/ManageFlavours.tsx)
- Purpose: All flavour management for a product — add, edit, delete, navigate to recipe management for each flavour.
- Workflow details:
  1. When opened for a product (`id` param), it loads flavours filtered by `productId`.
  2. Add Flavour: opens a modal with fields: Flavour Name, Description, Status. Duplicate names for the same product are checked.
  3. Edit Flavour: opens the same modal pre-filled; save calls `updateFlavour`.
  4. Delete Flavour: show a confirmation prompt and call `removeFlavour`.
  5. Manage Recipes per-row: the `Manage Recipes` action links to the flavour scoped page: `/masters/products/:productId/flavours/:flavourId`.

### Flavour Details (Recipes & Production)

- File: [src/pages/masters/FlavourDetails.tsx](src/pages/masters/FlavourDetails.tsx)
- Purpose: Manage recipes for a single flavour and support production scaling that affects material stock.

Recipe Add/Edit behaviour (current implementation):

  - Modal fields:
    - `Recipe Version` — user-entered string (e.g., `v1`).
    - `Master Formula` — for new recipes the system uses a default master quantity (the first existing recipe's `masterQuantity` or `100 g` if none exist). For edits, the existing recipe's `masterQuantity` is preserved.
    - `Serving Size` — free text field (optional in prototype).
    - `Recipe Materials` — repeating rows representing ingredients. Each row contains:
      - `Sr#` — row index (auto incremented)
      - `Material` — selected from `materials` master data
      - `Quantity` — entered in grams relative to the master formula (recipe-level storage uses numeric quantities)
      - `Unit` — prefilled from material master but editable
    - `Add Row` adds another ingredient row.

  - Validation:
    - When adding a new recipe, the sum of the ingredient quantities must equal the default master (e.g., `100 g`) to save. The UI shows an inline error if totals don't match.
    - For edits, master quantity is preserved and existing values are validated against it.

  - When saved the recipe is persisted to `ErpContext` via `addRecipe` / `updateRecipe`.

Production scaling & material stock adjustments:

  - The Flavour page exposes a small production panel where the user:
    1. Selects a saved recipe version.
    2. Enters a production quantity in kilograms (e.g., `300` kg).
    3. The UI calculates the scale factor: `scale = (productionKg * 1000) / recipe.masterQuantity`.
    4. For each recipe material the UI shows the scaled quantity converted to the material's unit (`kg` if the material unit is `kg`, otherwise grams displayed). Example: if recipe quantity for protein is `40 g` and production is `300 kg` with master `100 g`, scaled = 40 * (300000 / 100) = 120000 g → shown as `120 kg` for a material with `kg` unit.
    5. The user can click **Apply to Material Master** which, after confirmation, deducts the calculated quantity from the material's `stock` via `updateMaterial` in `ErpContext`.

  - Use caution: the current prototype directly subtracts from `stock` (no negative-stock guards nor batch/lot tracking). Add guards as needed.

  - Read-only Recipe Details: a view dialog displays recipe version, master quantity and the ingredient list.

### Flavours (standalone)

- File: [src/pages/masters/Flavours.tsx](src/pages/masters/Flavours.tsx)
- Purpose: a restored standalone page for flavours. Per product-scope requirement, there is no sidebar link to this page — it exists for direct access if required.

### Recipe Management (standalone)

- File: [src/pages/RecipeManagement.tsx](src/pages/RecipeManagement.tsx)
- Purpose: a simple independent recipe editor/viewer (restored file). The canonical recipe management workflow is flavour-scoped (`FlavourDetails`) — the standalone file exists for convenience.

### Materials & Material Master

- File: materials are seeded in `src/context/ErpContext.tsx` (default array). Material master includes `stock` (numeric) now.
- Actions that modify stock:
  - `Apply to Material Master` from scaled production in `FlavourDetails.tsx` deducts quantities using `updateMaterial`.
  - There is an `addMaterial` helper for adding new materials.

Important notes:
- Units: recipe materials are entered/stored in grams relative to the master formula. When applying production scaling the code converts between grams and a material's unit (if the material unit is `kg` then grams are converted to kg before deduction).

### Manufacturers

- File: seeded in `src/context/ErpContext.tsx`.
- Purpose: reference data used in production planning.

### Production Planning

- File: [src/pages/ProductionPlanning.tsx](src/pages/ProductionPlanning.tsx) (high-level)
- Purpose: create production plans that reference a product, flavour, recipe, manufacturer and target quantity. Not heavily integrated with stock updates in the current prototype (stock changes are driven through the Flavour recipe production flow).

## How to test flows locally

1. Start the dev server (from project root):

```bash
npm run dev
```

2. Open the app in a browser (Vite prints the local URL, e.g. `http://localhost:3004/`).

3. Products → Add a product (if none exist) → click **Manage Flavours** for the product.

4. In **Manage Flavours**: Add a new flavour.

5. In **Manage Recipes** for that flavour (click Manage Recipes):
   - Click **Add Recipe**.
   - Enter a `version` and add ingredient rows so the total equals the Master Formula (default 100 g on a first recipe):
     - Example rows: Protein 40, Sugar 30, Other 30 → total = 100 g.
   - Save.

6. Back on the Flavour page, use the Production panel:
   - Choose the recipe just created.
   - Enter `300` kg and click **Calculate**.
   - Confirm the scaled quantities, then click **Apply to Material Master** to deduct stock (confirm prompt appears).

7. Inspect material stock changes by viewing `materials` in `ErpContext` (update UI or debug via console).

## Next improvements / TODOs

- Persist `ErpContext` arrays to `localStorage` and rehydrate on load so data survives reloads.
- Add negative-stock guards and low-stock alerts when applying production deductions.
- Add unique recipe-version validation per flavour.
- Show running total in Add Recipe modal as the user types (quick enhancement).
- Add read-only recipe export / print view and better formatting for scaled units.
- Add unit normalization helpers (centralize conversions between grams and kg).

---

If you want I can:

- Implement `localStorage` persistence now (recommended), or
- Add the running-total indicator in the Add Recipe modal, or
- Add safeguards to prevent negative stock on application.

File added: [WORKFLOW.md](WORKFLOW.md)
