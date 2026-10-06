-- Transforma Developer.skills e Project.technologies (TEXT[]) na tabela Technology
-- com relações N:N, preservando os dados existentes.
-- Nomes são normalizados (trim + case-insensitive); mantém-se a grafia mais usada.

-- CreateTable
CREATE TABLE "Technology" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Technology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DeveloperToTechnology" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DeveloperToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectToTechnology" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ProjectToTechnology_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Technology_name_key" ON "Technology"("name");

-- CreateIndex
CREATE INDEX "_DeveloperToTechnology_B_index" ON "_DeveloperToTechnology"("B");

-- CreateIndex
CREATE INDEX "_ProjectToTechnology_B_index" ON "_ProjectToTechnology"("B");

-- AddForeignKey
ALTER TABLE "_DeveloperToTechnology" ADD CONSTRAINT "_DeveloperToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "Developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DeveloperToTechnology" ADD CONSTRAINT "_DeveloperToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToTechnology" ADD CONSTRAINT "_ProjectToTechnology_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToTechnology" ADD CONSTRAINT "_ProjectToTechnology_B_fkey" FOREIGN KEY ("B") REFERENCES "Technology"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data migration: popula Technology com os nomes distintos (normalizados)
INSERT INTO "Technology" ("name", "updatedAt")
SELECT canonical, CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON (lower(name)) name AS canonical
    FROM (
        SELECT btrim(unnest("skills")) AS name FROM "Developer"
        UNION ALL
        SELECT btrim(unnest("technologies")) AS name FROM "Project"
    ) AS all_names
    WHERE name <> ''
    GROUP BY name
    ORDER BY lower(name), count(*) DESC, name
) AS picked;

-- Data migration: vínculos
INSERT INTO "_DeveloperToTechnology" ("A", "B")
SELECT DISTINCT d."id", t."id"
FROM "Developer" d
CROSS JOIN LATERAL unnest(d."skills") AS s(name)
JOIN "Technology" t ON lower(t."name") = lower(btrim(s.name));

INSERT INTO "_ProjectToTechnology" ("A", "B")
SELECT DISTINCT p."id", t."id"
FROM "Project" p
CROSS JOIN LATERAL unnest(p."technologies") AS s(name)
JOIN "Technology" t ON lower(t."name") = lower(btrim(s.name));

-- AlterTable (agora seguro: dados já copiados)
ALTER TABLE "Developer" DROP COLUMN "skills";
ALTER TABLE "Project" DROP COLUMN "technologies";
