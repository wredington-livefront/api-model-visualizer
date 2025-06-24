"use client";

import { useActionState } from "react";
import { parseSchemaAction } from "../app/actions/parse-schema";
import type { SchemaGraphData } from "../server/parser/type";

// Type guard for SchemaGraphData
function isSchemaGraphData(data: unknown): data is SchemaGraphData {
  return (
    typeof data === "object" &&
    data !== null &&
    Array.isArray((data as Record<string, unknown>).nodes) &&
    Array.isArray((data as Record<string, unknown>).edges)
  );
}

// Helper type guard for error with message
function isErrorWithMessage(err: unknown): err is { error: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "error" in err &&
    typeof (err as { error: unknown }).error === "string"
  );
}

type Props = {
  onGraphData?: (data: SchemaGraphData) => void;
};

export default function FileInput({ onGraphData }: Props) {
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const result = await parseSchemaAction(formData);
      if (isSchemaGraphData(result)) {
        onGraphData?.(result);
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction}>
      <input name="file" type="file" accept=".yaml,.yml" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Parsing..." : "Upload"}
      </button>
      {isErrorWithMessage(state) && (
        <p style={{ color: "red" }}>{state.error}</p>
      )}
    </form>
  );
}
