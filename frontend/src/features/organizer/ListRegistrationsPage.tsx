// frontend/src/features/organizer/ListRegistrationsPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

interface Registration {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
}

const ListRegistrationsPage: React.FC = () => {
    const [data, setData] = useState<Registration[]>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch("/api/registrations")
            .then((d: any) => setData(d.registrations || []))
            .catch((err: any) => {
                alert(err?.data?.error || err.message || "Failed to load registrations");
            });
    }, []);

    const columns = useMemo<ColumnDef<Registration>[]>(
        () => [
            { accessorKey: "id", header: "ID" },
            { accessorKey: "firstName", header: "First Name" },
            { accessorKey: "lastName", header: "Last Name" },
            { accessorKey: "email", header: "Email" },
            {
                id: "actions",
                header: "",
                cell: ({ row }) => (
                    <Button
                        variant="link"
                        onClick={() => navigate("/register", { state: { registration: row.original } })}
                    >
                        Edit
                    </Button>
                ),
            },
        ],
        [navigate]
    );

    const table = useReactTable({
        data,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-4">
            <header className="pb-2 mb-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <Link to="/organizer" className="flex items-center gap-1 text-primary hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        Home
                    </Link>
                    <h1 className="text-xl sm:text-2xl font-semibold text-center w-full">
                        Registrations
                    </h1>
                </div>
            </header>

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
                        <tr key={row.id} className="hover:bg-gray-50">
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="border px-2 py-1">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ListRegistrationsPage;

