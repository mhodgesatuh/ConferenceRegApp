// frontend/src/features/organizer/AdministrationPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import PageHeader from "@/components/PageHeader";
import { Button, Input } from "@/components/ui";
import RegistrationForm from "@/features/registration/RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import { apiFetch } from "@/lib/api";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

interface Registration {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
    [key: string]: any;
}

interface LocationState {
    registration?: any;
}

const PAGE_SIZE = 20;

const AdministrationPage: React.FC = () => {
    const { state } = useLocation();
    const { registration } = (state as LocationState) || {};

    const [activeTab, setActiveTab] = useState<"list" | "update">("list");
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selected, setSelected] = useState<Registration | undefined>();
    const [pageIndex, setPageIndex] = useState(0);
    const [initialData, setInitialData] = useState<any | undefined>(registration);

    useEffect(() => {
        const loadRegs = async () => {
            try {
                const data = await apiFetch("/api/registrations");
                setRegistrations(data.registrations || []);
            } catch (err: any) {
                alert(err?.data?.error || err.message || "Failed to load registrations");
            }
        };
        loadRegs();
    }, []);

    // Fallback on refresh for Update tab
    useEffect(() => {
        const tryRefetch = async () => {
            if (initialData?.id) return;
            const idFromState = registration?.id ?? Number(sessionStorage.getItem("regId"));
            if (!idFromState) return;
            try {
                const data = await apiFetch(`/api/registrations/${idFromState}`, { method: "GET" });
                if (data?.registration) setInitialData(data.registration);
            } catch {
                /* ignore */
            }
        };
        tryRefetch();
    }, [registration, initialData]);

    const columns = useMemo<ColumnDef<Registration>[]>(
        () => [
            { accessorKey: "id", header: "ID" },
            { accessorKey: "firstName", header: "First Name" },
            { accessorKey: "lastName", header: "Last Name" },
            { accessorKey: "email", header: "Email" },
        ],
        []
    );

    const table = useReactTable({
        data: registrations,
        columns,
        state: { globalFilter, pagination: { pageIndex, pageSize: PAGE_SIZE } },
        onGlobalFilterChange: setGlobalFilter,
        onPaginationChange: (updater) => {
            const next = typeof updater === "function" ? updater({ pageIndex, pageSize: PAGE_SIZE }) : updater;
            setPageIndex(next.pageIndex);
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="space-y-4">
            <PageHeader title="Administration" />

            <div className="flex border-b">
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${activeTab === "list" ? "border-primary" : "border-transparent"}`}
                    onClick={() => setActiveTab("list")}
                >
                    List Registrations
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${activeTab === "update" ? "border-primary" : "border-transparent"}`}
                    onClick={() => setActiveTab("update")}
                >
                    Update My Registration
                </button>
            </div>

            {activeTab === "list" && (
                <div className="space-y-4">
                    <Input
                        placeholder="Filter..."
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="max-w-sm"
                    />

                    <table className="min-w-full border">
                        <thead>
                            {table.getHeaderGroups().map((hg) => (
                                <tr key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="border px-2 py-1 cursor-pointer select-none"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={`hover:bg-gray-50 ${selected?.id === row.original.id ? "bg-gray-100" : ""}`}
                                    onClick={() => setSelected(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="border px-2 py-1">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            Previous
                        </Button>
                        <Button variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            Next
                        </Button>
                        <span>
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </span>
                    </div>

                    {selected && (
                        <RegistrationForm fields={registrationFormData} initialData={selected} />
                    )}
                </div>
            )}

            {activeTab === "update" && (
                <RegistrationForm fields={registrationFormData} initialData={initialData} />
            )}
        </div>
    );
};

export default AdministrationPage;
