"use server";

import type { SchemaGraphData } from "../../server/parser/type";
import { parseSchemaGraph } from "../../server/parser/util";

export async function parseSchemaAction(
  formData: FormData,
): Promise<SchemaGraphData | { error: string }> {
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { error: "No file uploaded" };
  }
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const graph = await parseSchemaGraph(buffer);
    return graph;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}
