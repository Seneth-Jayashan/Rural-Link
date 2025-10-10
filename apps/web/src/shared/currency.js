export function formatLKR(amount){
  const num = Number(amount || 0)
  try{
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 2 }).format(num)
  }catch{
    // Fallback formatting
    return `Rs ${num.toFixed(2)}`
  }
}


