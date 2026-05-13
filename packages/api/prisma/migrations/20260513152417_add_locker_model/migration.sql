-- CreateEnum
CREATE TYPE "LockerEstado" AS ENUM ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "LockerUbicacion" AS ENUM ('VESTUARIO_MASCULINO', 'VESTUARIO_FEMENINO', 'NINOS');

-- CreateTable
CREATE TABLE "lockers" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ubicacion" "LockerUbicacion" NOT NULL,
    "estado" "LockerEstado" NOT NULL DEFAULT 'DISPONIBLE',
    "fechaFinContrato" DATE,
    "member_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lockers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lockers_numero_key" ON "lockers"("numero");

-- AddForeignKey
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
