package org.dromara.sales.mapper;

import com.baomidou.dynamic.datasource.annotation.DS;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.dromara.sales.domain.vo.SalesDimRankVo;
import org.dromara.sales.domain.vo.SalesOverviewVo;
import org.dromara.sales.domain.vo.SalesProductRankVo;
import org.dromara.sales.domain.vo.SalesTrendVo;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 销售实时分析 Mapper（数据源：Doris ds_realtime）
 *
 * @author ds-hadoop
 */
@Mapper
@DS("doris")
public interface SalesRealtimeMapper {

    /**
     * 查询当日销售总览指标
     *
     * @param tenantId 租户ID
     * @return 总览指标
     */
    SalesOverviewVo selectOverview(@Param("tenantId") Long tenantId);

    /**
     * 查询分钟级销售趋势
     *
     * @param tenantId  租户ID
     * @param startTime 起始时间
     * @return 趋势点列表
     */
    List<SalesTrendVo> selectTrend(@Param("tenantId") Long tenantId, @Param("startTime") LocalDateTime startTime);

    /**
     * 查询维度销售排行（类目/省份/渠道，列名在 Service 层白名单校验）
     *
     * @param tenantId  租户ID
     * @param dimColumn 维度列名
     * @param topN      排行数量
     * @return 排行列表
     */
    List<SalesDimRankVo> selectDimRank(@Param("tenantId") Long tenantId, @Param("dimColumn") String dimColumn, @Param("topN") Integer topN);

    /**
     * 查询商品销售排行
     *
     * @param tenantId 租户ID
     * @param topN     排行数量
     * @return 排行列表
     */
    List<SalesProductRankVo> selectProductRank(@Param("tenantId") Long tenantId, @Param("topN") Integer topN);
}
