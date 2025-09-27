// src/components/DebouncedSearch.tsx
//
// - Renders a search input (<Input type="search" />).
// - Control it from outside via value and onChange.
// - onChange is debounced: Instead of firing on every keystroke, it waits for
//   the user to stop typing for delay ms (default 200).
// - Keeps itself in sync if the parent resets the search box (like clicking Clear Filters).
// - Fully accessible (uses aria-label="Search").

import React from "react";
import { Input } from "@/components/ui";

/**
 * DebouncedSearch
 * - Controlled externally via `value` and `onChange`
 * - Debounces calls to `onChange` by `delay` ms (default 200)
 * - Fully accessible and keyboard-friendly
 */
export type DebouncedSearchProps = {
    value: string;
    onChange: (v: string) => void;
    delay?: number;
    placeholder?: string;
    className?: string;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const DebouncedSearch: React.FC<DebouncedSearchProps> = React.memo(
    ({ value, onChange, delay = 200, placeholder = "Search…", className = "w-[260px]", inputProps }) => {
        const [local, setLocal] = React.useState(value);

        // keep local input in sync when parent value changes (e.g., "Clear Filters")
        React.useEffect(() => {
            setLocal(value);
        }, [value]);

        // debounce parent callback
        React.useEffect(() => {
            const t = setTimeout(() => onChange(local), delay);
            return () => clearTimeout(t);
        }, [local, onChange, delay]);

        return (
            <Input
                type="search"
                aria-label="Search"
                placeholder={placeholder}
                value={local}
                onChange={(e) => setLocal(e.target.value)}
                className={className}
                {...inputProps}
            />
        );
    }
);

DebouncedSearch.displayName = "DebouncedSearch";

export default DebouncedSearch;
