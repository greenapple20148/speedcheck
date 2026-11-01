import type { Metadata } from "next";
import { Base64Tool } from "@/components/dev-tools/base64-tool";
import { DevToolPage } from "@/components/dev-tools/dev-tool-page";
import { getTool } from "@/lib/dev-tools/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

const tool = getTool("base64");

export const metadata: Metadata = buildMetadata({
  title: tool.metaTitle,
  description: tool.description,
  path: tool.href,
});

export default function Page() {
  return (
    <DevToolPage tool={tool}>
      <Base64Tool />
    </DevToolPage>
  );
}
