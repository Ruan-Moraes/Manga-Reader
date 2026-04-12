import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Plans from "../Plans";
import { TestProviders } from "@/test/testUtils";

describe("Plans", () => {
  it("renders pricing cards after loading plans from MSW", async () => {
    render(
      <TestProviders>
        <Plans />
      </TestProviders>,
    );

    await waitFor(() => {
      // All three plan period labels should be visible
      expect(screen.getByText("Mensal")).toBeInTheDocument();
      expect(screen.getByText("Diário")).toBeInTheDocument();
      expect(screen.getByText("Anual")).toBeInTheDocument();
    });
  });

  it('shows "Mais Popular" badge on monthly plan', async () => {
    render(
      <TestProviders>
        <Plans />
      </TestProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText("Mais Popular")).toBeInTheDocument();
    });
  });
});
