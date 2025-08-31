import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("../src/routes/registration.service", () => ({
  createRegistration: vi.fn(),
}));

import router from "../src/routes/registration";
import { createRegistration } from "../src/routes/registration.service";

const app = express();
app.use(express.json());
app.use("/", router);

const mockCreate = createRegistration as unknown as Mock;
const body = {
  email: "test@example.com",
  lastName: "Doe",
  question1: "A",
  question2: "B",
};

describe("registration duplicates", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("handles application-level duplicate", async () => {
    mockCreate.mockRejectedValueOnce(new Error("duplicate_email"));
    const res = await request(app).post("/").send(body);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Registration already exists");
  });

  it("handles db-level duplicate", async () => {
    const err = Object.assign(new Error("ER_DUP_ENTRY"), {
      code: "ER_DUP_ENTRY",
      errno: 1062,
    });
    mockCreate.mockRejectedValueOnce(err);
    const res = await request(app).post("/").send(body);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("Registration already exists");
  });
});
