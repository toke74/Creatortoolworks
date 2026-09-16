export type EarningsEstimatorStatus = "empty" | "ready" | "error";

export type EarningsEstimatorField = "views" | "lowRpm" | "highRpm";

export interface EarningsEstimatorInput {
  views: string;
  lowRpm: string;
  highRpm: string;
}

export interface EarningsEstimatorError {
  field: EarningsEstimatorField;
  message: string;
}

export interface EarningsEstimate {
  views: number;
  lowRpm: number;
  highRpm: number;
  lowEstimate: number;
  highEstimate: number;
  isSingleEstimate: boolean;
}

export interface EarningsEstimatorReport {
  status: EarningsEstimatorStatus;
  errors: EarningsEstimatorError[];
  estimate: EarningsEstimate | null;
}
