import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { contactSchema } from "./contact-schema";

const request = { full_name: "Client Test", email: "client@example.com", subject: "Assistance commande", message: "Je souhaite contacter votre assistance." };
describe("contact validation", () => {
  it("accepts a complete request", () => { assert.deepEqual(contactSchema.parse(request), request); });
  it("rejects invalid emails", () => { assert.equal(contactSchema.safeParse({ ...request, email: "invalid" }).success, false); });
  it("rejects missing messages", () => { assert.equal(contactSchema.safeParse({ ...request, message: "" }).success, false); });
});