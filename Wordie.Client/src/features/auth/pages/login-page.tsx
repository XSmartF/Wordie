import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { LoginForm } from "@/features/auth/components/login-form";
import { RegisterForm } from "@/features/auth/components/register-form";
import type { LoginFormValues } from "@/features/auth/schemas";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";

type AuthTab = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loginDefaults, setLoginDefaults] = useState<Partial<LoginFormValues>>({});

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
  <div className="bg-linear-to-br from-background to-muted flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Wordie</CardTitle>
          <CardDescription className="text-center">
            Master your vocabulary faster with smart study sets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AuthTab)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <LoginForm
                defaultValues={loginDefaults}
                onSuccess={() => navigate("/", { replace: true })}
              />
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <RegisterForm
                onSuccess={(values) => {
                  setLoginDefaults({ email: values.email, password: values.password });
                  setActiveTab("login");
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
