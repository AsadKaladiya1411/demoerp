# ERP Architecture

## 1. Project Overview

### Overall Purpose

This ERP is a React-based production and master-data prototype for nutrition/powder products. It manages product categories, products, flavours, manufacturers, material master records, recipes, production calculations, packaging calculations, box configuration, consolidated material requirements, inventory/material reports, dashboard summaries, and master production reports.

The current architecture treats `Recipe` as the operational source of truth for production-related calculations. A product and flavour determine the available recipes; a selected recipe then drives raw material, packaging, box, and report calculations.

### Technology Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Context API
- Radix UI primitives
- Lucide React icons
- Framer Motion
- Recharts
- Oxlint

Note: The user-facing project description mentions Next.js, but the actual implementation is a Vite React application.

### Folder Structure

```text
src/
  App.tsx
  main.tsx
  context/
    ErpContext.tsx
  lib/
    production.ts
    production.demo.ts
    utils.ts
  components/
    layout/
      AppLayout.tsx
      Sidebar.tsx
      TopNav.tsx
    ui/
      badge.tsx
      button.tsx
      card.tsx
      dialog.tsx
      input.tsx
      label.tsx
      select.tsx
      table.tsx
      tabs.tsx
  pages/
    Dashboard.tsx
    MasterReport.tsx
    RecipeManagement.tsx
    Reports.tsx
    masters/
      Categories.tsx
      Flavours.tsx
      FlavourDetails.tsx
      ManageFlavours.tsx
      Manufacturers.tsx
      Materials.tsx
      ProductDetails.tsx
      Products.tsx
```

### Main Modules

- Dashboard
- Product Categories
- Products
- Product Details
- Flavour management
- Recipe Management
- Material Master
- Manufacturer Master
- Reports
- Master Report
- Shared production utilities
- Shared ERP Context

## 2. Current Architecture

### Central State

All master and transaction-like data is held in `ErpContext.tsx` using React Context and `useState`.

The context exposes:

- `categories`
- `products`
- `flavours`
- `manufacturers`
- `materials`
- `recipes`
- `productionPlans`
- add/update/remove functions for supported masters
- `generateProductionSummary`

There is no backend, persistence layer, API, database, or browser storage in the current implementation. All data resets when the app reloads.

### Products

Products belong to categories and optionally reference a manufacturer. Products are managed in `Products.tsx` and viewed in `ProductDetails.tsx`.

Important relationships:

- `Product.categoryId -> Category.id`
- `Product.manufacturerId -> Manufacturer.id`
- `Flavour.productId -> Product.id`
- `Recipe.productId -> Product.id`

### Flavours

Flavours belong to products. They are managed globally and through product-specific screens.

Important relationships:

- `Flavour.productId -> Product.id`
- `Recipe.flavourId -> Flavour.id`

`ProductDetails.tsx` and `ManageFlavours.tsx` both expose flavour management paths. `FlavourDetails.tsx` includes recipe management for a specific product/flavour route.

### Recipes

Recipes are the core production definition. A recipe belongs to one product and one flavour. It includes:

- master formula quantity
- batch size
- pack size
- serving size
- raw material formula rows
- packaging configuration rows
- box configuration

`RecipeManagement.tsx` is the main recipe workflow. `FlavourDetails.tsx` also allows recipe add/edit for a specific flavour.

Downstream calculations use selected recipe data. Raw material, packaging, and box calculations are not stored as independent workflows.

### Material Master

Material Master lives in `Materials.tsx`. Materials can be raw materials or packaging materials.

Fields currently include:

- code
- name
- type
- unit
- supplier
- current stock
- minimum stock
- shelf life
- expiry required
- status
- optional pack weight for roll packaging

Materials are referenced from recipes by `materialId`.

### Packaging Materials

Packaging materials are records in the same `Material` model with `type: 'Packaging Material'`.

Recipe packaging rows reference packaging material IDs and specify:

- `unit: 'Nos' | 'Roll'`
- optional roll weight
- optional empty sachet weight

Packaging calculations are always derived from production output, specifically `ProductionSummary.totalFinishedUnits`.

### Reports

`Reports.tsx` provides tabbed reports:

- Production Report
- Requirement Report
- Packaging Report
- Material Report

Requirement and packaging reports use selected recipes and `generateConsolidatedMaterialRequirementReport`.

Material Report reads live material master data.

### Master Reports

`MasterReport.tsx` creates a detailed report from the first available production plan, falling back to the first recipe if needed.

It displays:

- batch / production metadata
- product details
- packaging summary
- raw material requirements
- packaging material requirements
- prepared/approved signature area

It uses live context data and shared calculation utilities.

### Production Calculation

Production calculation is implemented in `calculateProduction` in `src/lib/production.ts`.

Inputs:

- recipe payload
- material master references
- production quantity in kg
- optional box units

Outputs:

- production kg
- serving size
- total finished sachets/units
- total grams
- scaled raw materials
- optional boxes and loose units
- loss kg

### Box Configuration

Box configuration belongs to `Recipe.boxConfig`.

Stored fields:

- default assorted percentage
- default flavoured percentage
- flavoured box sachets per box
- assorted box sachets per box
- allowed assorted flavour IDs
- assorted flavour composition

`RecipeManagement.tsx` edits these values and uses `calculateBoxPlanning` in the final calculation summary.

### Dashboard

Dashboard reads context data and displays:

- counts for categories, products, flavours, recipes, manufacturers, materials
- pending approvals
- trial production count
- monthly production chart based on production plans
- products-per-category chart
- recent production plans

## 3. Data Models

### Context Models

#### `Category`

- `id`: unique identifier
- `code`: category code
- `name`: category name
- `description`: category description
- `status`: `Active` or `Inactive`
- `createdDate`: ISO-like creation date string

#### `Product`

- `id`: unique identifier
- `code`: product code
- `name`: product name
- `categoryId`: parent category ID
- `manufacturerId?`: optional manufacturer ID
- `shelfLife`: shelf life in months
- `expiryRequired`: whether expiry is required
- `description`: product description
- `status`: `Active` or `Inactive`

#### `Flavour`

- `id`: unique identifier
- `name`: flavour name
- `productId`: parent product ID
- `status`: `Active` or `Inactive`

#### `Manufacturer`

- `id`: unique identifier
- `name`: manufacturer name
- `contactPerson`: contact person
- `gst`: GST number
- `address`: address
- `mobile`: mobile number
- `email`: email address
- `status`: `Active` or `Inactive`

#### `Material`

- `id`: unique identifier
- `code`: material code
- `name`: material name
- `type`: `Raw Material` or `Packaging Material`
- `unit`: unit of stock/calculation
- `shelfLife`: shelf life
- `expiryRequired`: whether expiry is required
- `supplier`: supplier name
- `status`: `Active` or `Inactive`
- `stock?`: current stock
- `minStock?`: minimum stock
- `packWeightKg?`: optional roll/package weight in kg, used by packaging calculations

#### `RecipeMaterial`

- `materialId`: raw material ID
- `quantity`: quantity in recipe formula
- `unit`: formula unit

#### `RecipePackaging`

- `materialId`: packaging material ID
- `unit`: `Nos` or `Roll`
- `rollWeightKg?`: roll weight in kg
- `emptySachetWeightG?`: empty sachet weight in grams

#### `RecipeBoxConfig`

- `defaultAssortedPercentage`: target assorted allocation percentage
- `defaultFlavouredPercentage`: target flavoured allocation percentage
- `flavouredBox.sachetsPerBox`: sachets per single-flavour box
- `assortedBox.sachetsPerBox`: sachets per assorted box
- `assortedBox.allowedFlavourIds`: flavours allowed in assorted boxes
- `assortedBox.composition`: flavour-wise sachets per assorted box

#### `Recipe`

- `id`: unique identifier
- `productId`: product ID
- `flavourId`: flavour ID
- `version`: recipe version
- `masterQuantity`: base formula quantity, currently expected to be 100
- `batchSize`: default production batch size in kg
- `packSize`: packaging size label
- `servingSize?`: serving size string such as `30g`
- `materials`: raw material formula rows
- `packaging?`: packaging configuration rows
- `boxConfig`: recipe-owned box planning configuration

#### `ProductionPlan`

- `id`: unique identifier
- `productId`: product ID
- `flavourId`: flavour ID
- `recipeId`: recipe ID
- `manufacturerId`: manufacturer ID
- `batch`: batch number
- `mfgDate`: manufacturing date
- `quantity`: production quantity in kg
- `type`: `Normal` or `Trial`
- `status`: `Draft`, `Pending Approval`, or `Approved`

### Production Utility Types

#### `Unit`

String union for units such as `kg`, `g`, `pcs`, `roll`, `bundle`, `meter`, or any string.

#### `PackagingUnit`

`Nos` or `Roll`.

#### `MaterialRef`

Material lookup shape used by calculation utilities:

- `id`
- `name?`
- `unit`
- `packWeightKg?`
- `stock?`

#### `RecipeMaterialReq`

Recipe material input for production calculation:

- `materialId`
- `quantity`
- `unit`

#### `RecipePackagingReq`

Packaging calculation input:

- `materialId`
- `unit`
- `rollWeightKg?`
- `emptySachetWeightG?`

#### `RecipePayload`

Minimal recipe shape used by production utilities:

- `id`
- `masterQuantity`
- `batchSize?`
- `packSize?`
- `boxConfig?`
- `servingSize?`
- `materials`

#### `RawMaterialCalculated`

Calculated raw material result:

- `materialId`
- `name?`
- `required`
- `requiredBaseGrams?`
- `unit`

#### `PackagingCalculated`

Calculated packaging result:

- `materialId`
- `name?`
- `packagingUnit`
- `requiredSachets`
- `rollWeightKg?`
- `emptySachetWeightG?`
- `totalSachetsInOneRoll?`
- `requiredRolls?`
- `requiredNos?`

#### `ProductionSummary`

Production calculation output:

- `productionKg`
- `servingSizeG`
- `totalFinishedUnits`
- `totalGrams`
- `rawMaterials`
- `totalBoxes?`
- `looseUnits?`
- `lossKg?`

#### Consolidated Report Types

- `MaterialRequirementReportInput`: selected recipe, recipe name, and production kg
- `RecipeWiseRawMaterialRequirement`: material-wise requirement per recipe
- `RecipeWisePackagingRequirement`: packaging-wise requirement per recipe
- `RecipeWiseRequirement`: recipe section output
- `ConsolidatedRequirement`: grouped material total
- `ConsolidatedMaterialRequirementReport`: complete recipe-wise and consolidated report output

#### Box Planning Types

- `BoxPlanningFlavourInput`: flavour-wise produced sachets and assorted composition input
- `BoxPlanningInput`: percentages, box sizes, and flavour inputs
- `BoxPlanningFlavourResult`: flavour-wise used/remaining/box output
- `BoxPlanningSummary`: overall assorted/flavoured summary
- `BoxPlanningReport`: summary, flavour rows, and validation messages

## 4. Calculation Flow

### Actual Flow

```text
Product
  ↓
Flavour
  ↓
Selected Recipe
  ↓
Production Quantity
  ↓
calculateProduction(recipe, materials, productionKg)
  ↓
Raw Material Calculation
  ↓
calculatePackaging(totalFinishedUnits, recipe.packaging, materials)
  ↓
Packaging Calculation
  ↓
calculateBoxPlanning(recipe.boxConfig + totalFinishedUnits)
  ↓
Box Calculation
  ↓
Reports / Master Report / Recipe Management summaries
```

### Step-by-Step Implementation

1. User selects Product in Recipe Management.
2. Available flavours are filtered by `flavour.productId === selectedProduct`.
3. User selects Flavour.
4. Existing recipe dropdown is filtered by `recipe.flavourId === selectedFlavour`.
5. User loads or saves a Recipe.
6. Production Calculator uses `selectedRecipe`.
7. `calculateProduction` scales recipe formula from `recipe.masterQuantity` to requested `productionKg`.
8. Raw material requirements are calculated from `recipe.materials`.
9. Material names and stock units are looked up from Material Master.
10. Total finished units are calculated from production grams divided by serving size.
11. Packaging calculation uses `productionSummary.totalFinishedUnits` and `recipe.packaging`.
12. Box calculation uses `recipe.boxConfig` and `productionSummary.totalFinishedUnits`.
13. Reports use selected recipes and production quantities to generate requirement and packaging reports.
14. Master Report uses the first production plan or first recipe and recalculates from live data.

## 5. Existing Business Rules

- Recipe is the single source of truth for production-related calculations.
- Product and Flavour determine which Recipes are available.
- Production calculations use the selected Recipe.
- Recipe formula total must equal exactly `100g` in Recipe Management and Flavour Details.
- Batch Size must be greater than `0`.
- Pack Size is required.
- Box Configuration belongs to Recipe.
- Assorted Percentage plus Flavoured Percentage must equal exactly `100`.
- Flavoured and Assorted sachets per box must be greater than `0`.
- Packaging is configured on the Recipe.
- Packaging is calculated after production from `totalFinishedUnits`.
- Roll packaging requires roll weight and empty sachet weight.
- For roll packaging, total sachets in one roll equals `floor((rollWeightKg * 1000) / emptySachetWeightG)`.
- Required rolls equals `ceil(requiredSachets / totalSachetsInOneRoll)`.
- `Nos` packaging requirement equals required sachets.
- Consolidated material reports group by `materialId`, not material name.
- Consolidated report rows are sorted alphabetically by material name.
- Material Report flags Low Stock when current stock is less than or equal to minimum stock.

## 6. Existing Reports

### Production Report

Location: `Reports.tsx`

Inputs:

- `productionPlans`
- `products`

Outputs:

- batch number
- product name
- manufacturing date
- quantity
- type
- status

Dependencies:

- Production Plan master data
- Product master data

### Requirement Report

Location: `Reports.tsx`

Inputs:

- selected recipes
- production quantity per selected recipe
- materials
- products
- flavours

Outputs:

- recipe-wise raw material requirement
- consolidated raw material requirement
- consolidated packaging requirement

Dependencies:

- Recipe
- Product
- Flavour
- Material Master
- `generateConsolidatedMaterialRequirementReport`
- `calculateProduction`
- `calculatePackaging`

### Packaging Report

Location: `Reports.tsx`

Inputs:

- selected recipes from Requirement Report
- production quantities
- recipe packaging configuration
- material master

Outputs:

- packaging material
- total required

Dependencies:

- Requirement Report state
- Recipe packaging
- Material Master

### Material Report

Location: `Reports.tsx`

Inputs:

- Material Master

Outputs:

- material code
- material name
- type
- current stock
- minimum stock
- supplier
- status / low stock flag

Dependencies:

- Material Master

### Master Report

Location: `MasterReport.tsx`

Inputs:

- first production plan if available
- otherwise first recipe
- product/category/flavour/manufacturer/material master data

Outputs:

- batch details
- product details
- packaging summary
- raw material requirements
- packaging requirements
- prepared/approved signature area

Dependencies:

- Recipe
- Production Plan
- Product
- Category
- Flavour
- Manufacturer
- Material Master
- `calculateProduction`
- `calculatePackaging`
- `calculateBoxPlanning`
- `getPackagingRequiredDisplay`

### Recipe Management Embedded Reports

Location: `RecipeManagement.tsx`

Inputs:

- selected product
- selected flavour
- selected recipe
- production quantity
- material master

Outputs:

- required raw materials
- required packaging materials
- final calculation summary
- recipe formula report
- raw material consumption report
- packaging material consumption report
- JSON production summary

Dependencies:

- selected Recipe
- Material Master
- production utilities

## 7. Current Default Data

### Categories

- `cat-1`: Nutrition
- `cat-2`: Sports Nutrition

### Products

- `prod-1`: Protein Powder, category Nutrition, manufacturer ABC Nutrition
- `prod-2`: Mass Gainer, category Sports Nutrition, manufacturer XYZ Healthcare

### Flavours

- `flav-1`: Chocolate for Protein Powder
- `flav-2`: Vanilla for Protein Powder
- `flav-3`: Chocolate for Mass Gainer
- `flav-4`: Vanilla for Mass Gainer

### Manufacturers / Suppliers

Manufacturer records:

- ABC Nutrition
- XYZ Healthcare

Supplier names used by materials:

- Global Dairy
- Sweet Co
- NutriChem
- Print Flex
- Label Co
- Pack Solutions

### Materials

Raw materials:

- `mat-1`: MPC 85, 500 kg stock, 100 kg minimum
- `mat-2`: Sugar, 1000 kg stock, 200 kg minimum
- `mat-3`: Cocoa Powder, 250 kg stock, 50 kg minimum
- `mat-4`: Milk Powder, 400 kg stock, 75 kg minimum
- `mat-5`: Vitamin Mix, 120 kg stock, 25 kg minimum

Packaging materials:

- `mat-6`: Printed Film, 100 Roll stock, 20 Roll minimum, 100 kg pack weight
- `mat-7`: Labels, 50000 Nos stock, 10000 Nos minimum
- `mat-8`: Boxes, 2000 Nos stock, 500 Nos minimum
- `mat-9`: Master Cartons, 500 Nos stock, 100 Nos minimum

### Recipes

#### `rec-1`: Protein Powder Chocolate V1.0

- batch size: 500 kg
- pack size: 1 Kg
- serving size: 30g
- formula:
  - MPC 85: 45g
  - Sugar: 30g
  - Cocoa Powder: 20g
  - Vitamin Mix: 5g
- packaging:
  - Printed Film as Roll, 100 kg roll weight, 2g empty sachet
  - Labels as Nos
  - Boxes as Nos
- box config:
  - assorted 20%
  - flavoured 80%
  - flavoured box 10 sachets
  - assorted box 20 sachets

#### `rec-2`: Protein Powder Vanilla V1.0

- batch size: 400 kg
- pack size: 1 Kg
- serving size: 30g
- formula:
  - MPC 85: 48g
  - Sugar: 32g
  - Milk Powder: 15g
  - Vitamin Mix: 5g
- packaging:
  - Printed Film as Roll, 100 kg roll weight, 2g empty sachet
  - Labels as Nos
  - Boxes as Nos
- box config:
  - assorted 20%
  - flavoured 80%
  - flavoured box 10 sachets
  - assorted box 20 sachets

#### `rec-3`: Mass Gainer Chocolate V1.0

- batch size: 600 kg
- pack size: 1 Kg
- serving size: 50g
- formula:
  - MPC 85: 35g
  - Sugar: 35g
  - Cocoa Powder: 10g
  - Milk Powder: 15g
  - Vitamin Mix: 5g
- packaging:
  - Printed Film as Roll, 100 kg roll weight, 2.5g empty sachet
  - Labels as Nos
  - Master Cartons as Nos
- box config:
  - assorted 10%
  - flavoured 90%
  - flavoured box 10 sachets
  - assorted box 20 sachets

### Production Plans

- `plan-1`: Protein Powder Chocolate, recipe `rec-1`, batch `B-PP-001`, 500 kg, Approved
- `plan-2`: Mass Gainer Chocolate, recipe `rec-3`, batch `B-MG-001`, 600 kg, Approved

## 8. Missing Features

The following are incomplete or placeholder-like based on current code inspection. They are documented only; no implementation is included here.

- No persistent storage: data lives only in React state.
- No backend API or database.
- Export PDF / Export Excel / Print buttons do not perform actual export/print logic.
- Date filters in Reports are present but not applied to report data.
- Product edit/delete buttons are visible but not implemented.
- Category edit/delete buttons are visible but not implemented.
- Global Flavours page needs review for full CRUD consistency.
- `ProductionPlan` has seeded records and context add support, but no current dedicated UI module for creating production plans.
- `production.demo.ts` is a standalone demo script, not wired into the UI.
- Recipe Management includes editable assorted flavour selection and per-box composition.
- Master Report selects the first production plan/recipe automatically; no UI exists to select a specific production plan or recipe.
- Reports packaging tab depends on recipe selection made in the Requirement Report tab.
- Context add functions use captured array state (`setItems([...items, item])`) rather than functional updates, which can be fragile during rapid updates.
- No validation prevents deleting a material that is still referenced by recipes.
- No unit conversion beyond converting gram-based formula requirements to kg when material master unit is `kg`.
- No authentication, authorization, approval workflow, audit trail, or role-based access.

## 9. Improvement Suggestions

- Add persistence through a backend or local storage abstraction.
- Move seeded data to a separate `seedData.ts` file.
- Add a dedicated type-safe service layer for recipe/material/report operations.
- Convert context setters to functional updates consistently.
- Add referential integrity checks before deleting materials, products, flavours, or recipes.
- Add selectors/helper functions for common lookups such as product name by ID and flavour name by ID.
- Add report selection controls to Master Report.
- Implement date filtering in Reports.
- Implement print/PDF/Excel export actions.
- Add unit conversion utilities and explicit unit normalization rules.
- Add tests for production, packaging, consolidated report, and box planning utilities.
- Consider splitting `ErpContext.tsx` into model definitions, seed data, reducer/actions, and provider.
- Preserve Recipe as the source of truth and avoid reintroducing standalone planning modules.

## 10. Dependency Map

```text
ErpContext
├── Categories
├── Products
├── Flavours
├── Manufacturers
├── Materials
├── Recipes
└── ProductionPlans

Product
├── Category
├── Manufacturer
├── Flavours
└── Recipes

Flavour
├── Product
└── Recipes

Recipe
├── Product
├── Flavour
├── Raw Materials
├── Packaging Materials
├── Box Config
└── Production Calculations

Material Master
├── Recipe Formula Rows
├── Recipe Packaging Rows
├── Production Calculation
├── Packaging Calculation
├── Reports
└── Master Report

Production Utilities
├── calculateProduction
├── calculatePackaging
├── calculateBoxPlanning
├── validateRecipeFormulaTotal
├── validatePackagingRow
└── generateConsolidatedMaterialRequirementReport

Recipe Management
├── Products
├── Flavours
├── Recipes
├── Materials
├── Production Utilities
└── Context CRUD

Reports
├── ProductionPlans
├── Products
├── Flavours
├── Recipes
├── Materials
└── Consolidated Report Utility

Master Report
├── ProductionPlans
├── Recipes
├── Products
├── Flavours
├── Categories
├── Manufacturers
├── Materials
└── Production Utilities

Dashboard
├── Categories
├── Products
├── Flavours
├── Recipes
├── Manufacturers
├── Materials
└── ProductionPlans
```

## 11. Future Development Guidelines

- Keep Recipe as the single source of truth for production, packaging, material, and box calculations.
- Product and Flavour selection should only determine which Recipe is available or selected.
- All downstream calculations must originate from the selected Recipe.
- Do not create duplicate standalone planning modules for production or box planning.
- Keep business logic in shared utilities such as `production.ts`.
- Do not duplicate calculation formulas in UI components.
- Use strong TypeScript types for all new data models and utility inputs/outputs.
- Avoid `any`.
- Prefer `materialId`, `recipeId`, `productId`, and `flavourId` for relationships; do not join by display names.
- Preserve existing UI patterns and component library usage.
- Add new fields to all affected models, seed data, creation flows, edit flows, and reports.
- Validate at the point of data entry and in shared utilities when possible.
- Keep reports live from Context/master data; avoid hardcoded report rows.
- Use functional state updates for context mutations where possible.
- Before adding new features, search the codebase for related interfaces, object creation, reports, and utility dependencies.
- Do not remove shared calculation utilities if they are used by any module.
- Document architectural changes when business rules move or ownership changes.
