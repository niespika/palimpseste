-- Arrêt conservateur de la nouvelle distribution seulement. Copies et portes
-- du pilote manuel / des notions conservées, aucun contrat détruit.
begin;
update public.scriptorium_params set pilote_argument_banque_actif=false where id=1;
commit;
