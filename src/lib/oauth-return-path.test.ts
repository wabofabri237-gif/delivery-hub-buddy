import { test } from "node:test";
import assert from "node:assert/strict";
import { oauthReturnPath } from "./oauth-return-path";
test("preserve the complete local consent return", () => {
  assert.equal(oauthReturnPath("/.lovable/oauth/consent?authorization_id=123#decision"), "/.lovable/oauth/consent?authorization_id=123#decision");
});
test("reject external or ambiguous redirect targets", () => {
  for (const value of ["//evil.invalid", "/\\evil.invalid", "https://evil.invalid", "/\u0000evil", undefined]) assert.equal(oauthReturnPath(value), "/");
});