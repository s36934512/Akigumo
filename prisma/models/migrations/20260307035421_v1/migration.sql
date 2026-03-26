-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'RUNNING');

-- CreateEnum
CREATE TYPE "ActionCategory" AS ENUM ('AUTH', 'DATA_OP', 'FILE_IO', 'SECURITY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('UPLOADING', 'PENDING', 'AVAILABLE', 'IN_USE', 'PROCESSING', 'SCANNING', 'LOCKED', 'FAILED', 'REJECTED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('WORK', 'SERIES', 'COLLECTION', 'FILE_CONTAINER');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ONGOING', 'COMPLETED', 'HIATUS', 'UPCOMING', 'DRAFT', 'PRIVATE', 'ACTIVE', 'ARCHIVED', 'LOCKED', 'HIDDEN', 'PROCESSING', 'DELETED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('DISPATCHED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'LOCKED', 'SUSPENDED', 'DELETED');

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "message" TEXT,
    "payload" JSONB,
    "correlation_id" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ActionStatus" NOT NULL DEFAULT 'PENDING',
    "severity" "Severity" NOT NULL DEFAULT 'LOW',
    "session_id" UUID,
    "action_id" INTEGER NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ActionCategory" NOT NULL,

    CONSTRAINT "action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_time" TIMESTAMP(3) NOT NULL,
    "verified_time" TIMESTAMP(3),
    "verified_by" UUID,

    CONSTRAINT "entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "original_name" TEXT,
    "system_name" TEXT,
    "physical_path" TEXT,
    "size" BIGINT,
    "checksum" TEXT,
    "is_original" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "status" "FileStatus" NOT NULL,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_time" TIMESTAMP(3) NOT NULL,
    "last_scanned_time" TIMESTAMP(3),
    "file_extension_id" INTEGER NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_category" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "file_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_extension" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "mimeType" TEXT,
    "name" TEXT,
    "description" TEXT,
    "file_category_id" INTEGER NOT NULL,

    CONSTRAINT "file_extension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "type" "ItemType" NOT NULL,
    "status" "ItemStatus" NOT NULL,
    "published_time" TIMESTAMP(3),
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox" (
    "id" BIGSERIAL NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_time" TIMESTAMP(3) NOT NULL,
    "scheduled_time" TIMESTAMP(3),

    CONSTRAINT "outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_state" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "workflow_id" TEXT NOT NULL,
    "correlation_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "snapshot" JSONB,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "updated_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "redundancy" JSONB,
    "created_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_status_changed_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "password_hash" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "redundancy" JSONB,
    "last_status_changed_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" UUID NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "current_hash" TEXT NOT NULL,
    "history_hashes" TEXT[],
    "ip_address" TEXT,
    "raw_user_agent" TEXT,
    "device_type" TEXT,
    "os_name" TEXT,
    "browser_name" TEXT,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_time" TIMESTAMP(3),
    "expires_time" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "redundancy" JSONB,
    "user_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_log_correlation_id_idx" ON "audit_log"("correlation_id");

-- CreateIndex
CREATE INDEX "audit_log_severity_idx" ON "audit_log"("severity");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "action_code_key" ON "action"("code");

-- CreateIndex
CREATE UNIQUE INDEX "file_category_code_key" ON "file_category"("code");

-- CreateIndex
CREATE UNIQUE INDEX "file_extension_code_key" ON "file_extension"("code");

-- CreateIndex
CREATE INDEX "outbox_status_created_time_idx" ON "outbox"("status", "created_time");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_state_correlation_id_key" ON "workflow_state"("correlation_id");

-- CreateIndex
CREATE INDEX "workflow_state_workflow_id_status_idx" ON "workflow_state"("workflow_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_provider_user_id_key" ON "account"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_current_hash_key" ON "session"("current_hash");

-- CreateIndex
CREATE INDEX "history_hashes_gin_idx" ON "session" USING GIN ("history_hashes");

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity" ADD CONSTRAINT "entity_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_file_extension_id_fkey" FOREIGN KEY ("file_extension_id") REFERENCES "file_extension"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_extension" ADD CONSTRAINT "file_extension_file_category_id_fkey" FOREIGN KEY ("file_category_id") REFERENCES "file_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
