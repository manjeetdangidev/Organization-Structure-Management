# Labor Structure Management Platform

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-informational?style=for-the-badge&logo=tailwind-css)
![@dnd-kit](https://img.shields.io/badge/@dnd--kit-Core-orange?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)

---

## Table of Contents

- [1. Introduction & Application Philosophy](#1-introduction--application-philosophy)
- [2. Features Deep Dive](#2-features-deep-dive)
- [3. Getting Started: Local Development](#3-getting-started-local-development)
  - [3.1. Prerequisites](#31-prerequisites)
  - [3.2. Installation & Setup](#32-installation--setup)
- [4. Technical Architecture](#4-technical-architecture)
  - [4.1. Core Technologies](#41-core-technologies)
  - [4.2. State Management: The Immutable History Hook](#42-state-management-the-immutable-history-hook)
  - [4.3. Data Flow: Unidirectional and Predictable](#43-data-flow-unidirectional-and-predictable)
  - [4.4. Drag and Drop Architecture (`@dnd-kit`)](#44-drag-and-drop-architecture-dnd-kit)
  - [4.5. Recursive Tree Utilities (`/utils/treeUtils.ts`)](#45-recursive-tree-utilities-utilstreeutilsts)
  - [4.6. Component-Based Architecture](#46-component-based-architecture)
- [5. Codebase Guide](#5-codebase-guide)
  - [5.1. Project Structure](#51-project-structure)
  - [5.2. Key Components Breakdown](#52-key-components-breakdown)
  - [5.3. Working with Types (`types.ts`)](#53-working-with-types-typests)
- [6. Testing Strategy](#6-testing-strategy)
  - [6.1. Philosophy](#61-philosophy)
  - [6.2. Tools & Frameworks](#62-tools--frameworks)
  - [6.3. How to Run Tests](#63-how-to-run-tests)
- [7. Accessibility (A11y) Statement](#7-accessibility-a11y-statement)
- [8. Contributing](#8-contributing)
  - [8.1. Branching Strategy](#81-branching-strategy)
  - [8.2. Pull Request Process](#82-pull-request-process)
- [9. Project Roadmap & Future Enhancements](#9-project-roadmap--future-enhancements)

---

## 1. Introduction & Application Philosophy

### 1.1. High-Level Overview

The Labor Structure Management Platform is a sophisticated, enterprise-grade web application designed for Human Resources professionals, operations managers, and organizational planners. It provides a highly interactive, visual, and intuitive interface to build, manage, and reorganize a company's hierarchical labor structure.

Users can define the relationships between **Divisions**, **Departments**, and **Jobs**, manage a repository of unassigned roles, and save their complete configurations as persistent templates. The application is built to handle complex organizational charts with a user-friendly, drag-and-drop paradigm, transforming a traditionally tedious task into a fluid and engaging experience.

### 1.2. Core Design Principles

The application was architected around a few key principles:

1.  **User Empowerment & Safety:** The user should feel in complete control. Every significant action is reversible via a robust **Undo/Redo** system. This "safety net" encourages exploration and experimentation, as mistakes are never catastrophic. Visual feedback is constant and clear, ensuring the user always understands the state of the application.

2.  **Ultimate Flexibility & Customization:** We recognize that different users have different needs. The **Feature Panel** allows for granular control over the UI, enabling users to toggle nearly every advanced feature on or off. This allows the application to scale from a simple list manager to a full-featured organizational design tool, catering to both novices and power users.

3.  **Developer Experience & Maintainability:** A clean, scalable, and predictable architecture is paramount. The application employs a centralized state management model with immutable updates, a strict unidirectional data flow, and a well-defined, component-based structure. TypeScript is used throughout to ensure type safety and reduce runtime errors, making the codebase easier to maintain and extend.

4.  **Performance and Interactivity:** The user interface is designed to be fast and responsive. By leveraging an efficient library like `@dnd-kit` and using memoization (`useMemo`, `useCallback`) to prevent unnecessary re-renders, the application remains fluid even with large and complex data structures.

---

## 2. Features Deep Dive

### 2.1. The Main Workspace: A Flexible Dual-Panel UI

The primary interface on the `SetupPage` is a powerful dual-panel layout, designed for maximum efficiency.

-   **Resizable Panels:** The workspace is split between the **Labor Structure** on the left and **Available Job Roles** on the right.
    -   **Implementation:** A central gutter element has an `onMouseDown` event that triggers a `isResizing` state. `useEffect` then attaches `mousemove` and `mouseup` listeners to the `window` to calculate and apply the new panel width, stored in the `structureWidth` state. This provides a smooth, native-like resizing experience.
-   **Ratio Modal:** For users who prefer precision, double-clicking the resizer gutter opens a modal where an exact percentage ratio (e.g., 70/30) can be entered. This provides an accessibility alternative to fine-motor drag resizing.
-   **Gutter Action Buttons:** The resizer gutter isn't just a divider; it's an interactive element. It contains dedicated arrow buttons (`<` and `>`) that allow users to move selected jobs between the two panels with a single click (`handleMoveLeft`, `handleMoveRight`). This provides a clear, explicit alternative to dragging and dropping. Buttons are contextually disabled based on the selection.
-   **Collapsible Panel:** The "Available Jobs" panel can be completely hidden and restored via a button in the main header and a control on the panel itself, allowing users to enter a "focus mode" on the main structure.

### 2.2. The Labor Structure Column: Building the Hierarchy

This is the main canvas where the organization's structure is visualized and manipulated.

-   **Dynamic Title:** The `<h2>` title is bound to the `structureTitle` state, which changes from "Recommended Labor Structure" to "Current Labor Structure" or "User Labour Structure" based on whether the data `isDirty` or has been loaded from a template, providing clear context.
-   **Real-time Hierarchical Search:** The search input updates the `structureSearchQuery` state. A `useMemo` hook then computes the `filteredStructure` by recursively walking the entire tree and returning a new tree containing only items that match the query or have children that match. This ensures the hierarchy is preserved in search results.
-   **Live Header Counts:** The `structureCounts` object (`Div: X, Dept: Y, Job: Z`) is derived via a `useMemo` hook that re-calculates the totals whenever the main `state.structure` changes, providing an efficient and always-accurate at-a-glance summary.

### 2.3. The Tree Item: Core of the Hierarchy

Each node in the structure is rendered by the powerful `TreeItem` component, which is packed with features:

-   **Visual Hierarchy:**
    -   *Indentation:* `paddingLeft` is dynamically calculated based on the `depth` prop to create a clear visual tree structure.
    -   *Type-Specific Styling:* The `TypeIcon` internal component renders a unique icon (`Folder`, `ClipboardList`, `Circle`) for each `ItemType`. Font weight and color also change via the `nameClass` variable to visually differentiate Divisions, Departments, and Jobs.
-   **Stateful Interactivity:**
    -   *Selection:* The `onClick` handler calls the `onSelect` prop, supporting single selection and multi-selection via `e.metaKey || e.ctrlKey`. The `isSelected` variable controls the application of a distinct background color (`bg-cyan-100`).
    -   *Expansion/Collapse:* The chevron icon is only rendered if `item.children` exists. Its `onClick` handler calls `onToggleExpand`, which updates the `expandedIds` set in the root `App` component. The icon rotates using CSS transforms based on the `isExpanded` prop.
    -   *Inline Editing:* Triggered by `onDoubleClick`. This sets the `editingItemId` in the `App` state, which causes the `TreeItem` to conditionally render an `<input>` field. `onBlur` and `onKeyDown` ('Enter') events on the input call `onNameChange` to commit the new value.
    -   *Drag Handle:* The main body of the item has the `{...attributes} {...listeners}` spread from `useDraggable`, making it the grab handle for dnd operations.
-   **Contextual On-Hover Controls (Group Hover):**
    -   *Implementation:* A parent `div` with the `group` class from Tailwind CSS allows child elements with `group-hover:opacity-100` to appear only when the mouse is over any part of the `TreeItem`.
    -   *Add Child (`PlusCircle` icon):* Appears for Divisions and Departments. Calls `onOpenAddItemModal` with the correct child type and its own ID as the parent ID.
    -   *Delete Item (`X` icon):* Appears for all items. Calls `onDeleteItem` with its own `item.id`.
    -   *Sort Children (`ArrowDownAZ`, `ArrowUpZA` icons):* Appears for parent items. Calls `onSortChildren` with its own ID and the sort direction.
-   **Inline Move Controls:**
    -   *Visibility:* These controls are conditionally rendered only if `isSelected`, `selectedItemIds.length === 1`, and the `inlineMoveControls` feature flag is true.
    -   *Functionality:* Includes buttons for `onMoveItems('up'/'down')` and a text input for moving to a specific numeric position. A "Swap" checkbox toggles the behavior of the text input between `onMoveToPosition` and `onSwapItems`.
-   **Informational Displays:**
    -   *Position Index:* A read-only text element displays the item's position in the hierarchy (e.g., "1.2.1").
    -   *Layer Counts:* If the feature flag is enabled, a memoized calculation (`childCounts`) determines the number of child departments and jobs, displaying a summary like `(Dept: 2, Job: 6)`.
-   **Keyboard Navigation:** The containing element of the tree has a `tabIndex={0}` and an `onKeyDown` handler that implements:
    -   *Arrow Up/Down:* Moves selection to the next/previous visible item.
    -   *Arrow Right/Left:* Expands/collapses a selected parent node.
    -   *Alt + Arrow Up/Down:* Moves the selected item(s) up or down.

### 2.4. The Action Panel: A Centralized Command Center

This comprehensive toolbar, located at the top of the Structure Column, provides access to all major functions. All buttons have `disabled` attributes bound to logical conditions for a robust UX.

-   **Actions Group:**
    -   **Add (Dropdown):** Add a new Division, Department, or Job. Options are disabled based on the type of the `singleSelectedItem`. The "Add Layer" option opens a complex form modal for bulk creation.
    -   **Move Up/Down:** Calls `onMoveItems`. Disabled if `!hasSelection`.
    -   **Modify:** Calls `onModify`. Disabled if `!hasSingleSelection`.
    -   **Copy/Cut/Paste:** Calls `onCopy`, `onCut`, `onPaste`. Disabled based on selection count and clipboard state.
    -   **Delete:** Calls `onDelete`. Disabled if `!hasSelection`.
-   **View Group:**
    -   **Expand/Collapse All:** Calls `onToggleExpandAll`. The text and icon change based on the current `expansionState`.
    -   **Expand to Depts/Jobs:** Calls `onExpandLevel` with the corresponding depth.
    -   **Expand Sel. (Dropdown):** Options for "To Departments" and "To Jobs". Calls `onExpandSelection`. Options are disabled based on `canExpandToDepts` and `canExpandSelection` props.
    -   **Collapse Sel. (Dropdown):** Options for "Collapse All", "To Jobs", "To Departments", "To Divisions". Calls `onCollapseSelection` or `onCollapseToLevel`. Options are disabled based on `canCollapse...` props.
-   **Ordering Group:**
    -   **Manual:** Toggles the `showManualOrder` state, which conditionally renders numeric inputs on each `TreeItem`.
    -   **Apply:** Calls `onApplyManualOrder` to re-sort the tree based on the user-entered numbers.
    -   **A-Z / Z-A Sort:** Calls `onSort('asc'/'desc')` to perform a global, recursive alphabetical sort.
-   **Templates Group:**
    -   **Save:** Calls `onOpenSaveTemplateModal`. Disabled if the structure is not `isDirty`.
    -   **Manage (Dropdown):** Lists all `savedTemplates`. Each item has "Load" and "Delete" buttons, calling `onLoadTemplate` and `onDeleteTemplate` respectively.

### 2.5. The Available Jobs Column: Your Role Repository

This panel acts as a holding area for all job roles that are not currently part of the main labor structure.

-   **Flat List Structure:** Unlike the main structure, this is a simple, non-hierarchical list of `TreeItem` components.
-   **Independent Search:** Includes its own search bar and state (`availableJobsSearchQuery`) to filter the list without affecting the main structure.
-   **Create Custom Job:** The button calls `setIsCreateModalOpen(true)`, which opens a dedicated modal (`handleCreateCustomJob`) for creating new job roles from scratch and adding them to the `availableJobs` array in the main state.

### 2.6. Context Menu: Power-User Accessibility

Right-clicking on any `TreeItem` opens a contextual menu at the cursor's location.

-   **Implementation:** `onContextMenu` in `TreeItem` calls the `handleContextMenu` prop from `App.tsx`, which sets the `contextMenu` state with the `x`, `y` coordinates and the `itemId`. The `ContextMenu` component is then rendered conditionally based on this state.
-   **Context-Sensitive Actions:** The menu dynamically enables or disables options based on props passed from `App.tsx` (e.g., `canPaste`, `itemType`, `canExpand...`). "Add Department" is only shown if a Division is right-clicked.

### 2.7. Global Controls & Customization

-   **Undo/Redo:** Located in the main header, these buttons call the `undo` and `redo` functions returned by the `useHistoryState` hook. They are disabled based on the `canUndo` and `canRedo` boolean flags from the same hook.
-   **Feature Panel:** A slide-out panel that allows users to toggle boolean feature flags stored in the `features` state object. Each toggle is a controlled component that calls `onToggleFeature` with the key of the feature to be flipped. This allows for extensive runtime UI customization.

### 2.8. The Stepper: A Guided User Journey

The application guides the user through a simple, two-step process using the `Stepper` component.

1.  **Labor Structure:** The main editing workspace.
2.  **Review & Save:** A summary page (`ReviewPage.tsx`) that shows the final counts and offers a read-only, non-editable preview of the final structure. This preview reuses the `TreeItem` component but with all interactive features disabled. Clicking "Submit" sets an `isSubmitted` flag.
3.  **Congratulations:** After submission, the `CongratulationsPage` is shown, confirming success and providing an option to reset the workflow.

### 2.9. Modals & Notifications

-   **Generic Modal Component:** A reusable `Modal` component provides the base for all pop-up dialogs, handling the overlay, closing logic, and accessibility attributes.
-   **Specific Modals:**
    -   **Save Template:** Prompts for a template name and performs validation.
    -   **Add/Modify Item:** A simple input for creating or renaming items.
    -   **Delete Confirmation:** A modal with an alert icon that forces the user to confirm destructive actions, preventing accidental data loss.
-   **Toast Notifications:** A custom `Toast` component and `ToastContainer` provide non-intrusive feedback for actions like saving a template or resetting the structure. The `addToast` function in `App.tsx` manages a list of toasts, which are automatically removed after an animation completes.

---

## 3. Getting Started: Local Development

This section provides instructions for setting up the project on your local machine for development and testing purposes.

### 3.1. Prerequisites

Before you begin, ensure you have the following installed on your system:
-   **Node.js**: Version 18.x or higher is recommended.
-   **npm**: Version 9.x or higher (usually comes with Node.js).

### 3.2. Installation & Setup

Follow these steps to get your development environment running:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/labor-structure-management.git
    cd labor-structure-management
    ```

2.  **Install Dependencies**
    This project uses npm to manage its dependencies. Run the following command in the root directory:
    ```bash
    npm install
    ```

3.  **Start the Development Server**
    Once the dependencies are installed, you can start the local development server:
    ```bash
    npm start
    ```
    This will launch the application in your default web browser, typically at `http://localhost:3000`. The server supports hot-reloading, so any changes you make to the source code will be reflected in the browser automatically.

---

## 4. Technical Architecture

### 4.1. Core Technologies

-   **React 19:** The core of the application is built using the latest version of React, leveraging functional components and hooks.
-   **TypeScript:** The entire codebase is written in TypeScript, providing static type checking, improved code completion, and enhanced maintainability.
-   **Tailwind CSS:** A utility-first CSS framework is used for all styling, allowing for rapid development of a consistent and modern UI.
-   **@dnd-kit:** A lightweight, performant, and accessible library for all drag-and-drop functionality.
-   **Lucide React:** Provides the clean and consistent icon set used throughout the application.

### 4.2. State Management: The Immutable History Hook

The single most important piece of the architecture is the custom `useHistoryState` hook.

-   **Centralized State:** All application state (the structure tree, available jobs, etc.) is managed within a single state object in the root `App.tsx` component.
-   **History Object:** The hook does not just store the current state. It maintains a `History` object:
    ```typescript
    type History<T> = {
      past: T[];
      present: T;
      future: T[];
    };
    ```
-   **Immutable Updates:** This is the critical principle. **State is never mutated directly.** Every time the state needs to change, a deep copy of the `present` state is made, the modifications are applied to the copy, and this new copy becomes the *new* `present`. The old `present` is pushed onto the `past` stack. This ensures that every previous state is perfectly preserved.
-   **Undo/Redo Logic:**
    -   **Undo:** Pops the last state from the `past` array and makes it the new `present`. The old `present` is pushed to the front of the `future` array.
    -   **Redo:** Takes the first state from the `future` array and makes it the new `present`. The old `present` is pushed to the end of the `past` array.

### 4.3. Data Flow: Unidirectional and Predictable

The application follows a strict unidirectional data flow, a core principle of React.

1.  **State Lives in `App.tsx`:** The single source of truth resides in the top-level component.
2.  **Data Flows Down via Props:** The `App` component passes down the necessary state and handler functions to its children (e.g., `SetupPage`, `StructureColumn`).
3.  **Events Flow Up via Callbacks:** When a user interacts with a child component (e.g., clicks a "Delete" button in `TreeItem`), it doesn't change its own state. Instead, it calls a handler function (like `handleDeleteItems`) that was passed down as a prop from `App.tsx`.
4.  **`App.tsx` Updates State:** The handler function in `App.tsx` contains the logic to update the application state.
5.  **Re-render:** React detects the state change and re-renders the component tree with the new data.

This pattern makes the application highly predictable and easier to debug.

### 4.4. Drag and Drop Architecture (`@dnd-kit`)

While the application's powerful grid-like functionality might resemble solutions like AG Grid, the drag-and-drop capabilities are exclusively powered by a more modern, lightweight, and specialized library called **`@dnd-kit`**. This choice was deliberate to ensure maximum performance, accessibility, and a seamless integration with React's component model.

Below is a detailed breakdown of the `@dnd-kit` components and hooks that are fundamental to our application's interactive experience.

-   **`<DndContext />`**
    -   **Purpose:** This is the main provider component that wraps the entire draggable area. It creates the context that allows all the underlying hooks (`useDraggable`, `useDroppable`) to communicate.
    -   **Implementation:** Located in `SetupPage.tsx`, it wraps the `StructureColumn` and `AvailableJobsColumn`. It is configured with sensors and event handlers.
    -   **Key Props Used:**
        -   `sensors`: We use `useSensors` and `PointerSensor` to listen for mouse and touch events. It is configured with an `activationConstraint` to prevent accidental drags on simple clicks.
        -   `collisionDetection`: We use `closestCenter` to determine what item is being dropped onto.
        -   `onDragStart`: This handler (`handleDragStart`) is used to identify the item being dragged and store its ID in the `activeId` state. This is crucial for rendering the drag overlay.
        -   `onDragEnd`: This is the most critical handler (`handleDragEnd`). It fires when a drag operation concludes and contains the complex logic to update the application state by calling our recursive `treeUtils` functions.

-   **`useDraggable`**
    -   **Purpose:** A hook that provides the necessary properties to make a component draggable.
    -   **Implementation:** Used within the `TreeItem.tsx` component.
    -   **Key Return Values Used:**
        -   `attributes`: Properties like `role` and `tabIndex` for accessibility.
        -   `listeners`: Event handlers (`onMouseDown`, `onTouchStart`, etc.) that initiate the drag operation. These are spread onto the main div of the `TreeItem`.
        -   `setNodeRef`: A function to assign a ref to the draggable DOM element.
        -   `transform`: An object `{x, y, scaleX, scaleY}` that is used to apply a CSS transform to the item while it's being dragged, making it move with the cursor.

-   **`useDroppable`**
    -   **Purpose:** A hook that registers a component as a valid drop zone.
    -   **Implementation:** Used in multiple places:
        1.  `TreeItem.tsx`: Makes every item a potential drop target, allowing for reordering and nesting.
        2.  `StructureColumn.tsx`: Makes the root of the structure column a drop target for adding new root-level divisions.
        3.  `AvailableJobsColumn.tsx`: Makes the entire available jobs panel a drop target.
    -   **Key Return Values Used:**
        -   `setNodeRef`: A function to assign a ref to the droppable DOM element.
        -   `isOver`: A boolean that becomes `true` when a draggable item is currently hovering over the drop zone. We use this to apply a visual highlight (e.g., `outline-cyan-500`) to give the user clear feedback.

-   **`<DragOverlay />`**
    -   **Purpose:** A portal-based component that renders its children on top of everything else while a drag is in progress. This is used to show a semi-transparent "ghost" of the item being dragged.
    -   **Implementation:** Located in `SetupPage.tsx`. It conditionally renders a `<TreeItem />` component based on the `activeItem` state, ensuring a pixel-perfect preview of what's being dragged.

### 4.5. Recursive Tree Utilities (`/utils/treeUtils.ts`)

Because the core data structure is a nested tree, standard array methods are insufficient. This file contains a set of pure, recursive helper functions that operate on the tree immutably.

-   `findItemRecursive`: Traverses the tree to find and return a specific item by its ID.
-   `removeItemRecursive`: Traverses the tree, finds an item by ID, and returns a *new* tree with that item (and its children) removed.
--   `insertItemRecursive`: Traverses the tree to find a target container (`overId`) and returns a *new* tree with the new item inserted into it. Includes logic to validate the drop (e.g., a Job can only be dropped in a Department).
-   `moveItemsRecursive`: Handles the up/down movement of items within their sibling list.

### 4.6. Component-Based Architecture

The application is logically divided into reusable components, promoting separation of concerns and maintainability.

-   **Pages (`/pages`):** Top-level components that represent a major view or step in the user flow (e.g., `SetupPage`, `ReviewPage`).
-   **Components (`/components`):** Reusable UI elements that make up the pages (e.g., `StructureColumn`, `TreeItem`, `Modal`, `Stepper`).

---

## 5. Codebase Guide

### 5.1. Project Structure

```
/
├── src/
│   ├── components/         # Reusable UI components
│   ├── data/               # Initial state and static data
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Top-level page components
│   ├── utils/              # Helper functions, especially for tree manipulation
│   ├── App.tsx             # Main application component, state management
│   ├── index.tsx           # Entry point for React
│   └── types.ts            # Global TypeScript type definitions
├── index.html              # Main HTML file
└── README.md               # This file
```

### 5.2. Key Components Breakdown

-   **`App.tsx`:** The brain of the application. Manages all state, history, and contains all the core handler functions for modifying data.
-   **`SetupPage.tsx`:** Lays out the main workspace, including the dual-panel structure and the `DndContext`. It acts as a bridge, passing state and handlers from `App.tsx` to the column components.
-   **`StructureColumn.tsx`:** A complex component that includes the Action Panel and the list of `TreeItem`s. Manages UI state like dropdown visibility.
-   **`TreeItem.tsx`:** The recursive component for rendering each node. It handles its own display logic based on its properties (`isSelected`, `isExpanded`, etc.) and calls back to `App.tsx` to handle data changes.
-   **`useHistoryState.ts`:** The custom hook that powers the entire state and undo/redo system. It is the cornerstone of the application's reliability.

### 5.3. Working with Types (`types.ts`)

This file is the single source of truth for data shapes.

-   **`StructureItem`:** The fundamental type for any node in the tree.
    ```typescript
    export interface StructureItem {
      id: string;
      name: string;
      type: 'Division' | 'Department' | 'Job';
      children?: StructureItem[];
    }
    ```
-   **`AppState`:** Defines the shape of the entire application state managed by `useHistoryState`.

---

## 6. Testing Strategy

### 6.1. Philosophy

This project aims for a high degree of reliability and maintainability. Our testing strategy is based on the "Testing Trophy" principle, emphasizing a healthy mix of test types to ensure confidence in our codebase. We prioritize integration tests that mimic real user interactions over brittle implementation-detail unit tests.

### 6.2. Tools & Frameworks

-   **Unit Tests:** [Jest](https://jestjs.io/) will be used for testing pure functions, particularly the tree manipulation logic in `utils/treeUtils.ts`.
-   **Integration/Component Tests:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) with Jest will be our primary tool for testing components. We will focus on testing component behavior from a user's perspective.
-   **End-to-End (E2E) Tests:** [Cypress](https://www.cypress.io/) is planned for testing critical user flows across the entire application, such as dragging a job into the structure, saving a template, and completing the stepper workflow.

### 6.3. How to Run Tests

Once testing is implemented, you will be able to run the test suites with the following commands:
```bash
# Run all unit and component tests
npm test

# Run End-to-End tests (will open the Cypress runner)
npm run cypress:open
```

---

## 7. Accessibility (A11y) Statement

We are committed to making the Labor Structure Management Platform accessible to all users, regardless of their abilities. Our goal is to adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards.

Key accessibility considerations in this project include:
-   **Keyboard Navigation:** All interactive elements are reachable and operable via the keyboard. The tree structure itself supports navigation using arrow keys.
-   **Semantic HTML:** We use appropriate HTML elements to convey structure and meaning to assistive technologies.
-   **ARIA Attributes:** Where necessary, we use ARIA (Accessible Rich Internet Applications) roles and attributes to enhance the accessibility of dynamic components like the drag-and-drop interface.
-   **Focus Management:** We ensure logical focus order and visible focus indicators throughout the application.

All new features and components must be developed with these accessibility principles in mind.

---

## 8. Contributing

We welcome contributions to improve the platform! To ensure a smooth and effective collaboration process, please adhere to the following guidelines.

### 8.1. Branching Strategy

We follow a simplified GitFlow model:
-   `main`: This branch represents the latest production-ready code. Direct pushes are not allowed.
-   `develop`: This is the primary development branch. All feature branches are created from `develop` and merged back into it.
-   `feature/your-feature-name`: All new work should be done on a feature branch. Branch names should be descriptive (e.g., `feature/add-export-to-pdf`).

### 8.2. Pull Request Process

1.  Create your feature branch from the `develop` branch.
2.  Make your changes and commit them with clear, descriptive messages.
3.  Push your feature branch to the remote repository.
4.  Open a Pull Request (PR) from your feature branch to the `develop` branch.
5.  In your PR description, clearly explain the purpose of your changes and reference any relevant issues.
6.  Ensure all automated checks (linting, tests) pass.
7.  At least one other developer must review and approve your PR before it can be merged.

---

## 9. Project Roadmap & Future Enhancements

### 9.1. Short-Term Goals

-   **Performance Optimization:** For extremely large structures (>1000 items), implement windowing/virtualization for the tree view to ensure the UI remains smooth.
-   **Enhanced Keyboard Navigation:** Improve accessibility by adding more comprehensive keyboard controls for manipulating the tree.
-   **Export Functionality:** Add options to export the final structure to formats like CSV or PDF.

### 9.2. Long-Term Vision

-   **Backend Integration:** Replace `localStorage` with a proper backend database (e.g., PostgreSQL) and a REST or GraphQL API. This would enable multi-user access and persistence beyond a single browser.
-   **Real-time Collaboration:** Implement WebSockets to allow multiple users to view and edit the same labor structure in real-time, seeing each other's changes as they happen.
-   **Role-Based Access Control (RBAC):** Introduce user roles (e.g., Admin, Editor, Viewer) to control who can make changes to the structure.
-   **Analytics & Reporting:** Build a dashboard to provide insights into the organizational structure, such as department size, management ratios, and cost analysis.
-   **HRIS Integration:** Develop integrations to sync the labor structure with popular Human Resource Information Systems (HRIS) like Workday or BambooHR.
