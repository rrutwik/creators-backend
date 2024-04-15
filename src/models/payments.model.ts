import { Payment, PaymentMethod, PaymentStatus, PaymentType } from "@/interfaces/users.interface";
import { Document, Schema, model } from "mongoose";


const PaymentModelSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: PaymentType,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    method: {
        type: PaymentMethod,
        default: PaymentMethod.RAZORPAY,
        required: true,
    },
    razorpay_order_id: {
        type: String,
        required: true,
        index: true
    },
    props: {
        razorpay_create_object: {
            type: Object,
            required: true
        },
        razorpay_payment_status_object: {
            type: Object,
            required: true
        }
    },
    status: {
        type: PaymentStatus,
        required: true,
        default: PaymentStatus.CREATED
    },
}, { timestamps: true });

export const PaymentModel = model<Payment & Document>('payment', PaymentModelSchema);
