interface AssigneeAvatarProps {
  email: string | null | undefined;
  sizePx?: number;
  showLabel?: boolean;
}

export function emailToDisplayName(email: string): string {
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  return parts
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

function initials(email: string): string {
  const parts = emailToDisplayName(email).split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function emailToHue(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/** Displays a colored initials avatar for an assigned user, or a neutral placeholder. */
export default function AssigneeAvatar({
  email,
  sizePx = 20,
  showLabel = false,
}: AssigneeAvatarProps) {
  const fontSize = Math.max(8, Math.round(sizePx * 0.42));

  if (!email) {
    return (
      <span className="inline-flex items-center gap-1 min-w-0">
        <span
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#E5E5EA] dark:bg-[#3A3A3C] text-[#6E6E73] dark:text-[#8E8E93]"
          style={{ width: sizePx, height: sizePx }}
          aria-hidden
        >
          <svg
            width={Math.round(sizePx * 0.6)}
            height={Math.round(sizePx * 0.6)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </span>
        {showLabel && (
          <span className="truncate text-[11px] text-[#6E6E73] dark:text-[#8E8E93] font-medium">
            Sem responsável
          </span>
        )}
      </span>
    );
  }

  const hue = emailToHue(email);
  const bg = `hsl(${hue}, 55%, 52%)`;
  const fg = "#fff";

  return (
    <span className="inline-flex items-center gap-1 min-w-0">
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
        style={{ width: sizePx, height: sizePx, background: bg, color: fg, fontSize }}
        title={email}
        aria-label={email}
      >
        {initials(email)}
      </span>
      {showLabel && (
        <span
          className="truncate text-[11px] text-[#1D1D1F] dark:text-[#F5F5F7] font-medium"
          title={email}
        >
          {emailToDisplayName(email)}
        </span>
      )}
    </span>
  );
}
