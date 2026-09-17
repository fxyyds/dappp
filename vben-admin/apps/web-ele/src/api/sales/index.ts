import { requestClient } from '../request';

export namespace SalesApi {
  /** 销售实时总览指标 */
  export interface Overview {
    avgOrderAmount: number;
    orderCount: number;
    productCount: number;
    saleAmount: number;
  }
  /** 分钟级趋势点 */
  export interface TrendPoint {
    orderCount: number;
    saleAmount: number;
    statMinute: string;
  }
  /** 维度排行项 */
  export interface DimRankItem {
    name: string;
    orderCount: number;
    saleAmount: number;
  }
  /** 商品排行项 */
  export interface ProductRankItem {
    category: string;
    productId: number;
    productName: string;
    saleAmount: number;
    saleQuantity: number;
  }
}

/** 当日销售总览 */
export async function getSalesOverview(tenantId: number) {
  return requestClient.get<SalesApi.Overview>('/sales/realtime/overview', {
    params: { tenantId },
  });
}

/** 分钟级销售趋势 */
export async function getSalesTrend(tenantId: number, minutes = 60) {
  return requestClient.get<SalesApi.TrendPoint[]>('/sales/realtime/trend', {
    params: { minutes, tenantId },
  });
}

/** 维度销售排行（category/province/channel） */
export async function getSalesDimRank(
  tenantId: number,
  dim: string,
  topN = 8,
) {
  return requestClient.get<SalesApi.DimRankItem[]>('/sales/realtime/dimRank', {
    params: { dim, tenantId, topN },
  });
}

/** 商品销售排行 */
export async function getSalesProductRank(tenantId: number, topN = 8) {
  return requestClient.get<SalesApi.ProductRankItem[]>(
    '/sales/realtime/productRank',
    { params: { tenantId, topN } },
  );
}
