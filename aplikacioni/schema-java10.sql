-- Java 10: kërkesa, statusi dhe sinkronizimi i vendeve.
-- Ekzekutoje në Neon pas schema-java05.sql dhe schema-java09.sql.
CREATE TABLE IF NOT EXISTS kerkesa (
  id BIGSERIAL PRIMARY KEY,
  udhetim_id TEXT NOT NULL REFERENCES udhetimet(id) ON DELETE CASCADE,
  udhetari_id TEXT NOT NULL REFERENCES profilet(github_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ne_pritje'
    CHECK (status IN ('ne_pritje', 'e_pranuar')),
  krijuar_me TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  perditesuar_me TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (udhetim_id, udhetari_id)
);

CREATE INDEX IF NOT EXISTS kerkesa_udhetim_status_idx
  ON kerkesa (udhetim_id, status);
