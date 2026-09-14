import { describe, expect, test } from "vitest";
import { isReportTypeAvailable } from "@/features/reports/report-catalogue";

describe("isReportTypeAvailable", () => {
  test("KYC verifications isn't offered until the backend builds it", () => {
    expect(isReportTypeAvailable("kyc_verifications")).toBe(false);
  });

  test("built report types stay available", () => {
    for (const type of ["transactions", "admin_activity", "user_signups"]) {
      expect(isReportTypeAvailable(type)).toBe(true);
    }
  });
});
