export default function SimpleTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-blue-600">Simple Test Page</h1>
      <p className="mt-4">If you can see this, the server is working.</p>
      <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded">
        <p className="text-green-800">✅ Next.js is running successfully!</p>
        <p className="text-sm text-green-600 mt-2">Server time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}