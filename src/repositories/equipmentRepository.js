import { readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.resolve(
    __dirname,
    "../../data/equipment.json",
);

async function readData() {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
}

async function writeData(data) {
    await writeFile(
        filePath,
        JSON.stringify(data, null, 2),
        "utf-8",
    );
}

export const equipmentRepository = {
    async findAll() {
        return readData();
    },

    async findById(id) {
        const equipment = await readData();

        return equipment.find((item) => item.id === id) ?? null;
    },

    async findBySerialNumber(serialNumber) {
        const equipment = await readData();

        return equipment.find(
            (item) => item.serialNumber === serialNumber,
        ) ?? null;
    },

    async create(data) {
        const equipment = await readData();

        const newEquipment = {
            id: randomUUID(),
            ...data,
        };

        equipment.push(newEquipment);

        await writeData(equipment);

        return newEquipment;
    },

    async update(id, data) {
        const equipment = await readData();

        const index = equipment.findIndex(
            (item) => item.id === id,
        );

        if (index === -1) {
            return null;
        }

        equipment[index] = {
            ...equipment[index],
            ...data,
            location: data.location
                ? {
                    ...equipment[index].location,
                    ...data.location,
                }
                : equipment[index].location,
        };

        await writeData(equipment);

        return equipment[index];
    },

    async delete(id) {
        const equipment = await readData();

        const index = equipment.findIndex(
            (item) => item.id === id,
        );

        if (index === -1) {
            return false;
        }

        equipment.splice(index, 1);

        await writeData(equipment);

        return true;
    },
};