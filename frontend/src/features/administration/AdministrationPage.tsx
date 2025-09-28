// frontend/src/features/administration/AdministrationPage.tsx

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import PageTitle from "@/components/PageTitle";
import AdminTabs from "@/components/ui/AdminTabs";
import TabContent from "@/components/TabContent";
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

// Set the initial number of rows displayed per page in the DataTable component.
const DEFAULT_PAGE_SIZE = 20;

const TAB_LABELS: Record<'list' | 'update', string> = {
    update: "Registration Form",
    list: "Registrations Table",
};

const AdministrationPage: React.FC = () => {
    const { state } = useLocation();
    const { registration } = (state as LocationState) || {};

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") === "update" ? "update" : "list";
    const setActiveTab = useCallback(
        (tab: "list" | "update") => {
            if (activeTab === tab) return;
            const next = new URLSearchParams(searchParams);
            next.set("tab", tab);
            setSearchParams(next, { replace: true });
        },
        [activeTab, searchParams, setSearchParams]
    );
    const [selected, setSelected] = useState<Registration | undefined>();
    const activeTabLabel = TAB_LABELS[activeTab];

    useEffect(() => {
        if (activeTab === "list") {
            setSelected(undefined);
        }
    }, [activeTab]);

    const { data: registrations, isLoading, error } = useRegistrations();

    const storedId = Number(sessionStorage.getItem("regId") ?? "");
    const storedOrganizerFlag = useMemo<boolean | undefined>(() => {
        try {
            const raw = sessionStorage.getItem("regIsOrganizer");
            if (raw === null) return undefined;
            if (raw === "true" || raw === "1") return true;
            if (raw === "false" || raw === "0") return false;
            return undefined;
        } catch {
            return undefined;
        }
    }, []);
    const idFromState = registration?.id ?? (Number.isNaN(storedId) ? null : storedId);
    const { data: fetchedById } = useRegistrationById(idFromState);

    const initialDataForUpdate = selected ?? fetchedById ?? registration;
    const canViewList = Boolean(registration?.isOrganizer ?? storedOrganizerFlag);

    useEffect(() => {
        if (!canViewList && activeTab === "list") {
            setActiveTab("update");
        }
    }, [canViewList, activeTab, setActiveTab]);

    const dynamicColsBase = useMemo(
        () => buildListColumnsFromForm<Registration>(registrationFormData as FormField[]),
        []
    );

    // Static form metadata → stable memo (no deps needed)
    const booleanFieldNames = useMemo(
        () =>
            (registrationFormData as FormField[])
                .filter((f) => f.type === "checkbox" && f.name && f.list !== false)
                .map((f) => f.name),
        [] // registrationFormData is a static import
    );

    const boolFilterFn: FilterFn<Registration> = (row, id, _value) => {
        const v = row.getValue(id);
        // treat "checked-only" as true; undefined means "no filter"
        return v === true || v === 1 || v === "true" || v === "1" || v === true;
    };

    const dynamicCols = useMemo<ColumnDef<Registration>[]>(() => {
        return dynamicColsBase.map((col) => {
            const key = getAccessorKey(col);
            if (!key || !booleanFieldNames.includes(key)) return col;
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

    const columns = useMemo<ColumnDef<Registration>[]>(() => [editIconCol, ...dynamicCols], [dynamicCols, editIconCol]);

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
        <>
            <AdminTabs activeTab={activeTab} onSelect={setActiveTab} canViewList={canViewList} />

            <TabContent>
                <div className="space-y-6">
                    <PageTitle title={activeTabLabel} />

                    {activeTab === "list" && canViewList && (
                        <section
                            id="tab-panel-list"
                            role="tabpanel"
                            aria-labelledby="tab-list"
                            className="space-y-4"
                        >
                            {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
                            {error && <div className="text-sm text-red-600">Error: {error}</div>}

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
                                            {/* Row 1: filter pills (left) + Clear Filters (right) */}
                                            <div className="admin-toolbar-row admin-toolbar-row--between">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium">Filters:</span>
                                                    {booleanFieldNames.map((name) => {
                                                        const enabled = state.table.getColumn(name)?.getFilterValue() === true;
                                                        return (
                                                            <Button
                                                                key={name}
                                                                type="button"
                                                                variant={enabled ? "default" : "outline"}
                                                                size="sm"
                                                                className="admin-filter-pill"
                                                                onClick={() => {
                                                                    const col = state.table.getColumn(name);
                                                                    if (col) col.setFilterValue(enabled ? undefined : true);
                                                                }}
                                                            >
                                                                {camelToTitle(name)}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Right side: Clear Filters */}
                                                <div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="admin-toolbar-btn admin-toolbar-btn--dark"
                                                        onClick={state.clearFilters}
                                                    >
                                                        Clear Filters
                                                    </Button>
                                                </div>
                                            </div>
                                            {/* Row 2: search + columns + rows-per-page (left) + Export (right) */}
                                            <div className="admin-toolbar-row admin-toolbar-row--between">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <DebouncedSearch value={state.globalFilter} onChange={state.setGlobalFilter} />
                                                    {state.renderColumnVisibilityToggle()}
                                                    {state.renderPageSizeSelect([10, 20, 50, 100])}
                                                </div>
                                                {/* Right side: Export */}
                                                <div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="admin-toolbar-btn admin-toolbar-btn--dark"
                                                        onClick={state.exportCSV}
                                                    >
                                                        Export
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                />
                            </div>
                        </section>
                    )}

                    {activeTab === "update" && (
                        <section id="tab-panel-update" role="tabpanel" aria-labelledby="tab-update">
                            <RegistrationForm
                                fields={registrationFormData}
                                initialData={initialDataForUpdate}
                                forceAdmin
                                showHeader={false}
                            />
                        </section>
                    )}
                </div>
            </TabContent>
        </>
    );
};

export default AdministrationPage;
