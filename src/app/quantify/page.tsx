'use client';

export default function QuantifyPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="space-y-8 p-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-black rounded-3xl shadow-2xl border border-gray-800">
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-gray-300 text-sm font-semibold uppercase tracking-wider">Risk Metrics</span>
                </div>
                <h1 className="text-4xl font-bold text-white leading-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  Quantify
                </h1>
                <p className="text-gray-300 text-lg max-w-2xl leading-relaxed">
                  High-level risk metrics and quantification analysis.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Risk Quantification</h2>
          <p className="text-gray-600">
            This page is for high-level risk metrics and quantification. Content coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}