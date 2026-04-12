import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Catalog from "../Catalog";
import { TestProviders } from "@/test/testUtils";

describe("Catalog", () => {
  it("renders stats from MSW after loading", async () => {
    render(
      <TestProviders>
        <Catalog />
      </TestProviders>,
    );

    await waitFor(() => {
      // AnimatedCounter will eventually show the target numbers
      expect(screen.getByText("Obras disponíveis")).toBeInTheDocument();
      expect(screen.getByText("Capítulos para ler")).toBeInTheDocument();
    });
  });
});
