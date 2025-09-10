// frontend/src/features/administration/AdministrationPage.tsx

import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import PageHeader from "@/components/PageHeader";
import { Button, Input } from "@/components/ui";
import RegistrationForm from "@/features/registration/RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import type { FormField } from "@/data/registrationFormData";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "./components/DataTable";
import { buildFilterKeys, buildListColumnsFromForm } from "./table/columns";
import { useRegistrations } from "./hooks/useRegistrations";
import { useRegistrationById } from "./hooks/useRegistrationById";
import type { Registration } from "./types";

interface LocationState {
    registration?: any;
}

const DEFAULT_PAGE_SIZE = 20;

const AdministrationPage: React.FC = () => {
    const { state } = useLocation();
    const { registration } = (state as LocationState) || {};

    const [activeTab, setActiveTab] = useState<"list" | "update">("list");
    const [selected, setSelected] = useState<Registration | undefined>();

    // Collection hook
    const { data: registrations, isLoading, error } = useRegistrations();

    // Fallback-by-id hook for Update tab (supports refresh)
    const storedId = Number(sessionStorage.getItem("regId") ?? "");
    const idFromState = registration?.id ?? (Number.isNaN(storedId) ? null : storedId);
    const { data: fetchedById } = useRegistrationById(idFromState);

    // Initial data for Update tab prefers the row the user just selected,
    // then the fetched-by-id fallback, then any registration passed via router state.
    const initialDataForUpdate = selected ?? fetchedById ?? registration;

    // Columns from form schema
    const dynamicCols = useMemo(
        () =>
            buildListColumnsFromForm<Registration>(
                registrationFormData as unknown as FormField[]
            ),
        []
    );

    const columns = useMemo<ColumnDef<Registration>[]>(() => {
        return [
            // Selection column
            DataTable.selectionColumn<Registration>(),
            // Always keep ID up front
            { accessorKey: "id", header: "ID", enableHiding: false },
            // Dynamic fields from form schema
            ...dynamicCols,
            // Row actions
            DataTable.actionsColumn<Registration>(({ row }) => {
                const reg = row.original as Registration;
                return (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelected(reg);
                            setActiveTab("update");
                            sessionStorage.setItem("regId", String(reg.id));
                        }}
                    >
                        Edit
                    </Button>
                );
            }),
        ];
    }, [dynamicCols]);

    // Global filter keys (id + all dynamic accessors)
    const filterKeys = useMemo(
        () => buildFilterKeys(dynamicCols, ["id"]),
        [dynamicCols]
    );

    return (
        <div className="space-y-4">
            <PageHeader title="Administration" />

            {/* Tabs */}
            <div className="flex border-b">
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${
                        activeTab === "list" ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setActiveTab("list")}
                >
                    List Registrations
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${
                        activeTab === "update" ? "border-primary" : "border-transparent"
                    }`}
                    onClick={() => setActiveTab("update")}
                >
                    Update My Registration
                </button>
            </div>

            {/* LIST TAB */}
            {activeTab === "list" && (
                <div className="space-y-4">
                    {isLoading && (
                        <div className="text-sm text-muted-foreground">Loading…</div>
                    )}
                    {error && <div className="text-sm text-red-600">Error: {error}</div>}

                    <DataTable<Registration>
                        data={registrations}
                        columns={columns}
                        defaultPageSize={DEFAULT_PAGE_SIZE}
                        filterKeys={filterKeys}
                        onRowClick={(reg) => setSelected(reg)}
                        renderToolbar={(state) => (
                            <div className="flex flex-wrap items-center gap-2 w-full">
                                <Input
                                    placeholder="Search…"
                                    value={state.globalFilter}
                                    onChange={(e) => state.setGlobalFilter(e.target.value)}
                                    className="w-[260px]"
                                />

                                {state.renderColumnVisibilityToggle()}
                                {state.renderPageSizeSelect([10, 20, 50, 100])}

                                <div className="ml-auto flex items-center gap-3">
                                    {state.selectedCount > 0 && (
                                        <span className="text-sm text-muted-foreground">
                      {state.selectedCount} selected
                    </span>
                                    )}
                                    <Button variant="ghost" onClick={state.resetAll}>
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        )}
                    />

                    {/* Quick edit view below table if row clicked */}
                    {selected && (
                        <div className="pt-4">
                            <RegistrationForm
                                fields={registrationFormData}
                                initialData={selected}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* UPDATE TAB */}
            {activeTab === "update" && (
                <RegistrationForm
                    fields={registrationFormData}
                    initialData={initialDataForUpdate}
                />
            )}
        </div>
    );
};

export default AdministrationPage;
