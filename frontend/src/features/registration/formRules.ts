// frontend/src/features/registration/formRules.ts
//
// Rules and helpers for form validation, visibility, and required-ness.
// - Field groups: PROXY_FIELDS_SET and CANCEL_FIELDS_SET define related field names.
// - isValidEmail / isValidPhone: lightweight format checks for email/phone inputs.
// - userHasUpdatePrivilege: UI-level privilege flag based on presence of any field with priv: 'update' in initial data.
// - hasAnyProxyData: detects if any proxy fields contain non-empty text.
// - canSeeField: visibility logic per field and context:
//   - Hide id until showId is true.
//   - After save (isSaved), hide proxy toggle/fields and the proxy section.
//   - Before save (!isSaved), hide cancellation-related fields.
//   - If hasProxy is false, hide all proxy fields.
//   - Hide admin-scoped fields unless the user has update privilege.
// - getVisibleFields: filters the full field list using canSeeField.
// - isFieldRequired: proxy fields become required when hasProxy is true; otherwise use each field’s required flag.
// - getRequiredFieldNames: builds the current required-field set and enforces the paired rule: at least one of Day 1 / Day 2 must be selected.
// - findMissingRequiredFields: returns names of required fields that are effectively empty (handles strings, numbers, booleans, null/undefined).
//

import {FormField} from '@/data/registrationFormData';

export const PROXY_FIELDS_SET = new Set([
    'proxyName',
    'proxyPhone',
    'proxyEmail'
]);
export const CANCEL_FIELDS_SET = new Set([
    'isCancelled',
    'cancelledAttendance',
    'cancellationReason'
]);
const PRESENTER_REQUIRED_BASE_FIELDS = new Set([
    'presenterBio',
    'presenterPicUrl',
    'session1Title',
    'session1Description',
]);

const PRESENTER_REQUIRED_SECOND_SESSION_FIELDS = new Set([
    'session2Title',
    'session2Description',
]);

export const PRESENTER_FIELDS_SET = new Set([
    ...PRESENTER_REQUIRED_BASE_FIELDS,
    'isSecondSession',
    ...PRESENTER_REQUIRED_SECOND_SESSION_FIELDS,
]);

const asBoolean = (value: unknown): boolean => value === true || value === 1 || value === '1';

/**
 * Basic email format validation
 */
export function isValidEmail(value: string): boolean {
    // Simple RFC 5322 compliant regex for email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Basic phone number validation
 */
export function isValidPhone(value: string): boolean {
    // Allow digits, spaces, dashes, parentheses and leading plus
    return /^\+?[0-9\s\-()]{7,}$/.test(value);
}

/**
 * Role/privilege rule
 */
export function userHasUpdatePrivilege(fields: FormField[], initialData?: Record<string, any>): boolean {
    return fields.some((f) => f.priv === 'update' && Boolean(initialData?.[f.name]));
}

/**
 * Proxy consistency rule
 */
export function hasAnyProxyData(state: Record<string, any>): boolean {
    return [state.proxyName, state.proxyPhone, state.proxyEmail].some(
        (v) => typeof v === 'string' && v.trim() !== ''
    );
}

/**
 * Field visibility rule for a single field
 */
export function canSeeField(
    field: FormField,
    ctx: { state: Record<string, any>; hasUpdatePrivilege: boolean; isSaved: boolean; showId: boolean }
): boolean {
    const { state, hasUpdatePrivilege, isSaved, showId } = ctx;
    const hasProxy = asBoolean(state.hasProxy);
    const isPresenter = asBoolean(state.isPresenter);

    if (!showId && field.name === 'id') return false;

    if (
        isSaved &&
        (field.name === 'hasProxy' ||
            PROXY_FIELDS_SET.has(field.name) ||
            (field.type === 'section' && field.name === 'proxy-info'))
    )
        return false;

    if (!isSaved && CANCEL_FIELDS_SET.has(field.name)) return false;
    if (!hasProxy && PROXY_FIELDS_SET.has(field.name)) return false;
    if (
        !isPresenter &&
        (PRESENTER_FIELDS_SET.has(field.name) || (field.type === 'section' && field.name === 'presenter'))
    )
        return false;
    if (field.scope === 'admin' && !hasUpdatePrivilege) return false;

    return true;
}

/**
 * Visible fields given current context
 */
export function getVisibleFields(params: {
    fields: FormField[];
    state: Record<string, any>;
    hasUpdatePrivilege: boolean;
    isSaved: boolean;
    showId: boolean;
}): FormField[] {
    const { fields, ...ctx } = params;
    return fields.filter((f) => canSeeField(f, ctx));
}

/**
 * Required-ness rule for a single field.
 */
export function isFieldRequired(field: FormField, state: Record<string, any>): boolean {
    const isProxyField = PROXY_FIELDS_SET.has(field.name);
    const hasProxy = asBoolean(state.hasProxy);
    const isPresenter = asBoolean(state.isPresenter);
    if (isProxyField && hasProxy) return true;
    if (isPresenter && PRESENTER_REQUIRED_BASE_FIELDS.has(field.name)) return true;
    if (
        isPresenter &&
        asBoolean(state.isSecondSession) &&
        PRESENTER_REQUIRED_SECOND_SESSION_FIELDS.has(field.name)
    )
        return true;
    return Boolean(field.required);
}

/**
 * Names of fields that are required right now
 */
export function getRequiredFieldNames(fields: FormField[], state: Record<string, any>): Set<string> {
    const required = new Set<string>();
    for (const f of fields) if (isFieldRequired(f, state)) required.add(f.name);

    // Special paired rule: at least one day selected
    const day1 = asBoolean(state.day1Attendee);
    const day2 = asBoolean(state.day2Attendee);
    if (!day1 && !day2) {
        required.add('day1Attendee');
        required.add('day2Attendee');
    }
    return required;
}

/**
 * Of the required fields, which are currently missing values?
 */
export function findMissingRequiredFields(
    requiredFieldNames: Set<string>,
    state: Record<string, any>
): string[] {
    const missing: string[] = [];
    for (const name of requiredFieldNames) {
        const value = state[name];
        switch (typeof value) {
            case 'string':
                if (value.trim() === '') missing.push(name);
                break;
            case 'number':
                if (value === 0) missing.push(name);
                break;
            case 'boolean':
                if (!value) missing.push(name);
                break;
            default:
                if (!value) missing.push(name);
        }
    }
    return Array.from(new Set(missing));
}
