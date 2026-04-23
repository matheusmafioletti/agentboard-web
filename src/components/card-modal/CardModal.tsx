import { useState, useEffect, useCallback, useRef } from "react";
import { getFeature, updateFeature, type FeatureCardDetail } from "../../api/board";
import type { FeatureCardSummary } from "../../api/board";
import ExecutionHistory from "./ExecutionHistory";
import ArtifactList from "./ArtifactList";

type Tab = "tasks" | "artifacts" | "history";

interface CardModalProps {
  card: FeatureCardSummary;
  onClose: () => void;
  onSave: (id: string, title: string, description: string) => Promise<void>;
  onDelete: (id: string, columnId: string) => Promise<void>;
}

/** Full-detail modal for a Feature Card with inline editing and tabbed sections. */
export default function CardModal({
  card,
  onClose,
  onSave,
  onDelete,
}: CardModalProps) {
  const [detail, setDetail] = useState<FeatureCardDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reExecutePending, setReExecutePending] = useState(card.reExecutionPending);
  const [requestingReExecute, setRequestingReExecute] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getFeature(card.id).then(setDetail).catch(() => null);
  }, [card.id]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(card.id, title, description);
      setEditingTitle(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleReExecute() {
    setRequestingReExecute(true);
    try {
      await updateFeature(card.id, { reExecutionPending: true });
      setReExecutePending(true);
    } finally {
      setRequestingReExecute(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(card.id, card.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "tasks", label: "Tasks" },
    { id: "artifacts", label: "Artifacts" },
    { id: "history", label: "History" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                className="w-full text-xl font-semibold text-gray-900 border-b-2 border-indigo-400 outline-none bg-transparent"
              />
            ) : (
              <h2
                className="text-xl font-semibold text-gray-900 cursor-text hover:text-indigo-700 truncate"
                onClick={() => setEditingTitle(true)}
                title="Click to edit title"
              >
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 pt-4 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description…"
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div className="flex gap-1 border-b border-gray-100 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[100px] pb-4">
            {activeTab === "tasks" && (
              <p className="text-sm text-gray-400 italic">
                {detail?.tasks?.length
                  ? `${detail.tasks.length} task(s) created by the SpecKit agent.`
                  : "No tasks yet. The agent will create tasks via MCP tools."}
              </p>
            )}
            {activeTab === "artifacts" && (
              <ArtifactList artifacts={detail?.artifacts ?? []} />
            )}
            {activeTab === "history" && (
              <ExecutionHistory executions={detail?.commandExecutions ?? []} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {!reExecutePending ? (
              <button
                type="button"
                onClick={handleReExecute}
                disabled={requestingReExecute}
                className="text-sm font-medium text-amber-600 hover:text-amber-800 disabled:opacity-50"
                title="Signal agent to re-execute the current SpecKit stage"
              >
                {requestingReExecute ? "Signaling…" : "↻ Re-execute"}
              </button>
            ) : (
              <span className="text-xs text-amber-600 font-semibold">
                ↻ Re-execution pending
              </span>
            )}
          </div>
          <div>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Delete card
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-sm text-red-600 font-semibold disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
