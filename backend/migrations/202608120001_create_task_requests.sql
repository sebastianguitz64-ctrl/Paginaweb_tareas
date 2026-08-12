CREATE TABLE IF NOT EXISTS task_requests (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 100),
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 2 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_requests_created_at_idx
  ON task_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS task_requests_status_idx
  ON task_requests (status);
