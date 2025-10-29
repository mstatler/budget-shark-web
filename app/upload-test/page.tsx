// Tell Next.js: do NOT prerender this route at build time
export const dynamic = "force-dynamic";
export const revalidate = 0;

import IngestPanel from "../components/IngestPanel"; // note: ../ (not ../../)

export default function UploadTestPage() {
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Upload • Validate • Promote • Preview</h1>
      <IngestPanel />
    </main>
  );
}
