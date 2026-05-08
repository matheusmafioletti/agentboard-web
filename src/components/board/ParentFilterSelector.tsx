import { useEffect, useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";

import MaterialIcon from "../shared/MaterialIcon";
import { boardApi, type WorkItem } from "../../services/boardApi";
import WorkItemTypeBadge from "../shared/WorkItemTypeBadge";

interface ParentFilterSelectorProps {
  projectId: string;
  childType: "USER_STORY" | "TASK";
  selectedParentId: string | undefined;
  /** Setting a parent id filters the board or picks the create-form parent. */
  onSelect: (parentId: string) => void;
  /** When set (typically with `variant="form"`), shows control to unlink the selected parent. */
  onClear?: () => void;
  variant?: "board" | "form";
  /** When `variant="board"`, replaces the inline text dropdown trigger (modal unchanged). */
  renderBoardTrigger?: (openModal: () => void, modalOpen: boolean) => ReactNode;
}

function squashWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Caption for form variant: display key, title, optional description. */
function formatFormParentCaption(p: WorkItem): string {
  const desc = p.description ? squashWhitespace(p.description) : "";
  const head = `${p.displayKey} · ${p.title}`;
  return desc.length ? `${head} — ${desc}` : head;
}

const PARENT_TYPE: Record<"USER_STORY" | "TASK", "FEATURE" | "USER_STORY"> = {
  USER_STORY: "FEATURE",
  TASK: "USER_STORY",
};

const PARENT_LABEL: Record<"USER_STORY" | "TASK", string> = {
  USER_STORY: "Feature",
  TASK: "User Story",
};

const MODAL_TITLE: Record<"board" | "form", Record<"USER_STORY" | "TASK", string>> = {
  board: {
    USER_STORY: "Filtrar por Feature",
    TASK: "Filtrar por User Story",
  },
  form: {
    USER_STORY: "Escolher Feature pai",
    TASK: "Escolher User Story pai",
  },
};

export default function ParentFilterSelector({
  projectId,
  childType,
  selectedParentId,
  onSelect,
  onClear,
  variant = "board",
  renderBoardTrigger,
}: ParentFilterSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const parentType = PARENT_TYPE[childType];

  const { data: parents = [] } = useSWR<WorkItem[]>(
    projectId ? `parent-filter-${projectId}-${parentType}` : null,
    () => boardApi.listWorkItems({ projectId, type: parentType }),
    { revalidateOnFocus: false }
  );

  const selectedParent = parents.find((p) => p.id === selectedParentId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => p.title.toLowerCase().includes(q));
  }, [parents, query]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setModalOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const v = variant ?? "board";
  const label = PARENT_LABEL[childType];
  const ariaPick =
    variant === "board"
      ? `Selecionar ${label} para filtrar o quadro`
      : `Escolher ${label} pai`;

  function openModal() {
    setQuery("");
    setModalOpen(true);
  }

  const formLinkBase =
    "text-sm font-medium text-accent hover:underline bg-transparent border-0 p-0 cursor-pointer text-left " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-sm";

  return (
    <>
      {variant === "form" ? (
        !selectedParent ? (
          <button
            type="button"
            onClick={openModal}
            className={formLinkBase}
            aria-label={ariaPick}
            aria-haspopup="dialog"
            aria-expanded={modalOpen}
          >
            Vincular {label}
          </button>
        ) : (
          <div className="flex items-start gap-2 min-w-0">
            <button
              type="button"
              onClick={openModal}
              className={`${formLinkBase} flex-1 min-w-0 whitespace-normal break-words`}
              aria-label={`${ariaPick}. Texto atual: ${formatFormParentCaption(selectedParent)}`}
              aria-haspopup="dialog"
              aria-expanded={modalOpen}
            >
              {formatFormParentCaption(selectedParent)}
            </button>
            {onClear ? (
              <button
                type="button"
                aria-label="Remover vínculo"
                onClick={(ev) => {
                  ev.preventDefault();
                  onClear();
                }}
                className="shrink-0 mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-chip text-[#6E6E73] dark:text-[#8E8E93] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors"
              >
                <MaterialIcon name="close" />
              </button>
            ) : null}
          </div>
        )
      ) : renderBoardTrigger ? (
        renderBoardTrigger(openModal, modalOpen)
      ) : (
        <button
          type="button"
          onClick={openModal}
          className="inline-flex items-center gap-1 max-w-full min-w-0 px-2 py-1.5 -mx-2 rounded-chip text-left text-accent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
          aria-label={ariaPick}
          aria-haspopup="dialog"
          aria-expanded={modalOpen}
        >
            <span className="text-sm font-medium truncate inline-flex items-center gap-2 min-w-0">
              {selectedParent ? (
                <>
                  <WorkItemTypeBadge type={selectedParent.type} size="compact" />
                  <span className="truncate">
                    {selectedParent.displayKey} · {selectedParent.title}
                  </span>
                </>
              ) : (
                `Selecionar ${label}…`
              )}
            </span>
          <MaterialIcon name="arrow_drop_down" className="text-[#6E6E73] dark:text-[#8E8E93] shrink-0" />
        </button>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalOpen(false);
              setQuery("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-picker-title"
            className="bg-white dark:bg-[#1C1C1E] rounded-modal shadow-modal w-full max-w-md max-h-[min(480px,70vh)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 shrink-0 border-b border-black/[0.08] dark:border-white/[0.08]">
              <h2
                id="parent-picker-title"
                className="text-[16px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7]"
              >
                {MODAL_TITLE[v][childType]}
              </h2>
              <div className="mt-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6E6E73] dark:text-[#8E8E93] pointer-events-none">
                  <MaterialIcon name="search" iconSizePx={18} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pesquisar por título…"
                  className="w-full h-10 pl-10 pr-3 rounded-chip text-sm text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.08] placeholder-[#6E6E73] dark:placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-accent/40"
                  autoFocus
                />
              </div>
            </div>

            <ul className="flex-1 min-h-[200px] overflow-y-auto py-2">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(p.id);
                      setModalOpen(false);
                      setQuery("");
                    }}
                    className={[
                      "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 min-w-0",
                      selectedParentId === p.id
                        ? "bg-accent/10 text-accent"
                        : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-[#2C2C2E]",
                    ].join(" ")}
                  >
                    <WorkItemTypeBadge type={p.type} size="compact" />
                    <span className="truncate">
                      {p.displayKey} · {p.title}
                    </span>
                  </button>
                </li>
              ))}
              {parents.length === 0 ? (
                <li className="px-4 py-8 text-sm text-center text-[#6E6E73] dark:text-[#8E8E93]">
                  Nenhum {label} neste projeto.
                </li>
              ) : filtered.length === 0 ? (
                <li className="px-4 py-8 text-sm text-center text-[#6E6E73] dark:text-[#8E8E93]">
                  Nenhum resultado para &ldquo;{query.trim()}&rdquo;.
                </li>
              ) : null}
            </ul>

            <div className="shrink-0 px-5 py-3 border-t border-black/[0.08] dark:border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setQuery("");
                }}
                className="h-9 px-5 rounded-full text-sm font-medium border border-accent/40 text-accent hover:bg-accent/[0.06] transition-all duration-[120ms]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
