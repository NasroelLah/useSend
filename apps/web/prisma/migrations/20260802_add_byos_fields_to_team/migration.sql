-- AddColumns: BYOS credentials on Team
ALTER TABLE "Team"
  ADD COLUMN IF NOT EXISTS "byosAccessKeyId" TEXT,
  ADD COLUMN IF NOT EXISTS "byosSecretKey"   TEXT,
  ADD COLUMN IF NOT EXISTS "byosRegion"      TEXT;
