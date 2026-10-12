import { describe, expect, it } from "vitest";
import { endSession } from "./end-session";
import { shouldAttemptRefresh, singleFlight } from "./refresh-policy";

describe("shouldAttemptRefresh", () => {
  it("allows one refresh after an expired access token", () => {
    expect(
      shouldAttemptRefresh({
        status: 401,
        url: "/users/me",
        method: "get",
        message: "Invalid or expired token.",
        alreadyRetried: false,
      }),
    ).toBe(true);
  });

  it("does not refresh the same request twice", () => {
    expect(
      shouldAttemptRefresh({
        status: 401,
        url: "/users/me",
        method: "get",
        message: "Invalid or expired token.",
        alreadyRetried: true,
      }),
    ).toBe(false);
  });

  it("does not treat a wrong current password as an expired session", () => {
    expect(
      shouldAttemptRefresh({
        status: 401,
        url: "/users/me/password",
        method: "put",
        message: "Current password is incorrect",
        alreadyRetried: false,
      }),
    ).toBe(false);
  });

  it("does not refresh login, registration, or token requests", () => {
    expect(
      shouldAttemptRefresh({
        status: 401,
        url: "/sessions",
        method: "post",
        message: "Invalid credentials",
        alreadyRetried: false,
      }),
    ).toBe(false);

    expect(
      shouldAttemptRefresh({
        status: 401,
        url: "/users",
        method: "post",
        message: "Unauthorized",
        alreadyRetried: false,
      }),
    ).toBe(false);

    expect(
      shouldAttemptRefresh({
        status: 401,
        url: "/token",
        method: "post",
        message: "No refresh token provided.",
        alreadyRetried: false,
      }),
    ).toBe(false);
  });

  it("ignores validation errors and deactivated accounts", () => {
    expect(
      shouldAttemptRefresh({
        status: 400,
        url: "/users/me",
        method: "put",
        message: "Validation error",
        alreadyRetried: false,
      }),
    ).toBe(false);

    expect(
      shouldAttemptRefresh({
        status: 403,
        url: "/users/me",
        method: "get",
        message: "Account is deactivated.",
        alreadyRetried: false,
      }),
    ).toBe(false);
  });
});

describe("singleFlight", () => {
  it("runs one task for concurrent callers and a new task after it settles", async () => {
    let calls = 0;
    const run = singleFlight(async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return "ok";
    });

    const [first, second] = await Promise.all([run(), run()]);
    expect(first).toBe("ok");
    expect(second).toBe("ok");
    expect(calls).toBe(1);

    await run();
    expect(calls).toBe(2);
  });
});

describe("endSession", () => {
  it("clears local state when the logout request fails", async () => {
    let cleared = false;

    await endSession(async () => {
      throw new Error("offline");
    }, () => {
      cleared = true;
    });

    expect(cleared).toBe(true);
  });

  it("clears local state after a successful logout", async () => {
    let cleared = false;

    await endSession(async () => undefined, () => {
      cleared = true;
    });

    expect(cleared).toBe(true);
  });
});
