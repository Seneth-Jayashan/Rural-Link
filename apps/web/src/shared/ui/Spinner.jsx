import { motion } from 'framer-motion'

export function Spinner({ size=24 }){
  const s = typeof size==='number'? `${size}px` : size
  return (
    <motion.div className="inline-block" initial={{ rotate:0 }} animate={{ rotate:360 }} transition={{ repeat:Infinity, ease:'linear', duration:1.2 }} style={{ width:s, height:s }}>
      <svg viewBox="0 0 50 50" className="w-full h-full">
        <circle cx="25" cy="25" r="20" fill="none" strokeWidth="6" stroke="#e5e7eb" />
        <motion.circle cx="25" cy="25" r="20" fill="none" strokeWidth="6" stroke="#2563eb" strokeLinecap="round"
          initial={{ pathLength: 0.2, rotate:0 }} animate={{ pathLength: 0.8, rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:'easeInOut' }} />
      </svg>
    </motion.div>
  )
}


