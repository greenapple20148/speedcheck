import type { Metadata } from "next";
import { Suspense } from "react";
import { CloudUpload } from "lucide-react";
import { UploadInfoTip, UploadTimeCalculator } from "@/components/calculators/upload-time-calculator";
import { UploadTimeDetails, UploadTimeGuide, uploadTimeFaqs } from "@/components/calculators/upload-time-content";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
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
      <header className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00866A] text-white [[data-theme=dark]_&]:bg-[var(--primary)] [[data-theme=dark]_&]:text-[var(--primary-foreground)]">
          <CloudUpload className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              Upload Time Calculator
            </h1>
            <UploadInfoTip />
          </div>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Find out how long your files, photos, and videos will take to upload.
          </p>
        </div>
      </header>
      <Suspense fallback={<CalculatorFallback />}>
        <UploadTimeCalculator />
      </Suspense>
      <UploadTimeDetails />
      <UploadTimeGuide />
    </div>
  );
}

function CalculatorFallback() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)]">
      <div className="h-80 rounded-2xl border border-[#E2E8F0] bg-white shadow-soft" />
      <div className="h-80 rounded-2xl border border-[#E2E8F0] bg-white shadow-soft" />
      <p className="sr-only">Loading the calculator.</p>
    </div>
  );
}
