# Widget Registry

This file documents all reusable widgets/components in the nrates application to maintain clear documentation and prevent disasters.

## Widget Documentation

| Widget Name | File Path | Purpose | Inputs | Outputs | Dependencies |
|-------------|-----------|---------|--------|---------|--------------|
| **DashboardStats** | `/src/components/DashboardStats.tsx` | Dashboard metrics display with animated stat cards | `stats?: DashboardStatsType` - Statistics data<br/>`isLoading: boolean` - Loading state | Renders 4 animated metric cards showing banks, products, highest rate, and market average | `@heroicons/react/24/outline`, `@/lib/api` |
| **QuickActions** | `/src/components/QuickActions.tsx` | Action buttons for common tasks and navigation | None (static component) | Renders action buttons for extract, calibration, reports, export, history with modal integration | `@heroicons/react/24/outline`, `./ExportModal` |
| **RecentExtractions** | `/src/components/RecentExtractions.tsx` | List of recent data extraction runs with status and stats | `extractions?: ExtractionRun[]` - Array of extraction data<br/>`isLoading: boolean` - Loading state | Displays extraction history with status icons, timestamps, and quick stats summary | `@heroicons/react/24/outline`, `date-fns`, `@/lib/api` |
| **LatestRatesChart** | `/src/components/LatestRatesChart.tsx` | Bar chart showing highest rates by bank with standard vs promotional breakdown | `data?: LatestRate[]` - Rate data array<br/>`isLoading: boolean` - Loading state | Renders responsive bar chart with bank rates using Recharts | `recharts`, `@/lib/api` |
| **ProductRatesChart** | `/src/components/ProductRatesChart.tsx` | Advanced product rate comparison chart with filtering and Bank of England reference line | `selectedDate?: string` - Date for data extraction | Interactive chart with deposit category filters, bank selection, sort options, and stacked bars showing rate ranges | `@tanstack/react-query`, `recharts`, `@/lib/api` |
| **SpreadsChart** | `/src/components/SpreadsChart.tsx` | Chart/table showing spreads vs Bank of England base rate with dual view modes | `spreads: SpreadData[]` - Spread data<br/>`boeBaseRate: number` - BoE rate<br/>`date: string` - Data date<br/>`isLoading?: boolean` - Loading state | Renders table or custom chart view of rate spreads with performance indicators | `@heroicons/react/24/outline`, `@/lib/api` |
| **AllProductsTable** | `/src/components/AllProductsTable.tsx` | Comprehensive sortable table of all monitored savings products with advanced filtering | `selectedDate?: string` - Date filter<br/>`selectedCategories?: string[]` - Category filters<br/>`compact?: boolean` - Compact mode for dashboard use | Sortable table with search, bank/type filters, rate tiers, and external product links | `@tanstack/react-query`, `@heroicons/react/24/outline`, `@/lib/api` |
| **BankCategoryToggle** | `/src/components/BankCategoryToggle.tsx` | Multi-select checkbox component for bank category filtering | `selectedCategories: string[]` - Currently selected categories<br/>`onCategoriesChange: (categories: string[]) => void` - Change callback<br/>`className?: string` - CSS classes | Calls `onCategoriesChange` with updated category array | `@tanstack/react-query`, `@/lib/api` |
| **DatePicker** | `/src/components/DatePicker.tsx` | Date input component with validation and quick "Today" button | `date: string` - Current date value<br/>`onDateChange: (date: string) => void` - Change callback<br/>`label?: string` - Input label<br/>`className?: string` - CSS classes | Calls `onDateChange` with selected date string | `@heroicons/react/24/outline` |
| **ExportModal** | `/src/components/ExportModal.tsx` | Modal for data export with format and type selection | `isOpen: boolean` - Modal visibility<br/>`onClose: () => void` - Close callback | Triggers data download via API endpoints, closes modal on success | None (uses React Portal and DOM manipulation) |
| **ExtractProgress** | `/src/components/ExtractProgress.tsx` | Real-time progress tracking for data extraction processes | None (fetches data internally) | Displays active extractions with progress bars and recent extraction history | `@tanstack/react-query`, `@heroicons/react/24/outline`, `@/lib/api`, `date-fns` |
| **MarketCommentary** | `/src/components/MarketCommentary.tsx` | AI-powered market analysis with markdown parsing and expandable content | `triggerGeneration?: boolean` - Auto-generate flag<br/>`onGenerate?: () => void` - Generation callback | Renders AI commentary with markdown formatting, expandable content, and refresh controls | `@tanstack/react-query`, `@heroicons/react/24/outline`, `@/lib/api`, `date-fns` |
| **Navigation** | `/src/components/Navigation.tsx` | Main application navigation with dropdown menus and user context | None (static navigation structure) | Renders responsive navigation bar with dropdowns for primary/secondary nav | `@heroicons/react/24/outline`, `next/link`, `next/navigation`, `clsx` |
| **AuthLayout** | `/src/components/AuthLayout.tsx` | Layout wrapper that conditionally shows navigation based on route | `children: React.ReactNode` - Page content | Wraps content with navigation for protected routes, renders children directly for public routes | `./Navigation`, `next/navigation` |
| **BetaCalibrationChart** | `/src/components/beta/BetaCalibrationChart.tsx` | Interactive time series chart showing Bank of England base rate vs product rates with beta calculations | `latestRates: any[]` - Product rate data<br/>`selectedProducts: string[]` - Selected product keys<br/>`selectedCategories: string[]` - Selected bank categories<br/>`groupingMode: string` - Chart grouping mode<br/>`onSelectionChange: () => void` - Callback for product selection | Renders time series chart with Recharts LineChart component | `@tanstack/react-query`, `recharts`, `@/lib/api` |
| **ProductSelectionModal** | `/src/components/beta/ProductSelectionModal.tsx` | Modal for selecting products and tiers with hierarchical browsing and faceted search | `show: boolean` - Modal visibility<br/>`onClose: () => void` - Close callback<br/>`onApply: (selectedItems: string[], showAverages: boolean) => void` - Apply callback<br/>`hierarchicalData: any` - Hierarchical product data<br/>`facetedData: any[]` - Flat product data for search | Calls `onApply` with selected product IDs and average preference | None (pure React component) |
| **BetaHistoryTable** | `/src/components/beta/BetaHistoryTable.tsx` | Table showing individual Bank of England rate change events with bank-by-bank beta calculations | `selectedBanks: string[]` - Selected bank codes<br/>`selectedCategories: string[]` - Selected bank categories<br/>`selectedProducts: string[]` - Selected product keys<br/>`timeWindow?: number` - Analysis window in days (default 90)<br/>`groupingThreshold?: number` - Days for grouping changes (default 7)<br/>`enableGrouping?: boolean` - Enable change grouping (default false)<br/>`forwardLookingDays?: number` - Forward analysis period (default 90) | Renders expandable table showing rate hikes/cuts with individual bank beta calculations | `@tanstack/react-query`, `@/lib/api`, `@heroicons/react/24/outline` |
| **BetaAverageTable** | `/src/components/beta/BetaAverageTable.tsx` | Table showing average beta statistics comparing hikes vs cuts over user-defined periods | `selectedBanks: string[]` - Selected bank codes<br/>`selectedCategories: string[]` - Selected bank categories<br/>`selectedProducts: string[]` - Selected product keys<br/>`onSelectionChange?: () => void` - Product selection callback<br/>`defaultPeriod?: number` - Default period count (default 3) | Renders statistical table with period controls and insights | `@tanstack/react-query`, `@/lib/api`, `@heroicons/react/24/outline` |
| **SafeBetaLadderBuilder** | `/src/components/beta/SafeBetaLadderBuilder.tsx` | Safe configuration-only beta ladder builder without performance-intensive interactive features | `initialConfig?: Partial<BetaConfig>` - Initial configuration values<br/>`onConfigChange?: (config: BetaConfig) => void` - Configuration change callback<br/>`disabled?: boolean` - Disable all controls | Calls `onConfigChange` with validated configuration object containing constraints, beta multipliers, convexity zones, and strategy parameters | `@heroicons/react/24/outline` (minimal dependencies) |

## Widget Creation Guidelines

When creating new widgets:

1. **Document immediately** - Add entry to this table when creating the widget
2. **Clear interfaces** - Define precise TypeScript interfaces for props
3. **Single responsibility** - Each widget should have one clear purpose
4. **Reusable** - Design for reuse across different pages
5. **Self-contained** - Minimize external dependencies where possible

## Widget Categories

### Dashboard Widgets
- **DashboardStats**: Core metrics display with animated cards
- **QuickActions**: Navigation and action buttons
- **RecentExtractions**: Extraction history and status tracking

### Chart Widgets  
- **LatestRatesChart**: Bank rate comparison bar chart
- **ProductRatesChart**: Advanced product rate analysis with filtering
- **SpreadsChart**: BoE spread analysis with dual view modes
- **BetaCalibrationChart**: Time series beta calculation chart

### Data Widgets
- **AllProductsTable**: Comprehensive product data table
- **BetaHistoryTable**: Individual rate change analysis  
- **BetaAverageTable**: Statistical beta comparison
- **ExtractProgress**: Real-time extraction monitoring

### Control Widgets
- **DatePicker**: Date selection with validation
- **BankCategoryToggle**: Multi-select category filtering
- **ProductSelectionModal**: Hierarchical product selection
- **ExportModal**: Data export with format options
- **SafeBetaLadderBuilder**: Safe configuration-only beta ladder builder

### Layout Widgets
- **Navigation**: Main app navigation with dropdowns
- **AuthLayout**: Route-based layout wrapper
- **MarketCommentary**: AI-powered market analysis display

## Recent Changes

- **2025-06-14**: Added SafeBetaLadderBuilder - safe configuration-only version without performance risks
- **2025-06-14**: Complete widget registry documentation added for all 17 components
- **2025-06-14**: Added widget categorization by function (Dashboard, Chart, Data, Control, Layout)
- **2025-06-10**: Created initial widget registry  
- **2025-06-10**: Extracted beta calibration chart and product selection modal from main page
- **2025-06-10**: Added BetaHistoryTable widget for individual rate change analysis
- **2025-06-10**: Added BetaAverageTable widget for statistical hike vs cut comparison