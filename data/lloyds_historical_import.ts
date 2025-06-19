// Lloyds Bank Historical Rate Data Import
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

export const lloydsHistoricalData: HistoricalRateImport[] = [
  // Club Lloyds Current Account
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
    notes: "Imported from Lloyds historical rates page - Club Lloyds Current Account with tiered rates",
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
    notes: "Imported from Lloyds historical rates page - Higher rates during 2019-2020 period",
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
    notes: "Imported from Lloyds historical rates page - Single tier period",
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
    notes: "Imported from Lloyds historical rates page - Higher rate period",
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
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15", 
    effective_from: "2014-03-30",
    effective_to: "2017-01-07",
    is_future_rate: false,
    extraction_confidence: 0.90,
    source: "historical_import",
    notes: "Imported from Lloyds historical rates page - Extended period with tiered rates, exact tiers need verification",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 2500,
        base_rate: 1.00,
        total_rate: 1.00,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 2501,
        balance_maximum: 5000,
        base_rate: 4.00,
        total_rate: 4.00,
        rate_type: "standard",
        conditions: ["Club Lloyds membership required"]
      }
    ]
  },

  // Club Lloyds Gold Current Account
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Gold Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2020-10-01", 
    effective_to: "2023-01-30",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Imported from Lloyds historical rates page - Club Lloyds Gold with premium tiers",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 3999.99,
        base_rate: 0.60,
        total_rate: 0.60,
        rate_type: "standard",
        conditions: ["Club Lloyds Gold membership required"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 1.50,
        total_rate: 1.50,
        rate_type: "standard",
        conditions: ["Club Lloyds Gold membership required"]
      }
    ]
  },

  // Club Lloyds Platinum Current Account  
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Platinum Current Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2020-10-01",
    effective_to: "2023-01-30", 
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Imported from Lloyds historical rates page - Club Lloyds Platinum premium account",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 3999.99,
        base_rate: 0.60,
        total_rate: 0.60,
        rate_type: "standard",
        conditions: ["Club Lloyds Platinum membership required"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 1.50,
        total_rate: 1.50,
        rate_type: "standard",
        conditions: ["Club Lloyds Platinum membership required"]
      }
    ]
  },

  // Club Lloyds Premier Current Account
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Club Lloyds Premier Current Account", 
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2020-10-01",
    effective_to: "2023-01-30",
    is_future_rate: false,
    extraction_confidence: 0.95,
    source: "historical_import",
    notes: "Imported from Lloyds historical rates page - Club Lloyds Premier account",
    tiers: [
      {
        tier_name: "Tier 1",
        balance_minimum: 1,
        balance_maximum: 3999.99,
        base_rate: 0.60,
        total_rate: 0.60,
        rate_type: "standard",
        conditions: ["Club Lloyds Premier membership required"]
      },
      {
        tier_name: "Tier 2",
        balance_minimum: 4000,
        balance_maximum: 5000,
        base_rate: 1.50,
        total_rate: 1.50,
        rate_type: "standard",
        conditions: ["Club Lloyds Premier membership required"]
      }
    ]
  },

  // Classic Account
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Classic Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2018-01-01",
    effective_to: "2023-01-30",
    is_future_rate: false,
    extraction_confidence: 0.90,
    source: "historical_import",
    notes: "Imported from Lloyds historical rates page - Basic Classic Account, rates need verification for exact periods",
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

  // Vantage Account  
  {
    bank_code: "LLOYDS",
    bank_name: "Lloyds Bank UK",
    product_name: "Vantage Account",
    product_type: "instant_access_savings",
    collection_date: "2024-01-15",
    effective_from: "2018-01-01",
    effective_to: "2021-12-31",
    is_future_rate: false,
    extraction_confidence: 0.85,
    source: "historical_import",
    notes: "Imported from Lloyds historical rates page - Vantage Account, discontinued product",
    tiers: [
      {
        tier_name: "Standard", 
        balance_minimum: 1,
        balance_maximum: null,
        base_rate: 0.15,
        total_rate: 0.15,
        rate_type: "standard",
        conditions: ["Minimum monthly fee required"]
      }
    ]
  }
];

// Function to import data via API
export async function importLloydsHistoricalData() {
  try {
    const response = await fetch('/api/historical-data/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lloydsHistoricalData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Import completed:', result);
    return result;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}