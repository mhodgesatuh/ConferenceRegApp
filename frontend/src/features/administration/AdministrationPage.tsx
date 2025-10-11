// frontend/src/features/administration/AdministrationPage.tsx

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import PageTitle from "@/components/PageTitle";
import AdminTabs from "@/components/ui/AdminTabs";
import TabContent from "@/components/TabContent";
import { Button, Input } from "@/components/ui";
import type { ButtonProps } from "@/components/ui/button";
import RegistrationForm from "@/features/registration/RegistrationForm";
import { registrationFormData } from "@/data/registrationFormData";
import type { FormField } from "@/data/registrationFormData";
import { getAccessorKey } from "./table/utils";

import type { ColumnDef, FilterFn } from "@tanstack/react-table";
import { Pencil, UserPlus } from "lucide-react";

import { DataTable } from "./components/DataTable";
import PresentersTab from "./components/PresentersTab";
import RsvpUploadTab from "./components/RsvpUploadTab";
import { buildFilterKeys, buildListColumnsFromForm } from "./table/columns";
import { camelToTitleCase } from "@/lib/strings";
import { useRegistrations } from "./hooks/useRegistrations";
import { useRegistrationById } from "./hooks/useRegistrationById";
import type { Registration } from "./types";
import { useAuth } from "@/features/auth/AuthContext";
import { hasAdminPrivileges } from "@/features/auth/adminPrivileges";
import { cn } from "@/lib/utils";

interface LocationState {
    registration?: any;
}

type FilterToggleConfig = {
    name: string;
    label: string;
    exclusiveWith?: string;
};

// Set the initial number of rows displayed per page in the DataTable component.
const DEFAULT_PAGE_SIZE = 20;

type AdminTabKey = "list" | "update" | "presenters" | "rsvp";

const TAB_LABELS: Record<AdminTabKey, string> = {
    update: "Registration Form",
    list: "Registrations Table",
    presenters: "Presenters",
    rsvp: "RSVP",
};

const AdminToolbarButton: React.FC<ButtonProps> = ({
    className,
    children,
    type = "button",
    ...props
}) => (
    <Button
        type={type}
        variant="outline"
        size="sm"
        className={cn("admin-toolbar-btn admin-toolbar-btn--dark", className)}
        {...props}
    >
        {children}
    </Button>
);

const AdministrationPage: React.FC = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { registration: stateRegistration } = (state as LocationState) || {};
    const { registration: authRegistration, isAdmin: authIsAdmin } = useAuth();

    const stateIsAdmin = hasAdminPrivileges(stateRegistration);
    const isAdmin = Boolean(stateIsAdmin || authIsAdmin);

    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get("tab");
    const fallbackTab: AdminTabKey = isAdmin ? "list" : "update";
    const activeTab: AdminTabKey = rawTab === "update" || rawTab === "list" || rawTab === "presenters" || rawTab === "rsvp"
        ? (rawTab as AdminTabKey)
        : fallbackTab;
    const setActiveTab = useCallback(
        (tab: AdminTabKey) => {
            if (activeTab === tab) return;
            const next = new URLSearchParams(searchParams);
            next.set("tab", tab);
            setSearchParams(next, { replace: true });
        },
        [activeTab, searchParams, setSearchParams]
    );
    const [selected, setSelected] = useState<Registration | undefined>();
    const [creatingNew, setCreatingNew] = useState(false);
    const activeTabLabel = TAB_LABELS[activeTab];

    useEffect(() => {
        if (activeTab === "list") {
            setSelected(undefined);
            setCreatingNew(false);
        }
    }, [activeTab]);

    const { data: registrations, isLoading, error, errorStatus, reload } = useRegistrations();

    const activeRegistrationId = useMemo(() => {
        if (creatingNew) return undefined;
        const candidate = (selected as Registration | undefined)?.id
            ?? (stateRegistration as Registration | undefined)?.id
            ?? (authRegistration as Registration | undefined)?.id;
        return typeof candidate === "number" && !Number.isNaN(candidate) ? candidate : undefined;
    }, [creatingNew, selected, stateRegistration, authRegistration]);

    const { data: fetchedById, errorStatus: registrationErrorStatus } = useRegistrationById(activeRegistrationId);

    const initialDataForUpdate = creatingNew
        ? { isAttendee: true }
        : selected ?? fetchedById ?? stateRegistration ?? authRegistration;

    useEffect(() => {
        if (errorStatus === 401 || registrationErrorStatus === 401) {
            navigate("/home", { replace: true });
        }
    }, [errorStatus, registrationErrorStatus, navigate]);

    useEffect(() => {
        if (!isAdmin && (activeTab === "list" || activeTab === "presenters" || activeTab === "rsvp")) {
            setActiveTab("update");
        }
    }, [isAdmin, activeTab, setActiveTab]);

    const dynamicColsBase = useMemo(
        () => buildListColumnsFromForm<Registration>(registrationFormData as FormField[]),
        []
    );

    const filterableFieldNames = useMemo(() => {
        const seen = new Set<string>();
        return (registrationFormData as FormField[])
            .filter((field) => field.hasFilterButton)
            .map((field) => field.name)
            .filter((name): name is string => {
                if (!name) return false;
                if (seen.has(name)) return false;
                seen.add(name);
                return true;
            });
    }, []);

    const filterableFieldSet = useMemo(() => new Set(filterableFieldNames), [filterableFieldNames]);

    const boolFilterFn = useCallback<FilterFn<Registration>>((row, id, _value) => {
        const v = row.getValue(id);
        // treat "checked-only" as true; undefined means "no filter"
        return v === true || v === 1 || v === "true" || v === "1" || v === true;
    }, []);

    const dynamicCols = useMemo<ColumnDef<Registration>[]>(() => {
        return dynamicColsBase
            .filter((col) => getAccessorKey(col) !== "hasRsvp")
            .map((col) => {
                const key = getAccessorKey(col);
                if (!key || !filterableFieldSet.has(key)) return col;
                return {
                    ...col,
                    enableColumnFilter: true,
                    filterFn: boolFilterFn,
                } as ColumnDef<Registration>;
            });
    }, [dynamicColsBase, filterableFieldSet, boolFilterFn]);

    const filterToggleConfigs = useMemo<FilterToggleConfig[]>(() => {
        const configs: FilterToggleConfig[] = [];
        const seenLabels = new Set<string>();

        (registrationFormData as FormField[])
            .filter((field) => field.hasFilterButton)
            .forEach((field) => {
                const name = field.name;
                if (!name) return;

                if (name === "hasRsvp") {
                    if (!seenLabels.has("Has RSVP")) {
                        configs.push({ name: "hasRsvp", label: "Has RSVP", exclusiveWith: "hasNoRsvp" });
                        seenLabels.add("Has RSVP");
                    }
                    if (!seenLabels.has("No RSVP")) {
                        configs.push({ name: "hasNoRsvp", label: "No RSVP", exclusiveWith: "hasRsvp" });
                        seenLabels.add("No RSVP");
                    }
                    return;
                }

                const label = camelToTitleCase(name);
                if (seenLabels.has(label)) return;
                configs.push({ name, label });
                seenLabels.add(label);
            });

        return configs;
    }, []);

    const rsvpColumns = useMemo<ColumnDef<Registration>[]>(
        () => [
            {
                accessorKey: "hasRsvp",
                header: "Has RSVP",
                cell: ({ getValue }) => {
                    const value = getValue<boolean | string | number>();
                    return value == null ? "" : String(value);
                },
                enableColumnFilter: true,
                filterFn: boolFilterFn,
                meta: { clickedByDefault: true },
            },
            {
                accessorKey: "hasNoRsvp",
                header: "No RSVP",
                cell: ({ getValue }) => {
                    const value = getValue<boolean | string | number>();
                    return value == null ? "" : String(value);
                },
                enableColumnFilter: true,
                filterFn: boolFilterFn,
                meta: { clickedByDefault: false },
            },
        ],
        [boolFilterFn]
    );

    const handleNewAttendee = useCallback(() => {
        setCreatingNew(true);
        setSelected(undefined);
        setActiveTab("update");
    }, [setActiveTab, setSelected, setCreatingNew]);

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
                            setCreatingNew(false);
                            setSelected(reg);
                            setActiveTab("update");
                        }}
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                );
            },
        }),
        [setActiveTab, setSelected, setCreatingNew]
    );

    const columns = useMemo<ColumnDef<Registration>[]>(
        () => [editIconCol, ...dynamicCols, ...rsvpColumns],
        [dynamicCols, editIconCol, rsvpColumns]
    );

    const filterKeys = useMemo(() => buildFilterKeys(dynamicCols, ["hasRsvp", "hasNoRsvp"]), [dynamicCols]);

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
                id="registrationsSearch"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className="w-[260px]"
            />
        );
    };

    const handleFormSaved = useCallback(
        (regData: Record<string, any>) => {
            if (regData && regData.id != null) {
                setSelected(regData as Registration);
                setCreatingNew(false);
            }
            reload();
        },
        [reload, setSelected, setCreatingNew]
    );

    const presenters = useMemo(
        () => (registrations ?? []).filter((reg) => Boolean(reg.isPresenter)),
        [registrations]
    );

    return (
        <>
            <AdminTabs activeTab={activeTab} onSelect={setActiveTab} isAdmin={isAdmin} />

            <TabContent>
                <div className="space-y-6">
                    <PageTitle title={activeTabLabel} />

                    {activeTab === "list" && isAdmin && (
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
                                    onRowClick={(reg) => {
                                        setCreatingNew(false);
                                        setSelected(reg);
                                    }}
                                    persistKey="admin.registrations.v1"
                                    renderToolbar={(state) => (
                                        <div className="admin-toolbar">
                                            {/* Row 1: filter pills (left) + Clear Filters (right) */}
                                            <div className="admin-toolbar-row admin-toolbar-row--between">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium">Filters:</span>
                                                    {filterToggleConfigs.map(({ name, label, exclusiveWith }) => {
                                                        const column = state.table.getColumn(name);
                                                        if (!column) return null;
                                                        const enabled = column.getFilterValue() === true;
                                                        return (
                                                            <Button
                                                                key={name}
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                className={cn(
                                                                    "admin-filter-pill",
                                                                    enabled
                                                                        ? "admin-filter-pill--active"
                                                                        : "admin-filter-pill--inactive"
                                                                )}
                                                                onClick={() => {
                                                                    const nextEnabled = !enabled;
                                                                    column.setFilterValue(nextEnabled ? true : undefined);
                                                                    if (nextEnabled && exclusiveWith) {
                                                                        const otherColumn = state.table.getColumn(exclusiveWith);
                                                                        otherColumn?.setFilterValue(undefined);
                                                                    }
                                                                }}
                                                            >
                                                                {label}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Right side: Clear Filters */}
                                                <div>
                                                    <AdminToolbarButton onClick={state.clearFilters}>
                                                        Clear Filters
                                                    </AdminToolbarButton>
                                                </div>
                                            </div>
                                            {/* Row 2: search + columns + rows-per-page (left) + Export (right) */}
                                            <div className="admin-toolbar-row admin-toolbar-row--between">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <AdminToolbarButton onClick={handleNewAttendee}>
                                                        <UserPlus className="mr-1 h-4 w-4" aria-hidden="true" />
                                                        <span>+ Attendee</span>
                                                    </AdminToolbarButton>
                                                    <DebouncedSearch value={state.globalFilter} onChange={state.setGlobalFilter} />
                                                    {state.renderColumnVisibilityToggle()}
                                                    {state.renderPageSizeSelect([10, 20, 50, 100])}
                                                </div>
                                                {/* Right side: Export */}
                                                <div>
                                                    <AdminToolbarButton onClick={state.exportCSV}>
                                                        Export
                                                    </AdminToolbarButton>
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
                                onSaved={handleFormSaved}
                            />
                        </section>
                    )}

                    {activeTab === "presenters" && isAdmin && (
                        <section
                            id="tab-panel-presenters"
                            role="tabpanel"
                            aria-labelledby="tab-presenters"
                            className="space-y-4"
                        >
                            <PresentersTab presenters={presenters} isLoading={isLoading} error={error} />
                        </section>
                    )}

                    {activeTab === "rsvp" && isAdmin && (
                        <section
                            id="tab-panel-rsvp"
                            role="tabpanel"
                            aria-labelledby="tab-rsvp"
                            className="space-y-4"
                        >
                            <RsvpUploadTab />
                        </section>
                    )}
                </div>
            </TabContent>
        </>
    );
};

export default AdministrationPage;
