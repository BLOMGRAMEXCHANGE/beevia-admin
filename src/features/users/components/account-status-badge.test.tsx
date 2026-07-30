import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountStatusBadge } from "./account-status-badge";

describe("AccountStatusBadge", () => {
  test("renders a human-readable label for each status", () => {
    render(<AccountStatusBadge status="suspended" />);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });
});
