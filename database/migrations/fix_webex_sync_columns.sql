-- Rename camelCase webex_sync columns to snake_case (matches Sequelize underscored convention)

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'userId'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "userId" TO user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'accessToken'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "accessToken" TO access_token;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'refreshToken'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "refreshToken" TO refresh_token;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'tokenType'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "tokenType" TO token_type;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'expiresIn'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "expiresIn" TO expires_in;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'expiresAt'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "expiresAt" TO expires_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'webexUserId'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "webexUserId" TO webex_user_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'webexUserEmail'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "webexUserEmail" TO webex_user_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'webexDisplayName'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "webexDisplayName" TO webex_display_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'isActive'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "isActive" TO is_active;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'lastSyncAt'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "lastSyncAt" TO last_sync_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'syncEnabled'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "syncEnabled" TO sync_enabled;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "createdAt" TO created_at;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webex_sync' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE webex_sync RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
END $$;
