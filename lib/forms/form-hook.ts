import { createFormHook, createFormHookContexts } from '@tanstack/react-form';

import { PathSelectorField } from '@/components/repositories/path-selector-field';
import { CheckboxField } from '@/components/ui/form/checkbox-field';
import { FormError } from '@/components/ui/form/form-error';
import { NumberFieldComponent } from '@/components/ui/form/number-field';
import { SelectField } from '@/components/ui/form/select-field';
import { SubmitButton } from '@/components/ui/form/submit-button';
import { SwitchField } from '@/components/ui/form/switch-field';
import { TextField } from '@/components/ui/form/text-field';
import { TextareaField } from '@/components/ui/form/textarea-field';

export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    CheckboxField,
    NumberField: NumberFieldComponent,
    PathSelectorField,
    SelectField,
    SwitchField,
    TextareaField,
    TextField,
  },
  fieldContext,
  formComponents: {
    FormError,
    SubmitButton,
  },
  formContext,
});
