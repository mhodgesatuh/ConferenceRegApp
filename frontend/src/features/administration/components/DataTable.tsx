// src/features/administration/components/DataTable.tsx

import React, { useState, useEffect } from "react";
import type {
    Table as ReactTable,
    ColumnDef,
    ColumnFiltersState,
} from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    PaginationState,
    RowSelectionState,
    SortingState,
    VisibilityState,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    Settings,
} from "lucide-react";

/** Toolbar state passed to renderToolbar (generic + includes table). */
export type DataTableToolbarRenderState<T extends object = any> = {
    table: ReactTable<T>;
    globalFilter: string;
    setGlobalFilter: (v: string) => void;
    selectedCount: number;
    renderColumnVisibilityToggle: () => React.ReactNode;
    renderPageSizeSelect: (options: number[]) => React.ReactNode;
    resetAll: () => void;
};

export type DataTableProps<T extends object> = {
    data: T[];
    columns: ColumnDef<T, any>[];
    defaultPageSize?: number;
    filterKeys?: string[];
    onRowClick?: (row: T) => void;
    renderToolbar?: (state: DataTableToolbarRenderState<T>) => React.ReactNode;
    /** Optional: persist UI state (page size, global filter, column visibility & filters) */
    persistKey?: string;
};

export function DataTable<T extends object>(props: DataTableProps<T>) {
    const {
        data,
        columns,
        defaultPageSize = 20,
        filterKeys = [],
        onRowClick,
        renderToolbar,
        persistKey,
    } = props;

    // table state
    const [sorting, setSorting] = useState<SortingState>([]);
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
        const initial: VisibilityState = {};
        const collect = (cols: ColumnDef<T, any>[] | undefined) => {
            cols?.forEach((col) => {
                const id = (col as any).id ?? (col as any).accessorKey;
                const meta = (col as any).meta as { clickedByDefault?: boolean } | undefined;
                if (id && meta?.clickedByDefault !== true) {
                    initial[id as string] = false;
                }
                if ((col as any).columns) collect((col as any).columns);
            });
        };
        collect(columns);
        return initial;
    });
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: defaultPageSize,
    });
    const [globalFilter, setGlobalFilter] = useState("");
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
            pagination,
            globalFilter,
            columnFilters, // ✅ enable column filter state
        },
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters, // ✅
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        globalFilterFn: (row, _columnId, filterValue) => {
            if (!filterValue) return true;
            const needle = String(filterValue).toLowerCase();
            if (!filterKeys.length) return true;
            for (const k of filterKeys) {
                const v = (row.original as any)?.[k];
                if (v == null) continue;
                if (String(v).toLowerCase().includes(needle)) return true;
            }
            return false;
        },
    });

    const selectedCount = table.getFilteredSelectedRowModel().rows.length;

    // toolbar helpers
    const renderColumnVisibilityToggle = () => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Columns
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
                {table
                    .getAllLeafColumns()
                    .filter((c) => c.getCanHide())
                    .map((c) => (
                        <DropdownMenuCheckboxItem
                            key={c.id}
                            className="capitalize"
                            checked={c.getIsVisible()}
                            onCheckedChange={(v) => c.toggleVisibility(!!v)}
                        >
                            {c.id}
                        </DropdownMenuCheckboxItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const renderPageSizeSelect = (options: number[]) => (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
                value={String(pagination.pageSize)}
                onValueChange={(v) =>
                    setPagination((p) => ({ ...p, pageSize: Number(v), pageIndex: 0 }))
                }
            >
                <SelectTrigger className="w-[90px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                            {n}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    const resetAll = () => {
        table.resetSorting();
        table.resetGlobalFilter();
        table.resetColumnVisibility();
        setColumnFilters([]);
        setRowSelection({});
        setPagination({ pageIndex: 0, pageSize: defaultPageSize });
    };

    // --- Optional persistence: restore on mount ---
    useEffect(() => {
        if (!persistKey) return;
        try {
            const raw = localStorage.getItem(persistKey);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved.pageSize) {
                setPagination((p) => ({ ...p, pageSize: saved.pageSize, pageIndex: 0 }));
            }
            if (saved.globalFilter != null) setGlobalFilter(saved.globalFilter);
            if (saved.columnVisibility) setColumnVisibility(saved.columnVisibility);
            if (Array.isArray(saved.columnFilters)) setColumnFilters(saved.columnFilters);
        } catch {
            // ignore
        }
    }, [persistKey]);

    // --- Optional persistence: save on state changes ---
    useEffect(() => {
        if (!persistKey) return;
        try {
            localStorage.setItem(
                persistKey,
                JSON.stringify({
                    pageSize: pagination.pageSize,
                    globalFilter,
                    columnVisibility,
                    columnFilters,
                })
            );
        } catch {
            // ignore
        }
    }, [persistKey, pagination.pageSize, globalFilter, columnVisibility, columnFilters]);

    return (
        <div className="space-y-3">
            {/* Toolbar */}
            {renderToolbar?.({
                table,
                globalFilter,
                setGlobalFilter,
                selectedCount,
                renderColumnVisibilityToggle,
                renderPageSizeSelect,
                resetAll,
            })}

            {/* Table */}
            <div className="rounded-md border border-chart-4">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id} className="bg-chart-4/40">
                                {hg.headers.map((header) => {
                                    const canSort = header.column.getCanSort();
                                    const sorted = header.column.getIsSorted() as false | "asc" | "desc";
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={(canSort ? "cursor-pointer select-none " : "") + "text-gray-900"}
                                            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                                        >
                                            <div className="flex items-center gap-1">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {sorted === "asc" && <span aria-hidden>▲</span>}
                                                {sorted === "desc" && <span aria-hidden>▼</span>}
                                            </div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="even:bg-chart-4/10 hover:bg-chart-4/20 data-[state=selected]:bg-chart-4/30"
                                    onClick={() => (props.onRowClick ? onRowClick?.(row.original) : undefined)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllLeafColumns().length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium">
            {data.length ? table.getRowModel().rows[0]?.index + 1 : 0}-
                        {table.getRowModel().rows.length
                            ? table.getRowModel().rows[table.getRowModel().rows.length - 1]?.index + 1
                            : 0}
          </span>{" "}
                    of <span className="font-medium">{data.length}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="First page"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="text-sm">
            Page{" "}
                        <span className="font-medium">
              {table.getState().pagination.pageIndex + 1}
            </span>{" "}
                        of <span className="font-medium">{table.getPageCount()}</span>
          </span>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        aria-label="Last page"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* Column helper utilities for callers (selection/actions common patterns) */
DataTable.selectionColumn = function selectionColumn<T extends object>(): ColumnDef<T> {
    return {
        id: "select",
        size: 32,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
            <Checkbox
                aria-label="Select all on page"
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                aria-label={`Select row ${row.index + 1}`}
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
                onClick={(e) => e.stopPropagation()}
            />
        ),
    } as ColumnDef<T>;
};

DataTable.actionsColumn = function actionsColumn<T extends object>(
    render: (ctx: { row: any }) => React.ReactNode
): ColumnDef<T> {
    return {
        id: "actions",
        header: "",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => render({ row }),
    } as ColumnDef<T>;
};
