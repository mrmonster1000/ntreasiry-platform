#!/usr/bin/env node

// Import Lloyds Club historical data into the database
const fetch = require('node-fetch');

// Load the historical data
const { lloydsCompleteHistoricalData } = require('../data/lloyds_complete_historical_import.ts');

async function importLloydsData() {
  try {
    console.log('Starting Lloyds historical data import...');
    console.log(`Importing ${lloydsCompleteHistoricalData.length} historical records`);
    
    const response = await fetch('http://localhost:3002/api/historical-data/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        data: lloydsCompleteHistoricalData.map(record => ({
          bank_code: record.bank_code,
          product_name: record.product_name,
          product_type: record.product_type,
          rate: record.tiers[0]?.total_rate || 0, // Use first tier rate for now
          date: record.collection_date,
          effective_from: record.effective_from,
          effective_to: record.effective_to,
          is_future_rate: record.is_future_rate,
          source: record.source,
          notes: record.notes + ' | Tiers: ' + record.tiers.map(t => `${t.tier_name}: ${t.total_rate}%`).join(', ')
        }))
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log('Import completed successfully:', result);
    return result;
  } catch (error) {
    console.error('Import failed:', error);
    throw error;
  }
}

importLloydsData()
  .then(() => {
    console.log('✅ Lloyds historical data import completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  });