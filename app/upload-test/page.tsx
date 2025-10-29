export const dynamic = 'force-dynamic';  // disable static prerendering
export const revalidate = 0;             // no ISR either


"use client";

import * as React from "react";
import IngestPanel from "../components/IngestPanel"; // if your page is deeper, change to "../../components/IngestPanel"

export default function UploadTestPage() {
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">
        Upload • Validate • Promote • Preview
      </h1>
      <IngestPanel />
    </main>
  );
}
