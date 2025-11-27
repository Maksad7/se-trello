# Trello Clone – SE Assignment 01

Author: Maksad Ermetov  

- GitHub: https://github.com/Maksad7/se-trello  
- Live demo (Vercel): https://se-trello.vercel.app

## Overview

Simple Trello-like app with boards, lists and cards, built for the SE Assignment 01.  
Users can create boards, add lists to a board, add cards inside lists and edit card details.

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- MongoDB Atlas
- Tailwind CSS
- PostHog (analytics)
- Deployed on Vercel

## Functionality

### Boards (`/`)

- List all boards.
- Create a new board (form: “New board title” + “Create board”).
- Rename / delete a board.
- Click on a board → navigate to `/boards/:id`.

### Lists (columns) – `/boards/:id`

- Load a single board with its lists and cards.
- Add list from header form (“New list title” + “Add list”).
- Rename list (✏️) and delete list (🗑) together with its cards.

### Cards

- “+ Add a card” inside a list creates a new card.
- Cards are shown as items in the list.
- Click on a card → modal with:
  - editable title;
  - editable description;
  - “Save changes” and “Delete card” buttons.

## Data model (MongoDB)

```ts
// boards
{
  _id: ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// lists
{
  _id: ObjectId;
  boardId: ObjectId;  // boards._id
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// cards
{
  _id: ObjectId;
  boardId: ObjectId;  // denormalized
  listId: ObjectId;   // lists._id
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}


## API

- `/api/boards`
  - `GET` – list boards
  - `POST` – create board
- `/api/boards/[id]`
  - `GET` – get one board
  - `PATCH` – rename board
  - `DELETE` – delete board
- `/api/lists`
  - `GET` – lists for a board
  - `POST` – create list
- `/api/lists/[id]`
  - `PATCH` – rename list
  - `DELETE` – delete list + its cards
- `/api/cards`
  - `GET` – cards for a board
  - `POST` – create card
- `/api/cards/[id]`
  - `PATCH` – update title/description
  - `DELETE` – delete card

# Metrics – PostHog analytics

This project uses **PostHog** for basic product analytics.

PostHog is initialized on the client side in `lib/posthog.ts` using the `posthog-js` SDK.
Events are sent from React client components on the **home page** (`/`) and the **board page** (`/boards/:id`).

---

## Implemented events

### Home page (`/`)

**1. `board_created`**

- **When:** after a board is successfully created via `POST /api/boards`.
- **Where in code:** in the `createBoard` handler on the home page.
- **Properties:**
  - `boardId` – ID of the created board;
  - `boardTitle` – title of the created board.
- **Purpose:** to see how many boards users create and which titles are common.

---

**2. `board_deleted`**

- **When:** after a board is successfully deleted via `DELETE /api/boards/[id]`.
- **Where in code:** in the `deleteBoard` handler on the home page.
- **Properties:**
  - `boardId` – ID of the deleted board.
- **Purpose:** to understand how often users remove boards and how stable their boards are.

---

**3. `board_renamed`**

- **When:** after a board is successfully renamed via `PATCH /api/boards/[id]`.
- **Where in code:** in the `renameBoard` handler on the home page.
- **Properties:**
  - `boardId` – ID of the board;
  - `newTitle` – new board title.
- **Purpose:** to see how often users change the names of boards and how much they refine them.

---

### Board page (`/boards/:id`)

**4. `board_opened`**

- **When:** after the board data is successfully loaded from `GET /api/boards/[id]`.
- **Where in code:** inside `useEffect` on the board page, after setting `board` state.
- **Properties:**
  - `boardId` – ID of the opened board.
- **Purpose:** to measure which boards users actually open and work with (not only create).

---

**5. `list_created`**

- **When:** after a list is successfully created via `POST /api/lists`.
- **Where in code:** in the `handleCreateList` function on the board page.
- **Properties:**
  - `boardId` – board where the list was created;
  - `listId` – ID of the list;
  - `title` – list title.
- **Purpose:** to see how many lists per board users usually create and how they structure their boards.

---

**6. `card_created`**

- **When:** after a card is successfully created via `POST /api/cards`.
- **Where in code:** in the `addCard` function on the board page.
- **Properties:**
  - `boardId` – board ID;
  - `listId` – list where the card was added;
  - `cardId` – card ID.
- **Purpose:** to track whether boards actually contain cards and to measure engagement on the card level.

---

**7. `card_opened`**

- **When:** when a user clicks a card and the card modal is opened.
- **Where in code:** in the `openCard` function on the board page.
- **Properties:**
  - `boardId` – board ID;
  - `listId` – list ID;
  - `cardId` – opened card ID.
- **Purpose:** to see how often users interact with card details (view/edit), not just create cards.

---

## Why these metrics are useful

- They form a simple **usage funnel**:

  `board_created → board_opened → list_created → card_created → card_opened`.

  This helps understand where users stop: do they only create boards, or do they go further and work with lists and cards.

- They allow measuring **engagement**:
  - average number of lists per board;
  - average number of cards per board / per list;
  - ratio of created cards to opened cards.

- In a real product these metrics could be used to:
  - detect boards that are never opened (low quality / accidental creations);
  - see if users get stuck before creating their first card;
  - prioritize UX improvements (e.g., make card creation easier if many boards stay without cards);
  - run A/B tests on the board and card UI.

---

## Configuration



running locally:
git clone https://github.com/Maksad7/se-trello.git
cd se-trello
npm install
npm run dev


create:
```env.local```
MONGODB_URI=mongodb+srv://username:password@cluster0.yaicnqa.mongodb.net/?appName=Cluster0
NEXT_PUBLIC_POSTHOG_KEY=<PostHog project API key>
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com 


```bash
git add README.md
git commit -m "Fix README formatting"
git push

