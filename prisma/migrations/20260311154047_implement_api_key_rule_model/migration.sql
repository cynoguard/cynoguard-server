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

-- CreateIndex
CREATE UNIQUE INDEX "api_key_rules_api_key_id_key" ON "api_key_rules"("api_key_id");

-- AddForeignKey
ALTER TABLE "api_key_rules" ADD CONSTRAINT "api_key_rules_api_key_id_fkey" FOREIGN KEY ("api_key_id") REFERENCES "api_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
