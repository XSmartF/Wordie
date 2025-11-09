import { extractErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/components/ui/button";
import {
  FormBuilder,
  type FormFieldConfig,
} from "@/shared/components/form/form-builder";

import { useMemo } from "react";

import { useLoginMutation } from "../hooks/use-login";
import { loginSchema, type LoginFormValues } from "../schemas";

type LoginFormProps = {
  defaultValues?: Partial<LoginFormValues>;
  onSuccess?: () => void;
};

const defaultLoginValues: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginForm({ defaultValues, onSuccess }: LoginFormProps) {
  const mergedDefaults = useMemo(
    () => ({ ...defaultLoginValues, ...defaultValues }),
    [defaultValues]
  );

  const fields = useMemo<FormFieldConfig<LoginFormValues>[]>(
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
        name: "password",
        label: "Password",
        type: "text",
        placeholder: "Password",
        required: true,
        autoComplete: "current-password",
        inputProps: {
          type: "password",
        },
      },
    ],
    []
  );

  const loginMutation = useLoginMutation({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  const isSubmitting = loginMutation.isPending;
  const serverError = loginMutation.error ? extractErrorMessage(loginMutation.error) : null;

  return (
    <FormBuilder<LoginFormValues>
      fields={fields}
      defaultValues={mergedDefaults}
      onSubmit={(values) => loginMutation.mutate(values)}
      submitting={isSubmitting}
      schema={loginSchema}
      formOptions={{ mode: "onChange" }}
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
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      )}
    />
  );
}
