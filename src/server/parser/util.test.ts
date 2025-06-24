import { parseSchemaGraph } from "./util";

describe("loadOpenAPISpec (integration)", () => {
  it("should load the OpenAPI spec from a real file", async () => {
    const content = await parseSchemaGraph(
      "/Users/willredington/Projects/rvo/perks-script-transfer-xapi-doc/openapi/dist/rx-swap-xapi.yml",
    );
    console.log(content);
  });
});
