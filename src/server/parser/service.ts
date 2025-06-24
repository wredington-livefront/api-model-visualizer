import { parse } from "yaml";
import type {
  OpenAPISchema,
  OpenAPISpec,
  SchemaEdge,
  SchemaGraphData,
  SchemaNode,
} from "./type";

export class SchemaParser {
  private spec: OpenAPISpec;
  private nodes = new Map<string, SchemaNode>();
  private edges: SchemaEdge[] = [];
  private externalRefs = new Set<string>();

  constructor(yamlContent: string) {
    this.spec = parse(yamlContent) as OpenAPISpec;
  }

  public parseSchemas(): SchemaGraphData {
    this.nodes.clear();
    this.edges = [];
    this.externalRefs.clear();

    if (!this.spec.components?.schemas) {
      return { nodes: [], edges: [] };
    }

    // First pass: create all schema nodes and collect external refs
    Object.entries(this.spec.components.schemas).forEach(
      ([schemaName, schema]) => {
        this.createSchemaNode(schemaName, schema);
        this.collectExternalRefs(schema);
      },
    );

    // Create nodes for external references
    this.externalRefs.forEach((ref) => {
      this.createExternalRefNode(ref);
    });

    // Second pass: create relationships between schemas
    Object.entries(this.spec.components.schemas).forEach(
      ([schemaName, schema]) => {
        this.parseSchemaRelationships(schemaName, schema);
      },
    );

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }

  private createSchemaNode(schemaName: string, schema: OpenAPISchema): void {
    if (this.nodes.has(schemaName)) return;

    let nodeType: SchemaNode["type"] = "object";
    const properties: string[] = [];

    if (schema.$ref) {
      // This is a reference, we'll handle it in relationships
      return;
    }

    if (schema.enum) {
      nodeType = "enum";
    } else if (schema.allOf) {
      nodeType = "allOf";
    } else if (schema.oneOf) {
      nodeType = "oneOf";
    } else if (schema.anyOf) {
      nodeType = "anyOf";
    } else if (schema.type === "array") {
      nodeType = "array";
    } else if (schema.type) {
      nodeType = schema.type as SchemaNode["type"];
    }

    // Collect property names
    if (schema.properties) {
      properties.push(...Object.keys(schema.properties));
    }

    const node: SchemaNode = {
      id: schemaName,
      label: schemaName,
      type: nodeType,
      description: schema.description,
      properties,
      required: schema.required,
      isExternal: false,
    };

    this.nodes.set(schemaName, node);
  }

  private collectExternalRefs(schema: OpenAPISchema): void {
    if (schema.$ref && this.isExternalRef(schema.$ref)) {
      this.externalRefs.add(schema.$ref);
    }

    // Recursively check nested schemas
    if (schema.properties) {
      Object.values(schema.properties).forEach((prop) =>
        this.collectExternalRefs(prop),
      );
    }
    if (schema.items) {
      this.collectExternalRefs(schema.items);
    }
    if (schema.allOf) {
      schema.allOf.forEach((s) => this.collectExternalRefs(s));
    }
    if (schema.oneOf) {
      schema.oneOf.forEach((s) => this.collectExternalRefs(s));
    }
    if (schema.anyOf) {
      schema.anyOf.forEach((s) => this.collectExternalRefs(s));
    }
  }

  private createExternalRefNode(ref: string): void {
    const { fileName, schemaName } = this.parseRef(ref);
    const nodeId = `${fileName}#${schemaName}`;

    if (this.nodes.has(nodeId)) return;

    const node: SchemaNode = {
      id: nodeId,
      label: schemaName,
      type: "external",
      description: `External schema from ${fileName}`,
      isExternal: true,
      filePath: fileName,
    };

    this.nodes.set(nodeId, node);
  }

  private parseSchemaRelationships(
    schemaName: string,
    schema: OpenAPISchema,
  ): void {
    // Handle direct $ref
    if (schema.$ref) {
      this.createReferenceEdge(schemaName, schema.$ref);
      return;
    }

    // Handle properties
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        if (propSchema.$ref) {
          const targetId = this.getRefTargetId(propSchema.$ref);
          this.createEdge(schemaName, targetId, propName, "property");
        } else {
          // Handle nested schemas in properties
          this.parseNestedSchema(schemaName, propSchema, propName);
        }
      });
    }

    // Handle array items
    if (schema.items) {
      if (schema.items.$ref) {
        const targetId = this.getRefTargetId(schema.items.$ref);
        this.createEdge(schemaName, targetId, "items", "array_items");
      } else {
        this.parseNestedSchema(schemaName, schema.items, "items");
      }
    }

    // Handle composition (allOf, oneOf, anyOf)
    this.handleComposition(schemaName, schema.allOf, "allOf");
    this.handleComposition(schemaName, schema.oneOf, "oneOf");
    this.handleComposition(schemaName, schema.anyOf, "anyOf");
  }

  private handleComposition(
    schemaName: string,
    schemas: OpenAPISchema[] | undefined,
    compositionType: string,
  ): void {
    if (!schemas) return;

    schemas.forEach((composedSchema, index) => {
      if (composedSchema.$ref) {
        const targetId = this.getRefTargetId(composedSchema.$ref);
        this.createEdge(
          schemaName,
          targetId,
          `${compositionType}[${index}]`,
          "composition",
        );
      }
    });
  }

  private parseNestedSchema(
    parentSchema: string,
    schema: OpenAPISchema,
    context: string,
  ): void {
    // Recursively handle nested references
    if (schema.$ref) {
      const targetId = this.getRefTargetId(schema.$ref);
      this.createEdge(parentSchema, targetId, context, "reference");
    }

    if (schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        this.parseNestedSchema(
          parentSchema,
          propSchema,
          `${context}.${propName}`,
        );
      });
    }

    if (schema.items) {
      this.parseNestedSchema(parentSchema, schema.items, `${context}[]`);
    }
  }

  private createReferenceEdge(sourceSchema: string, ref: string): void {
    const targetId = this.getRefTargetId(ref);
    const edgeType = this.isExternalRef(ref) ? "external_ref" : "reference";
    this.createEdge(sourceSchema, targetId, "$ref", edgeType);
  }

  private createEdge(
    source: string,
    target: string,
    label: string,
    type: SchemaEdge["type"],
  ): void {
    const edgeId = `${source}->${target}`;

    // Avoid duplicate edges
    if (this.edges.some((edge) => edge.id === edgeId)) return;

    this.edges.push({
      id: edgeId,
      source,
      target,
      label,
      type,
    });
  }

  private getRefTargetId(ref: string): string {
    if (this.isExternalRef(ref)) {
      const { fileName, schemaName } = this.parseRef(ref);
      return `${fileName}#${schemaName}`;
    } else {
      // Internal reference like "#/components/schemas/SchemaName"
      return ref.split("/").pop() ?? ref;
    }
  }

  private isExternalRef(ref: string): boolean {
    return !ref.startsWith("#/");
  }

  private parseRef(ref: string): { fileName: string; schemaName: string } {
    if (ref.includes("#")) {
      const [filePath, fragment] = ref.split("#");
      const fileName = filePath?.split("/").pop() ?? filePath ?? "";
      const schemaName = fragment?.split("/").pop() ?? fragment ?? "";
      return { fileName, schemaName };
    } else {
      // If no hash, treat as a path relative to current file path
      return { fileName: ref, schemaName: "Unknown" };
    }
  }
}
