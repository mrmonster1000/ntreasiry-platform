#!/usr/bin/env npx tsx

// Import script for Lloyds historical data
// Run with: npx tsx scripts/import-lloyds-data.ts

import { lloydsHistoricalData } from '../data/lloyds_historical_import';
import { APIClient } from '../src/lib/api';

async function importLloydsData() {
  console.log('🏦 Starting Lloyds historical data import...');
  console.log(`📊 Preparing to import ${lloydsHistoricalData.length} historical rate records`);
  
  // Initialize API client
  const apiClient = new APIClient('http://localhost:3002');
  
  try {
    // Transform data to match API expected format
    const transformedData = lloydsHistoricalData.map(record => ({
      bank_code: record.bank_code,
      product_name: record.product_name,
      product_type: record.product_type,
      rate: record.tiers[0]?.total_rate || 0, // Use first tier rate as primary rate
      date: record.collection_date,
      effective_from: record.effective_from,
      effective_to: record.effective_to || null,
      is_future_rate: record.is_future_rate,
      source: record.source,
      notes: `${record.notes} | Tiers: ${record.tiers.length}`,
      // Additional metadata for complex products
      tier_data: JSON.stringify(record.tiers),
      extraction_confidence: record.extraction_confidence
    }));

    console.log('🔄 Sending data to API...');
    
    // Use the existing importHistoricalData method
    const result = await apiClient.importHistoricalData(transformedData);
    
    console.log('✅ Import completed successfully!');
    console.log(`📈 Imported: ${result.imported} records`);
    console.log(`🔄 Duplicates: ${result.duplicates} records`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n📋 Import Summary:');
    console.log(`   • Total records processed: ${lloydsHistoricalData.length}`);
    console.log(`   • Successfully imported: ${result.imported}`);
    console.log(`   • Duplicates skipped: ${result.duplicates}`);
    console.log(`   • Errors: ${result.errors?.length || 0}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    
    // Additional error context
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.statusText);
      console.error('Response data:', error.response.data);
    }
    
    throw error;
  }
}

// Self-executing function for direct script execution
async function main() {
  try {
    await importLloydsData();
    process.exit(0);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

export { importLloydsData };