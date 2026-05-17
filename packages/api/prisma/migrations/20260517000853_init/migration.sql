-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pendiente', 'Pagado', 'Cancelado');

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "mesReferencia" INTEGER NOT NULL,
    "anioReferencia" INTEGER NOT NULL,
    "fechaVencimiento" DATE NOT NULL,
    "estado" "PaymentStatus" NOT NULL DEFAULT 'Pendiente',
    "fechaPago" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_memberId_mesReferencia_anioReferencia_key" ON "payments"("memberId", "mesReferencia", "anioReferencia");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
