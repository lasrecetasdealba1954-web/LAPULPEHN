import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { authenticate, requirePulperia, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get pulperia stats (Centro de Mando)
router.get('/pulperia', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { from, to } = req.query;

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  // Date filters
  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  // Get order stats
  const orderStats = await prisma.order.groupBy({
    by: ['status'],
    where: {
      pulperiaId: pulperia.id,
      ...(hasDateFilter && { createdAt: dateFilter }),
    },
    _count: true,
    _sum: { totalAmount: true },
  });

  // Total revenue
  const totalRevenue = await prisma.order.aggregate({
    where: {
      pulperiaId: pulperia.id,
      status: 'DELIVERED',
      ...(hasDateFilter && { createdAt: dateFilter }),
    },
    _sum: { totalAmount: true },
    _count: true,
  });

  // Products stats
  const productStats = await prisma.product.aggregate({
    where: { pulperiaId: pulperia.id },
    _count: true,
  });

  const availableProducts = await prisma.product.count({
    where: { pulperiaId: pulperia.id, isAvailable: true },
  });

  // Top selling products
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        pulperiaId: pulperia.id,
        status: 'DELIVERED',
        ...(hasDateFilter && { createdAt: dateFilter }),
      },
    },
    _sum: { quantity: true, subtotal: true },
    _count: true,
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  });

  // Get product details for top products
  const topProductIds = topProducts.map(p => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: { id: true, name: true, imageUrl: true, price: true },
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  const topProductsWithDetails = topProducts.map(p => ({
    product: productMap.get(p.productId),
    totalSold: p._sum.quantity,
    totalRevenue: p._sum.subtotal,
    orderCount: p._count,
  }));

  // Daily sales for chart (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailySales = await prisma.$queryRaw`
    SELECT
      DATE("createdAt") as date,
      COUNT(*) as orders,
      SUM("totalAmount") as revenue
    FROM "Order"
    WHERE "pulperiaId" = ${pulperia.id}
      AND "status" = 'DELIVERED'
      AND "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  ` as any[];

  // Reviews summary
  const reviewStats = await prisma.review.aggregate({
    where: { pulperiaId: pulperia.id },
    _avg: { rating: true },
    _count: true,
  });

  // Rating distribution
  const ratingDistribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { pulperiaId: pulperia.id },
    _count: true,
  });

  // Job applications
  const jobStats = await prisma.job.findMany({
    where: { pulperiaId: pulperia.id },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  });

  const totalApplications = jobStats.reduce((sum, job) => sum + job._count.applications, 0);

  res.json({
    summary: {
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalOrders: totalRevenue._count,
      totalProducts: productStats._count,
      availableProducts,
      rating: pulperia.rating,
      totalReviews: pulperia.totalReviews,
    },
    ordersByStatus: orderStats.map(s => ({
      status: s.status,
      count: s._count,
      totalAmount: s._sum.totalAmount || 0,
    })),
    topProducts: topProductsWithDetails,
    dailySales: dailySales.map(d => ({
      date: d.date,
      orders: Number(d.orders),
      revenue: Number(d.revenue),
    })),
    reviews: {
      average: reviewStats._avg.rating || 0,
      total: reviewStats._count,
      distribution: ratingDistribution.map(r => ({
        rating: r.rating,
        count: r._count,
      })),
    },
    jobs: {
      totalJobs: jobStats.length,
      activeJobs: jobStats.filter(j => j.isActive).length,
      totalApplications,
    },
  });
}));

// Export data (CSV or JSON)
router.get('/export', authenticate, requirePulperia, asyncHandler(async (req: AuthRequest, res) => {
  const { format = 'json', type = 'orders', from, to } = req.query;

  const pulperia = await prisma.pulperia.findUnique({
    where: { userId: req.user!.id },
  });

  if (!pulperia) {
    throw new AppError('No tienes una pulpería registrada', 400);
  }

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  let data: any;

  switch (type) {
    case 'orders':
      data = await prisma.order.findMany({
        where: {
          pulperiaId: pulperia.id,
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        include: {
          customer: { select: { name: true, email: true, phone: true } },
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
      break;

    case 'products':
      data = await prisma.product.findMany({
        where: { pulperiaId: pulperia.id },
        orderBy: { createdAt: 'desc' },
      });
      break;

    case 'reviews':
      data = await prisma.review.findMany({
        where: { pulperiaId: pulperia.id },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      break;

    default:
      throw new AppError('Tipo de exportación inválido', 400);
  }

  if (format === 'csv') {
    // Convert to CSV
    const fields = data.length > 0 ? Object.keys(flattenObject(data[0])) : [];
    const csv = [
      fields.join(','),
      ...data.map((item: any) => {
        const flat = flattenObject(item);
        return fields.map(f => JSON.stringify(flat[f] ?? '')).join(',');
      }),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-${Date.now()}.csv`);
    return res.send(csv);
  }

  // Return JSON
  res.json(data);
}));

// Helper to flatten nested objects for CSV
function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
        Object.assign(result, flattenObject(obj[key], newKey));
      } else if (Array.isArray(obj[key])) {
        result[newKey] = JSON.stringify(obj[key]);
      } else if (obj[key] instanceof Date) {
        result[newKey] = obj[key].toISOString();
      } else {
        result[newKey] = obj[key];
      }
    }
  }

  return result;
}

export default router;
