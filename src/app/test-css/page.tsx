'use client';

export default function TestCSSPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">CSS Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 className="text-xl font-semibold text-blue-600 mb-2">Tailwind CSS Test</h2>
          <p className="text-gray-700">If you can see styling on this page, Tailwind is working.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-100 border border-red-300 rounded p-4">
            <p className="text-red-800">Red Box</p>
          </div>
          <div className="bg-green-100 border border-green-300 rounded p-4">
            <p className="text-green-800">Green Box</p>
          </div>
          <div className="bg-blue-100 border border-blue-300 rounded p-4">
            <p className="text-blue-800">Blue Box</p>
          </div>
        </div>
        
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Test Button
        </button>
      </div>
    </div>
  );
}