import { User, Technician } from "../models/index.js";

const USER_ATTRIBUTES = [
    "id",
    "email",
    "role",
    "technicianId",
    "isActive",
    "createdAt",
    "updatedAt",
];

export const userRepository = {
    async findByEmail(email, { withHash = false } = {}) {
        const attributes = withHash
        ? [...USER_ATTRIBUTES, "passwordHash"]
        : USER_ATTRIBUTES;

        return User.findOne({
        where: { email },
        attributes,
        });
    },

    async findById(id, { withHash = false } = {}) {
        const attributes = withHash
        ? [...USER_ATTRIBUTES, "passwordHash"]
        : USER_ATTRIBUTES;

        return User.findByPk(id, { attributes });
    },

    async findByIdWithTechnician(id) {
        return User.findByPk(id, {
        attributes: USER_ATTRIBUTES,
        include: [
            {
            model: Technician,
            as: "technician",
            attributes: ["id", "fullName", "specialization"],
            },
        ],
        });
    },

    async create(data) {
        return User.create(data);
    },
};