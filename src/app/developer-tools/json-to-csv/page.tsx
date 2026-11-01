import type { Metadata } from "next";
import { DevToolPage } from "@/components/dev-tools/dev-tool-page";
import { JsonToCsvTool } from "@/components/dev-tools/json-to-csv-tool";
import { getTool } from "@/lib/dev-tools/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

const tool = getTool("json-to-csv");

export const metadata: Metadata = buildMetadata({
  title: tool.metaTitle,
  description: tool.description,
  path: tool.href,
});

export default function Page() {
  return (
    <DevToolPage tool={tool}>
      <JsonToCsvTool />
    </DevToolPage>
  );
}
