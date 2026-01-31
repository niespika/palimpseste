"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/auth";
import { clearRole, readRole } from "@/lib/auth";

export default function RoleGuard({
  role,
  children
}: {
  role: Role;
  children: ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedRole = readRole();
    if (!storedRole) {
      router.replace("/login");
      return;
    }
    if (storedRole !== role) {
      clearRole();
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [role, router]);

  if (!ready) {
    return (
      <div className="card">
        <p>Vérification de votre accès en cours...</p>
      </div>
    );
  }

  return <>{children}</>;
}
