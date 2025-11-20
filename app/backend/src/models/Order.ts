import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  orderId: string;
  userId: string;
  total: number;
  products: Array<{ productId: string; quantity: number }>;
  createdAt: string;
}

const OrderSchema: Schema = new Schema({
  orderId: { type: String, required: true },
  userId: { type: String, required: true },
  total: { type: Number, required: true },
  products: [
    {
      productId: { type: String, required: true },
      quantity: { type: Number, required: true }
    }
  ],
  createdAt: { type: String, required: true }
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
