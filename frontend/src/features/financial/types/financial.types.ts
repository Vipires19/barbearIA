export type FinancialPeriodStatus = "OPEN" | "CLOSED";

export type DistributionSnapshot = {
  professional_id: string;
  professional_name: string;
  participation_percentage: number;
  gross_amount: number;
  advances_deducted: number;
  net_amount: number;
};

export type FinancialPeriod = {
  id: string;
  status: FinancialPeriodStatus;
  started_at: string;
  closed_at: string | null;
  total_revenue: number | null;
  total_expenses: number | null;
  operational_result: number | null;
  reserve_applied: number | null;
  distributable_amount: number | null;
  reserve_percentage_snapshot: number | null;
  accumulated_reserve_after: number | null;
  distributions: DistributionSnapshot[];
};

export type FinancialPeriodListResponse = {
  items: FinancialPeriod[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
};

export type FinancialSettings = {
  id: string;
  reserve_percentage: number;
  accumulated_reserve: number;
  updated_at: string;
};

export type ExpenseCategory =
  | "RENT"
  | "ENERGY"
  | "WATER"
  | "INTERNET"
  | "SUPPLIES"
  | "MAINTENANCE"
  | "TAXES"
  | "OTHER";

export type Expense = {
  id: string;
  period_id: string;
  description: string;
  category: ExpenseCategory;
  category_label: string;
  amount: number;
  expense_date: string;
  created_at: string;
};

export type Advance = {
  id: string;
  period_id: string;
  professional_id: string;
  professional_name: string;
  amount: number;
  notes: string | null;
  created_at: string;
};

export type ProfessionalDistributionPreview = {
  professional_id: string;
  professional_name: string;
  participation_percentage: number;
  estimated_gross: number;
  advances_in_period: number;
  estimated_net: number;
};

export type FinancialDashboard = {
  current_period: FinancialPeriod;
  settings: FinancialSettings;
  total_revenue: number;
  total_expenses: number;
  operational_result: number;
  reserve_applied: number;
  distributable_amount: number;
  accumulated_reserve: number;
  active_professionals_count: number;
  expenses: Expense[];
  advances: Advance[];
  distribution_preview: ProfessionalDistributionPreview[];
};

export type ProfessionalWallet = {
  professional_id: string;
  professional_name: string;
  participation_percentage: number;
  closed_participation_total: number;
  closed_advances_total: number;
  closed_net_total: number;
  current_period_estimated_gross: number;
  current_period_advances: number;
  current_period_estimated_net: number;
  estimated_balance: number;
};

export type ExpenseCreatePayload = {
  description: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
};

export type AdvanceCreatePayload = {
  professional_id: string;
  amount: number;
  notes?: string | null;
};

export type FinancialSettingsUpdatePayload = {
  reserve_percentage: number;
};

export type ParticipationSummary = {
  total_percentage: number;
  active_professionals_count: number;
  is_valid: boolean;
};

export const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Aluguel" },
  { value: "ENERGY", label: "Energia" },
  { value: "WATER", label: "Água" },
  { value: "INTERNET", label: "Internet" },
  { value: "SUPPLIES", label: "Materiais" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "TAXES", label: "Impostos" },
  { value: "OTHER", label: "Outros" },
] as const satisfies ReadonlyArray<{ value: ExpenseCategory; label: string }>;
