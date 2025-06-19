import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Helper function to map product types to IRRBB categories
function mapProductTypeToIRRBB(productType: string): string {
  const mapping: Record<string, string> = {
    'instant_access_savings': 'rate_sensitive_instant_access',
    'isa_savings': 'isa_savings',
    'regular_saver': 'regular_saver',
    'fixed_term': 'fixed_term'
  };
  return mapping[productType] || 'instant_access_savings';
}

export interface DashboardStats {
  totalBanks: number;
  totalProducts: number;
  averageRate: number;
  highestRate: number;
  highestRateBank: string | null;
  lastUpdated: string;
}

export interface LatestRate {
  bank_name: string;
  bank_code: string;
  product_name: string;
  product_type: string;
  current_effective_rate: number;
  standard_rate: number;
  promotional_rate?: number;
  minimum_balance: number;
  maximum_balance: number;
  collection_date: string;
  extraction_confidence: number;
}

export interface BankSummary {
  bank_name: string;
  total_products: number;
  instant_access_products: number;
  isa_products: number;
  regular_saver_products: number;
  avg_standard_rate: number;
  max_standard_rate: number;
  max_promotional_rate: number;
  last_updated: string;
}

export interface ExtractionRun {
  id: number;
  run_date: string;
  run_timestamp: string;
  status: 'in_progress' | 'completed' | 'failed';
  total_banks: number;
  successful_banks: number;
  failed_banks: number;
  total_products_found: number;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface ExtractionStatus {
  id: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  totalBanks: number;
  completedBanks: number;
  currentBank?: string;
  startTime: string;
  results: Array<{
    bank: string;
    success: boolean;
    products?: number;
    error?: string;
  }>;
}

export interface SystemHealth {
  database: string;
  claude_api: string;
  prompts: string;
  environment: string;
  database_schema: string;
}

export interface Bank {
  id: number;
  name: string;
  code: string;
  created_at: string;
}

export interface MasterProduct {
  id: string;
  bank_name: string;
  bank_code: string;
  product_name: string;
  product_type: string;
  product_url: string;
  is_active: boolean;
  date_added: string;
  date_withdrawn?: string;
  withdrawal_reason?: string;
  last_verified: string;
  notes?: string;
}

export interface CompletenessReport {
  total_master_products: number;
  found_products: number;
  missing_products: number;
  completeness_percentage: number;
  found_list: MasterProduct[];
  missing_list: MasterProduct[];
}

export interface PromptData {
  bankCode: string;
  content: string;
  lastModified: string;
  version: string;
}

export interface PromptTestResult {
  bankCode: string;
  testResult: {
    success: boolean;
    products: any[];
    confidence: number;
    notes: string;
  };
  timestamp: string;
}

export interface BankCategories {
  major_banks: string[];
  building_societies: string[];
  challenger_banks: string[];
  digital_banks: string[];
  traditional_banks: string[];
  app_based: string[];
}

export interface BOEBaseRate {
  date: string;
  rate: number;
}

export interface SpreadData {
  bank_name: string;
  bank_code: string;
  product_name: string;
  current_rate: number;
  boe_base_rate: number;
  spread: number;
  promotional_spread?: number;
}

export interface SpreadsResponse {
  date: string;
  boe_base_rate: number;
  spreads: SpreadData[];
}

export interface CompletenessOverall {
  total_products_extracted: number;
  total_expected_products: number;
  products_found: number;
  completeness_percentage: number;
}

export interface CategoryCompleteness {
  category: string;
  bank_count: number;
  products_extracted: number;
  products_expected: number;
  products_found: number;
  completeness_percentage: number;
}

export interface CompletenessSummary {
  date: string;
  overall: CompletenessOverall;
  by_category: CategoryCompleteness[];
}

export interface IRRBBCategory {
  id: string;
  name: string;
  description: string;
  behavioral_notes: string;
}

export interface ProductRate {
  bank_name: string;
  bank_code: string;
  product_name: string;
  product_type: string;
  min_rate: number;
  max_rate: number;
  tier_count: number;
  irrbb_category: string;
}

export interface MarketCommentary {
  commentary: string;
  lastUpdated: string;
  dataSnapshot: {
    marketOverview: {
      totalProducts: number;
      totalBanks: number;
      averageRate: number;
      highestRate: number;
      lowestRate: number;
      rateSpread: number;
    };
    topPerformers: Array<{
      bank: string;
      avgRate: number;
      maxRate: number;
      productCount: number;
    }>;
    irrbbCategories: Array<{
      category: string;
      avgRate: number;
      maxRate: number;
      productCount: number;
    }>;
    recentActivity: Array<{
      date: string;
      status: string;
      banksProcessed: number;
    }>;
  };
  extractionDate: string;
}

export interface BetaCoefficient {
  bank: string;
  category: string;
  beta: number;
  correlation: number;
  rSquared: number;
  dataPoints: number;
}

export interface BetaTimeSeries {
  date: string;
  boe_rate: number;
  boe_change?: string;
  is_historical?: boolean;
  is_projected?: boolean;
  [bankKey: string]: number | string | boolean | undefined; // Dynamic keys for bank rates
}

export interface BetaAnalysis {
  timeSeries: BetaTimeSeries[];
  betaCoefficients: BetaCoefficient[];
  summary: {
    avgBeta: number;
    marketLeader: string;
    mostStable: string;
    volatilityIndex: number;
  };
  metadata: {
    timeframe: string;
    startDate: string;
    endDate: string;
    extendedEndDate?: string;
    currentDate?: string;
    totalDataPoints: number;
    historicalDataPoints?: number;
    projectedDataPoints?: number;
    banksAnalyzed: number;
    boeRateChanges?: Array<{
      date: string;
      rate: number;
      change: string;
    }>;
  };
}

export interface HistoricalDataEntry {
  id: number;
  bank_code: string;
  product_name: string;
  product_type: string;
  rate: number;
  date: string; // Collection date
  effective_from: string;
  effective_to?: string;
  is_future_rate: boolean;
  source: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProductWithHistory {
  id: string; // Changed to string to match master catalogue IDs
  name: string;
  type: string;
  master_product_id: string; // Now required as it's the primary key
  bank_name: string;
  bank_code: string;
  product_url?: string;
  rate_count: number;
  first_date: string;
  last_date: string;
}

export interface RateTierEntry {
  id: number;
  tier_name: string;
  balance_minimum: number;
  balance_maximum?: number;
  base_rate: number;
  bonus_rate?: number;
  total_rate: number;
  rate_type: string;
  conditions?: string[];
}

export interface ProductHistoryEntry {
  master_product_id: string; // Primary key linking to master catalogue
  product_name: string;
  product_type: string;
  bank_name: string;
  bank_code: string;
  collection_date: string;
  effective_from: string;
  effective_to?: string;
  is_future_rate: boolean;
  standard_rate: number;
  promotional_rate?: number;
  effective_rate: number;
  minimum_balance: number;
  maximum_balance?: number;
  extraction_confidence: number;
  source: string;
  notes?: string;
  tiers?: RateTierEntry[]; // Include tier information for tiered products
}

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  // Rates
  async getLatestRates(date?: string, categories?: string[]): Promise<LatestRate[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    
    const response = await apiClient.get(`/rates/latest?${params.toString()}`);
    return response.data;
  },

  // Banks
  async getBankSummary(): Promise<BankSummary[]> {
    const response = await apiClient.get('/banks/summary');
    return response.data;
  },

  async getBanks(): Promise<Bank[]> {
    const response = await apiClient.get('/banks');
    return response.data;
  },

  // Extractions
  async getRecentExtractions(limit = 10): Promise<ExtractionRun[]> {
    const response = await apiClient.get(`/extractions/recent?limit=${limit}`);
    return response.data;
  },

  async runExtraction(params: {
    banks: string[];
    dryRun?: boolean;
    date?: string;
  }): Promise<{ runId: string; message: string; totalBanks: number; estimatedTime: number }> {
    const response = await apiClient.post('/extractions/start', params);
    return response.data;
  },

  async getExtractionStatus(id: string): Promise<ExtractionStatus> {
    const response = await apiClient.get(`/extractions/${id}/status`);
    return response.data;
  },

  async getActiveExtractions(): Promise<ExtractionStatus[]> {
    const response = await apiClient.get('/extractions/active');
    return response.data;
  },

  // System
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await apiClient.get('/system/health');
    return response.data;
  },

  // Reports & Export
  async exportData(format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/export/rates?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Master Catalogue
  async getMasterCatalogue(): Promise<MasterProduct[]> {
    const response = await apiClient.get('/catalogue/products');
    return response.data;
  },

  async getBankCatalogue(bankCode: string): Promise<MasterProduct[]> {
    const response = await apiClient.get(`/catalogue/products/${bankCode}`);
    return response.data;
  },

  async getCompletenessReport(bankCode?: string): Promise<CompletenessReport> {
    const url = bankCode ? `/catalogue/completeness/${bankCode}` : '/catalogue/completeness';
    const response = await apiClient.get(url);
    return response.data;
  },

  // Prompt Management
  async getPrompt(bankCode: string): Promise<PromptData> {
    const response = await apiClient.get(`/prompts/${bankCode}`);
    return response.data;
  },

  async updatePrompt(bankCode: string, content: string): Promise<{ message: string; lastModified: string }> {
    const response = await apiClient.put(`/prompts/${bankCode}`, { content });
    return response.data;
  },

  async testPrompt(bankCode: string, content: string, testContent?: string): Promise<PromptTestResult> {
    const response = await apiClient.post(`/prompts/${bankCode}/test`, { content, testContent });
    return response.data;
  },

  // Bank of England & Spreads
  async getBOEBaseRates(): Promise<BOEBaseRate[]> {
    const response = await apiClient.get('/boe/base-rate');
    return response.data;
  },

  async getBOEBaseRate(date: string): Promise<BOEBaseRate> {
    const response = await apiClient.get(`/boe/base-rate?date=${date}`);
    return response.data;
  },

  async getSpreads(date?: string): Promise<SpreadsResponse> {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get(`/rates/spreads${params}`);
    return response.data;
  },

  // Bank Categories
  async getBankCategories(): Promise<BankCategories> {
    const response = await apiClient.get('/banks/categories');
    return response.data;
  },

  // Completeness Summary
  async getCompletenessSummary(date?: string): Promise<CompletenessSummary> {
    const params = date ? `?date=${date}` : '';
    const response = await apiClient.get(`/summary/completeness${params}`);
    return response.data;
  },

  // Product Rates for Chart
  async getProductRates(filters?: { banks?: string | string[], productType?: string, extractionDate?: string, useIRRBB?: boolean }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.banks && filters.banks !== 'all') {
      if (Array.isArray(filters.banks)) {
        filters.banks.forEach(bank => params.append('banks', bank));
      } else {
        params.append('banks', filters.banks);
      }
    }
    if (filters?.productType && filters.productType !== 'all') {
      params.append('productType', filters.productType);
    }
    if (filters?.extractionDate) {
      params.append('extractionDate', filters.extractionDate);
    }
    if (filters?.useIRRBB) {
      params.append('useIRRBB', 'true');
    }
    const response = await apiClient.get(`/chart/product-rates?${params.toString()}`);
    return response.data;
  },

  // Get IRRBB Categories
  async getIRRBBCategories(): Promise<IRRBBCategory[]> {
    const response = await apiClient.get('/categories/irrbb');
    return response.data;
  },

  // Bank of England Base Rate
  async getBoeRate(): Promise<{ rate: number; date: string; source: string; last_updated: string }> {
    const response = await apiClient.get('/chart/boe-rate');
    return response.data;
  },

  // Market Commentary
  async getMarketCommentary(): Promise<MarketCommentary> {
    const response = await apiClient.get('/market-commentary');
    return response.data;
  },

  // Get products for beta analysis
  async getBetaProducts(): Promise<Array<{
    key: string;
    bank_name: string;
    bank_code: string;
    product_name: string;
    product_type: string;
    tiers: Array<{
      tier_number: number;
      tier_name: string;
      total_rate: number;
      balance_minimum: number;
      balance_maximum?: number;
    }>;
  }>> {
    const response = await apiClient.get('/beta-analysis/products');
    return response.data;
  },

  // Beta Analysis
  async getBetaAnalysis(filters?: { 
    timeframe?: '7d' | '30d' | '90d' | '180d';
    startDate?: string;
    endDate?: string;
    banks?: string[]; 
    categories?: string[];
    products?: string[];
    tiers?: string[];
    analysisType?: 'rates' | 'beta' | 'correlation' 
  }): Promise<BetaAnalysis> {
    const params = new URLSearchParams();
    
    if (filters?.timeframe) {
      params.append('timeframe', filters.timeframe);
    }
    if (filters?.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters?.banks && filters.banks.length > 0) {
      filters.banks.forEach(bank => params.append('banks', bank));
    }
    if (filters?.categories && filters.categories.length > 0) {
      filters.categories.forEach(cat => params.append('categories', cat));
    }
    if (filters?.products && filters.products.length > 0) {
      filters.products.forEach(product => params.append('products', product));
    }
    if (filters?.tiers && filters.tiers.length > 0) {
      filters.tiers.forEach(tier => params.append('tiers', tier));
    }
    if (filters?.analysisType) {
      params.append('analysisType', filters.analysisType);
    }
    
    const response = await apiClient.get(`/beta-analysis?${params.toString()}`);
    return response.data;
  },

  // Individual Beta Analysis for specific rate changes
  async getIndividualBetaAnalysis(filters?: {
    timeWindow?: string; // Days for analysis window (default 90)
    groupingThreshold?: string; // Days for grouping successive changes (default 0)
    enableGrouping?: string; // Enable/disable grouping (default 'false')
    forwardLookingDays?: string; // Forward-looking period (default 90)
    banks?: string[];
    categories?: string[];
    products?: string[];
    rateChangeTypes?: 'HIKE' | 'CUT' | 'ALL'; // Filter by change type
  }): Promise<{
    hikes: {
      data: Array<{
        changeLabel: string;
        changeType: 'HIKE';
        changeDate: string;
        rateChange: number; // Basis points
        startRate: number;
        endRate: number;
        timeWindowDays: number;
        bankBetas: Array<{
          bank: string;
          category: string;
          beta: number;
          correlation: number;
          rSquared: number;
          dataPoints: number;
        }>;
        summary: {
          avgBeta: number;
          betaStdDev: number;
          banksAnalyzed: number;
          dataPointsUsed: number;
        };
        isGrouped: boolean;
        groupedChanges?: number;
        groupedChangesList: Array<{
          label: string;
          date: string;
          rateChange: number;
        }>;
        totalAnalysisPeriodDays: number;
      }>;
      average: {
        count: number;
        avgBeta: number;
        avgRateChange: number;
        totalBanksAnalyzed: number;
        totalDataPoints: number;
      } | null;
    };
    cuts: {
      data: Array<{
        changeLabel: string;
        changeType: 'CUT';
        changeDate: string;
        rateChange: number; // Basis points
        startRate: number;
        endRate: number;
        timeWindowDays: number;
        bankBetas: Array<{
          bank: string;
          category: string;
          beta: number;
          correlation: number;
          rSquared: number;
          dataPoints: number;
        }>;
        summary: {
          avgBeta: number;
          betaStdDev: number;
          banksAnalyzed: number;
          dataPointsUsed: number;
        };
        isGrouped: boolean;
        groupedChanges?: number;
        groupedChangesList: Array<{
          label: string;
          date: string;
          rateChange: number;
        }>;
        totalAnalysisPeriodDays: number;
      }>;
      average: {
        count: number;
        avgBeta: number;
        avgRateChange: number;
        totalBanksAnalyzed: number;
        totalDataPoints: number;
      } | null;
    };
    metadata: {
      timeWindowDays: number;
      forwardLookingDays: number;
      groupingThresholdDays: number;
      groupingEnabled: boolean;
      totalChangesAnalyzed: number;
      hikesCount: number;
      cutsCount: number;
      analysisType: string;
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters?.timeWindow) {
      params.append('timeWindow', filters.timeWindow);
    }
    if (filters?.groupingThreshold) {
      params.append('groupingThreshold', filters.groupingThreshold);
    }
    if (filters?.enableGrouping) {
      params.append('enableGrouping', filters.enableGrouping);
    }
    if (filters?.forwardLookingDays) {
      params.append('forwardLookingDays', filters.forwardLookingDays);
    }
    if (filters?.banks && filters.banks.length > 0) {
      filters.banks.forEach(bank => params.append('banks', bank));
    }
    if (filters?.categories && filters.categories.length > 0) {
      filters.categories.forEach(cat => params.append('categories', cat));
    }
    if (filters?.products && filters.products.length > 0) {
      filters.products.forEach(product => params.append('products', product));
    }
    if (filters?.rateChangeTypes) {
      params.append('rateChangeTypes', filters.rateChangeTypes);
    }
    
    const response = await apiClient.get(`/individual-beta-analysis?${params.toString()}`);
    return response.data;
  },

  // Historical Data Management
  async getHistoricalData(filters?: { 
    bank?: string; 
    productType?: string; 
    startDate?: string; 
    endDate?: string 
  }): Promise<HistoricalDataEntry[]> {
    const params = new URLSearchParams();
    if (filters?.bank) params.append('bank', filters.bank);
    if (filters?.productType) params.append('productType', filters.productType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/historical-data?${params.toString()}`);
    return response.data;
  },

  async addHistoricalData(entry: {
    bank_code: string;
    product_name: string;
    product_type: string;
    rate: number;
    date: string;
    notes?: string;
  }): Promise<HistoricalDataEntry> {
    const response = await apiClient.post('/historical-data', entry);
    return response.data;
  },

  async updateHistoricalData(id: number, entry: {
    bank_code: string;
    product_name: string;
    product_type: string;
    rate: number;
    date: string;
    notes?: string;
  }): Promise<HistoricalDataEntry> {
    const response = await apiClient.put(`/historical-data/${id}`, entry);
    return response.data;
  },

  async deleteHistoricalData(id: number): Promise<void> {
    await apiClient.delete(`/historical-data/${id}`);
  },

  async importHistoricalData(data: Array<{
    bank_code: string;
    product_name: string;
    product_type: string;
    rate: number;
    date: string;
    notes?: string;
  }>): Promise<{
    imported: number;
    errors: string[];
    duplicates: number;
  }> {
    const response = await apiClient.post('/historical-data/import', { data });
    return response.data;
  },

  // Products and History
  async getProducts(): Promise<ProductWithHistory[]> {
    const response = await apiClient.get('/products');
    return response.data;
  },

  async getProductHistory(filters?: {
    productId?: string; // Changed to string for master catalogue IDs
    fromDate?: string;
    toDate?: string;
    bank?: string;
    productType?: string;
  }): Promise<ProductHistoryEntry[]> {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.bank) params.append('bank', filters.bank);
    if (filters?.productType) params.append('productType', filters.productType);
    
    const response = await apiClient.get(`/rates/history?${params.toString()}`);
    return response.data;
  },

  // nTreasury Rate Prediction System
  async getNTreasuryPredictions(filters: {
    boeScenario: string; // +25bp, +50bp, -25bp, -50bp, custom
    calibrationPeriod: string; // recent3, recent5, 12months, alltime
    bankFilter: string; // all, big4, challengers, building-societies
    productFilter: string; // all, instant-access, isa, regular-saver
  }): Promise<{
    scenario: {
      boe_change_bp: number;
      current_boe_rate: number;
      predicted_boe_rate: number;
      calibration_period: string;
      bank_filter: string;
      product_filter: string;
    };
    predictions: Array<{
      bank_name: string;
      bank_code: string;
      product_name: string;
      tier_name: string;
      tier_number: number;
      current_rate: number;
      predicted_rate: number;
      rate_change_bp: number;
      beta_coefficient: number;
      confidence_score: number;
      response_time: string;
      calibration_data: {
        data_points: number;
        r_squared: number;
        calibration_period: string;
      };
    }>;
    summary: {
      total_predictions: number;
      avg_pass_through_pct: number;
      most_responsive: string;
      fastest_response: string;
      avg_confidence_pct: number;
    };
    metadata: {
      generated_at: string;
      data_freshness: string;
      calibration_source: string;
    };
  }> {
    const params = new URLSearchParams();
    params.append('boeScenario', filters.boeScenario);
    params.append('calibrationPeriod', filters.calibrationPeriod);
    params.append('bankFilter', filters.bankFilter);
    params.append('productFilter', filters.productFilter);
    
    const response = await apiClient.get(`/ntreasury/predictions?${params.toString()}`);
    return response.data;
  },

  // Beta Ladder System
  async generateBetaLadders(filters?: {
    bank_filter?: string; // all, big4, challengers, building-societies
    product_filter?: string; // all, instant-access, isa, regular-saver
    rebuild?: boolean;
  }): Promise<{
    ladders: Array<{
      bank: string;
      bank_code: string;
      product: string;
      tier: string;
      tier_number: number;
      current_rate: number;
      ladder_date: string;
      rate_steps: Array<{
        base_rate: number;
        product_rate: number;
        beta: number;
        confidence: number;
        rate_environment: string;
        rate_change_from_current: number;
      }>;
    }>;
    metadata: {
      generated_at: string;
      total_combinations: number;
      calibration_date: string;
      rate_range: { min: number; max: number; step: number };
      quality_checks: {
        completeness: boolean;
        monotonic: boolean;
        realistic_ranges: boolean;
      };
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.bank_filter) params.append('bank_filter', filters.bank_filter);
    if (filters?.product_filter) params.append('product_filter', filters.product_filter);
    if (filters?.rebuild) params.append('rebuild', filters.rebuild.toString());
    
    const response = await apiClient.get(`/beta-ladders/generate?${params.toString()}`);
    return response.data;
  },

  async lookupBetaLadder(params: {
    bank_code: string;
    product_name: string;
    tier_number: number;
    base_rate: number;
  }): Promise<{
    bank: string;
    product: string;
    tier: string;
    tier_number: number;
    requested_base_rate: number;
    predicted_rate: number;
    beta: number;
    confidence: number;
    rate_environment: string;
    ladder_date: string;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('bank_code', params.bank_code);
    queryParams.append('product_name', params.product_name);
    queryParams.append('tier_number', params.tier_number.toString());
    queryParams.append('base_rate', params.base_rate.toString());
    
    const response = await apiClient.get(`/beta-ladders/lookup?${queryParams.toString()}`);
    return response.data;
  },

  // Historical Beta Calibration
  async getHistoricalBetaCalibration(filters?: {
    method: 'last_3_moves' | 'zone_averaged' | 'optimized_zones';
    bank_filter?: string[];
    product_filter?: string[];
    tier_filter?: string[];
    analysis_window?: string; // e.g., '90d', '180d', '1y'
    min_data_points?: number;
  }): Promise<{
    calibration_method: string;
    analysis: {
      last_3_hikes?: {
        count: number;
        avg_beta: number;
        avg_rate_change: number;
        data_points: number;
        confidence: number;
      };
      last_3_cuts?: {
        count: number;
        avg_beta: number;
        avg_rate_change: number;
        data_points: number;
        confidence: number;
      };
      zone_analysis?: {
        low_rate_zone: {
          avg_beta: number;
          data_points: number;
          r_squared: number;
        };
        mid_rate_zone: {
          avg_beta: number;
          data_points: number;
          r_squared: number;
        };
        high_rate_zone: {
          avg_beta: number;
          data_points: number;
          r_squared: number;
        };
      };
      optimized_zones?: {
        recommended_zones: number;
        optimal_transitions: number[];
        zone_configs: Array<{
          zone_start: number;
          zone_end: number;
          beta_multiplier: number;
          r_squared: number;
          data_points: number;
        }>;
        improvement_score: number;
      };
    };
    recommended_config: {
      lowRateBetaMultiplier: number;
      midRateBetaMultiplier: number;
      highRateBetaMultiplier: number;
      cutSensitivityOverride?: number;
      hikeSensitivityOverride?: number;
      lowToMidConvexityZone?: number;
      midToHighConvexityZone?: number;
      confidence_score: number;
    };
    metadata: {
      analysis_period: string;
      data_points_analyzed: number;
      banks_included: string[];
      products_included: string[];
      generated_at: string;
    };
  }> {
    const params = new URLSearchParams();
    
    if (filters) {
      params.append('method', filters.method);
      if (filters.bank_filter?.length) {
        filters.bank_filter.forEach(bank => params.append('banks', bank));
      }
      if (filters.product_filter?.length) {
        filters.product_filter.forEach(product => params.append('products', product));
      }
      if (filters.tier_filter?.length) {
        filters.tier_filter.forEach(tier => params.append('tiers', tier));
      }
      if (filters.analysis_window) params.append('analysis_window', filters.analysis_window);
      if (filters.min_data_points) params.append('min_data_points', filters.min_data_points.toString());
    }
    
    const response = await apiClient.get(`/beta-calibration/historical?${params.toString()}`);
    return response.data;
  },

  async applyHistoricalCalibration(config: {
    method: 'last_3_moves' | 'zone_averaged' | 'optimized_zones';
    target_product: {
      bank_code: string;
      product_name: string;
      tier_number: number;
    };
    calibration_params: {
      lowRateBetaMultiplier: number;
      midRateBetaMultiplier: number;
      highRateBetaMultiplier: number;
      cutSensitivityOverride?: number;
      hikeSensitivityOverride?: number;
      lowToMidConvexityZone?: number;
      midToHighConvexityZone?: number;
    };
    constraint_config?: {
      maxSpreadOverBase?: number;
      maxAbsoluteSpread?: number;
      maxSpreadUnderBase?: number;
      minSpreadUnderBase?: number;
      capSpreadAtCurrentLevel?: boolean;
    };
  }): Promise<{
    calibrated_ladder: {
      bank: string;
      product: string;
      tier: string;
      tier_number: number;
      current_rate: number;
      calibration_method: string;
      rate_steps: Array<{
        base_rate: number;
        product_rate: number;
        beta: number;
        confidence: number;
        rate_environment: string;
        calibration_source: string;
      }>;
    };
    comparison: {
      original_ladder?: any;
      calibration_impact: {
        avg_beta_change: number;
        rate_sensitivity_change: number;
        max_rate_change: number;
        zones_affected: string[];
      };
    };
    validation: {
      monotonic_check: boolean;
      constraint_compliance: boolean;
      realistic_ranges: boolean;
      historical_alignment: number; // 0-1 score
    };
    metadata: {
      calibrated_at: string;
      data_source: string;
      confidence_level: number;
    };
  }> {
    const response = await apiClient.post('/beta-calibration/apply', config);
    return response.data;
  },

  // Rainy Day Saver Test Case
  async getRainyDayTestLadder(config?: {
    maxSpreadOverBase?: number;
    maxAbsoluteSpread?: number;
    maxSpreadUnderBase?: number;
    minSpreadUnderBase?: number;
    naturalStrategy?: number;
    rateEnvironmentStrategy?: number;
    lowToMidConvexityZone?: number;
    midToHighConvexityZone?: number;
    newEntrantPressure?: number;
    marketShareDefence?: number;
    pricingEnvironment?: number;
    lowRateBetaMultiplier?: number;
    midRateBetaMultiplier?: number;
    highRateBetaMultiplier?: number;
    cutSensitivityOverride?: number | null;
    hikeSensitivityOverride?: number | null;
  }): Promise<{
    test_case: {
      product: string;
      bank: string;
      tier: number;
      description: string;
    };
    current_state: {
      boe_rate: number;
      product_rate: number;
      rate_spread: number;
    };
    last_cut_analysis: {
      analysis_method: string;
      last_cut_detected: boolean;
      estimated_cut_sensitivity: number;
      reasoning: string;
      last_cut_behavior?: any;
      data_points_analyzed?: number;
    };
    ladder: {
      product: string;
      bank: string;
      tier: string;
      tier_number: number;
      current_boe_rate: number;
      current_product_rate: number;
      construction_date: string;
      rate_steps: Array<{
        base_rate: number;
        product_rate: number;
        beta: number;
        confidence: number;
        rate_environment: string;
        rate_change_from_current: number;
        construction_method: string;
      }>;
    };
    configuration: any;
    constraints_applied: string[];
    validation: {
      monotonic_check: boolean;
      floor_constraints: boolean;
      interpolation_steps: boolean;
    };
    metadata: {
      generated_at: string;
      test_methodology: string;
      calibration_source: string;
    };
  }> {
    const params = new URLSearchParams();
    
    if (config) {
      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const url = params.toString() ? 
      `/beta-ladders/rainy-day-saver-test?${params.toString()}` : 
      '/beta-ladders/rainy-day-saver-test';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  // Product Rates
  async getProductRates(filters?: {
    banks?: string | string[];
    productType?: string;
    extractionDate?: string;
    useIRRBB?: boolean;
  }): Promise<ProductRate[]> {
    // Transform the latest rates data into ProductRate format
    const params = new URLSearchParams();
    if (filters?.extractionDate) params.append('date', filters.extractionDate);
    
    // Get banks parameter
    let bankCategories: string[] = ['major_banks', 'building_societies', 'challenger_banks'];
    if (filters?.banks && filters.banks !== 'all') {
      if (typeof filters.banks === 'string') {
        bankCategories = [filters.banks];
      } else {
        bankCategories = filters.banks;
      }
    }
    
    if (bankCategories.length > 0) {
      params.append('categories', bankCategories.join(','));
    }
    
    const response = await apiClient.get(`/rates/latest?${params.toString()}`);
    const latestRates: LatestRate[] = response.data;
    
    // Transform to ProductRate format with aggregated min/max rates by product
    const productMap = new Map<string, {
      bank_name: string;
      bank_code: string;
      product_name: string;
      product_type: string;
      rates: number[];
      irrbb_category: string;
    }>();
    
    latestRates.forEach(rate => {
      const key = `${rate.bank_code}-${rate.product_name}`;
      if (!productMap.has(key)) {
        productMap.set(key, {
          bank_name: rate.bank_name,
          bank_code: rate.bank_code,
          product_name: rate.product_name,
          product_type: rate.product_type,
          rates: [],
          irrbb_category: mapProductTypeToIRRBB(rate.product_type)
        });
      }
      productMap.get(key)!.rates.push(rate.current_effective_rate);
    });
    
    // Convert to ProductRate array
    return Array.from(productMap.values()).map(product => ({
      bank_name: product.bank_name,
      bank_code: product.bank_code,
      product_name: product.product_name,
      product_type: product.product_type,
      min_rate: Math.min(...product.rates),
      max_rate: Math.max(...product.rates),
      tier_count: product.rates.length,
      irrbb_category: product.irrbb_category
    }));
  },

  // IRRBB Categories
  async getIRRBBCategories(): Promise<IRRBBCategory[]> {
    // Return static IRRBB categories for now
    return [
      {
        id: 'rate_sensitive_instant_access',
        name: 'Rate Sensitive Instant Access',
        description: 'Instant access savings products that are rate sensitive',
        behavioral_notes: 'High rate sensitivity, immediate withdrawal'
      },
      {
        id: 'instant_access_savings',
        name: 'Instant Access Savings',
        description: 'Standard instant access savings products',
        behavioral_notes: 'Moderate rate sensitivity, immediate withdrawal'
      },
      {
        id: 'isa_savings',
        name: 'ISA Savings',
        description: 'Individual Savings Account products',
        behavioral_notes: 'Tax-free savings with annual limits'
      },
      {
        id: 'regular_saver',
        name: 'Regular Saver',
        description: 'Regular monthly savings products',
        behavioral_notes: 'Fixed monthly deposits, higher rates'
      },
      {
        id: 'fixed_term',
        name: 'Fixed Term',
        description: 'Fixed term deposit products',
        behavioral_notes: 'Low behavioral optionality, fixed duration'
      }
    ];
  },

  // Time Series Data for Beta Analysis
  async getTimeSeriesData(filters?: {
    fromDate?: string;
    toDate?: string;
    groupingMode?: 'categories' | 'products';
    categories?: string[];
    banks?: string[];
    productTypes?: string[];
  }): Promise<BetaTimeSeries[]> {
    const params = new URLSearchParams();
    
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);
    if (filters?.groupingMode) params.append('groupingMode', filters.groupingMode);
    if (filters?.categories?.length) params.append('categories', filters.categories.join(','));
    if (filters?.banks?.length) params.append('banks', filters.banks.join(','));
    if (filters?.productTypes?.length) params.append('productTypes', filters.productTypes.join(','));
    
    const response = await apiClient.get(`/rates/time-series?${params.toString()}`);
    return response.data;
  },
};