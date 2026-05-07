import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useState,
} from "react";
import MaterialIcon from "./MaterialIcon";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const previewClass =
  [
    "prose prose-sm max-w-none min-h-[120px] overflow-auto rounded-chip px-3 py-2 text-left",
    "border border-black/[0.08] dark:border-white/[0.08]",
    "bg-[#F5F5F7] dark:bg-[#0A0A0F]",
    "prose-headings:font-semibold prose-headings:tracking-heading",
    "prose-headings:text-[#1D1D1F] dark:prose-headings:text-[#F5F5F7]",
    "prose-p:text-[#1D1D1F] dark:prose-p:text-[#F5F5F7]",
    "prose-li:text-[#1D1D1F] dark:prose-li:text-[#F5F5F7]",
    "prose-strong:text-[#1D1D1F] dark:prose-strong:text-[#F5F5F7]",
    "prose-code:text-accent prose-code:bg-white/80 dark:prose-code:bg-[#141418]",
    "prose-code:px-1 prose-code:py-px prose-code:rounded-chip prose-code:font-normal",
    "prose-pre:bg-white dark:prose-pre:bg-[#141418]",
    "prose-pre:border prose-pre:border-black/[0.08] dark:prose-pre:border-white/[0.08]",
    "prose-a:text-accent prose-a:no-underline hover:prose-a:brightness-125",
    "dark:prose-invert prose-invert prose-blockquote:border-accent/40",
  ].join(" ");

function MarkdownArticle({ markdown }: { markdown: string }) {
  return (
    <div className={previewClass}>
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {markdown.length === 0 ? "" : markdown}
      </Markdown>
    </div>
  );
}

const textareaClass = [
  "w-full flex-1 min-h-[260px] lg:min-h-0 px-3 py-2 rounded-chip text-sm font-mono resize-y",
  "text-[#1D1D1F] dark:text-[#F5F5F7]",
  "bg-[#F5F5F7] dark:bg-[#2C2C2E]",
  "border border-black/[0.08] dark:border-white/[0.08]",
  "placeholder-[#6E6E73] dark:placeholder-[#8E8E93]",
  "focus:outline-none focus:ring-2 focus:ring-accent/40",
].join(" ");

/** Editor-only, no flex growth — for parents with `overflow-y: auto` where flex-1 does not receive a height budget. */
const textareaEditorBlockBase = [
  "w-full box-border px-3 py-2 rounded-chip text-sm font-mono resize-y",
  "text-[#1D1D1F] dark:text-[#F5F5F7]",
  "bg-[#F5F5F7] dark:bg-[#2C2C2E]",
  "border border-black/[0.08] dark:border-white/[0.08]",
  "placeholder-[#6E6E73] dark:placeholder-[#8E8E93]",
  "focus:outline-none focus:ring-2 focus:ring-accent/40",
].join(" ");

const textareaStretchToParentClass = [
  "box-border max-h-none min-h-[min(280px,42vh)] w-full resize-y rounded-chip px-3 py-2 font-mono text-sm",
  "text-[#1D1D1F] dark:text-[#F5F5F7]",
  "bg-[#F5F5F7] dark:bg-[#2C2C2E]",
  "border border-black/[0.08] dark:border-white/[0.08]",
  "placeholder-[#6E6E73] dark:placeholder-[#8E8E93]",
  "focus:outline-none focus:ring-2 focus:ring-accent/40",
].join(" ");

const textareaFullscreenClass = [
  "w-full flex-1 min-h-0 px-3 py-2 rounded-chip text-sm font-mono resize-none",
  "text-[#1D1D1F] dark:text-[#F5F5F7]",
  "bg-white dark:bg-[#1C1C1E]",
  "border border-black/[0.08] dark:border-white/[0.08]",
  "placeholder-[#6E6E73] dark:placeholder-[#8E8E93]",
  "focus:outline-none focus:ring-2 focus:ring-accent/40",
].join(" ");

export interface MarkdownFieldHandle {
  openFullscreen: () => void;
}

export interface MarkdownFieldProps {
  variant: "preview-only" | "split";
  value: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  inputId?: string;
  labelledBy?: string;
  /** When variant is split, hide the Markdown preview pane (editor only). */
  showPreview?: boolean;
  /** When false, the expand control is omitted (call `openFullscreen` via ref). */
  embedFullscreenToggle?: boolean;
  fullscreenLabel?: string;
  exitFullscreenLabel?: string;
  showFullscreenToggle?: boolean;
  /** When split without preview, fill height of a flex parent (e.g. modal fullscreen). */
  stretchToParent?: boolean;
  /** When preview-only, wrap in a flex column that fills a flex parent (scroll inside). */
  previewFillParent?: boolean;
  /**
   * Editor-only (no preview): fixed block height classes — use inside scroll containers.
   * Ignored when `stretchToParent` is true.
   */
  editorBoxClassName?: string;
  /** Focus the source editor on mount (split variants). */
  autoFocus?: boolean;
}

/** Sanitized Markdown preview and optional split Markdown source editor. */
const MarkdownField = forwardRef<MarkdownFieldHandle, MarkdownFieldProps>(
  function MarkdownField(
    {
      variant,
      value,
      onChange,
      placeholder = "",
      inputId,
      labelledBy,
      showPreview = true,
      embedFullscreenToggle = true,
      fullscreenLabel = "Open in full",
      exitFullscreenLabel = "Close full screen",
      showFullscreenToggle = true,
      stretchToParent = false,
      previewFillParent = false,
      editorBoxClassName,
      autoFocus = false,
    },
    ref
  ) {
    const fallbackId = useId();
    const editorId = inputId ?? fallbackId;
    const [fullscreen, setFullscreen] = useState(false);

    useImperativeHandle(ref, () => ({
      openFullscreen: () => setFullscreen(true),
    }));

    useEffect(() => {
      if (!fullscreen) return undefined;
      function onKey(ev: KeyboardEvent) {
        if (ev.key === "Escape") {
          setFullscreen(false);
        }
      }
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [fullscreen]);

    if (variant === "preview-only") {
      const inner = <MarkdownArticle markdown={value} />;
      if (!previewFillParent) {
        return inner;
      }
      return (
        <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">{inner}</div>
        </div>
      );
    }

    const previewBlock = (
      <div className="flex-1 flex flex-col min-h-0 min-w-0 gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-caps text-[#6E6E73] dark:text-[#8E8E93] shrink-0">
          Pré-visualização
        </span>
        <div
          data-testid="markdown-preview-pane"
          className="flex-1 min-h-[260px] lg:min-h-0 lg:overflow-auto"
        >
          <MarkdownArticle markdown={value} />
        </div>
      </div>
    );

    const textareaProps = {
      id: editorId,
      value,
      spellCheck: false as const,
      placeholder,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      ...(autoFocus ? { autoFocus: true } : {}),
      ...(labelledBy ? ({ "aria-labelledby": labelledBy } as const) : {}),
    };

    const showExpand =
      showFullscreenToggle && embedFullscreenToggle ? (
        <button
          type="button"
          aria-label={fullscreenLabel}
          data-testid="markdown-fullscreen-enter"
          onClick={() => setFullscreen(true)}
          className="absolute top-2 right-2 z-10 inline-flex items-center justify-center p-2 rounded-chip text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
        >
          <MaterialIcon name="open_in_full" />
        </button>
      ) : null;

    if (fullscreen) {
      const exitBtn = (
        <button
          type="button"
          aria-label={exitFullscreenLabel}
          data-testid="markdown-fullscreen-exit"
          onClick={() => setFullscreen(false)}
          className="absolute top-3 right-3 z-[110] inline-flex items-center justify-center p-2 rounded-chip text-[#6E6E73] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
        >
          <MaterialIcon name="close_fullscreen" />
        </button>
      );

      if (!showPreview) {
        return (
          <div
            data-testid="markdown-fullscreen-layer"
            className="fixed inset-0 z-[100] flex flex-col bg-[#F5F5F7] dark:bg-[#0A0A0F] p-4 pt-14 lg:p-6 lg:pt-16 relative"
          >
            {exitBtn}
            <label htmlFor={editorId} className="sr-only">
              Editor Markdown da descrição
            </label>
            <textarea {...textareaProps} className={textareaFullscreenClass} />
          </div>
        );
      }

      return (
        <div
          data-testid="markdown-fullscreen-layer"
          className="fixed inset-0 z-[100] flex flex-col bg-[#F5F5F7] dark:bg-[#0A0A0F] p-4 pt-14 lg:p-6 lg:pt-16 relative"
        >
          {exitBtn}
          <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
              <label htmlFor={editorId} className="sr-only">
                Editor Markdown da descrição
              </label>
              <textarea {...textareaProps} className={textareaFullscreenClass} />
            </div>
            <div className="flex-1 flex flex-col min-h-0 min-w-0">{previewBlock}</div>
          </div>
        </div>
      );
    }

    if (!showPreview) {
      const outerStretch = stretchToParent ? "w-full min-w-0 shrink-0" : "min-h-0";
      const innerStretch = stretchToParent
        ? "flex w-full flex-col"
        : "flex flex-col";
      const blockEditorClass = editorBoxClassName?.trim();
      const taClass = stretchToParent
        ? textareaStretchToParentClass
        : blockEditorClass
          ? `${textareaEditorBlockBase} ${blockEditorClass}`
          : textareaClass;
      return (
        <div className={`relative flex flex-col gap-2 ${outerStretch}`}>
          {showExpand}
          <div className={innerStretch}>
            <label htmlFor={editorId} className="sr-only">
              Editor Markdown da descrição
            </label>
            <textarea {...textareaProps} className={taClass} />
          </div>
        </div>
      );
    }

    return (
      <div className="relative flex flex-col gap-2 min-h-0">
        {showExpand}

        <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-[280px]">
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <label htmlFor={editorId} className="sr-only">
              Editor Markdown da descrição
            </label>
            <textarea {...textareaProps} className={textareaClass} />
          </div>
          <div className="flex-1 flex flex-col min-h-0 min-w-0">{previewBlock}</div>
        </div>
      </div>
    );
  }
);

export default MarkdownField;
