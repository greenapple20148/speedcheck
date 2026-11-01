import type { Metadata } from "next";
import { Suspense } from "react";
import { Gauge, Images, Timer } from "lucide-react";
import { UploadTimeCalculator, UploadTimeTabs } from "@/components/calculators/upload-time-calculator";
import { UploadTimeExamples, UploadTimeLearn, uploadTimeFaqs } from "@/components/calculators/upload-time-content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { ToolPageHero } from "@/components/ui/tool-page-hero";
import { UploadHeroArt } from "@/components/ui/tool-art";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqPageJsonLd, webApplicationJsonLd } from "@/lib/seo/structured-data";

const TITLE = "Upload Time Calculator";
const DESCRIPTION =
  "Estimate upload duration from file size and upload megabits per second, with decimal and binary size units.";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/upload-time-calculator",
});

export default function UploadTimePage() {
  const faqLd = faqPageJsonLd(uploadTimeFaqs);
  const structured = [
    webApplicationJsonLd({ name: TITLE, description: DESCRIPTION, path: "/upload-time-calculator" }),
    ...(faqLd ? [faqLd] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:py-6">
      <JsonLd data={structured} />
      <Breadcrumbs items={[{ label: TITLE }]} currentPath="/upload-time-calculator" />
      <ToolPageHero
        title={TITLE}
        description="Find out how long your files, photos, and videos will take to upload based on file size, your upload speed, and transfer efficiency."
        chips={[
          { label: "Quick & Accurate", icon: Timer },
          { label: "Real-World Efficiency", icon: Gauge },
          { label: "For Files, Photos & Videos", icon: Images },
        ]}
        illustration={<UploadHeroArt />}
      />
      <UploadTimeTabs
        calculator={
          <Suspense fallback={<CalculatorFallback />}>
            <UploadTimeCalculator />
          </Suspense>
        }
        examples={<UploadTimeExamples />}
        learn={<UploadTimeLearn />}
      />
    </div>
  );
}

function CalculatorFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
      <div className="h-80 rounded-[20px] border border-[#E2E8E5] bg-white shadow-soft" />
      <div className="h-80 rounded-[20px] border border-[#E2E8E5] bg-white shadow-soft" />
      <p className="sr-only">Loading the calculator.</p>
    </div>
  );
}
