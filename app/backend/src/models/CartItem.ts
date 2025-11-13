import { Schema, model, Types } from 'mongoose';

const cartItemSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  productId: { type: Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
}, { timestamps: true });

export const CartItem = model('CartItem', cartItemSchema);
