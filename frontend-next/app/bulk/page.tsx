"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { IcpPanel } from "@/components/icp-panel";
import { BulkUploader } from "@/components/bulk/bulk-uploader";
import { ICP_PRESETS } from "@/lib/icp-presets";
import type { ICPProfile } from "@/types/lead";

export default function BulkPage() {
  const [icp, setIcp] = React.useState<ICPProfile>(
    ICP_PRESETS["B2B SaaS Agency"],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
      <PageHeader
        title="Bulk qualification"
        description="Upload a CSV and qualify many leads in one pass. Every row runs the full research and ICP scoring pipeline."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <BulkUploader icp={icp} />
        </div>
        <aside className="order-first xl:order-last">
          <IcpPanel value={icp} onChange={setIcp} />
        </aside>
      </div>
    </div>
  );
}
