import { siteConfig } from "@/lib/site";

export function IntroSection() {
  return (
    <section>
      <h1>{siteConfig.name}</h1>
      <p>{siteConfig.description}</p>
      <p>
        Ce socle Next.js est prêt pour accueillir des chapitres, des exercices
        adaptatifs et un suivi élève quand vous serez prêt.
      </p>
    </section>
  );
}
