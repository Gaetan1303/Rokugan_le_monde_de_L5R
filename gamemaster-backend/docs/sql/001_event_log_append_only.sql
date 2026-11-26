-- Verrou « ajout seul » pour le journal d'événements.
-- À intégrer dans la migration TypeORM du ticket S1-1 (TypeORM ne sait pas créer de triggers).
CREATE OR REPLACE FUNCTION forbid_event_log_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'event_log est en ajout seul : % interdit', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS event_log_append_only ON event_log;
CREATE TRIGGER event_log_append_only
  BEFORE UPDATE OR DELETE ON event_log
  FOR EACH ROW EXECUTE FUNCTION forbid_event_log_mutation();
-- Pour l'anonymisation RGPD (S8-3), passer par une fonction SECURITY DEFINER dédiée
-- plutôt que de lever ce verrou.
