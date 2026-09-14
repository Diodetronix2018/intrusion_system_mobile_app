/**
 * Validators return a translation key rather than a message, so the caller
 * renders it in the active language and errors re-translate when the language
 * changes.
 */
export type ValidationError =
  | { key: string; params?: Record<string, unknown> }
  | undefined;

/** Deliberately permissive — the server is the real authority on addresses. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const MIN_PASSWORD_LENGTH = 8;

export const isEmail = (value: string) => EMAIL_RE.test(value.trim());

export function validateRequired(
  value: string,
  field: string,
): ValidationError {
  return value.trim() ? undefined : { key: 'validation.required', params: { field } };
}

export function validateEmail(value: string, field: string): ValidationError {
  const required = validateRequired(value, field);
  if (required) {
    return required;
  }
  return isEmail(value) ? undefined : { key: 'validation.invalidEmail' };
}

export function validatePassword(
  value: string,
  field: string,
): ValidationError {
  const required = validateRequired(value, field);
  if (required) {
    return required;
  }
  return value.length >= MIN_PASSWORD_LENGTH
    ? undefined
    : {
        key: 'validation.passwordTooShort',
        params: { count: MIN_PASSWORD_LENGTH },
      };
}

export function validateMatch(
  value: string,
  other: string,
): ValidationError {
  return value === other ? undefined : { key: 'validation.passwordMismatch' };
}
