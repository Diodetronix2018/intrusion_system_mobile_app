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

/** Indian mobile numbers are exactly ten digits and start 6-9. */
export const INDIAN_MOBILE_LENGTH = 10;
const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

/**
 * Reduces user input to the ten national digits: drops spaces, dashes and
 * brackets, then strips a +91 / 91 / 0 trunk prefix if one was typed.
 */
export function normalizeIndianMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length > INDIAN_MOBILE_LENGTH) {
    if (digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.startsWith('0')) {
      return digits.replace(/^0+/, '');
    }
  }
  return digits;
}

export function validateIndianMobile(value: string): ValidationError {
  const digits = normalizeIndianMobile(value);
  if (!digits) {
    return { key: 'validation.phoneRequired' };
  }
  if (digits.length !== INDIAN_MOBILE_LENGTH) {
    return {
      key: 'validation.phoneLength',
      params: { count: INDIAN_MOBILE_LENGTH },
    };
  }
  if (!INDIAN_MOBILE_RE.test(digits)) {
    return { key: 'validation.phoneInvalid' };
  }
  return undefined;
}

export function validateMatch(
  value: string,
  other: string,
): ValidationError {
  return value === other ? undefined : { key: 'validation.passwordMismatch' };
}
