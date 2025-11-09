import { useCallback, useMemo, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";

import { extractErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/components/ui/button";
import {
  FormBuilder,
  type FormFieldConfig,
} from "@/shared/components/form/form-builder";

import { useRegisterMutation } from "../hooks/use-register";
import { registerSchema, type RegisterFormValues } from "../schemas";

type RegisterFormProps = {
  onSuccess?: (values: RegisterFormValues) => void;
};

const defaultRegisterValues: RegisterFormValues = {
  email: "",
  password: "",
  displayName: "",
};

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const formRef = useRef<UseFormReturn<RegisterFormValues> | null>(null);

  const fields = useMemo<FormFieldConfig<RegisterFormValues>[]>(
    () => [
      {
        name: "email",
        label: "Email",
        type: "text",
        placeholder: "Email",
        required: true,
        autoComplete: "email",
        inputProps: {
          type: "email",
        },
      },
      {
        name: "displayName",
        label: "Display name",
        type: "text",
        placeholder: "Display name",
        required: true,
        autoComplete: "name",
      },
      {
        name: "password",
        label: "Password",
        type: "text",
        placeholder: "Password",
        required: true,
        autoComplete: "new-password",
        inputProps: {
          type: "password",
        },
      },
    ],
    []
  );

  const registerMutation = useRegisterMutation({
    onSuccess: (values) => {
      onSuccess?.(values);
      formRef.current?.reset(defaultRegisterValues);
    },
  });

  const isSubmitting = registerMutation.isPending;
  const serverError = registerMutation.error
    ? extractErrorMessage(registerMutation.error)
    : null;

  const handleFormReady = useCallback((form: UseFormReturn<RegisterFormValues>) => {
    formRef.current = form;
  }, []);

  return (
    <FormBuilder<RegisterFormValues>
      fields={fields}
      defaultValues={defaultRegisterValues}
      schema={registerSchema}
      submitting={isSubmitting}
      formOptions={{ mode: "onChange" }}
      onSubmit={(values) => registerMutation.mutate(values)}
      onFormReady={handleFormReady}
      renderFooter={(formInstance) => (
        <div className="space-y-4">
          {serverError ? (
            <p className="text-sm text-destructive">{serverError}</p>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !formInstance.formState.isValid}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </div>
      )}
    />
  );
}
