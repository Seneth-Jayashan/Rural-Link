const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, max: 99, default: 1 },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  items: { type: [CartItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

CartSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

CartSchema.methods.calculateSubtotal = async function(){
  await this.populate('items.product', 'price');
  return this.items.reduce((sum, it)=> sum + (Number(it.product?.price || 0) * it.quantity), 0);
}

module.exports = mongoose.model('Cart', CartSchema);


