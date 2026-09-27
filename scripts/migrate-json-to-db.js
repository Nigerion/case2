import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  sequelize,
  Site,
  Equipment,
  MaintenanceRequest,
} from "../src/models/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");

async function readJson(name) {
    try {
        const content = await readFile(path.join(dataDir, name), "utf-8");
        return JSON.parse(content);
    } catch (error) {
        if (error.code === "ENOENT") {
        console.warn(`[skip] File ${name} not found`);
        return [];
        }
        throw error;
    }
}

async function main() {
    await sequelize.authenticate();
    console.log("Connected to DB");

    /* 1. Площадка по умолчанию — для оборудования из Кейса 2 */
    const [defaultSite] = await Site.findOrCreate({
        where: { code: "DEFAULT" },
        defaults: {
        name: "Площадка по умолчанию",
        code: "DEFAULT",
        region: "Не указан",
        latitude: 55.75,
        longitude: 37.61,
        },
    });
    console.log(`Default site id: ${defaultSite.id}`);

    /* 2. Оборудование */
    const equipmentList = await readJson("equipment.json");
    let equipmentImported = 0;

    for (const e of equipmentList) {
        const [, created] = await Equipment.findOrCreate({
        where: { serialNumber: e.serialNumber },
        defaults: {
            id: e.id,
            siteId: defaultSite.id,
            name: e.name,
            type: e.type,
            serialNumber: e.serialNumber,
            status: e.status,
            installedAt: new Date(e.installedAt),
        },
        });
        if (created) equipmentImported++;
    }
    console.log(`Equipment imported: ${equipmentImported}/${equipmentList.length}`);

    /* 3. Заявки */
    const requests = await readJson("requests.json");
    let requestsImported = 0;

    for (const r of requests) {
        const [, created] = await MaintenanceRequest.findOrCreate({
        where: { id: r.id },
        defaults: {
            id: r.id,
            equipmentId: r.equipmentId,
            title: r.title,
            description: r.description ?? "",
            priority: r.priority,
            status: r.status,
            plannedAt: r.plannedAt ? new Date(r.plannedAt) : null,
            closedAt:
            r.status === "done" || r.status === "rejected"
                ? new Date(r.updatedAt)
                : null,
            author: "imported",
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
        },
        });
        if (created) requestsImported++;
    }
    console.log(`Requests imported: ${requestsImported}/${requests.length}`);

    console.log("Import completed");
    await sequelize.close();
}

main().catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
});