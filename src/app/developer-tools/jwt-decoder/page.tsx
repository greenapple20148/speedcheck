import type { Metadata } from "next";
import { DevToolPage } from "@/components/dev-tools/dev-tool-page";
import { JwtDecoderTool } from "@/components/dev-tools/jwt-decoder";
import { getTool } from "@/lib/dev-tools/catalog";
import { buildMetadata } from "@/lib/seo/metadata";

const tool = getTool("jwt-decoder");

export const metadata: Metadata = buildMetadata({
  title: tool.metaTitle,
  description: tool.description,
  path: tool.href,
});

export default function Page() {
  return (
    <DevToolPage tool={tool}>
      <JwtDecoderTool />
    </DevToolPage>
  );
}
