-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('DIRECTORA', 'ECONOMA', 'CELADORA');

-- CreateEnum
CREATE TYPE "TipoBalance" AS ENUM ('COPA_DE_LECHE', 'COMEDOR_COMUN', 'COMEDOR_DIETA_ESPECIAL');

-- CreateEnum
CREATE TYPE "EstadoPlan" AS ENUM ('BORRADOR', 'ENVIADO', 'APROBADO', 'CON_OBSERVACIONES');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "usuario" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alumno" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "dieta" TEXT,

    CONSTRAINT "Alumno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAsistencia" (
    "asistenciaId" INTEGER NOT NULL,
    "alumnoId" INTEGER NOT NULL,
    "presente" BOOLEAN NOT NULL,

    CONSTRAINT "RegistroAsistencia_pkey" PRIMARY KEY ("asistenciaId","alumnoId")
);

-- CreateTable
CREATE TABLE "BalanceDiario" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" "TipoBalance" NOT NULL,
    "cantidadComensales" INTEGER NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "costoPorRacion" DECIMAL(10,2) NOT NULL,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "BalanceDiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaBalance" (
    "id" SERIAL NOT NULL,
    "nombreIngrediente" VARCHAR(100) NOT NULL,
    "pesoPorRacion" DECIMAL(10,2) NOT NULL,
    "cantidadUsada" DECIMAL(10,2) NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "balanceId" INTEGER NOT NULL,

    CONSTRAINT "LineaBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanMensual" (
    "id" SERIAL NOT NULL,
    "mes" DATE NOT NULL,
    "estado" "EstadoPlan" NOT NULL,
    "obsDirectora" TEXT,
    "usuarioId" INTEGER NOT NULL,

    CONSTRAINT "PlanMensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanSemanal" (
    "id" SERIAL NOT NULL,
    "numSemana" INTEGER NOT NULL,
    "obsEconoma" TEXT,
    "planId" INTEGER NOT NULL,

    CONSTRAINT "PlanSemanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanDiario" (
    "id" SERIAL NOT NULL,
    "numDia" INTEGER NOT NULL,
    "desayuno" TEXT,
    "almuerzo" TEXT,
    "semanaId" INTEGER NOT NULL,

    CONSTRAINT "PlanDiario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_usuario_key" ON "Usuario"("usuario");

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAsistencia" ADD CONSTRAINT "RegistroAsistencia_asistenciaId_fkey" FOREIGN KEY ("asistenciaId") REFERENCES "Asistencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAsistencia" ADD CONSTRAINT "RegistroAsistencia_alumnoId_fkey" FOREIGN KEY ("alumnoId") REFERENCES "Alumno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceDiario" ADD CONSTRAINT "BalanceDiario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaBalance" ADD CONSTRAINT "LineaBalance_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "BalanceDiario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanMensual" ADD CONSTRAINT "PlanMensual_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanSemanal" ADD CONSTRAINT "PlanSemanal_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PlanMensual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanDiario" ADD CONSTRAINT "PlanDiario_semanaId_fkey" FOREIGN KEY ("semanaId") REFERENCES "PlanSemanal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
