-- CreateTable
CREATE TABLE "detections" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "signals" JSONB NOT NULL,
    "is_human" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "detections" ADD CONSTRAINT "detections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
