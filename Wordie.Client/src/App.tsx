import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";

import { router } from "./router";
import { AppProviders } from "@/shared/providers/app-providers";
import { Toaster } from "@/shared/components/ui/sonner";

const App = () => (
  <AppProviders>
    <Suspense fallback={null}>
      <RouterProvider router={router} />
    </Suspense>
    <Toaster richColors position="top-right" />
  </AppProviders>
);

export default App;
