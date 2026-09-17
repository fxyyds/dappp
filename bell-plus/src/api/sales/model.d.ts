declare namespace SalesApi {
  /** 销售实时总览指标 */
  interface Overview {
    avgOrderAmount: number | string;
    orderCount: number;
    productCount: number;
    saleAmount: number | string;
  }
  /** 分钟级趋势点 */
  interface TrendPoint {
    orderCount: number;
    saleAmount: number | string;
    statMinute: string;
  }
  /** 维度排行项 */
  interface DimRankItem {
    name: string;
    orderCount: number;
    saleAmount: number | string;
  }
  /** 商品排行项 */
  interface ProductRankItem {
    category: string;
    productId: number;
    productName: string;
    saleAmount: number | string;
    saleQuantity: number;
  }
}
