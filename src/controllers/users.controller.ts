import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { Payment, PaymentMethod, PaymentStatus, PaymentType, User } from '@interfaces/users.interface';
import { UserService } from '@services/users.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { PaymentModel } from '@/models/payments.model';
import Razorpay from 'razorpay';
import { UserProfileModel } from '@/models/user_profile.model';

var razorPayInstance = new Razorpay({
  key_id: `rzp_live_42xRdrlU7mIOmQ`,
  key_secret: 'pD4psK93Y7GBJIBDn7chZTUR',
});

const totalTokensToAddPerRupee = 10;

export class UserController {
  public createRazorpayOrder = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userService = Container.get(UserService);
      const amount = req.body.amount;
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const razorPayAmount = Number(amount * 100);
      if (!razorPayAmount || isNaN(razorPayAmount)) {
        throw new Error('Invalid amount');
      }
      const razorPayOrder = await razorPayInstance.orders.create({
        amount: razorPayAmount,
        currency: 'INR',
      });
      if (!razorPayOrder) {
        throw new Error('Order creation failed');
      }
      if (!razorPayOrder.id) {
        throw new Error('Order id not found');
      }
      const orderId = razorPayOrder.id;
      const dbCreateOrder: Payment = {
        user_id: user._id,
        razorpay_order_id: orderId,
        props: {
          razorpay_create_object: razorPayOrder,
          razorpay_payment_status_object: null,
        },
        amount: amount,
        type: PaymentType.PAYMENT,
        method: PaymentMethod.RAZORPAY,
        status: PaymentStatus.CREATED,
      };
      const paymentModel = await PaymentModel.create(dbCreateOrder);
      res.status(201).json({ order_id: orderId });
    } catch (error) {
      next(error);
    }
  }

  public getRazorpayOrder = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.orderId;
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const payment = await PaymentModel.findOne({ razorpay_order_id: orderId, user_id: user._id });
      if (!payment) {
        throw new Error('Payment not found');
      }
      if (payment.status === PaymentStatus.PENDING) {
        const [razorPayStatus, razorpayOrderPayments] = await Promise.all([
          razorPayInstance.orders.fetch(orderId),
          razorPayInstance.orders.fetchPayments(orderId),
        ]);
        if (razorPayStatus?.status === 'paid') {
          const successPayments = razorpayOrderPayments.items.filter((item: any) => item.status === 'captured');
          if (successPayments.length > 0) {
            payment.status = PaymentStatus.SUCCESS;
            const totalAmount = payment.amount;
            payment.props.razorpay_payment_status_object = razorPayStatus;
            await payment.save();

            // on success payment start
            const tokensToAdd = totalAmount * totalTokensToAddPerRupee;
            await UserProfileModel.findOneAndUpdate(
              { user_id: user._id },
              { $inc: { credits: tokensToAdd } },
              { new: true },
            );
            // on success payment end

          } else {
            const failedPayments = razorpayOrderPayments.items.filter((item: any) => item.status === 'failed');
            if (failedPayments.length > 0) {
              payment.status = PaymentStatus.FAILED;
              payment.props.razorpay_payment_status_object = razorPayStatus;
              await payment.save();
            }
          }
        }
      }
      res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }
}
