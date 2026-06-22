-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "TemplateType" AS ENUM ('PLAYER', 'TEAM');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'CLOSED', 'MODERATION_BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "templates" (
    "id" TEXT NOT NULL,
    "id_user_fk" TEXT NOT NULL,
    "template_type" "TemplateType" NOT NULL,
    "game_name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "preferred_role" TEXT,
    "rank" TEXT,
    "schedule" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "requests" (
    "id" TEXT NOT NULL,
    "id_user_fk" TEXT NOT NULL,
    "id_template_fk" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "conversations" (
    "id" TEXT NOT NULL,
    "id_first_user_fk" TEXT NOT NULL,
    "id_second_user_fk" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "id_user_sender_fk" TEXT NOT NULL,
    "id_conversation_fk" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "responses" (
    "id" TEXT NOT NULL,
    "id_user_responder_fk" TEXT NOT NULL,
    "id_conversation_fk" TEXT NOT NULL,
    "id_request_fk" TEXT NOT NULL,
    "text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_name_key" ON "users"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "templates_id_user_fk_idx" ON "templates"("id_user_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "templates_game_name_idx" ON "templates"("game_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "templates_template_type_idx" ON "templates"("template_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "requests_id_user_fk_idx" ON "requests"("id_user_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "requests_id_template_fk_idx" ON "requests"("id_template_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_id_first_user_fk_idx" ON "conversations"("id_first_user_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "conversations_id_second_user_fk_idx" ON "conversations"("id_second_user_fk");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_id_first_user_fk_id_second_user_fk_key" ON "conversations"("id_first_user_fk", "id_second_user_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_id_user_sender_fk_idx" ON "messages"("id_user_sender_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_id_conversation_fk_idx" ON "messages"("id_conversation_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "responses_id_conversation_fk_idx" ON "responses"("id_conversation_fk");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "responses_id_request_fk_idx" ON "responses"("id_request_fk");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "responses_id_user_responder_fk_id_request_fk_key" ON "responses"("id_user_responder_fk", "id_request_fk");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "templates" ADD CONSTRAINT "templates_id_user_fk_fkey" FOREIGN KEY ("id_user_fk") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_id_user_fk_fkey" FOREIGN KEY ("id_user_fk") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_id_template_fk_fkey" FOREIGN KEY ("id_template_fk") REFERENCES "templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_id_first_user_fk_fkey" FOREIGN KEY ("id_first_user_fk") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "conversations" ADD CONSTRAINT "conversations_id_second_user_fk_fkey" FOREIGN KEY ("id_second_user_fk") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_id_user_sender_fk_fkey" FOREIGN KEY ("id_user_sender_fk") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "messages" ADD CONSTRAINT "messages_id_conversation_fk_fkey" FOREIGN KEY ("id_conversation_fk") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "responses" ADD CONSTRAINT "responses_id_user_responder_fk_fkey" FOREIGN KEY ("id_user_responder_fk") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "responses" ADD CONSTRAINT "responses_id_conversation_fk_fkey" FOREIGN KEY ("id_conversation_fk") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "responses" ADD CONSTRAINT "responses_id_request_fk_fkey" FOREIGN KEY ("id_request_fk") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
