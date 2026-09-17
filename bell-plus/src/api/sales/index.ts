import type { SalesApi } from './model';

import { alovaInstance } from '@/utils/http';

enum Api {
  dimRank = '/sales/realtime/dimRank',
  overview = '/sales/realtime/overview',
  productRank = '/sales/realtime/productRank',
  trend = '/sales/realtime/trend',
}

/** 当日销售总览 */
export function getSalesOverview(tenantId: number) {
  return alovaInstance.Get<SalesApi.Overview>(Api.overview, {
    params: { tenantId },
  });
}

/** 分钟级销售趋势 */
export function getSalesTrend(tenantId: number, minutes = 60) {
  return alovaInstance.Get<SalesApi.TrendPoint[]>(Api.trend, {
    params: { minutes, tenantId },
  });
}

/** 维度销售排行（category / province / channel） */
export function getSalesDimRank(
  tenantId: number,
  dim: 'category' | 'channel' | 'province',
  topN = 8,
) {
  return alovaInstance.Get<SalesApi.DimRankItem[]>(Api.dimRank, {
    params: { dim, tenantId, topN },
  });
}

/** 商品销售排行 */
export function getSalesProductRank(tenantId: number, topN = 8) {
  return alovaInstance.Get<SalesApi.ProductRankItem[]>(Api.productRank, {
    params: { tenantId, topN },
  });
}
