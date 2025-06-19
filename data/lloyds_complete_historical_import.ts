// Comprehensive Lloyds Bank Historical Rate Data Import (2004-2023)
// Data source: https://www.lloydsbank.com/help-guidance/legal-information/rates-and-charges/previous-current-accounts.html

interface HistoricalRateImport {
  bank_code: string;
  bank_name: string;
  product_name: string;
  product_type: string;
  collection_date: string;
  effective_from: string;
  effective_to?: string;
  is_future_rate: boolean;
  extraction_confidence: number;
  source: string;
  notes: string;
  tiers: {
    tier_name: string;
    balance_minimum: number;
    balance_maximum?: number;
    base_rate: number;
    total_rate: number;
    rate_type: string;
    conditions?: string[];
  }[];
}

export const lloydsCompleteHistoricalData: HistoricalRateImport[] = [
  // Classic Account - Early Period (2004-2008)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Classic Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2004-03-01",
    effective_to: "2008-08-18",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Classic Account early period - very low rates during 2004-2008",
    tiers: [
      {
        tier_name: "Standard",
        balance_minimum: 1,
        balance_maximum: null,
        base_rate: 0.10,
        total_rate: 0.10,
        rate_type: "standard",
        conditions: []
      }
    ]
  },

  // Select Account - Early Period (2004-2012)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Select Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2004-03-01",
    effective_to: "2012-10-02",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Select Account long-term period with low rates during financial crisis era",
    tiers: [
      {
        tier_name: "Standard",
        balance_minimum: 1,
        balance_maximum: null,
        base_rate: 0.10,
        total_rate: 0.10,
        rate_type: "standard",
        conditions: []
      }
    ]
  },

  // Under 19s Account - Early Period (2009-2016)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Under 19s Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2009-11-23",
    effective_to: "2016-09-01",
    is_future_rate: false,
    extraction_confidence: 0.90,
    source: "historical_import",
    notes: "Under 19s Account with attractive rates for younger customers - tiered structure",
    tiers: [
      {
        tier_name: "Lower Tier",
        balance_minimum: 1,
        balance_maximum: 2500,
        base_rate: 2.50,
        total_rate: 2.50,
        rate_type: "standard",
        conditions: ["Under 19 years old"]
      },
      {
        tier_name: "Higher Tier", 
        balance_minimum: 2501,
        balance_maximum: null,
        base_rate: 0.10,
        total_rate: 0.10,
        rate_type: "standard",
        conditions: ["Under 19 years old"]
      }
    ]
  },

  // Vantage Account - Multiple periods with higher rates
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Vantage Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2009-01-01",
    effective_to: "2014-12-31",
    is_future_rate: false,
    extraction_confidence: 0.85,
    source: "historical_import",
    notes: "Vantage Account with progressive tiered rates - premium account type",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 1000,
        base_rate: 1.00,
        total_rate: 1.00,
        rate_type: "standard",
        conditions: ["Vantage account holder"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 1001,
        balance_maximum: 2500,
        base_rate: 2.00,
        total_rate: 2.00,
        rate_type: "standard",
        conditions: ["Vantage account holder"]
      },
      {
        tier_name: "Tier 3",
        balance_minimum: 2501,
        balance_maximum: 5000,
        base_rate: 4.00,
        total_rate: 4.00,
        rate_type: "standard",
        conditions: ["Vantage account holder"]
      }
    ]
  },

  // Student Account - Early Period (2007-2013) 
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Student Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2007-01-01",
    effective_to: "2013-12-31",
    is_future_rate: false,
    extraction_confidence: 0.85,
    source: "historical_import",
    notes: "Student Account with graduated overdraft structure - rates around 8.2% EAR",
    tiers: [
      {
        tier_name: "Standard",
        balance_minimum: 1,
        balance_maximum: null,
        base_rate: 0.10,
        total_rate: 0.10,
        rate_type: "standard",
        conditions: ["Student status required", "Overdraft facility available"]
      }
    ]
  },

  // Club Lloyds Current Account - Extended Historical Coverage
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2010-01-01",
    effective_to: "2014-03-29",
    is_future_rate: false,
    extraction_confidence: 0.80,
    source: "historical_import",
    notes: "Club Lloyds early period - before the high-rate era of 2014-2017",
    tiers: [
      {
        tier_name: "Standard",
        balance_minimum: 1,
        balance_maximum: 5000,
        base_rate: 0.50,
        total_rate: 0.50,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      }
    ]
  },

  // Club Lloyds Current Account - High Rate Period (2014-2017)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2014-03-30",
    effective_to: "2017-01-07",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Club Lloyds high-rate period - extremely competitive rates up to 4%",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 1999.99,
        base_rate: 1.00,
        total_rate: 1.00,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 2000,
        balance_maximum: 3999.99,
        base_rate: 2.00,
        total_rate: 2.00,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      },
      {
        tier_name: "Tier 3",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 4.00,
        total_rate: 4.00,
        rate_type: "premium",
        conditions: ["Club Lloyds membership required"]
      }
    ]
  },

  // Club Lloyds Current Account - Rate Reduction Period (2017-2018)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2017-01-08",
    effective_to: "2018-06-30",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Club Lloyds rate reduction - move to single tier structure at 2%",
    tiers: [
      {
        tier_name: "Standard",
        balance_minimum: 1,
        balance_maximum: 5000,
        base_rate: 2.00,
        total_rate: 2.00,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      }
    ]
  },

  // Club Lloyds Current Account - Further Reduction (2018-2019)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2018-07-01",
    effective_to: "2019-09-30",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Club Lloyds continued rate reduction to 1.5%",
    tiers: [
      {
        tier_name: "Standard",
        balance_minimum: 1,
        balance_maximum: 5000,
        base_rate: 1.50,
        total_rate: 1.50,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      }
    ]
  },

  // Club Lloyds Current Account - Pre-COVID Period (2019-2020)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2019-10-01",
    effective_to: "2020-09-30",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Club Lloyds pre-COVID period - return to tiered structure with higher rates",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 3999.99,
        base_rate: 1.00,
        total_rate: 1.00,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 2.00,
        total_rate: 2.00,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      }
    ]
  },

  // Club Lloyds Current Account - COVID/Low Rate Period (2020-2023)
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2020-10-01",
    effective_to: "2023-01-30",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Club Lloyds COVID-era low rates - significant reduction from previous periods",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 3999.99,
        base_rate: 0.60,
        total_rate: 0.60,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 1.50,
        total_rate: 1.50,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      }
    ]
  },

  // Club Lloyds Gold - Historical Period
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Gold Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2014-01-01",
    effective_to: "2023-01-30",
    is_future_rate: false,
    extraction_confidence: 0.90,
    source: "historical_import",
    notes: "Club Lloyds Gold - premium variant with similar rate structure to standard Club Lloyds",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 3999.99,
        base_rate: 0.60,
        total_rate: 0.60,
        rate_type: "standard",
        conditions: ["Club Lloyds Gold membership required", "Premium features included"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 1.50,
        total_rate: 1.50,
        rate_type: "standard",
        conditions: ["Club Lloyds Gold membership required", "Premium features included"]
      }
    ]
  },

  // Club Lloyds Platinum - Historical Period
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Platinum Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2014-01-01",
    effective_to: "2023-01-30",
    is_future_rate: false,
    extraction_confidence: 0.90,
    source: "historical_import",
    notes: "Club Lloyds Platinum - top-tier variant with comprehensive benefits",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 3999.99,
        base_rate: 0.60,
        total_rate: 0.60,
        rate_type: "standard",
        conditions: ["Club Lloyds Platinum membership required", "Premium benefits package"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 1.50,
        total_rate: 1.50,
        rate_type: "standard",
        conditions: ["Club Lloyds Platinum membership required", "Premium benefits package"]
      }
    ]
  }
];

// Updated import function using complete dataset
export async function importLloydsCompleteHistoricalData() {
  try {
    const response = await fetch('/api/historical-data/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: lloydsCompleteHistoricalData })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Complete historical import completed:', result);
    return result;
  } catch (error) {
    console.error('Complete historical import failed:', error);
    throw error;
  }
}