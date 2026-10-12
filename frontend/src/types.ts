/** JSON-контракт HTTP API. Правила сверки живут в backend. */

export interface DealGood {
  name: string;
  tnved: string;
}

export interface Deal {
  contractNumber: string;
  contractDate: string;
  russianParty: string;
  foreignParty: string;
  country: string;
  goods: DealGood[];
}

export interface WorkSummary {
  id: number;
  title: string;
  status: "в работе";
  contractNumber: string;
  matchCount: number;
  missingCount: number;
}

export interface CheckFinding {
  documentCode: string;
  documentTitle: string;
  detail: string;
}

export interface DealCheck {
  matches: CheckFinding[];
  missing: CheckFinding[];
}

export interface WorkDetails {
  id: number;
  title: string;
  status: "в работе";
  deal: Deal;
  check: DealCheck;
}

export interface NormativeDocument {
  id: string;
  code: string;
  title: string;
  kind: string;
  prefixes?: { prefix: string; caption: string }[];
}

export interface CreateWorkRequest {
  title: string;
  deal: Deal;
}
