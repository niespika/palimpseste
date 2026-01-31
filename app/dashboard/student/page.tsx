"use client";

import { useRouter } from "next/navigation";
import RoleGuard from "@/app/components/RoleGuard";
import { clearRole } from "@/lib/auth";

export default function StudentDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    clearRole();
    router.replace("/login");
  };

  return (
    <RoleGuard role="student">
      <div className="card">
        <div>
          <h1>Tableau de bord Élève</h1>
          <p>Bienvenue ! Vous êtes connecté en tant qu'élève.</p>
        </div>
        <div className="actions">
          <button className="secondary" type="button" onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </div>
    </RoleGuard>
  );
}
