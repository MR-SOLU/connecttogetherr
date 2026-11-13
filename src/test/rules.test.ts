import { describe, expect, it } from "vitest";
import { isProfileComplete, roomCapacity, spotsLeft } from "@/lib/rules";

const base = { display_name: "Asha", bio: "I love hiking and planning trips.", interests: ["travel"] };

describe("profile must be complete before chatting", () => {
  it("accepts a name, 20+ character bio and one interest", () => {
    expect(isProfileComplete(base)).toBe(true);
  });
  it("rejects a bio shorter than 20 characters", () => {
    expect(isProfileComplete({ ...base, bio: "Hi there" })).toBe(false);
  });
  it("rejects a profile with no interests", () => {
    expect(isProfileComplete({ ...base, interests: [] })).toBe(false);
  });
  it("rejects suspended (reported) accounts", () => {
    expect(isProfileComplete({ ...base, is_suspended: true })).toBe(false);
  });
});

describe("room sizes", () => {
  it("duo rooms hold exactly 2 people", () => {
    expect(roomCapacity("duo", 10)).toBe(2);
  });
  it("group rooms hold at least 3 and at most 50", () => {
    expect(roomCapacity("group", 2)).toBe(3);
    expect(roomCapacity("group", 80)).toBe(50);
  });
  it("spots left never goes below zero", () => {
    expect(spotsLeft(2, 3)).toBe(0);
  });
});
