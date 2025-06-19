#!/usr/bin/env npx tsx

// Import script for Lloyds historical data  
import { lloydsCompleteHistoricalData } from '../data/lloyds_complete_historical_import';

async function importLloydsData() {
  console.log('🏦 Starting Lloyds historical data import...');
  console.log(`📊 Preparing to import ${lloydsCompleteHistoricalData.length} historical rate records`);
  
  try {
    // Transform data to match API expected format
    const transformedData = lloydsCompleteHistoricalData.map(record => ({
      bank_code: record.bank_code,
      product_name: record.product_name,
      product_type: record.product_type,
      rate: record.tiers[0]?.total_rate || 0, // Use first tier rate as primary rate
      date: record.collection_date,
      effective_from: record.effective_from,
      effective_to: record.effective_to || null,
      is_future_rate: record.is_future_rate,
      source: record.source,
      notes: `${record.notes} | Tiers: ${record.tiers.map(t => `${t.tier_name}: ${t.total_rate}%`).join(', ')}`
    }));

    console.log('🔄 Sending data to API...');
    console.log('Sample record:', JSON.stringify(transformedData[0], null, 2));
    
    // Use fetch directly since the API client has issues
    const response = await fetch('http://localhost:3002/api/historical-data/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: transformedData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Import completed successfully!');
    console.log(`📈 Imported: ${result.imported} records`);
    console.log(`🔄 Duplicates: ${result.duplicates} records`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      result.errors.forEach((error: string, index: number) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    console.log('\n📋 Import Summary:');
    console.log(`   • Total records processed: ${lloydsCompleteHistoricalData.length}`);
    console.log(`   • Successfully imported: ${result.imported}`);
    console.log(`   • Duplicates skipped: ${result.duplicates}`);
    console.log(`   • Errors: ${result.errors?.length || 0}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Self-executing function
async function main() {
  try {
    await importLloydsData();
    process.exit(0);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

main();