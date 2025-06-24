export type SchemaNode = {
  id: string;
  label: string;
  type:
    | "object"
    | "array"
    | "string"
    | "number"
    | "boolean"
    | "enum"
    | "oneOf"
    | "allOf"
    | "anyOf"
    | "external";
  description?: string;
  properties?: string[];
  required?: string[];
  isExternal?: boolean;
  filePath?: string;
};

export type SchemaEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  type:
    | "property"
    | "reference"
    | "array_items"
    | "composition"
    | "external_ref";
};

export type SchemaGraphData = {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
};

export type OpenAPISchema = {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  items?: OpenAPISchema;
  $ref?: string;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  required?: string[];
  enum?: unknown[];
  description?: string;
  format?: string;
};

export type OpenAPISpec = {
  components?: {
    schemas?: Record<string, OpenAPISchema>;
  };
};
