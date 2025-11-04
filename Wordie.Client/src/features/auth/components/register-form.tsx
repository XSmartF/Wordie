import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { extractErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

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
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: defaultRegisterValues,
    mode: "onChange",
  });

  const registerMutation = useRegisterMutation({
    onSuccess: (values) => {
      onSuccess?.(values);
      form.reset(defaultRegisterValues);
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    registerMutation.mutate(values);
  });

  const isSubmitting = registerMutation.isPending;
  const serverError = registerMutation.error
    ? extractErrorMessage(registerMutation.error)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={form.formState.errors.email ? true : undefined}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          type="text"
          autoComplete="name"
          disabled={isSubmitting}
          aria-invalid={form.formState.errors.displayName ? true : undefined}
          {...form.register("displayName")}
        />
        {form.formState.errors.displayName ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.displayName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          aria-invalid={form.formState.errors.password ? true : undefined}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-destructive">{serverError}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
