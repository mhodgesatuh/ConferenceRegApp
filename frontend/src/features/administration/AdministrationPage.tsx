// frontend/src/features/administration/AdministrationPage.tsx

import React, { useMemo, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

import PageHeader from "@/components/PageHeader";
import { Button, Input } from "@/components/ui";
import RegistrationForm from "@/features/registration/RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import type { FormField } from "@/data/registrationFormData";
import { getAccessorKey } from "./table/utils";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Pencil } from "lucide-react";

import { DataTable } from "./components/DataTable";
import { buildFilterKeys, buildListColumnsFromForm, camelToTitle } from "./table/columns";
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

    const { data: registrations, isLoading, error } = useRegistrations();

    const storedId = Number(sessionStorage.getItem("regId") ?? "");
    const idFromState = registration?.id ?? (Number.isNaN(storedId) ? null : storedId);
    const { data: fetchedById } = useRegistrationById(idFromState);

    const initialDataForUpdate = selected ?? fetchedById ?? registration;

    const dynamicColsBase = useMemo(
        () =>
            buildListColumnsFromForm<Registration>(
                registrationFormData as unknown as FormField[]
            ),
        []
    );

    const booleanFieldNames = useMemo(
        () =>
            (registrationFormData as FormField[])
                .filter((f) => f.type === "checkbox" && f.name && f.list !== false)
                .map((f) => f.name),
        [registrationFormData]
    );

    const boolFilterFn: FilterFn<Registration> = (row, id, value) => {
        if (value === undefined) return true;
        return Boolean(row.getValue(id));
    };

    const dynamicCols = useMemo<ColumnDef<Registration>[]>(() => {
        return dynamicColsBase.map((col) => {
            const key = getAccessorKey(col);
            if (!key || !booleanFieldNames.includes(key)) {
                return col;
            }
            return {
                ...col,
                enableColumnFilter: true,
                filterFn: boolFilterFn,
            } as ColumnDef<Registration>;
        });
    }, [dynamicColsBase, booleanFieldNames]);

    const editIconCol: ColumnDef<Registration> = useMemo(
        () => ({
            id: "edit",
            header: "",
            enableSorting: false,
            enableHiding: false,
            size: 36,
            cell: ({ row }) => {
                const reg = row.original as Registration;
                return (
                    <button
                        type="button"
                        title="Edit"
                        aria-label="Edit"
                        className="p-1 rounded hover:bg-muted"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelected(reg);
                            setActiveTab("update");
                            sessionStorage.setItem("regId", String(reg.id));
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                );
            },
        }),
        []
    );

    const columns = useMemo<ColumnDef<Registration>[]>(() => {
        return [editIconCol, ...dynamicCols];
    }, [dynamicCols, editIconCol]);

    const filterKeys = useMemo(() => buildFilterKeys(dynamicCols), [dynamicCols]);

    const DebouncedSearch: React.FC<{
        value: string;
        onChange: (v: string) => void;
        delay?: number;
    }> = ({ value, onChange, delay = 200 }) => {
        const [local, setLocal] = useState(value);
        useEffect(() => setLocal(value), [value]);
        useEffect(() => {
            const t = setTimeout(() => onChange(local), delay);
            return () => clearTimeout(t);
        }, [local, onChange, delay]);
        return (
            <Input
                placeholder="Search…"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="w-[260px]"
            />
        );
    };

    return (
        <div className="page-card space-y-4">
            <PageHeader title="Administration" />

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`admin-tab ${activeTab === "list" ? "admin-tab--active" : ""}`}
                    onClick={() => setActiveTab("list")}
                >
                    List Registrations
                </button>
                <button
                    className={`admin-tab ${activeTab === "update" ? "admin-tab--active" : ""}`}
                    onClick={() => setActiveTab("update")}
                >
                    Update Registration
                </button>
            </div>

            {/* LIST TAB */}
            {activeTab === "list" && (
                <div className="space-y-4">
                    {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
                    {error && <div className="text-sm text-red-600">Error: {error}</div>}

                    {/* Nearly full-width table (98% of the page) */}
                    <div className="bleed-98">
                        <div className="admin-table-frame">
                            <DataTable<Registration>
                                data={registrations}
                                columns={columns}
                                defaultPageSize={DEFAULT_PAGE_SIZE}
                                filterKeys={filterKeys}
                                onRowClick={(reg) => setSelected(reg)}
                                persistKey="admin.registrations.v1"
                                renderToolbar={(state) => (
                                    <div className="admin-toolbar">
                                        {/* Filters row */}
                                        <div className="admin-toolbar-row">
                                            <span className="font-medium">Filters:</span>
                                            {booleanFieldNames.map((name) => {
                                                const enabled =
                                                    state.table.getColumn(name)?.getFilterValue() === true;
                                                return (
                                                    <Button
                                                        key={name}
                                                        type="button"
                                                        variant={enabled ? "default" : "outline"}
                                                        size="sm"
                                                        className="admin-filter-pill"
                                                        onClick={() => {
                                                            const col = state.table.getColumn(name);
                                                            if (col)
                                                                col.setFilterValue(enabled ? undefined : true);
                                                        }}
                                                    >
                                                        {camelToTitle(name)}
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        {/* Search + controls row */}
                                        <div className="admin-toolbar-row">
                                            <DebouncedSearch
                                                value={state.globalFilter}
                                                onChange={state.setGlobalFilter}
                                            />
                                            {state.renderColumnVisibilityToggle()}
                                            {state.renderPageSizeSelect([10, 20, 50, 100])}
                                            {state.renderExportButton("Export")}

                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* UPDATE TAB */}
            {activeTab === "update" && (
                <RegistrationForm
                    fields={registrationFormData}
                    initialData={initialDataForUpdate}
                    forceAdmin
                    showHeader={false}
                />
            )}
        </div>
    );
};

export default AdministrationPage;
