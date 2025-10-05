export const ADMIN_PRIVILEGE_FLAGS = ["isOrganizer", "isMonitor"] as const;

type RegistrationLike = Record<string, any> | null | undefined;

type AdminFlag = (typeof ADMIN_PRIVILEGE_FLAGS)[number];

type WithOptionalFlag = Partial<Record<AdminFlag, unknown>> & Record<string, any>;

export function hasAdminPrivileges(registration: RegistrationLike): boolean {
    if (!registration) return false;
    const candidate = registration as WithOptionalFlag;
    return ADMIN_PRIVILEGE_FLAGS.some((flag) => Boolean(candidate[flag]));
}
