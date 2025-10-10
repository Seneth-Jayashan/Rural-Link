let ioInstance = null;

function setRealtime(io) {
  ioInstance = io;
}

function emitToOrder(orderId, event, payload) {
  if (ioInstance) {
    ioInstance.to(`order_${orderId}`).emit(event, payload);
  }
}

function emitToDeliveryDrivers(event, payload) {
  if (ioInstance) {
    ioInstance.to('delivery_drivers').emit(event, payload);
  }
}

module.exports = { setRealtime, emitToOrder, emitToDeliveryDrivers };


