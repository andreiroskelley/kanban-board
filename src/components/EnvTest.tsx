"use client";

export default function EnvTest() {
  console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE);

  return (
    <div className="p-4 border rounded-lg bg-blue-50">
      <h3 className="font-bold mb-2">Environment Variable Test</h3>
      <p className="text-sm">
        Check browser console for: <code>process.env.NEXT_PUBLIC_API_BASE</code>
      </p>
      <p className="text-sm mt-2">
        Value: <span className="font-mono bg-gray-100 px-2 py-1 rounded">
          {process.env.NEXT_PUBLIC_API_BASE || 'Not found'}
        </span>
      </p>
    </div>
  );
}