"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPosthog } from "@/lib/posthog";

type Board = {
  _id: string;
  title: string;
};

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // загрузка досок
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/boards");
        const data = await res.json();
        if (data.ok) setBoards(data.boards);
      } catch (err) {
        console.error("Failed to load boards", err);
      }
    })();
  }, []);

  // создание доски
  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Ответ не JSON:", text);
        alert("Сервер вернул не JSON. Посмотри ошибку в терминале.");
        return;
      }

      if (!res.ok || !data.ok) {
        alert(data?.message || "Failed to create board");
        return;
      }

      setBoards((prev) => [data.board, ...prev]);
      setTitle("");

      // 🔹 метрика: доска создана
      const ph = getPosthog();
      ph?.capture("board_created", {
        boardId: data.board._id,
        boardTitle: data.board.title,
      });
    } catch (err) {
      console.error(err);
      alert("Network error when creating board");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBoard(id: string) {
    if (!confirm("Delete this board?")) return;
    try {
      const res = await fetch(`/api/boards/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setBoards((prev) => prev.filter((b) => b._id !== id));

        // 🔹 метрика: доска удалена
        const ph = getPosthog();
        ph?.capture("board_deleted", { boardId: id });
      } else {
        alert(data.message || "Failed to delete board");
      }
    } catch (err) {
      console.error(err);
      alert("Network error when deleting board");
    }
  }

  async function renameBoard(id: string, oldTitle: string) {
    const newTitle = prompt("New board title:", oldTitle);
    if (!newTitle?.trim()) return;

    try {
      const res = await fetch(`/api/boards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      const data = await res.json();
      if (data.ok) {
        setBoards((prev) =>
          prev.map((b) =>
            b._id === id ? { ...b, title: data.board.title } : b
          )
        );

        // 🔹 метрика: доска переименована
        const ph = getPosthog();
        ph?.capture("board_renamed", {
          boardId: id,
          newTitle: data.board.title,
        });
      } else {
        alert(data.message || "Failed to rename board");
      }
    } catch (err) {
      console.error(err);
      alert("Network error when renaming board");
    }
  }

  return (
    <main className="min-h-screen flex flex-col bg-sky-800 text-white">
      <header className="flex items-center justify-between px-6 py-3 bg-sky-900/80 shadow">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Boards</h1>
          <span className="px-2 py-1 text-xs rounded bg-sky-700/70">
            Trello clone
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button className="px-3 py-1 rounded bg-sky-700/80 hover:bg-sky-600">
            Home
          </button>
        </div>
      </header>

      
      <div className="flex-1 px-6 py-4">
       
        <form
          onSubmit={createBoard}
          className="mb-4 flex flex-wrap items-center gap-3"
        >
          <input
            className="px-3 py-2 rounded bg-slate-900/80 border border-slate-700 w-64 text-sm placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
            placeholder="New board title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-sm"
          >
            {loading ? "Creating..." : "Create board"}
          </button>
        </form>

        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200/80 mb-3">
          Your boards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boards.map((b) => (
            <div
              key={b._id}
              className="bg-slate-900/90 rounded-lg p-4 flex flex-col justify-between shadow-sm hover:bg-slate-900 transition"
            >
              <Link
                href={`/boards/${b._id}`}
                className="text-base font-semibold mb-3 break-words hover:underline"
              >
                {b.title}
              </Link>

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => renameBoard(b._id, b.title)}
                  className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteBoard(b._id)}
                  className="px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
