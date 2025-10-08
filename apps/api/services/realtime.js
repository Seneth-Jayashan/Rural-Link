let ioInstance = null;

function setRealtime(io) {
  ioInstance = io;
}

function emitToOrder(orderId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`order_${orderId}`).emit(event, payload);
  }
}

module.exports = { setRealtime, emitToOrder };


