import { useEffect, useState } from "react";
import useSWR from "swr";
import { boardApi, type WorkItemDetail } from "../../services/boardApi";
import MarkdownField from "../shared/MarkdownField";
import MaterialIcon from "../shared/MaterialIcon";

const cardDescIconBtn =
  "h-8 w-8 inline-flex items-center justify-center rounded-chip shrink-0 transition-colors " +
  "text-[#6E6E73] dark:text-[#8E8E93] border border-transparent " +
  "hover:text-accent hover:bg-accent/[0.08]";

const headerFsBtn =
  `${cardDescIconBtn} border border-black/[0.08] dark:border-white/[0.08]`;

const CARD_DESC_EDITOR_BOX =
  "min-h-[min(20rem,42dvh)] h-[min(20rem,42dvh)]";

interface CardModalProps {
  projectId: string;
  workItemId: string;
  onClose: () => void;
  onSaved: () => void;
}

interface CardModalBodyProps {
  detail: WorkItemDetail;
  workItemId: string;
  onClose: () => void;
  onSaved: () => void;
  layoutFullscreen: boolean;
  onExitFullscreen: () => void;
}

function CardModalBody({
  detail,
  workItemId,
  onClose,
  onSaved,
  layoutFullscreen,
  onExitFullscreen,
}: CardModalBodyProps) {
  const [title, setTitle] = useState(detail.title ?? "");
  const [description, setDescription] = useState(detail.description ?? "");
  const [descriptionEditing, setDescriptionEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await boardApi.patchWorkItem(workItemId, {
        title: title.trim(),
        description: description.trim() || "",
      });
      setDescriptionEditing(false);
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const descSource = description;
  const hasDescription = Boolean(descSource.trim());

  const titleBlock = (
    <div className="shrink-0">
      <label
        htmlFor="card-modal-title"
        className="block text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] mb-1.5"
      >
        Título <span className="text-red-500 ml-0.5">*</span>
      </label>
      <input
        id="card-modal-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="w-full h-10 px-3 rounded-chip text-sm text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.08] placeholder-[#6E6E73] dark:placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </div>
  );

  const descriptionBlock = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <label
          id="card-modal-desc-label"
          className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]"
        >
          Descrição
        </label>
        {!descriptionEditing ? (
          <button
            type="button"
            aria-label="Editar descrição"
            data-testid="card-desc-mode-edit"
            className={cardDescIconBtn}
            onClick={() => setDescriptionEditing(true)}
          >
            <MaterialIcon name="edit" />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Visualizar descrição"
            data-testid="card-desc-mode-preview"
            className={cardDescIconBtn}
            onClick={() => setDescriptionEditing(false)}
          >
            <MaterialIcon name="visibility" />
          </button>
        )}
      </div>

      {!descriptionEditing ? (
        <div data-testid="card-modal-description-read">
          {hasDescription ? (
            layoutFullscreen ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <MarkdownField variant="preview-only" value={descSource} previewFillParent />
              </div>
            ) : (
              <MarkdownField variant="preview-only" value={descSource} />
            )
          ) : (
            <p className="text-sm font-medium text-[#6E6E73] dark:text-[#8E8E93]">Sem descrição</p>
          )}
        </div>
      ) : layoutFullscreen ? (
        <div className="flex w-full min-w-0 shrink-0 flex-col">
          <MarkdownField
            variant="split"
            showPreview={false}
            stretchToParent
            embedFullscreenToggle={false}
            showFullscreenToggle={false}
            labelledBy="card-modal-desc-label"
            value={descSource}
            onChange={setDescription}
            placeholder="Escreva em Markdown..."
          />
        </div>
      ) : (
        <MarkdownField
          variant="split"
          showPreview={false}
          labelledBy="card-modal-desc-label"
          value={descSource}
          onChange={setDescription}
          placeholder="Escreva em Markdown..."
          editorBoxClassName={CARD_DESC_EDITOR_BOX}
        />
      )}
    </div>
  );

  const scrollBody = layoutFullscreen ? (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-6 py-6 lg:px-8">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {titleBlock}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">{descriptionBlock}</div>
        {error ? (
          <p className="shrink-0 text-sm text-red-500 font-medium" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  ) : (
    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-7 py-4">
      <div className="flex flex-col gap-4">
        {titleBlock}
        {descriptionBlock}
        {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : null}
      </div>
    </div>
  );

  const footer = (
    <div
      className={[
        "flex shrink-0 justify-end gap-2 border-t border-black/[0.08] py-4 dark:border-white/[0.08]",
        layoutFullscreen ? "px-6 lg:px-8 bg-white dark:bg-[#1C1C1E]" : "px-7",
      ].join(" ")}
    >
      {layoutFullscreen ? (
        <button
          type="button"
          onClick={onExitFullscreen}
          className="h-9 px-5 rounded-full text-sm font-medium border border-accent/40 text-accent hover:bg-accent/[0.06] transition-all duration-[120ms]"
        >
          Voltar
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-full border border-accent/40 px-5 text-sm font-medium text-accent transition-all duration-[120ms] hover:bg-accent/[0.06]"
        >
          Cancelar
        </button>
      )}
      <button
        type="submit"
        disabled={saving}
        className="h-9 rounded-full bg-accent px-5 text-sm font-medium text-white transition-all duration-[120ms] hover:brightness-110 disabled:opacity-60"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {scrollBody}
      {footer}
    </form>
  );
}

export default function CardModal({
  projectId,
  workItemId,
  onClose,
  onSaved,
}: CardModalProps) {
  const [modalFullscreen, setModalFullscreen] = useState(false);
  const { data, isLoading } = useSWR(
    projectId && workItemId ? `work-item-${projectId}-${workItemId}` : null,
    () => boardApi.getWorkItem(workItemId),
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!modalFullscreen) return undefined;
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setModalFullscreen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalFullscreen]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target !== e.currentTarget) return;
    if (modalFullscreen) return;
    onClose();
  }

  function headerClose() {
    return (
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className={`${cardDescIconBtn} shrink-0`}
      >
        <MaterialIcon name="close" />
      </button>
    );
  }

  const headerIcons = modalFullscreen ? (
    <button
      type="button"
      key="fs-exit"
      aria-label="Close full screen"
      data-testid="markdown-fullscreen-exit"
      onClick={() => setModalFullscreen(false)}
      className={headerFsBtn}
    >
      <MaterialIcon name="close_fullscreen" />
    </button>
  ) : (
    <button
      type="button"
      key="fs-enter"
      aria-label="Open in full"
      data-testid="markdown-fullscreen-enter"
      onClick={() => setModalFullscreen(true)}
      className={headerFsBtn}
    >
      <MaterialIcon name="open_in_full" />
    </button>
  );

  const backdropClass = modalFullscreen
    ? "fixed inset-0 z-50 flex flex-col min-h-0 bg-[#F5F5F7] dark:bg-[#0A0A0F]"
    : "fixed inset-0 z-50 box-border flex flex-col bg-black/40 p-6 backdrop-blur-sm";

  const dialogClass = modalFullscreen
    ? "flex flex-col h-[100dvh] max-h-[100dvh] w-full shrink-0 overflow-hidden rounded-none shadow-none bg-white dark:bg-[#1C1C1E]"
    : "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-modal bg-white shadow-modal dark:bg-[#1C1C1E]";

  const headerClass = modalFullscreen
    ? "relative z-10 shrink-0 flex items-start justify-between gap-4 border-b border-black/[0.08] px-6 pt-6 pb-5 lg:px-8 dark:border-white/[0.08]"
    : "flex shrink-0 items-start justify-between gap-4 border-b border-black/[0.08] px-7 pb-4 pt-7 dark:border-white/[0.08]";

  const titleClass =
    "flex-1 min-w-0 pr-2 text-[20px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7]";

  return (
    <div role="presentation" className={backdropClass} onClick={handleBackdropClick}>
      <div
        className={dialogClass}
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-labelledby="card-modal-heading"
      >
        <div className={headerClass}>
          <h2 id="card-modal-heading" className={titleClass}>
            Detalhe do item
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {headerIcons}
            {headerClose()}
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-0 flex-1 overflow-hidden px-7 py-4">
            <div className="skeleton-shimmer h-48 rounded-chip w-full" />
          </div>
        ) : data ? (
          <CardModalBody
            key={`${data.id}-${data.updatedAt}`}
            detail={data}
            workItemId={workItemId}
            onClose={onClose}
            onSaved={onSaved}
            layoutFullscreen={modalFullscreen}
            onExitFullscreen={() => setModalFullscreen(false)}
          />
        ) : (
          <div className="px-7 py-4">
            <p className="text-sm text-[#6E6E73] dark:text-[#8E8E93] font-medium">Item não encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
