-- CreateTable
CREATE TABLE "sports" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cupoMaximo" INTEGER NOT NULL,
    "precioAdicional" DOUBLE PRECISION NOT NULL,
    "esFederado" BOOLEAN NOT NULL,
    "requires_medical_certificate" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sports_nombre_key" ON "sports"("nombre");
