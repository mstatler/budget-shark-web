// app/dashboard/upload/page.tsx
"use client";

import * as React from "react";
import IngestPanel from "@/app/components/IngestPanel";

export default function UploadPage() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "12px 16px 24px" }}>
      <IngestPanel />
    </main>
  );
}
