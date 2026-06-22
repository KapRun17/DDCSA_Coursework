-- Ограничения, которые Prisma Schema пока не выражает декларативно.
ALTER TABLE "users"
  DROP CONSTRAINT IF EXISTS "users_name_length_check",
  ADD CONSTRAINT "users_name_length_check" CHECK (char_length(btrim("name")) BETWEEN 3 AND 30),
  DROP CONSTRAINT IF EXISTS "users_email_not_blank_check",
  ADD CONSTRAINT "users_email_not_blank_check" CHECK (char_length(btrim("email")) BETWEEN 1 AND 254),
  DROP CONSTRAINT IF EXISTS "users_password_hash_not_blank_check",
  ADD CONSTRAINT "users_password_hash_not_blank_check" CHECK (char_length(btrim("password_hash")) BETWEEN 1 AND 255);

ALTER TABLE "templates"
  DROP CONSTRAINT IF EXISTS "templates_game_name_not_blank_check",
  ADD CONSTRAINT "templates_game_name_not_blank_check" CHECK (char_length(btrim("game_name")) BETWEEN 1 AND 120),
  DROP CONSTRAINT IF EXISTS "templates_title_not_blank_check",
  ADD CONSTRAINT "templates_title_not_blank_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 120),
  DROP CONSTRAINT IF EXISTS "templates_optional_fields_length_check",
  ADD CONSTRAINT "templates_optional_fields_length_check" CHECK (
    ("preferred_role" IS NULL OR char_length("preferred_role") <= 100)
    AND ("rank" IS NULL OR char_length("rank") <= 100)
    AND ("schedule" IS NULL OR char_length("schedule") <= 255)
    AND ("description" IS NULL OR char_length("description") <= 2000)
  );

ALTER TABLE "requests"
  DROP CONSTRAINT IF EXISTS "requests_title_not_blank_check",
  ADD CONSTRAINT "requests_title_not_blank_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 120),
  DROP CONSTRAINT IF EXISTS "requests_description_not_blank_check",
  ADD CONSTRAINT "requests_description_not_blank_check" CHECK (char_length(btrim("description")) BETWEEN 1 AND 2000);

ALTER TABLE "conversations"
  DROP CONSTRAINT IF EXISTS "conversations_distinct_ordered_users_check",
  ADD CONSTRAINT "conversations_distinct_ordered_users_check"
    CHECK ("id_first_user_fk" < "id_second_user_fk");

ALTER TABLE "messages"
  DROP CONSTRAINT IF EXISTS "messages_text_not_blank_check",
  ADD CONSTRAINT "messages_text_not_blank_check" CHECK (char_length(btrim("text")) BETWEEN 1 AND 1000);

ALTER TABLE "responses"
  DROP CONSTRAINT IF EXISTS "responses_text_length_check",
  ADD CONSTRAINT "responses_text_length_check" CHECK ("text" IS NULL OR char_length("text") <= 1000);

CREATE OR REPLACE FUNCTION enforce_request_template_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "templates" AS template
    WHERE template."id" = NEW."id_template_fk"
      AND template."id_user_fk" = NEW."id_user_fk"
  ) THEN
    RAISE EXCEPTION 'request template must belong to request owner'
      USING ERRCODE = '23514', CONSTRAINT = 'requests_template_owner_check';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "requests_template_owner_trigger" ON "requests";
CREATE TRIGGER "requests_template_owner_trigger"
BEFORE INSERT OR UPDATE OF "id_user_fk", "id_template_fk"
ON "requests"
FOR EACH ROW
EXECUTE FUNCTION enforce_request_template_owner();

CREATE OR REPLACE FUNCTION enforce_message_participant()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "conversations" AS conversation
    WHERE conversation."id" = NEW."id_conversation_fk"
      AND NEW."id_user_sender_fk" IN (
        conversation."id_first_user_fk",
        conversation."id_second_user_fk"
      )
  ) THEN
    RAISE EXCEPTION 'message sender must be a conversation participant'
      USING ERRCODE = '23514', CONSTRAINT = 'messages_sender_participant_check';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "messages_sender_participant_trigger" ON "messages";
CREATE TRIGGER "messages_sender_participant_trigger"
BEFORE INSERT OR UPDATE OF "id_user_sender_fk", "id_conversation_fk"
ON "messages"
FOR EACH ROW
EXECUTE FUNCTION enforce_message_participant();

CREATE OR REPLACE FUNCTION enforce_response_consistency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  request_owner_id text;
  request_status text;
BEGIN
  SELECT request."id_user_fk", request."status"::text
  INTO request_owner_id, request_status
  FROM "requests" AS request
  WHERE request."id" = NEW."id_request_fk";

  IF request_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF request_status <> 'OPEN' THEN
    RAISE EXCEPTION 'responses are accepted only for open requests'
      USING ERRCODE = '23514', CONSTRAINT = 'responses_open_request_check';
  END IF;

  IF NEW."id_user_responder_fk" = request_owner_id THEN
    RAISE EXCEPTION 'request owner cannot respond to own request'
      USING ERRCODE = '23514', CONSTRAINT = 'responses_not_request_owner_check';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM "conversations" AS conversation
    WHERE conversation."id" = NEW."id_conversation_fk"
      AND conversation."id_first_user_fk" = LEAST(NEW."id_user_responder_fk", request_owner_id)
      AND conversation."id_second_user_fk" = GREATEST(NEW."id_user_responder_fk", request_owner_id)
  ) THEN
    RAISE EXCEPTION 'response conversation must contain responder and request owner'
      USING ERRCODE = '23514', CONSTRAINT = 'responses_conversation_participants_check';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "responses_consistency_trigger" ON "responses";
CREATE TRIGGER "responses_consistency_trigger"
BEFORE INSERT OR UPDATE OF "id_user_responder_fk", "id_conversation_fk", "id_request_fk"
ON "responses"
FOR EACH ROW
EXECUTE FUNCTION enforce_response_consistency();
