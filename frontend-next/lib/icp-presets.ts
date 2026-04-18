import type { ICPProfile } from "@/types/lead";

export const EMPTY_ICP: ICPProfile = {
  name: "Custom",
  target_industries: [],
  target_company_types: [],
  target_geographies: [],
  min_signals_of_budget: [],
  preferred_business_models: [],
  red_flags: [],
};

export const ICP_PRESETS: Record<string, ICPProfile> = {
  Custom: { ...EMPTY_ICP, name: "Custom" },
  "B2B SaaS Agency": {
    name: "B2B SaaS Agency",
    target_industries: ["SaaS", "Fintech", "E-commerce"],
    target_company_types: ["Mid-market SaaS", "Series A-C startups"],
    target_geographies: ["North America", "Europe"],
    min_signals_of_budget: [
      "Recent funding",
      "Hiring engineers",
      "Enterprise clients",
    ],
    preferred_business_models: ["SaaS subscription", "Usage-based"],
    red_flags: ["Pre-revenue", "Solo founder", "Free-tier only"],
  },
  "Marketing Services": {
    name: "Marketing Services",
    target_industries: ["E-commerce", "Retail", "Consumer brands"],
    target_company_types: ["DTC brands", "Retailers with online presence"],
    target_geographies: ["Global"],
    min_signals_of_budget: [
      "Active paid ads",
      "Multiple product lines",
      "Large catalog",
    ],
    preferred_business_models: ["E-commerce", "Subscription commerce"],
    red_flags: ["Single-product hobby store", "No online sales"],
  },
};

export const ICP_PRESET_NAMES = Object.keys(ICP_PRESETS);
