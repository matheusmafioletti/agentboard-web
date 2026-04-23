import { useState } from "react";
import type { ArtifactData } from "../../api/board";

interface ArtifactListProps {
  artifacts: ArtifactData[];
}

/** Expandable list of SpecKit artifacts grouped by command, showing full content on click. */
export default function ArtifactList({ artifacts }: ArtifactListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (artifacts.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No artifacts yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {artifacts.map((artifact) => (
        <li key={artifact.id}>
          <div
            data-testid="artifact-row"
            className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
            onClick={() =>
              setExpandedId((prev) =>
                prev === artifact.id ? null : artifact.id
              )
            }
          >
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {artifact.command}
            </span>
            {artifact.agentIdentifier && (
              <span className="text-xs text-gray-500">{artifact.agentIdentifier}</span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              {new Date(artifact.createdAt).toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">
              {expandedId === artifact.id ? "▲" : "▼"}
            </span>
          </div>

          {expandedId === artifact.id && (
            <div className="mt-1 ml-2 p-3 rounded-md bg-gray-50 border border-gray-100">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-mono max-h-64 overflow-y-auto">
                {artifact.content}
              </pre>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
