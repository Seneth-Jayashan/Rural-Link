// This file is retained for backward compatibility; the merchant entry route now redirects
// to `/merchant/products`. Consider removing this file if no longer used directly.
export default function MerchantDashboard(){
  return (
    <div className="p-3 pb-16">
      <h1 className="text-lg font-semibold mb-3">Merchant</h1>
      <p className="text-sm text-gray-600">Please use the Products tab below.</p>
    </div>
  )
}


