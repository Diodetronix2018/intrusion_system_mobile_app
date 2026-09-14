import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { ValidationError } from './validation';

/** Turns a ValidationError into a message in the active language. */
export function useValidationMessage() {
  const { t } = useTranslation();
  return useCallback(
    (error: ValidationError) => (error ? t(error.key, error.params) : undefined),
    [t],
  );
}
