import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getToken } from "@/lib/multiplex/client";

export const Route = createFileRoute("/app")({
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (token) {
      void navigate({ to: "/inicio" });
    } else {
      void navigate({ to: "/entrar" });
    }
  }, [navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-sm text-muted-foreground">
      Carregando VENDRA by BonaSoft...
    </div>
  );
}
