export const PLANS = {
  monthly: { label: 'Mensal', months: 1, price: 49.90 },
  quarterly: { label: 'Trimestral', months: 3, price: 139.90 },
  semiannual: { label: 'Semestral', months: 6, price: 269.90 },
  annual: { label: 'Anual', months: 12, price: 529.90 },
} as const;

export type PlanKey = keyof typeof PLANS;
