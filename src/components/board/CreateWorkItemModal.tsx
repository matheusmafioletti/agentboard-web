import { useEffect, useId, useRef, useState } from "react";
import useSWR from "swr";

import { boardApi, type CreateWorkItemPayload, type TenantUser } from "../../services/boardApi";
import MarkdownField from "../shared/MarkdownField";
import MaterialIcon from "../shared/MaterialIcon";
import ParentFilterSelector from "./ParentFilterSelector";
import WorkItemTypeBadge from "../shared/WorkItemTypeBadge";
import AssigneeAvatar, { emailToDisplayName } from "../shared/AssigneeAvatar";

export type WorkItemType = "FEATURE" | "USER_STORY" | "TASK";

interface CreateWorkItemModalProps {
  projectId: string;
  type: WorkItemType;
  onClose: () => void;
  onCreated: () => void;
}

const TITLE_BY_TYPE: Record<WorkItemType, string> = {
  FEATURE: "Nova Feature",
  USER_STORY: "Nova User Story",
  TASK: "Nova Task",
};

type FieldErrors = {
  title?: string;
  parent?: string;
  description?: string;
};

const fieldErrorClass = "text-sm text-red-500 font-medium mt-1.5";

function computeFieldErrors(
  type: WorkItemType,
  title: string,
  description: string,
  parentId: string | undefined
): FieldErrors {
  const errors: FieldErrors = {};
  if (!title.trim()) {
    errors.title = "Título é obrigatório.";
  }
  if ((type === "USER_STORY" || type === "TASK") && !parentId) {
    errors.parent =
      type === "USER_STORY"
        ? "Selecione uma Feature pai."
        : "Selecione uma User Story pai.";
  }
  if (type === "USER_STORY" && !description.trim()) {
    errors.description = "Descrição é obrigatória.";
  }
  return errors;
}

function hasFieldErrors(errors: FieldErrors): boolean {
  return Boolean(errors.title ?? errors.parent ?? errors.description);
}

/** Editor-only: explicit block size — flex-1 fails inside `overflow-y-auto` (no height budget). */
const CREATE_DESC_EDITOR_BOX =
  "min-h-[min(20rem,42dvh)] h-[min(20rem,42dvh)]";

const iconGhost =
  "h-8 w-8 inline-flex items-center justify-center rounded-chip shrink-0 transition-colors " +
  "text-[#6E6E73] dark:text-[#8E8E93] border border-transparent " +
  "hover:text-accent hover:bg-accent/[0.08]";

interface DescriptionToolbarProps {
  descLabelId: string;
  descEditing: boolean;
  onEdit: () => void;
  onPreview: () => void;
  descriptionRequired?: boolean;
}

function DescriptionToolbar({
  descLabelId,
  descEditing,
  onEdit,
  onPreview,
  descriptionRequired,
}: DescriptionToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
      <label
        id={descLabelId}
        className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93]"
      >
        Descrição
        {descriptionRequired ? <span className="text-red-500 ml-0.5">*</span> : null}
      </label>
      {descEditing ? (
        <button
          type="button"
          aria-label="Visualizar descrição"
          data-testid="create-desc-mode-preview"
          className={iconGhost}
          onClick={onPreview}
        >
          <MaterialIcon name="visibility" />
        </button>
      ) : (
        <button
          type="button"
          aria-label="Editar descrição"
          data-testid="create-desc-mode-edit"
          className={iconGhost}
          onClick={onEdit}
        >
          <MaterialIcon name="edit" />
        </button>
      )}
    </div>
  );
}

export default function CreateWorkItemModal({
  projectId,
  type,
  onClose,
  onCreated,
}: CreateWorkItemModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descEditing, setDescEditing] = useState(true);
  const [modalFullscreen, setModalFullscreen] = useState(false);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [assigneeMenuOpen, setAssigneeMenuOpen] = useState(false);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: users = [] } = useSWR<TenantUser[]>(
    "tenant-users",
    () => boardApi.listUsers(),
    { revalidateOnFocus: false }
  );

  const titleErrorId = useId();
  const parentErrorId = useId();
  const descriptionErrorIdFs = useId();
  const descriptionErrorId = useId();

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

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (assigneeMenuRef.current && !assigneeMenuRef.current.contains(e.target as Node)) {
        setAssigneeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = computeFieldErrors(type, title, description, parentId);
    setFieldErrors(nextErrors);
    setSubmitError(null);
    if (hasFieldErrors(nextErrors)) {
      return;
    }
    setSaving(true);
    try {
      const payload: CreateWorkItemPayload = {
        type,
        title: title.trim(),
        description:
          type === "USER_STORY" ? description.trim() : description.trim() || undefined,
        priority: 5,
        assigneeId: assigneeId ?? null,
      };
      if (type === "USER_STORY" || type === "TASK") {
        payload.parentId = parentId;
      }
      await boardApi.createWorkItem(projectId, payload);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao criar item.";
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  }

  const hasDescription = Boolean(description.trim());

  const parentBlock =
    (type === "USER_STORY" || type === "TASK") && (
      <div className="shrink-0">
        <div className="block text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] mb-1.5">
          {type === "USER_STORY" ? "Feature Pai" : "User Story Pai"}
          <span className="text-red-500 ml-0.5">*</span>
        </div>
        <ParentFilterSelector
          projectId={projectId}
          childType={type}
          selectedParentId={parentId}
          variant="form"
          onSelect={(id) => {
            setParentId(id);
            setSubmitError(null);
            setFieldErrors((prev) => ({ ...prev, parent: undefined }));
          }}
          onClear={() => {
            setParentId(undefined);
            setSubmitError(null);
            setFieldErrors((prev) => ({ ...prev, parent: undefined }));
          }}
        />
        {fieldErrors.parent ? (
          <p id={parentErrorId} className={fieldErrorClass} role="alert">
            {fieldErrors.parent}
          </p>
        ) : null}
      </div>
    );

  const titleBlock = (
    <div className="shrink-0">
      <label
        htmlFor="create-work-item-title"
        className="block text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] mb-1.5"
      >
        Título <span className="text-red-500 ml-0.5">*</span>
      </label>
      <input
        id="create-work-item-title"
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setSubmitError(null);
          setFieldErrors((prev) => ({ ...prev, title: undefined }));
        }}
        placeholder="Título do item..."
        aria-invalid={Boolean(fieldErrors.title)}
        aria-describedby={fieldErrors.title ? titleErrorId : undefined}
        className="w-full h-10 px-3 rounded-chip text-sm text-[#1D1D1F] dark:text-[#F5F5F7] bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.08] placeholder-[#6E6E73] dark:placeholder-[#8E8E93] focus:outline-none focus:ring-2 focus:ring-accent/40"
        autoFocus={!descEditing}
      />
      {fieldErrors.title ? (
        <p id={titleErrorId} className={fieldErrorClass} role="alert">
          {fieldErrors.title}
        </p>
      ) : null}
    </div>
  );

  const selectedUser = users.find((u) => u.id === assigneeId);

  const assigneeBlock = (
    <div className="shrink-0">
      <p className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] mb-1.5">
        Responsável
      </p>
      <div ref={assigneeMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setAssigneeMenuOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={assigneeMenuOpen}
          className="w-full h-10 flex items-center gap-2.5 px-3 rounded-chip text-sm font-medium bg-[#F5F5F7] dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors duration-150"
        >
          <AssigneeAvatar email={selectedUser?.email ?? null} sizePx={18} />
          <span className="flex-1 text-left truncate">
            {selectedUser ? emailToDisplayName(selectedUser.email) : "Sem responsável"}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`shrink-0 text-[#6E6E73] dark:text-[#8E8E93] transition-transform duration-150 ${assigneeMenuOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {assigneeMenuOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 w-full bg-white dark:bg-[#1C1C1E] rounded-card shadow-modal border border-black/[0.08] dark:border-white/[0.08] z-[80] py-1.5"
            role="listbox"
            aria-label="Selecionar responsável"
          >
            <ul className="max-h-56 overflow-y-auto">
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={!assigneeId}
                  onClick={() => { setAssigneeId(undefined); setAssigneeMenuOpen(false); }}
                  className={[
                    "w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors duration-150",
                    !assigneeId
                      ? "bg-accent/[0.08] dark:bg-accent/[0.12] text-accent font-medium"
                      : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <AssigneeAvatar email={null} sizePx={20} />
                  <span>Sem responsável</span>
                </button>
              </li>
              {users.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={assigneeId === u.id}
                    onClick={() => { setAssigneeId(u.id); setAssigneeMenuOpen(false); }}
                    className={[
                      "w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors duration-150",
                      assigneeId === u.id
                        ? "bg-accent/[0.08] dark:bg-accent/[0.12] text-accent font-medium"
                        : "text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                    ].join(" ")}
                  >
                    <AssigneeAvatar email={u.email} sizePx={20} />
                    <span className="truncate">{emailToDisplayName(u.email)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  const descriptionPlaceholder =
    type === "USER_STORY"
      ? "Descrição obrigatória (Markdown)…"
      : "Descrição opcional em Markdown…";

  function descSection(
    descLabelId: string,
    layoutStretch: boolean,
    mdAutoFocus: boolean,
    descriptionErrorParagraphId: string
  ) {
    return (
      <div
        className={
          layoutStretch
            ? "flex w-full min-w-0 shrink-0 flex-col gap-3"
            : "flex flex-col gap-3"
        }
      >
        <DescriptionToolbar
          descLabelId={descLabelId}
          descEditing={descEditing}
          descriptionRequired={type === "USER_STORY"}
          onEdit={() => setDescEditing(true)}
          onPreview={() => {
            setDescEditing(false);
          }}
        />
        {!descEditing ? (
          hasDescription ? (
            <MarkdownField
              variant="preview-only"
              value={description}
              previewFillParent={layoutStretch}
            />
          ) : (
            <p
              className={
                layoutStretch
                  ? "flex min-h-[min(120px,20vh)] w-full shrink-0 items-center justify-center text-sm font-medium text-[#6E6E73] dark:text-[#8E8E93] rounded-chip border border-black/[0.08] dark:border-white/[0.08] px-3 py-8 text-center"
                  : "text-sm font-medium text-[#6E6E73] dark:text-[#8E8E93] rounded-chip border border-black/[0.08] dark:border-white/[0.08] px-3 py-8 text-center"
              }
            >
              Sem descrição.
            </p>
          )
        ) : layoutStretch ? (
          <div className="flex w-full min-w-0 shrink-0 flex-col">
            <MarkdownField
              variant="split"
              showPreview={false}
              embedFullscreenToggle={false}
              showFullscreenToggle={false}
              stretchToParent
              autoFocus={mdAutoFocus}
              labelledBy={descLabelId}
              value={description}
              onChange={(next) => {
                setDescription(next);
                setSubmitError(null);
                setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }}
              placeholder={descriptionPlaceholder}
            />
          </div>
        ) : (
          <MarkdownField
            variant="split"
            showPreview={false}
            embedFullscreenToggle={false}
            showFullscreenToggle={false}
            stretchToParent={false}
            editorBoxClassName={CREATE_DESC_EDITOR_BOX}
            autoFocus={mdAutoFocus}
            labelledBy={descLabelId}
            value={description}
            onChange={(next) => {
              setDescription(next);
              setSubmitError(null);
              setFieldErrors((prev) => ({ ...prev, description: undefined }));
            }}
            placeholder={descriptionPlaceholder}
          />
        )}
        {fieldErrors.description ? (
          <p
            id={descriptionErrorParagraphId}
            className={fieldErrorClass}
            role="alert"
          >
            {fieldErrors.description}
          </p>
        ) : null}
      </div>
    );
  }

  function headerClose() {
    return (
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className={`${iconGhost} shrink-0`}
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
      className={`${iconGhost} border border-black/[0.08] dark:border-white/[0.08]`}
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
      className={`${iconGhost} border border-black/[0.08] dark:border-white/[0.08]`}
    >
      <MaterialIcon name="open_in_full" />
    </button>
  );

  return (
    <div
      role="presentation"
      className={
        modalFullscreen
          ? "fixed inset-0 z-50 flex flex-col min-h-0 bg-[#F5F5F7] dark:bg-[#0A0A0F]"
          : "fixed inset-0 z-50 box-border flex flex-col bg-black/40 p-6 backdrop-blur-sm"
      }
      onClick={(e) => {
        if (!modalFullscreen && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-labelledby="create-work-item-heading"
        className={
          modalFullscreen
            ? "flex flex-col h-[100dvh] max-h-[100dvh] w-full shrink-0 overflow-hidden rounded-none shadow-none bg-white dark:bg-[#1C1C1E]"
            : "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-modal bg-white shadow-modal dark:bg-[#1C1C1E]"
        }
        onClick={(e) => e.stopPropagation()}
      >
        {modalFullscreen ? (
          <>
            <div className="relative z-10 shrink-0 flex items-start justify-between gap-4 px-6 pt-6 lg:px-8 pb-5 border-b border-black/[0.08] dark:border-white/[0.08]">
              <h2
                id="create-work-item-heading"
                className="text-[20px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7] flex-1 min-w-0 pr-2"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <WorkItemTypeBadge type={type} size="compact" />
                  <span>{TITLE_BY_TYPE[type]}</span>
                </span>
              </h2>
              <div className="flex shrink-0 items-center gap-1">
                {headerIcons}
                {headerClose()}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 min-w-0">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-6 py-6 lg:px-8 gap-4">
                <div className="flex max-h-[min(280px,42vh)] min-h-0 shrink-0 flex-col gap-4 overflow-y-auto">
                  {parentBlock}
                  {titleBlock}
                  {assigneeBlock}
                </div>
                <div className="flex w-full min-w-0 shrink-0 flex-col">
                  {descSection("create-item-desc-label-fs", true, true, descriptionErrorIdFs)}
                </div>
                {submitError ? (
                  <p className="text-sm text-red-500 font-medium shrink-0" role="alert">
                    {submitError}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 flex justify-end gap-2 px-6 lg:px-8 py-4 border-t border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E]">
                <button
                  type="button"
                  onClick={() => setModalFullscreen(false)}
                  className="h-9 px-5 rounded-full text-sm font-medium border border-accent/40 text-accent hover:bg-accent/[0.06] transition-all duration-[120ms]"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 px-5 rounded-full text-sm font-medium bg-accent text-white hover:brightness-110 transition-all duration-[120ms] disabled:opacity-60"
                >
                  {saving ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/[0.08] px-7 pb-4 pt-7 dark:border-white/[0.08]">
              <h2
                id="create-work-item-heading"
                className="flex-1 min-w-0 pr-2 text-[20px] font-semibold tracking-heading text-[#1D1D1F] dark:text-[#F5F5F7]"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <WorkItemTypeBadge type={type} size="compact" />
                  <span>{TITLE_BY_TYPE[type]}</span>
                </span>
              </h2>
              <div className="flex shrink-0 items-center gap-1">
                {headerIcons}
                {headerClose()}
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-7 py-4">
                <div className="flex flex-col gap-4">
                  {parentBlock}
                  {titleBlock}
                  {assigneeBlock}
                  {descSection(
                    "create-item-desc-label",
                    false,
                    true,
                    descriptionErrorId
                  )}
                  {submitError ? (
                    <p className="text-sm font-medium text-red-500" role="alert">
                      {submitError}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-2 border-t border-black/[0.08] px-7 py-4 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 rounded-full border border-accent/40 px-5 text-sm font-medium text-accent transition-all duration-[120ms] hover:bg-accent/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-9 rounded-full bg-accent px-5 text-sm font-medium text-white transition-all duration-[120ms] hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? "Criando..." : "Criar"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
