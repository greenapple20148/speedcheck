import type { Metadata } from "next";
import { DevToolPage } from "@/components/dev-tools/dev-tool-page";
import { JsonToYamlTool } from "@/components/dev-tools/json-to-yaml-tool";
import { getTool } from "@/lib/dev-tools/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

const tool = getTool("json-to-yaml");

export const metadata: Metadata = buildMetadata({
  title: tool.metaTitle,
  description: tool.description,
  path: tool.href,
});

export default function Page() {
  return (
    <DevToolPage tool={tool}>
      <JsonToYamlTool />
    </DevToolPage>
  );
}
