const Cart = require('../models/Cart');
const Product = require('../models/Product');

function serialize(cart){
  return {
    user: String(cart.user),
    items: cart.items.map(it=> ({
      product: typeof it.product === 'object' ? it.product : { _id: String(it.product) },
      quantity: it.quantity
    })),
    updatedAt: cart.updatedAt
  }
}

async function ensureCart(userId){
  let cart = await Cart.findOne({ user: userId });
  if(!cart){ cart = await Cart.create({ user: userId, items: [] }) }
  return cart;
}

exports.getCart = async (req, res) => {
  try{
    const cart = await ensureCart(req.user._id);
    await cart.populate('items.product');
    return res.json({ success:true, cart: serialize(cart) })
  }catch(e){
    return res.status(500).json({ success:false, message:'Failed to fetch cart' })
  }
}

exports.replaceCart = async (req, res) => {
  try{
    const { items } = req.body || {};
    const cart = await ensureCart(req.user._id);
    const nextItems = [];
    if(Array.isArray(items)){
      for(const it of items){
        if(!it || !it.product || !it.quantity) continue;
        const productId = typeof it.product === 'object' ? it.product._id : it.product;
        const product = await Product.findById(productId).select('_id');
        if(!product) continue;
        const quantity = Math.max(1, Math.min(99, Number(it.quantity) || 1));
        nextItems.push({ product: product._id, quantity });
      }
    }
    cart.items = nextItems;
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success:true, cart: serialize(cart) })
  }catch(e){
    return res.status(500).json({ success:false, message:'Failed to update cart' })
  }
}

exports.addItem = async (req, res) => {
  try{
    const { productId, quantity = 1 } = req.body || {};
    if(!productId) return res.status(400).json({ success:false, message:'productId required' })
    const product = await Product.findById(productId).select('_id');
    if(!product) return res.status(404).json({ success:false, message:'Product not found' })

    const cart = await ensureCart(req.user._id);
    const idx = cart.items.findIndex(it=> String(it.product) === String(productId));
    if(idx >= 0){
      cart.items[idx].quantity = Math.min(99, cart.items[idx].quantity + Number(quantity || 1));
    }else{
      cart.items.push({ product: product._id, quantity: Math.max(1, Math.min(99, Number(quantity)||1)) })
    }
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success:true, cart: serialize(cart) })
  }catch(e){
    return res.status(500).json({ success:false, message:'Failed to add item' })
  }
}

exports.updateItem = async (req, res) => {
  try{
    const { productId } = req.params;
    const { quantity } = req.body || {};
    const cart = await ensureCart(req.user._id);
    const idx = cart.items.findIndex(it=> String(it.product) === String(productId));
    if(idx < 0) return res.status(404).json({ success:false, message:'Item not in cart' })
    cart.items[idx].quantity = Math.max(1, Math.min(99, Number(quantity)||1));
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success:true, cart: serialize(cart) })
  }catch(e){
    return res.status(500).json({ success:false, message:'Failed to update item' })
  }
}

exports.removeItem = async (req, res) => {
  try{
    const { productId } = req.params;
    const cart = await ensureCart(req.user._id);
    cart.items = cart.items.filter(it=> String(it.product) !== String(productId));
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success:true, cart: serialize(cart) })
  }catch(e){
    return res.status(500).json({ success:false, message:'Failed to remove item' })
  }
}

exports.clear = async (req, res) => {
  try{
    const cart = await ensureCart(req.user._id);
    cart.items = [];
    await cart.save();
    return res.json({ success:true, cart: serialize(cart) })
  }catch(e){
    return res.status(500).json({ success:false, message:'Failed to clear cart' })
  }
}

exports.merge = async (req, res) => {
  try{
    const { items } = req.body || {};
    const cart = await ensureCart(req.user._id);
    const map = new Map(cart.items.map(it=> [String(it.product), it.quantity]));
    if(Array.isArray(items)){
      for(const it of items){
        if(!it || !it.product || !it.quantity) continue;
        const productId = typeof it.product === 'object' ? it.product._id : it.product;
        const product = await Product.findById(productId).select('_id');
        if(!product) continue;
        const q = Math.max(1, Math.min(99, Number(it.quantity)||1));
        map.set(String(product._id), Math.min(99, (map.get(String(product._id)) || 0) + q));
      }
    }
    cart.items = Array.from(map.entries()).map(([pid, q])=> ({ product: pid, quantity: q }));
    await cart.save();
    await cart.populate('items.product');
    return res.json({ success:true, cart: serialize(cart) })
  }catch(e){
    return res.status(500).json({ success:false, message:'Failed to merge cart' })
  }
}


