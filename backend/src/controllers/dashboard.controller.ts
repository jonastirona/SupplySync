import { Request, Response } from 'express';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { Supplier } from '../models/supplier.model';
import { asyncHandler } from '../middleware/async.handler';
import { AppError } from '../utils/app-error';

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get counts from each collection
    const [totalOrders, totalItems, totalSuppliers] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Supplier.countDocuments({ status: 'active' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalItems,
        totalSuppliers
      }
    });
  } catch (error) {
    throw new AppError('Error fetching dashboard statistics', 500);
  }
}); 