-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'MOBILE', 'TABLET', 'BOT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('X');

-- CreateEnum
CREATE TYPE "MentionStatus" AS ENUM ('NEW', 'VIEWED', 'DISMISSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('SUCCESS', 'FAILED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "WatchDomainStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TldStrategy" AS ENUM ('SAME_TLD_ONLY', 'ALLOWLIST', 'MIXED');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('ALGO', 'GEMINI', 'MANUAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('SUSPICIOUS_DOMAIN');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebase_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "business_type" TEXT,
    "primary_uses" TEXT[],
    "team_size" TEXT,
    "discover_source" TEXT,
    "offer_code" TEXT,
    "is_onboarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "industry" TEXT,
    "environment" TEXT NOT NULL,
    "primary_domain" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detections" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "session_id" TEXT,
    "ip_address" TEXT NOT NULL,
    "country_code" TEXT,
    "city" TEXT,
    "user_agent" TEXT NOT NULL,
    "device_type" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "is_headless" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL,
    "risk_level" "RiskLevel" NOT NULL,
    "action" TEXT NOT NULL,
    "is_human" BOOLEAN NOT NULL,
    "challenge_count" INTEGER NOT NULL DEFAULT 0,
    "challenge_solved" BOOLEAN NOT NULL DEFAULT false,
    "time_to_solve" INTEGER NOT NULL DEFAULT 0,
    "signals" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_attempts" (
    "id" TEXT NOT NULL,
    "detection_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answered_at" TIMESTAMP(3),
    "success" BOOLEAN NOT NULL,
    "time_to_solve" INTEGER,

    CONSTRAINT "challenge_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_bank" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "difficulty_level" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "challenge_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_rules" (
    "id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "strictness" TEXT NOT NULL DEFAULT 'balanced',
    "persistence" INTEGER NOT NULL DEFAULT 48,
    "signals" JSONB NOT NULL DEFAULT '{}',
    "whitelist" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_keywords" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_keywords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_mentions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'X',
    "external_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_username" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "tweet_url" TEXT,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "retweet_count" INTEGER NOT NULL DEFAULT 0,
    "risk_score" INTEGER NOT NULL DEFAULT 0,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "risk_flags" TEXT[],
    "status" "MentionStatus" NOT NULL DEFAULT 'NEW',
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "matched_keyword" TEXT,
    "published_at" TIMESTAMP(3),
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scan_logs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'X',
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'SUCCESS',
    "mentions_found" INTEGER NOT NULL DEFAULT 0,
    "high_risk_count" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "label" TEXT,
    "status" "WatchDomainStatus" NOT NULL DEFAULT 'ACTIVE',
    "tld_strategy" "TldStrategy" NOT NULL DEFAULT 'MIXED',
    "tld_allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tld_suspicious" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "similarity_threshold" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watchlist_entries" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "official_domain_raw" TEXT NOT NULL,
    "official_domain_normalized" TEXT NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "interval_hours" INTEGER NOT NULL DEFAULT 24,
    "candidate_count" INTEGER NOT NULL DEFAULT 100,
    "similarity_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "tld_strategy" "TldStrategy" NOT NULL DEFAULT 'SAME_TLD_ONLY',
    "tld_allowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tld_suspicious" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_scan_at" TIMESTAMP(3),
    "last_scan_status" TEXT,
    "next_run_at" TIMESTAMP(3),
    "suspicious_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watchlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_domains" (
    "id" TEXT NOT NULL,
    "watch_domain_id" TEXT,
    "watchlist_entry_id" TEXT,
    "domain" TEXT NOT NULL,
    "tld" TEXT NOT NULL,
    "source" "CandidateSource" NOT NULL,
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "rdap_registered" BOOLEAN,
    "rdap_checked_at" TIMESTAMP(3),
    "rdap_status" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rdap_raw" JSONB,
    "risk_level" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domain_scan_logs" (
    "id" TEXT NOT NULL,
    "watchlist_entry_id" TEXT NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "summary" JSONB,

    CONSTRAINT "domain_scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "watch_domain_id" TEXT NOT NULL,
    "candidate_domain_id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_id_key" ON "users"("firebase_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "projects_name_organization_id_key" ON "projects"("name", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "detections_project_id_created_at_idx" ON "detections"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "detections_project_id_action_idx" ON "detections"("project_id", "action");

-- CreateIndex
CREATE INDEX "detections_project_id_country_code_idx" ON "detections"("project_id", "country_code");

-- CreateIndex
CREATE INDEX "detections_project_id_is_human_idx" ON "detections"("project_id", "is_human");

-- CreateIndex
CREATE INDEX "detections_session_id_idx" ON "detections"("session_id");

-- CreateIndex
CREATE INDEX "detections_ip_address_idx" ON "detections"("ip_address");

-- CreateIndex
CREATE INDEX "challenge_attempts_detection_id_idx" ON "challenge_attempts"("detection_id");

-- CreateIndex
CREATE INDEX "challenge_attempts_challenge_id_idx" ON "challenge_attempts"("challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_bank_value_key" ON "challenge_bank"("value");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_user_id_organization_id_key" ON "organization_members"("user_id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_rules_api_key_id_key" ON "api_key_rules"("api_key_id");

-- CreateIndex
CREATE INDEX "monitoring_keywords_project_id_idx" ON "monitoring_keywords"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_keywords_project_id_keyword_key" ON "monitoring_keywords"("project_id", "keyword");

-- CreateIndex
CREATE INDEX "brand_mentions_project_id_risk_level_idx" ON "brand_mentions"("project_id", "risk_level");

-- CreateIndex
CREATE INDEX "brand_mentions_project_id_status_idx" ON "brand_mentions"("project_id", "status");

-- CreateIndex
CREATE INDEX "brand_mentions_project_id_sentiment_idx" ON "brand_mentions"("project_id", "sentiment");

-- CreateIndex
CREATE INDEX "brand_mentions_project_id_matched_keyword_idx" ON "brand_mentions"("project_id", "matched_keyword");

-- CreateIndex
CREATE UNIQUE INDEX "brand_mentions_project_id_external_id_key" ON "brand_mentions"("project_id", "external_id");

-- CreateIndex
CREATE INDEX "scan_logs_project_id_idx" ON "scan_logs"("project_id");

-- CreateIndex
CREATE INDEX "watch_domains_tenant_id_status_idx" ON "watch_domains"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "watch_domains_tenant_id_domain_key" ON "watch_domains"("tenant_id", "domain");

-- CreateIndex
CREATE INDEX "watchlist_entries_project_id_active_idx" ON "watchlist_entries"("project_id", "active");

-- CreateIndex
CREATE INDEX "watchlist_entries_next_run_at_idx" ON "watchlist_entries"("next_run_at");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_entries_project_id_official_domain_normalized_key" ON "watchlist_entries"("project_id", "official_domain_normalized");

-- CreateIndex
CREATE INDEX "candidate_domains_watch_domain_id_idx" ON "candidate_domains"("watch_domain_id");

-- CreateIndex
CREATE INDEX "candidate_domains_watchlist_entry_id_idx" ON "candidate_domains"("watchlist_entry_id");

-- CreateIndex
CREATE INDEX "candidate_domains_domain_idx" ON "candidate_domains"("domain");

-- CreateIndex
CREATE INDEX "candidate_domains_risk_level_idx" ON "candidate_domains"("risk_level");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_domains_watch_domain_id_domain_key" ON "candidate_domains"("watch_domain_id", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_domains_watchlist_entry_id_domain_key" ON "candidate_domains"("watchlist_entry_id", "domain");

-- CreateIndex
CREATE INDEX "domain_scan_logs_watchlist_entry_id_scanned_at_idx" ON "domain_scan_logs"("watchlist_entry_id", "scanned_at");

-- CreateIndex
CREATE INDEX "alerts_tenant_id_user_id_is_read_idx" ON "alerts"("tenant_id", "user_id", "is_read");

-- CreateIndex
CREATE INDEX "alerts_watch_domain_id_created_at_idx" ON "alerts"("watch_domain_id", "created_at");

-- CreateIndex
CREATE INDEX "alerts_candidate_domain_id_idx" ON "alerts"("candidate_domain_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_attempts" ADD CONSTRAINT "challenge_attempts_detection_id_fkey" FOREIGN KEY ("detection_id") REFERENCES "detections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_attempts" ADD CONSTRAINT "challenge_attempts_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenge_bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_rules" ADD CONSTRAINT "api_key_rules_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_keywords" ADD CONSTRAINT "monitoring_keywords_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_mentions" ADD CONSTRAINT "brand_mentions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchlist_entries" ADD CONSTRAINT "watchlist_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_domains" ADD CONSTRAINT "candidate_domains_watch_domain_id_fkey" FOREIGN KEY ("watch_domain_id") REFERENCES "watch_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_domains" ADD CONSTRAINT "candidate_domains_watchlist_entry_id_fkey" FOREIGN KEY ("watchlist_entry_id") REFERENCES "watchlist_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_scan_logs" ADD CONSTRAINT "domain_scan_logs_watchlist_entry_id_fkey" FOREIGN KEY ("watchlist_entry_id") REFERENCES "watchlist_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_watch_domain_id_fkey" FOREIGN KEY ("watch_domain_id") REFERENCES "watch_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_candidate_domain_id_fkey" FOREIGN KEY ("candidate_domain_id") REFERENCES "candidate_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

