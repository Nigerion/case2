import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const dataPath = path.resolve(currentDir, "../../data/requests.json");

async function readRequests() {
  const content = await readFile(dataPath, "utf8");
  return JSON.parse(content);
}

async function writeRequests(requests) {
  await writeFile(
    dataPath,
    JSON.stringify(requests, null, 2),
    "utf8",
  );
}

export const requestRepository = {
  async findAll() {
    return readRequests();
  },

  async findById(id) {
    const requests = await readRequests();

    return requests.find((request) => request.id === id) ?? null;
  },

  async findByEquipmentId(equipmentId) {
    const requests = await readRequests();

    return requests.filter(
      (request) => request.equipmentId === equipmentId,
    );
  },

  async create(data) {
    const requests = await readRequests();
    const now = new Date().toISOString();

    const request = {
      id: randomUUID(),
      equipmentId: data.equipmentId,
      title: data.title,
      description: data.description ?? "",
      priority: data.priority,
      status: "new",
      ...(data.plannedAt && { plannedAt: data.plannedAt }),
      createdAt: now,
      updatedAt: now,
    };

    requests.push(request);

    await writeRequests(requests);

    return request;
  },

  async update(id, data) {
    const requests = await readRequests();
    const index = requests.findIndex(
      (request) => request.id === id,
    );

    if (index === -1) {
      return null;
    }

    const updatedRequest = {
      ...requests[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    requests[index] = updatedRequest;

    await writeRequests(requests);

    return updatedRequest;
  },

  async delete(id) {
    const requests = await readRequests();
    const index = requests.findIndex(
      (request) => request.id === id,
    );

    if (index === -1) {
      return false;
    }

    requests.splice(index, 1);

    await writeRequests(requests);

    return true;
  },

  async findMany({
  status,
  priority,
  equipmentId,
  createdAtFrom,
  createdAtTo,
  plannedAtFrom,
  plannedAtTo,
  page,
  limit,
  sortBy,
  order,
}) {
  const requests = await readRequests();

  let filtered = requests;

  if (status) {
    filtered = filtered.filter(
      (request) => request.status === status,
    );
  }

  if (priority) {
    filtered = filtered.filter(
      (request) => request.priority === priority,
    );
  }

  if (equipmentId) {
    filtered = filtered.filter(
      (request) => request.equipmentId === equipmentId,
    );
  }

  if (createdAtFrom) {
    filtered = filtered.filter(
      (request) => request.createdAt >= createdAtFrom,
    );
  }

  if (createdAtTo) {
    filtered = filtered.filter(
      (request) => request.createdAt <= createdAtTo,
    );
  }

  if (plannedAtFrom) {
    filtered = filtered.filter(
      (request) => request.plannedAt && request.plannedAt >= plannedAtFrom,
    );
  }

  if (plannedAtTo) {
    filtered = filtered.filter(
      (request) => request.plannedAt && request.plannedAt <= plannedAtTo,
    );
  }

  const total = filtered.length;

  const direction = order === "asc" ? 1 : -1;

  filtered.sort((a, b) => {
    const aValue = a[sortBy] ?? "";
    const bValue = b[sortBy] ?? "";

    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;

    return 0;
  });

  const startIndex = (page - 1) * limit;

  const data = filtered.slice(
    startIndex,
    startIndex + limit,
  );

  return {
    items:data,
    total
  };
},
};
