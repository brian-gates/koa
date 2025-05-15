import assert from "node:assert/strict";
import { describe, it } from "node:test";
import createContext from "../../test-helpers/context";
import { asTestResponse } from "../../test-helpers/types";

describe("response.is(type)", () => {
  it("should ignore params", () => {
    const res = asTestResponse(createContext().response);
    res.type = "text/html; charset=utf-8";

    assert.strictEqual(res.is("text/*"), "text/html");
  });

  describe("when no type is set", () => {
    it("should return false", () => {
      const res = asTestResponse(createContext().response);

      assert.strictEqual(res.is(), false);
      assert.strictEqual(res.is("html"), false);
    });
  });

  describe("when given no types", () => {
    it("should return the type", () => {
      const res = asTestResponse(createContext().response);
      res.type = "text/html; charset=utf-8";

      assert.strictEqual(res.is(), "text/html");
    });
  });

  describe("given one type", () => {
    it("should return the type or false", () => {
      const res = asTestResponse(createContext().response);
      res.type = "image/png";

      assert.strictEqual(res.is("png"), "png");
      assert.strictEqual(res.is(".png"), ".png");
      assert.strictEqual(res.is("image/png"), "image/png");
      assert.strictEqual(res.is("image/*"), "image/png");
      assert.strictEqual(res.is("*/png"), "image/png");

      assert.strictEqual(res.is("jpeg"), false);
      assert.strictEqual(res.is(".jpeg"), false);
      assert.strictEqual(res.is("image/jpeg"), false);
      assert.strictEqual(res.is("text/*"), false);
      assert.strictEqual(res.is("*/jpeg"), false);
    });
  });

  describe("given multiple types", () => {
    it("should return the first match or false", () => {
      const res = asTestResponse(createContext().response);
      res.type = "image/png";

      assert.strictEqual(res.is("png"), "png");
      assert.strictEqual(res.is(".png"), ".png");
      assert.strictEqual(res.is("text/*", "image/*"), "image/png");
      assert.strictEqual(res.is("image/*", "text/*"), "image/png");
      assert.strictEqual(res.is("image/*", "image/png"), "image/png");
      assert.strictEqual(res.is("image/png", "image/*"), "image/png");

      assert.strictEqual(
        res.is(["text/*", "image/*"] as string[]),
        "image/png",
      );
      assert.strictEqual(
        res.is(["image/*", "text/*"] as string[]),
        "image/png",
      );
      assert.strictEqual(
        res.is(["image/*", "image/png"] as string[]),
        "image/png",
      );
      assert.strictEqual(
        res.is(["image/png", "image/*"] as string[]),
        "image/png",
      );

      assert.strictEqual(res.is("jpeg"), false);
      assert.strictEqual(res.is(".jpeg"), false);
      assert.strictEqual(res.is("text/*", "application/*"), false);
      assert.strictEqual(
        res.is("text/html", "text/plain", "application/json; charset=utf-8"),
        false,
      );
    });
  });

  describe("when Content-Type: application/x-www-form-urlencoded", () => {
    it('should match "urlencoded"', () => {
      const res = asTestResponse(createContext().response);
      res.type = "application/x-www-form-urlencoded";

      assert.strictEqual(res.is("urlencoded"), "urlencoded");
      assert.strictEqual(res.is("json", "urlencoded"), "urlencoded");
      assert.strictEqual(res.is("urlencoded", "json"), "urlencoded");
    });
  });
});
