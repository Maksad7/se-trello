"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPosthog } from "@/lib/posthog";

type Board = {
  _id: string;
  title: string;
};

type List = {
  _id: string;
  boardId: string;
  title: string;
};

type Card = {
  _id: string;
  boardId: string;
  listId: string;
  title: string;
  description?: string;
};

export default function BoardPage() {
  const params = useParams<{ id: string }>();
  const boardId = params.id;
  const router = useRouter();

  const [board, setBoard] = useState<Board | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardTitle, setCardTitle] = useState("");
  const [cardDesc, setCardDesc] = useState("");

  // поле для нового списка
  const [newListTitle, setNewListTitle] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    (async () => {
      try {
        const [boardRes, listsRes, cardsRes] = await Promise.all([
          fetch(`/api/boards/${boardId}`),
          fetch(`/api/lists?boardId=${boardId}`),
          fetch(`/api/cards?boardId=${boardId}`),
        ]);

        const boardData = await boardRes.json();
        const listsData = await listsRes.json();
        const cardsData = await cardsRes.json();

        if (boardData.ok) {
          setBoard(boardData.board);

          // metrika open
          const ph = getPosthog();
          ph?.capture("board_opened", { boardId: boardData.board._id });
        }

        if (listsData.ok) setLists(listsData.lists);
        if (cardsData.ok) setCards(cardsData.cards);
      } finally {
        setLoading(false);
      }
    })();
  }, [boardId]);

  // sozdania form
  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const title = newListTitle.trim();
    if (!title) return;

    setCreatingList(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, title }),
      });
      const data = await res.json();
      if (data.ok) {
        setLists((prev) => [...prev, data.list]);
        setNewListTitle("");

        // metrika spisok sozdan
        const ph = getPosthog();
        ph?.capture("list_created", {
          boardId,
          listId: data.list._id,
          title: data.list.title,
        });
      } else {
        alert(data.message || "Failed to create list");
      }
    } catch (err) {
      console.error(err);
      alert("Network error when creating list");
    } finally {
      setCreatingList(false);
    }
  }

  async function renameList(id: string, oldTitle: string) {
    const title = prompt("New list title:", oldTitle);
    if (!title?.trim()) return;

    const res = await fetch(`/api/lists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (data.ok) {
      setLists((prev) =>
        prev.map((l) => (l._id === id ? { ...l, title } : l))
      );
    } else {
      alert(data.message || "Failed to rename list");
    }
  }

  async function deleteList(id: string) {
    if (!confirm("Delete this list and its cards?")) return;
    const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setLists((prev) => prev.filter((l) => l._id !== id));
      setCards((prev) => prev.filter((c) => c.listId !== id));
    } else {
      alert(data.message || "Failed to delete list");
    }
  }

  async function addCard(listId: string) {
    const title = prompt("Card title:");
    if (!title?.trim()) return;

    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boardId, listId, title }),
    });
    const data = await res.json();
    if (data.ok) {
      setCards((prev) => [...prev, data.card]);

      // metrika kartocka
      const ph = getPosthog();
      ph?.capture("card_created", {
        boardId,
        listId,
        cardId: data.card._id,
      });
    } else {
      alert(data.message || "Failed to create card");
    }
  }

  function openCard(card: Card) {
    setSelectedCard(card);
    setCardTitle(card.title);
    setCardDesc(card.description || "");

    // metrika kart otkr
    const ph = getPosthog();
    ph?.capture("card_opened", {
      cardId: card._id,
      listId: card.listId,
      boardId: card.boardId,
    });
  }

  async function saveCard() {
    if (!selectedCard) return;

    const res = await fetch(`/api/cards/${selectedCard._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: cardTitle,
        description: cardDesc,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      setCards((prev) =>
        prev.map((c) =>
          c._id === selectedCard._id
            ? { ...c, title: cardTitle, description: cardDesc }
            : c
        )
      );
      setSelectedCard(null);
    } else {
      alert(data.message || "Failed to update card");
    }
  }

  async function deleteCard() {
    if (!selectedCard) return;
    if (!confirm("Delete this card?")) return;

    const res = await fetch(`/api/cards/${selectedCard._id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.ok) {
      setCards((prev) => prev.filter((c) => c._id !== selectedCard._id));
      setSelectedCard(null);
    } else {
      alert(data.message || "Failed to delete card");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <p>Loading...</p>
      </main>
    );
  }

  if (!board) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <p>Board not found</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-emerald-500 rounded"
        >
          Back to boards
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-sky-800 text-white">
     
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-sky-900/80 shadow">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{board.title}</h1>

          <form
            onSubmit={handleCreateList}
            className="flex items-center gap-2"
          >
            <input
              className="px-3 py-1.5 rounded bg-slate-900/80 border border-slate-700 w-40 text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              placeholder="New list title"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
            />
            <button
              type="submit"
              disabled={creatingList}
              className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-xs"
            >
              {creatingList ? "Adding..." : "Add list"}
            </button>
          </form>
        </div>

        <button
          className="px-3 py-1 rounded bg-sky-700/80 hover:bg-sky-600 text-xs"
          onClick={() => router.push("/")}
        >
          Home
        </button>
      </header>

      
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex items-start gap-4 px-4 py-4 min-h-full">
          {lists.map((list) => (
            <div
              key={list._id}
              className="w-72 bg-slate-900/90 rounded-lg shadow-sm flex-shrink-0"
            >
              
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/70">
                <span className="font-semibold text-sm">{list.title}</span>
                <div className="flex gap-1">
                  <button
                    className="text-[11px] px-1.5 py-0.5 rounded bg-slate-700 hover:bg-slate-600"
                    onClick={() => renameList(list._id, list.title)}
                  >
                    ✏️
                  </button>
                  <button
                    className="text-[11px] px-1.5 py-0.5 rounded bg-slate-700 hover:bg-red-600"
                    onClick={() => deleteList(list._id)}
                  >
                    🗑
                  </button>
                </div>
              </div>

              
              <div className="px-2 py-2 flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
                {cards
                  .filter((c) => c.listId === list._id)
                  .map((card) => (
                    <button
                      key={card._id}
                      onClick={() => openCard(card)}
                      className="w-full text-left px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm shadow-sm"
                    >
                      {card.title}
                    </button>
                  ))}
              </div>

              {/* knopka add card */}
              <button
                onClick={() => addCard(list._id)}
                className="w-full text-left px-3 py-2 text-sm text-slate-200/80 hover:bg-slate-800/80 rounded-b-lg border-t border-slate-700/60"
              >
                + Add a card
              </button>
            </div>
          ))}
        </div>
      </div>

      
      {selectedCard && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-xl shadow-2xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Card details</h2>

            <label className="block mb-3 text-sm">
              <span className="text-slate-300">Title</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 focus:outline-none focus:border-emerald-500"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
              />
            </label>

            <label className="block mb-4 text-sm">
              <span className="text-slate-300">Description</span>
              <textarea
                className="mt-1 w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 min-h-[120px] resize-none focus:outline-none focus:border-emerald-500"
                value={cardDesc}
                onChange={(e) => setCardDesc(e.target.value)}
              />
            </label>

            <div className="flex justify-between mt-4">
              <button
                onClick={deleteCard}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-sm"
              >
                Delete card
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCard(null)}
                  className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCard}
                  className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-sm"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
