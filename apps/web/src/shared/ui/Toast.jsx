import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCheckCircle, FiInfo, FiAlertTriangle, FiXCircle, FiX } from 'react-icons/fi'

const ToastContext = createContext({ notify: ()=>{} })

const icons = {
  success: <FiCheckCircle className="text-green-600" />,
  info: <FiInfo className="text-blue-600" />,
  warning: <FiAlertTriangle className="text-amber-600" />,
  error: <FiXCircle className="text-red-600" />,
}

export function ToastProvider({ children }){
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id)=> setToasts(ts=> ts.filter(t=> t.id!==id)), [])
  const notify = useCallback((opts)=>{
    const id = ++idRef.current
    const toast = { id, title: opts.title||'', message: opts.message||'', type: opts.type||'info', duration: opts.duration??3000 }
    setToasts(ts=> [...ts, toast])
    if (toast.duration>0){ setTimeout(()=> remove(id), toast.duration) }
  }, [remove])

  const value = useMemo(()=> ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed z-50 inset-x-0 bottom-16 sm:bottom-4 flex flex-col gap-2 px-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t=> (
            <motion.div key={t.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type:'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto bg-white border rounded-xl shadow-lg p-3 flex items-start gap-3">
              <div className="mt-0.5">{icons[t.type]||icons.info}</div>
              <div className="flex-1">
                {t.title && <div className="font-medium text-sm">{t.title}</div>}
                {t.message && <div className="text-xs text-gray-600">{t.message}</div>}
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={()=>remove(t.id)}>
                <FiX />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(){
  return useContext(ToastContext)
}


