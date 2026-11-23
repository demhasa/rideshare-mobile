-- Java 10: kërkesat për vend, të ndara mes udhëtarit dhe shoferit.
-- Ekzekutoje pas schema.sql, schema-java05.sql dhe schema-java09.sql.
CREATE TABLE IF NOT EXISTS kerkesat (
  id BIGSERIAL PRIMARY KEY,
  udhetim_id TEXT NOT NULL REFERENCES udhetimet(id) ON DELETE CASCADE,
  udhetar_id TEXT NOT NULL REFERENCES profilet(github_id) ON DELETE CASCADE,
  statusi TEXT NOT NULL DEFAULT 'ne_pritje'
    CHECK (statusi IN ('ne_pritje', 'pranuar')),
  krijuar_me TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pranuar_me TIMESTAMPTZ,
  -- Një udhëtar ka vetëm një kërkesë për të njëjtin udhëtim.
  UNIQUE (udhetim_id, udhetar_id)
);

CREATE INDEX IF NOT EXISTS kerkesat_udhetim_id_idx ON kerkesat (udhetim_id);

-- Dy udhëtime fiktive me 2 vende: 5 për Rastet 1–2, 6 për Rastin 3.
INSERT INTO udhetimet (id, nisja, destinacioni, ora, vendtakimi, vende)
VALUES
  ('5', 'Ferizaj', 'AAB', '08:15', 'Te sheshi i qytetit', 2),
  ('6', 'Ferizaj', 'AAB', '09:30', 'Te sheshi i qytetit', 2)
ON CONFLICT (id) DO NOTHING;

-- Cakto veten si shofer pronar (zëvendëso ID_JOTE_GITHUB me ID-në nga /panel):
-- UPDATE profilet SET roli = 'shofer' WHERE github_id = 'ID_JOTE_GITHUB';
-- UPDATE udhetimet SET shofer_id = 'ID_JOTE_GITHUB' WHERE id IN ('5', '6');

-- Rikthim i udhëtimeve të provës në gjendjen fillestare (vetëm të dhëna fiktive):
-- DELETE FROM kerkesat WHERE udhetim_id IN ('5', '6');
-- UPDATE udhetimet SET vende = 2 WHERE id IN ('5', '6');

SELECT id, vende, shofer_id FROM udhetimet ORDER BY id;
