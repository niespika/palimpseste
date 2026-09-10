-- Arrêt réversible : conserve contrats, textes et jugements pour la reprise.
begin;
update public.scriptorium_params set pilote_argument_actif=false where id=1;
commit;
