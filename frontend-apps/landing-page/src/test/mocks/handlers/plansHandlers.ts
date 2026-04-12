import { http, HttpResponse } from "msw";
import type { SubscriptionPlan } from "@manga-reader/types";

export const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-daily-id",
    period: "DAILY",
    priceInCents: 39,
    description: "Acesso por 1 dia.",
    features: ["Acesso a todo o catálogo"],
    active: true,
  },
  {
    id: "plan-monthly-id",
    period: "MONTHLY",
    priceInCents: 1990,
    description: "Acesso por 30 dias.",
    features: ["Acesso a todo o catálogo", "Leitura offline"],
    active: true,
  },
  {
    id: "plan-annual-id",
    period: "ANNUAL",
    priceInCents: 15990,
    description: "Acesso por 1 ano.",
    features: [
      "Acesso a todo o catálogo",
      "Leitura offline",
      "Suporte prioritário",
    ],
    active: true,
  },
];

export const plansHandlers = [
  http.get("*/api/subscription-plans", () => {
    return HttpResponse.json({
      data: MOCK_PLANS,
      success: true,
      message: null,
      statusCode: 200,
    });
  }),
];
