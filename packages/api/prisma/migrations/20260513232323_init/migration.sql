-- CreateTable
CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_total_suspension" BOOLEAN NOT NULL DEFAULT false,
    "member_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
