import { bench, group, run } from "mitata";
import { serialize, deserialize } from "./serialize";

type User = {
    id: string;
    username: string;
    email: string;
    age: number;
    isActive: boolean;
    roles: string[];
    createdAt: Date;
};

function parseUser(x: unknown): User {
    if (
        typeof x === "object" &&
        x !== null &&
        "id" in x &&
        typeof x.id === "string" &&
        "username" in x &&
        typeof x.username === "string" &&
        "email" in x &&
        typeof x.email === "string" &&
        "age" in x &&
        typeof x.age === "number" &&
        x.age > 0 &&
        "isActive" in x &&
        typeof x.isActive === "boolean" &&
        "roles" in x &&
        Array.isArray(x.roles) &&
        x.roles.every((r) => typeof r === "string") &&
        "createdAt" in x &&
        x.createdAt instanceof Date
    ) {
        return {
            id: x.id,
            username: x.username,
            email: x.email,
            age: x.age,
            isActive: x.isActive,
            roles: x.roles,
            createdAt: x.createdAt,
        };
    }
    throw new Error("invalid user");
}

const user: User = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    username: "testuser",
    email: "test@example.com",
    age: 25,
    isActive: true,
    roles: ["user", "admin"],
    createdAt: new Date(),
};

group("serialize vs JSON.stringify", () => {
    bench("JSON.stringify", () => JSON.stringify(user));
    bench("serialize", () => serialize(user));
});

group("deserialize vs JSON.parse", () => {
    const serialized = serialize(user);
    const stringified = JSON.stringify(user);

    bench("JSON.parse", () => JSON.parse(stringified));
    bench("deserialize", () => deserialize(serialized));
    bench("deserialize w/ schema", () => deserialize(serialized, parseUser));
});

await run();
