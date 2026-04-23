import { useState } from "react";
import { useBoard } from "../hooks/useBoard";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";
import Board from "../components/board/Board";
import CardModal from "../components/card-modal/CardModal";
import type { FeatureCardSummary } from "../api/board";

/** Full Kanban board page with drag-and-drop and Feature Card management. */
export default function BoardPage() {
  const { board, loading, error, createCard, updateCard, deleteCard, moveCard, refresh, dispatch } =
    useBoard();
  const { user } = useAuth();
  useWebSocket(user?.token ?? null, user?.tenantId ?? null, dispatch, refresh);
  const [selectedCard, setSelectedCard] = useState<FeatureCardSummary | null>(
    null
  );
  const [newCardTitle, setNewCardTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreateCard() {
    const title = newCardTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      await createCard(title);
      setNewCardTitle("");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveCard(
    id: string,
    title: string,
    description: string
  ) {
    await updateCard(id, { title, description });
    setSelectedCard((prev) =>
      prev?.id === id ? { ...prev, title, description } : prev
    );
  }

  async function handleDeleteCard(id: string, columnId: string) {
    await deleteCard(id, columnId);
    setSelectedCard(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading board…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <span className="text-red-500 text-sm">{error}</span>
      </div>
    );
  }

  if (!board) return null;

  const newCardInputNode = (
    <>
      <input
        type="text"
        value={newCardTitle}
        onChange={(e) => setNewCardTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreateCard()}
        placeholder="New feature…"
        className="w-full text-sm rounded-lg border border-gray-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-1"
      />
      <button
        type="button"
        onClick={handleCreateCard}
        disabled={creating || !newCardTitle.trim()}
        className="w-full text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white py-1.5 transition-colors"
      >
        {creating ? "Adding…" : "+ Add Feature"}
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{board.name}</h1>
      </header>

      <div className="p-6 overflow-x-auto">
        <Board
          board={board}
          onCardClick={setSelectedCard}
          onMoveCard={moveCard}
          newCardInput={newCardInputNode}
        />
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onSave={handleSaveCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  );
}
