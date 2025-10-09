import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPhone, FiPhoneCall, FiMic, FiMicOff, FiX } from 'react-icons/fi'
import webrtcService from '../webrtc.js'

export default function CallComponent({ 
  isOpen, 
  onClose, 
  callType = 'outgoing', // 'outgoing', 'incoming', 'active'
  orderId,
  recipientInfo,
  callId,
  offer, // For incoming calls
  onCallAccepted,
  onCallRejected,
  onCallEnded
}) {
  const [isMuted, setIsMuted] = useState(false)
  const [callStatus, setCallStatus] = useState(callType)
  const [callDuration, setCallDuration] = useState(0)
  
  const durationIntervalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setupWebRTCListeners()
    }
    return () => {
      cleanupWebRTCListeners()
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (callStatus === 'active') {
      startCallTimer()
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        setCallDuration(0)
      }
    }
  }, [callStatus])

  const setupWebRTCListeners = () => {
    webrtcService.on('onCallAccepted', () => {
      setCallStatus('active')
      if (onCallAccepted) onCallAccepted()
    })

    webrtcService.on('onCallRejected', () => {
      handleCallEnd()
      if (onCallRejected) onCallRejected()
    })

    webrtcService.on('onCallEnded', () => {
      handleCallEnd()
      if (onCallEnded) onCallEnded()
    })
  }

  const cleanupWebRTCListeners = () => {
    webrtcService.off('onCallAccepted')
    webrtcService.off('onCallRejected')
    webrtcService.off('onCallEnded')
  }

  const startCallTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAcceptCall = async () => {
    try {
      await webrtcService.handleIncomingCall({
        callId: callId,
        offer: offer
      })
      setCallStatus('active')
      if (onCallAccepted) onCallAccepted()
    } catch (error) {
      console.error('Error accepting call:', error)
    }
  }

  const handleRejectCall = () => {
    webrtcService.rejectCall(callId, orderId)
    handleCallEnd()
    if (onCallRejected) onCallRejected()
  }

  const handleEndCall = () => {
    webrtcService.endCall()
    handleCallEnd()
    if (onCallEnded) onCallEnded()
  }

  const handleCallEnd = () => {
    setCallStatus('ended')
    setTimeout(() => {
      onClose()
    }, 1000)
  }

  const toggleMute = () => {
    const newMuteState = webrtcService.toggleMute()
    setIsMuted(!newMuteState)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-blue-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  {callStatus === 'incoming' ? 'Incoming Call' : 
                   callStatus === 'outgoing' ? 'Calling...' : 
                   callStatus === 'active' ? 'Call Active' : 'Call Ended'}
                </h3>
                {recipientInfo && (
                  <p className="text-sm opacity-90">
                    {recipientInfo.firstName} {recipientInfo.lastName}
                  </p>
                )}
                {callStatus === 'active' && (
                  <p className="text-sm opacity-90">{formatDuration(callDuration)}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>

          {/* Voice Call Area */}
          <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 h-64 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiPhone size={48} />
              </div>
              <h4 className="text-lg font-semibold mb-2">Voice Call</h4>
              {callStatus === 'active' && (
                <div className="text-sm opacity-90">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Connected</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 bg-gray-50">
            {callStatus === 'incoming' && (
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAcceptCall}
                  className="flex-1 bg-green-600 text-white rounded-lg py-3 flex items-center justify-center gap-2"
                >
                  <FiPhoneCall size={20} />
                  Accept
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRejectCall}
                  className="flex-1 bg-red-600 text-white rounded-lg py-3 flex items-center justify-center gap-2"
                >
                  <FiX size={20} />
                  Decline
                </motion.button>
              </div>
            )}

            {callStatus === 'outgoing' && (
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEndCall}
                  className="flex-1 bg-red-600 text-white rounded-lg py-3 flex items-center justify-center gap-2"
                >
                  <FiX size={20} />
                  Cancel
                </motion.button>
              </div>
            )}

            {callStatus === 'active' && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMute}
                    className={`flex-1 rounded-lg py-3 flex items-center justify-center gap-2 ${
                      isMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                    }`}
                  >
                    {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </motion.button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEndCall}
                  className="w-full bg-red-600 text-white rounded-lg py-3 flex items-center justify-center gap-2"
                >
                  <FiPhone size={20} />
                  End Call
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
