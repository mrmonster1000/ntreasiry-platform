# Widget Registry

This file documents all reusable widgets/components in the nrates application to maintain clear documentation and prevent disasters.

## Widget Documentation

| Widget Name | File Path | Purpose | Inputs | Outputs | Dependencies |
|-------------|-----------|---------|--------|---------|--------------|
| **BetaCalibrationChart** | `/src/components/beta/BetaCalibrationChart.tsx` | Interactive time series chart showing Bank of England base rate vs product rates with beta calculations | `latestRates: any[]` - Product rate data<br/>`selectedProducts: string[]` - Selected product keys<br/>`selectedCategories: string[]` - Selected bank categories<br/>`groupingMode: string` - Chart grouping mode<br/>`onSelectionChange: () => void` - Callback for product selection | Renders time series chart with Recharts LineChart component | `@tanstack/react-query`, `recharts`, `@/lib/api` |
| **ProductSelectionModal** | `/src/components/beta/ProductSelectionModal.tsx` | Modal for selecting products and tiers with hierarchical browsing and faceted search | `show: boolean` - Modal visibility<br/>`onClose: () => void` - Close callback<br/>`onApply: (selectedItems: string[], showAverages: boolean) => void` - Apply callback<br/>`hierarchicalData: any` - Hierarchical product data<br/>`facetedData: any[]` - Flat product data for search | Calls `onApply` with selected product IDs and average preference | None (pure React component) |
| **BetaHistoryTable** | `/src/components/beta/BetaHistoryTable.tsx` | Table showing individual Bank of England rate change events with bank-by-bank beta calculations | `selectedBanks: string[]` - Selected bank codes<br/>`selectedCategories: string[]` - Selected bank categories<br/>`selectedProducts: string[]` - Selected product keys<br/>`timeWindow?: number` - Analysis window in days (default 90)<br/>`groupingThreshold?: number` - Days for grouping changes (default 7)<br/>`enableGrouping?: boolean` - Enable change grouping (default false)<br/>`forwardLookingDays?: number` - Forward analysis period (default 90) | Renders expandable table showing rate hikes/cuts with individual bank beta calculations | `@tanstack/react-query`, `@/lib/api`, `@heroicons/react/24/outline` |

## Widget Creation Guidelines

When creating new widgets:

1. **Document immediately** - Add entry to this table when creating the widget
2. **Clear interfaces** - Define precise TypeScript interfaces for props
3. **Single responsibility** - Each widget should have one clear purpose
4. **Reusable** - Design for reuse across different pages
5. **Self-contained** - Minimize external dependencies where possible

## Recent Changes

- **2025-06-10**: Created initial widget registry
- **2025-06-10**: Extracted beta calibration chart and product selection modal from main page