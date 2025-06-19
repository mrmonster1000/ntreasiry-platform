// Browser-based Lloyds data import utility
// Can be executed from browser console or test pages

import { lloydsCompleteHistoricalData as lloydsHistoricalData } from '../../data/lloyds_complete_historical_import';

export interface ImportResult {
  imported: number;
  errors: string[];
  duplicates: number;
  details: string[];
}

export async function importLloydsDataBrowser(): Promise<ImportResult> {
  console.log('🏦 Starting Lloyds historical data import (Browser)...');
  console.log(`📊 Preparing to import ${lloydsHistoricalData.length} historical rate records`);
  
  const result: ImportResult = {
    imported: 0,
    errors: [],
    duplicates: 0,
    details: []
  };

  try {
    // Transform data for API consumption
    const transformedData = lloydsHistoricalData.map(record => ({
      bank_code: record.bank_code,
      product_name: record.product_name,
      product_type: record.product_type,
      rate: record.tiers[0]?.total_rate || 0,
      date: record.collection_date,
      effective_from: record.effective_from,
      effective_to: record.effective_to || null,
      is_future_rate: record.is_future_rate,
      source: record.source,
      notes: `${record.notes} | Tiers: ${record.tiers.length} | First tier: ${record.tiers[0]?.balance_minimum}-${record.tiers[0]?.balance_maximum || '∞'} at ${record.tiers[0]?.total_rate}%`,
      tier_data: JSON.stringify(record.tiers),
      extraction_confidence: record.extraction_confidence
    }));

    console.log('🔄 Sending data to backend API...');
    
    // Make API call to import endpoint
    const response = await fetch('http://localhost:3002/api/historical-data/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ data: transformedData })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiResult = await response.json();
    
    result.imported = apiResult.imported || 0;
    result.duplicates = apiResult.duplicates || 0;
    result.errors = apiResult.errors || [];
    
    console.log('✅ Import completed successfully!');
    console.log(`📈 Imported: ${result.imported} records`);
    console.log(`🔄 Duplicates: ${result.duplicates} records`);
    
    if (result.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    // Add details about what was imported
    result.details = [
      `Total records processed: ${lloydsHistoricalData.length}`,
      `Successfully imported: ${result.imported}`,
      `Duplicates skipped: ${result.duplicates}`,
      `Errors: ${result.errors.length}`,
      '',
      'Products included:',
      ...Array.from(new Set(lloydsHistoricalData.map(r => r.product_name))).map(name => `  • ${name}`),
      '',
      'Date ranges covered:',
      `  • Earliest: ${Math.min(...lloydsHistoricalData.map(r => new Date(r.effective_from).getTime()))}`,
      `  • Latest: ${Math.max(...lloydsHistoricalData.map(r => new Date(r.effective_to || r.effective_from).getTime()))}`,
    ];
    
    return result;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Import failed: ${errorMessage}`);
    
    if (error.response) {
      result.errors.push(`API Response: ${error.response.status} ${error.response.statusText}`);
    }
    
    throw error;
  }
}

// Export data for inspection
export { lloydsHistoricalData };

// Global function for browser console access
if (typeof window !== 'undefined') {
  (window as any).importLloydsData = importLloydsDataBrowser;
  (window as any).lloydsData = lloydsHistoricalData;
  
  console.log('🔧 Lloyds import utilities loaded!');
  console.log('   Run: importLloydsData() to start import');
  console.log('   Inspect: lloydsData to view the data');
}