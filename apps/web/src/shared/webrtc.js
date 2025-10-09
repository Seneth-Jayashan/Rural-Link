import { getSocket } from './socket.js'

class WebRTCService {
  constructor() {
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
    this.isInitiator = false
    this.callbacks = {
      onLocalStream: null,
      onRemoteStream: null,
      onCallEnded: null,
      onCallAccepted: null,
      onCallRejected: null,
      onIncomingCall: null
    }
    this.currentCallId = null
    this.setupSocketListeners()
  }

  setupSocketListeners() {
    const socket = getSocket()
    
    socket.on('call:offer', async (data) => {
      if (this.callbacks.onIncomingCall) {
        this.callbacks.onIncomingCall(data)
      }
    })

    socket.on('call:answer', async (data) => {
      if (this.peerConnection && data.answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer))
      }
    })

    socket.on('call:ice-candidate', async (data) => {
      if (this.peerConnection && data.candidate) {
        await this.peerConnection.addIceCandidate(new RTCSessionDescription(data.candidate))
      }
    })

    socket.on('call:accepted', (data) => {
      if (this.callbacks.onCallAccepted) {
        this.callbacks.onCallAccepted(data)
      }
    })

    socket.on('call:rejected', (data) => {
      if (this.callbacks.onCallRejected) {
        this.callbacks.onCallRejected(data)
      }
    })

    socket.on('call:ended', (data) => {
      this.endCall()
      if (this.callbacks.onCallEnded) {
        this.callbacks.onCallEnded(data)
      }
    })
  }

  async initializePeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }

    this.peerConnection = new RTCPeerConnection(configuration)

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket()
        socket.emit('call:ice-candidate', {
          callId: this.currentCallId,
          candidate: event.candidate
        })
      }
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      if (this.callbacks.onRemoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream)
      }
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection.connectionState === 'disconnected' || 
          this.peerConnection.connectionState === 'failed') {
        this.endCall()
      }
    }
  }

  async startCall(orderId, recipientId) {
    try {
      this.currentCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.isInitiator = true

      // Get user media (audio only)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })

      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream)
      }

      // Initialize peer connection
      await this.initializePeerConnection()

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream)
      })

      // Create offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // Send offer through socket
      const socket = getSocket()
      socket.emit('call:offer', {
        callId: this.currentCallId,
        orderId,
        recipientId,
        offer
      })

      return this.currentCallId
    } catch (error) {
      console.error('Error starting call:', error)
      throw error
    }
  }

  async acceptCall(callId, orderId) {
    try {
      this.currentCallId = callId
      this.isInitiator = false

      // Get user media (audio only)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })

      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream)
      }

      // Initialize peer connection
      await this.initializePeerConnection()

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream)
      })

      // Notify caller that call is accepted
      const socket = getSocket()
      socket.emit('call:accepted', { callId, orderId })

      return true
    } catch (error) {
      console.error('Error accepting call:', error)
      throw error
    }
  }

  async answerCall(offer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      
      const answer = await this.peerConnection.createAnswer()
      await this.peerConnection.setLocalDescription(answer)

      // Send answer through socket
      const socket = getSocket()
      socket.emit('call:answer', {
        callId: this.currentCallId,
        answer
      })

      return true
    } catch (error) {
      console.error('Error answering call:', error)
      throw error
    }
  }

  async handleIncomingCall(data) {
    try {
      this.currentCallId = data.callId
      this.isInitiator = false

      // Get user media (audio only)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })

      if (this.callbacks.onLocalStream) {
        this.callbacks.onLocalStream(this.localStream)
      }

      // Initialize peer connection
      await this.initializePeerConnection()

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream)
      })

      // Set remote description and create answer
      await this.answerCall(data.offer)

      return true
    } catch (error) {
      console.error('Error handling incoming call:', error)
      throw error
    }
  }

  rejectCall(callId, orderId) {
    const socket = getSocket()
    socket.emit('call:rejected', { callId, orderId })
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.currentCallId) {
      const socket = getSocket()
      socket.emit('call:ended', { callId: this.currentCallId })
      this.currentCallId = null
    }

    this.isInitiator = false
    this.remoteStream = null
  }

  toggleMute() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        return audioTrack.enabled
      }
    }
    return false
  }


  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = callback
    }
  }

  off(event) {
    if (this.callbacks[event]) {
      this.callbacks[event] = null
    }
  }
}

// Create singleton instance
const webrtcService = new WebRTCService()

export default webrtcService
