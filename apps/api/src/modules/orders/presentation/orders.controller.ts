import { Request, Response, NextFunction } from 'express';
import {
  CheckoutUseCase,
  GetOrdersUseCase,
  UpdateOrderStatusUseCase,
  GetOrderByIdUseCase,
} from '../application/orders.use-cases';
import { sendSuccess } from '../../../core/exceptions';
import { checkoutSchema, updateFulfillmentSchema } from './orders.schemas';

export class OrdersController {
  constructor(
    private readonly checkoutUseCase: CheckoutUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
  ) {}

  checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = checkoutSchema.parse({ body: req.body, headers: req.headers });
      const idempotencyKey = data.headers['idempotency-key'] as string;
      const userId = (req as Request & { auth?: { sub?: string } }).auth?.sub || 'system';

      const result = await this.checkoutUseCase.execute({
        userId: userId,
        shippingAddress: data.body.shippingAddress,
        billingAddress: data.body.billingAddress,
        couponCode: data.body.couponCode,
        companyName: data.body.companyName,
        customerGstin: data.body.customerGstin,
        paymentPlan: data.body.paymentPlan,
        idempotencyKey,
      });
      sendSuccess(req, res, 201, result);
    } catch (error) {
      next(error);
    }
  };

  getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as Request & { auth?: { sub?: string } }).auth?.sub || 'system';
      const orders = await this.getOrdersUseCase.execute(userId);
      sendSuccess(req, res, 200, orders);
    } catch (error) {
      next(error);
    }
  };

  getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const skip = parseInt(req.query.skip as string, 10) || 0;
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const orders = await this.getOrdersUseCase.executeAdmin(skip, limit);
      sendSuccess(req, res, 200, orders);
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const order = await this.getOrderByIdUseCase.execute(id);
      sendSuccess(req, res, 200, order);
    } catch (error) {
      next(error);
    }
  };

  updateFulfillment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateFulfillmentSchema.parse({ params: req.params, body: req.body });
      const order = await this.updateOrderStatusUseCase.executeFulfillment(
        data.params.id,
        data.body.status,
        data.body.note,
      );
      sendSuccess(req, res, 200, order);
    } catch (error) {
      next(error);
    }
  };
}
