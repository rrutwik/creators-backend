import { NextFunction, Response } from 'express';
import { Container } from 'typedi';
import { Payment, PaymentMethod, PaymentStatus, PaymentType, User } from '@interfaces/users.interface';
import { UserService } from '@services/users.service';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { PaymentModel } from '@/models/payments.model';
import Razorpay from 'razorpay';
import { UserProfileModel } from '@/models/user_profile.model';
import { ChatSessionModel } from '@/models/chat_session.model';
import { GitaAgent } from '@/external/agents/gitagpt-agent';
import { ChatSession } from '@/interfaces/chatsession.interface';
import { RAZORPAY_KEY, RAZORPAY_SECRET } from '@/config';
import moment from 'moment-timezone';
import { logger } from '@/utils/logger';

var razorPayInstance = new Razorpay({
  key_id: RAZORPAY_KEY,
  key_secret: RAZORPAY_SECRET
});

const totalTokensToAddPerRupee = 10;

export class UserController {
  public getProfile = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const profile = await UserProfileModel.findOne({ user_id: user._id });
      return res.status(200).json({ data: profile });
    } catch (error) {
      next(error);
    }
  }

  public getChatHistory = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const chatSessionModel: ChatSession = await ChatSessionModel.findOne({
        user_id: user._id,
      });
      const messages = chatSessionModel.messages;
      res.status(200).json({data: messages});
    } catch (error) {
      next(error);
    }
  }

  public getChats = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const userService = Container.get(UserService);
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const limit = Number(req.query.limit) || 10;
      const offset = Number(req.query.offset) || 0;
      const chatSessions = await ChatSessionModel.find({
        user_id: user._id,
      }, {
        name: 1,
        uuid: 1
      }, {
        limit,
        offset,
      });
      res.status(200).json({
        data: chatSessions,
      });
    } catch (error) {
      next(error);
    }
  }

  public getChat = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const chatSessionUUID = req.params.id;
      const chatSession = await ChatSessionModel.findOne({
        uuid: chatSessionUUID,
      });
      return res.status(200).json({
        data: chatSession,
      });
    } catch (error) {
      next(error);
    }
  }

  public sendMessage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const chatUUID = req.body.id;
      const message = req.body.message;
      if (!message) {
        throw new Error('Invalid request');
      }
      let chatSession = null;
      if (chatUUID) {
        chatSession = await ChatSessionModel.findOne({
          uuid: chatUUID,
        });
      } else {
        chatSession = await ChatSessionModel.create({
          user_id: user._id,
          messages: []
        });
      }
      const canMessage = true;
      if (!canMessage) {
        throw new Error('You cannot message');
      }
      const gitaAgent = new GitaAgent();
      const updatedChatSession = await gitaAgent.sendMessageToAgent(message, chatSession);
      return res.status(200).json({
        data: updatedChatSession,
      });
    } catch (error) {
      next(error);
    }
  }

  public createRazorpayOrder = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const amount = req.body.amount;
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const razorPayAmount = Number(amount * 100);
      if (!razorPayAmount || isNaN(razorPayAmount)) {
        throw new Error('Invalid amount');
      }
      const dbCreateOrder: Payment = {
        user_id: user._id,
        amount: amount,
        type: PaymentType.PAYMENT,
        method: PaymentMethod.RAZORPAY,
        status: PaymentStatus.CREATED,
      };
      const paymentModel = await PaymentModel.create(dbCreateOrder);
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
      const updatedPaymentModel = await PaymentModel.findOneAndUpdate({
        _id: paymentModel._id,
      }, {
        status: PaymentStatus.PENDING,
        razorpay_order_id: orderId,
        props: {
          ...paymentModel.props,
          razorpay_create_object: razorPayOrder,
        }
      });
      this.getRazorpayPayment(updatedPaymentModel, user);
      return res.status(201).json({ order_id: orderId });
    } catch (error) {
      next(error);
    }
  }

  private getRazorpayPayment = async (previousPaymentEntry: Payment, user: User, waitTime: number = 0) => {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      logger.info(`Checking payment status for ${previousPaymentEntry._id} for user ${user._id} with wait time ${waitTime} ms`);
      if (!previousPaymentEntry) {
        throw new Error('Payment not found');
      }
      logger.info(`Checking payment status for ${previousPaymentEntry._id} for user ${user._id} ${previousPaymentEntry.user_id.toString() === user._id.toString()} `);
      if (previousPaymentEntry.user_id.toString() !== user._id.toString()) {
        throw new Error('Payment not found');
      }
      const payment = await PaymentModel.findOne({
        _id: previousPaymentEntry._id,
      });
      if (payment.status === PaymentStatus.PENDING) {
        const [razorPayStatus, razorpayOrderPayments] = await Promise.all([
          razorPayInstance.orders.fetch(payment.razorpay_order_id),
          razorPayInstance.orders.fetchPayments(payment.razorpay_order_id),
        ]);
        logger.info(`Payment status for ${payment._id} ${JSON.stringify(razorPayStatus)} and payments ${JSON.stringify(razorpayOrderPayments)}`);
        if (razorPayStatus?.status === 'paid') {
          const successPayments = razorpayOrderPayments.items.filter((item: any) => item.status === 'captured');
          if (successPayments.length > 0) {
            const updatedPayment = await PaymentModel.findOneAndUpdate({
              _id: payment._id,
            }, {
              status: PaymentStatus.SUCCESS,
              props: {
                ...payment.props,
                razorpay_payment_status_object: razorPayStatus,
                success_payments: successPayments
              },
            });
            const totalAmount = updatedPayment.amount;
            // on success payment start
            const tokensToAdd = totalAmount * totalTokensToAddPerRupee;
            await UserProfileModel.findOneAndUpdate(
              { user_id: user._id },
              { $inc: { credits: tokensToAdd } },
              { new: true },
            );
            return;
          }
        }
        const failedPayments = razorpayOrderPayments.items.filter((item: any) => item.status === 'failed');
        if (failedPayments.length > 0) {
          await PaymentModel.findOneAndUpdate({
            _id: payment._id,
          }, {
            status: PaymentStatus.FAILED,
            props: {
              ...payment.props,
              razorpay_payment_status_object: razorPayStatus,
              failed_payments: failedPayments
            },
          });
        }
        // exponential backoff
        const newWaitTime = waitTime === 0 ? 1000 : waitTime * 2;
        const createdOn = moment(payment.createdAt);
        const diff = moment().diff(createdOn, 'hours');
        if (diff > 24) {
          await PaymentModel.findOneAndUpdate({
            _id: payment._id,
          }, {
            status: PaymentStatus.FAILED,
            props: {
              ...payment.props,
              razorpay_payment_status_object: razorPayStatus
            },
          });
          return;
        }
        this.getRazorpayPayment(payment, user, newWaitTime);
      }
  }

  public getRazorpayOrder = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const orderId = req.params.orderId;
      const user: User = req.user;
      if (!user) {
        throw new Error('User not found');
      }
      const payment = await PaymentModel.findOne({
        razorpay_order_id: orderId,
      });
      if (!payment) {
        throw new Error('Payment not found');
      }
      if (payment.user_id !== user._id) {
        throw new Error('Payment not found');
      }
      if (payment.status === PaymentStatus.PENDING) {
        this.getRazorpayPayment(payment, user);
      }
      return res.status(200).json(payment);
    } catch (error) {
      next(error);
    }
  }
}
