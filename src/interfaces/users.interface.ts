export interface User {
  _id?: string;
  email?: string;
  password?: string;
  phone?: string;
}

export interface PasswordResetObject {
  reset_token: string;
  reset_token_expiry: Date;
}

export interface UserProfile {
  _id?: string;
  user_id: string;
  user?: User;
  first_name: string;
  last_name: string;
  credits: number;
  language: string;
  avatar?: Buffer;
}

export interface PaymentProps {
  razorpay_create_object: any;
  razorpay_payment_status_object: any;
}

export enum PaymentMethod {
  RAZORPAY = 'razorpay',
  PAYPAL = 'paypal',
  STRIPE = 'stripe'
}

export enum PaymentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export enum PaymentType {
  PAYMENT = 'payment',
  REFUND = 'refund'
}

export interface Payment {
  _id?: string;
  user_id: string;
  user?: User;
  amount: number;
  razorpay_order_id?: string;
  props?: PaymentProps;
  status: PaymentStatus;
  method: PaymentMethod;
  type: PaymentType;
  createdAt?: Date;
  updatedAt?: Date;
}
