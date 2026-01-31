"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate, persistRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const role = authenticate(email, password);
    if (!role) {
      setError("Email ou mot de passe incorrect. Veuillez réessayer.");
      return;
    }

    persistRole(role);
    router.replace(`/dashboard/${role}`);
  };

  return (
    <div className="card">
      <div>
        <h1>Connexion Palimpseste</h1>
        <p>Connectez-vous pour accéder à votre tableau de bord.</p>
      </div>

      <div className="role-chip">Prof : teacher@palimpseste.fr · teacher123</div>
      <div className="role-chip">Élève : student@palimpseste.fr · student123</div>

      <form onSubmit={handleSubmit} className="actions" style={{ flexDirection: "column" }}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <div className="error">{error}</div> : null}

        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
