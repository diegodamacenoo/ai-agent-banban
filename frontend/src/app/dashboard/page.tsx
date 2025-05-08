'use client';
import * as React from "react"
import { usePathname } from "next/navigation";
import { SiteHeader } from "@/app/ui/dashboard/site-header";
import { SectionCards } from "@/app/ui/dashboard/section-cards"
import { ChartAreaInteractive } from "@/app/ui/dashboard/chart-area-interactive";
import { DataTable } from "@/app/ui/dashboard/data-table";

import data from "./data.json";

export default function DashboardPage() {
    const pathname = usePathname();

    return (
        <>
            <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
        </>
    )
}
