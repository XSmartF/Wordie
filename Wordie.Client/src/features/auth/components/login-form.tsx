import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { extractErrorMessage } from "@/shared/api/http-client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

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
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { ...defaultLoginValues, ...defaultValues },
    mode: "onChange",
  });

  const loginMutation = useLoginMutation({
    onSuccess: () => {
      onSuccess?.();
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({ ...defaultLoginValues, ...defaultValues });
    }
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    loginMutation.mutate(values);
  });

  const isSubmitting = loginMutation.isPending;
  const serverError = loginMutation.error ? extractErrorMessage(loginMutation.error) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          disabled={isSubmitting}
          aria-invalid={form.formState.errors.email ? true : undefined}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          disabled={isSubmitting}
          aria-invalid={form.formState.errors.password ? true : undefined}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-sm text-destructive">{serverError}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
