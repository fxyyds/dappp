package org.dromara.sales.service;

import org.dromara.sales.domain.vo.SalesDimRankVo;
import org.dromara.sales.domain.vo.SalesOverviewVo;
import org.dromara.sales.domain.vo.SalesProductRankVo;
import org.dromara.sales.domain.vo.SalesTrendVo;

import java.util.List;

/**
 * 销售实时分析服务
 *
 * @author ds-hadoop
 */
public interface ISalesRealtimeService {

    /**
     * 当日销售总览
     *
     * @param tenantId 租户ID
     * @return 总览指标
     */
    SalesOverviewVo getOverview(Long tenantId);

    /**
     * 分钟级销售趋势
     *
     * @param tenantId 租户ID
     * @param minutes  回溯分钟数
     * @return 趋势点列表
     */
    List<SalesTrendVo> getTrend(Long tenantId, Integer minutes);

    /**
     * 维度销售排行
     *
     * @param tenantId 租户ID
     * @param dim      维度（category/province/channel）
     * @param topN     排行数量
     * @return 排行列表
     */
    List<SalesDimRankVo> getDimRank(Long tenantId, String dim, Integer topN);

    /**
     * 商品销售排行
     *
     * @param tenantId 租户ID
     * @param topN     排行数量
     * @return 排行列表
     */
    List<SalesProductRankVo> getProductRank(Long tenantId, Integer topN);
}
