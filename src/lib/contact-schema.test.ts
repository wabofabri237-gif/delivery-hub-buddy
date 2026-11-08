import { describe, it, expect } from "vitest";
import { contactSchema } from "./contact-schema";

const request = { full_name: "Client Test", email: "client@example.com", subject: "Assistance commande", message: "Je souhaite contacter votre assistance." };
describe("contact validation", () => {
  it("accepts a complete request", () => { expect(contactSchema.parse(request)).toEqual(request); });
  it("rejects invalid emails", () => { expect(contactSchema.safeParse({ ...request, email: "invalid" }).success).toBe(false); });
  it("rejects missing messages", () => { expect(contactSchema.safeParse({ ...request, message: "" }).success).toBe(false); });
});