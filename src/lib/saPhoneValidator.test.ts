import { describe, it, expect } from "vitest";
import { validateSaPhone } from "./saPhoneValidator";

describe("validateSaPhone — accepted formats", () => {
  it("accepts a local mobile number with spaces", () => {
    const r = validateSaPhone("082 123 4567");
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe("+27821234567");
    expect(r.display).toBe("082 123 4567");
    expect(r.mobile).toBe(true);
  });

  it("accepts a local mobile number with no spaces", () => {
    const r = validateSaPhone("0821234567");
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe("+27821234567");
  });

  it("accepts +27 international format", () => {
    const r = validateSaPhone("+27 82 123 4567");
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe("+27821234567");
  });

  it("accepts 27-prefixed format with no plus", () => {
    const r = validateSaPhone("27821234567");
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe("+27821234567");
  });

  it("strips parentheses and dashes during normalisation", () => {
    const r = validateSaPhone("(082) 123-4567");
    expect(r.valid).toBe(true);
    expect(r.formatted).toBe("+27821234567");
  });
});

describe("validateSaPhone — landline vs mobile", () => {
  it("flags 011 (Joburg landline) as not mobile", () => {
    const r = validateSaPhone("0111234567");
    expect(r.valid).toBe(true);
    expect(r.mobile).toBe(false);
  });

  it("flags 012 (Pretoria landline) as not mobile", () => {
    const r = validateSaPhone("0121234567");
    expect(r.valid).toBe(true);
    expect(r.mobile).toBe(false);
  });

  it("flags 06x as mobile", () => {
    const r = validateSaPhone("0601234567");
    expect(r.valid).toBe(true);
    expect(r.mobile).toBe(true);
  });
});

describe("validateSaPhone — rejections", () => {
  it("rejects empty input with a 'required' message", () => {
    const r = validateSaPhone("");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/required/i);
  });

  it("rejects too-short numbers", () => {
    expect(validateSaPhone("082").valid).toBe(false);
  });

  it("rejects too-long numbers", () => {
    expect(validateSaPhone("08212345670000").valid).toBe(false);
  });

  it("rejects unrecognised SA prefix (e.g. 09x)", () => {
    const r = validateSaPhone("0991234567");
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/prefix/i);
  });

  it("rejects a 10-digit number that doesn't start with 0", () => {
    const r = validateSaPhone("1821234567");
    expect(r.valid).toBe(false);
  });

  it("does not allow letters in the input", () => {
    const r = validateSaPhone("082ABC4567");
    expect(r.valid).toBe(false);
  });
});

describe("validateSaPhone — E.164 / display formatting", () => {
  it("E.164 always has a leading + and no spaces", () => {
    const r = validateSaPhone("082 123 4567");
    expect(r.formatted).toMatch(/^\+27\d{9}$/);
  });

  it("display format is 'NNN NNN NNNN'", () => {
    const r = validateSaPhone("0821234567");
    expect(r.display).toBe("082 123 4567");
  });
});
