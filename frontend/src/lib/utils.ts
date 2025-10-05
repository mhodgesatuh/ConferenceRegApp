// frontend/src/lib/utils.ts
//

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// The cn helper takes any number of ClassValue arguments, lets clsx turn those
// conditional/array class inputs into a single class string, and then runs that
// string through twMerge so Tailwind utility classes that conflict are resolved
// or deduplicated before being returned.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
