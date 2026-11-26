-- Java 11: përgjigjja e shoferit bëhet njoftim personal për udhëtarin.
-- Ekzekutoje pas schema.sql, schema-java05.sql, schema-java09.sql dhe schema-java10.sql.
CREATE TABLE IF NOT EXISTS njoftimet (
  id BIGSERIAL PRIMARY KEY,
  -- Marrësi vendoset nga serveri (udhëtari i kërkesës), jo nga telefoni.
  marres_id TEXT NOT NULL REFERENCES profilet(github_id) ON DELETE CASCADE,
  kerkesa_id BIGINT NOT NULL REFERENCES kerkesat(id) ON DELETE CASCADE,
  lloji TEXT NOT NULL CHECK (lloji IN ('pranuar')),
  krijuar_me TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL derisa marrësi ta hapë dhe serveri ta konfirmojë.
  lexuar_me TIMESTAMPTZ,
  -- E njëjta përgjigje për të njëjtën kërkesë krijon vetëm një njoftim.
  UNIQUE (kerkesa_id, lloji)
);

CREATE INDEX IF NOT EXISTS njoftimet_marres_idx ON njoftimet (marres_id, krijuar_me DESC);

-- Udhëtim fiktiv i ri me 2 vende për Rastin 3 të javës 11.
INSERT INTO udhetimet (id, nisja, destinacioni, ora, vendtakimi, vende)
VALUES ('7', 'Ferizaj', 'AAB', '10:45', 'Te sheshi i qytetit', 2)
ON CONFLICT (id) DO NOTHING;

-- Cakto veten si pronar edhe të udhëtimit 7 (zëvendëso ID_JOTE_GITHUB):
-- UPDATE udhetimet SET shofer_id = 'ID_JOTE_GITHUB' WHERE id = '7';

-- Kontrolli i dyfishimeve (duhet të kthejë 0 rreshta):
-- SELECT kerkesa_id, lloji, COUNT(*) FROM njoftimet GROUP BY 1, 2 HAVING COUNT(*) > 1;

SELECT id, marres_id, kerkesa_id, lloji, krijuar_me, lexuar_me
FROM njoftimet ORDER BY id;
