import { useState } from "react";
import type { CommandExecutionData } from "../../api/board";

interface ExecutionHistoryProps {
  executions: CommandExecutionData[];
}

const statusStyles: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-700",
  ERROR: "bg-red-100 text-red-700",
  RUNNING: "bg-yellow-100 text-yellow-700",
};

/** Chronological list of SpecKit command executions with status badges and expandable error details. */
export default function ExecutionHistory({ executions }: ExecutionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (executions.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">No execution history yet.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {executions.map((exec) => (
        <li key={exec.id}>
          <div
            data-testid="exec-row"
            className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer"
            onClick={() =>
              setExpandedId((prev) => (prev === exec.id ? null : exec.id))
            }
          >
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                statusStyles[exec.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {exec.status}
            </span>
            <span className="text-sm font-medium text-gray-800 flex-1">
              {exec.command}
            </span>
            {exec.durationMs != null && (
              <span className="text-xs text-gray-400">{exec.durationMs} ms</span>
            )}
            <span className="text-xs text-gray-400">
              {new Date(exec.startedAt).toLocaleString()}
            </span>
          </div>

          {expandedId === exec.id && (exec.errorMessage || exec.agentIdentifier) && (
            <div className="mt-1 ml-2 p-2 rounded-md bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-1">
              {exec.agentIdentifier && (
                <p>
                  <span className="font-semibold">Agent:</span> {exec.agentIdentifier}
                </p>
              )}
              {exec.errorMessage && (
                <p className="text-red-600">
                  <span className="font-semibold">Error:</span> {exec.errorMessage}
                </p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
