import { SchemaParser } from "./service";
import type { SchemaGraphData } from "./type";

export async function parseSchemaGraph(
  yamlContent: string | Buffer,
): Promise<SchemaGraphData> {
  const content =
    typeof yamlContent === "string"
      ? yamlContent
      : yamlContent.toString("utf8");
  const parser = new SchemaParser(content);
  return parser.parseSchemas();
}
