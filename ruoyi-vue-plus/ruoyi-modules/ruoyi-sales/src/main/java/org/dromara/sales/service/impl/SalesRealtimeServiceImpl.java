package org.dromara.sales.service.impl;

import cn.hutool.core.collection.CollUtil;
import cn.hutool.core.util.ObjectUtil;
import lombok.RequiredArgsConstructor;
import org.dromara.common.core.exception.ServiceException;
import org.dromara.sales.domain.vo.SalesDimRankVo;
import org.dromara.sales.domain.vo.SalesOverviewVo;
import org.dromara.sales.domain.vo.SalesProductRankVo;
import org.dromara.sales.domain.vo.SalesTrendVo;
import org.dromara.sales.mapper.SalesRealtimeMapper;
import org.dromara.sales.service.ISalesRealtimeService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 销售实时分析服务实现（查询 Doris）
 *
 * @author ds-hadoop
 */
@RequiredArgsConstructor
@Service
public class SalesRealtimeServiceImpl implements ISalesRealtimeService {

    /** 维度参数白名单：接口参数 → Doris 列名 */
    private static final Map<String, String> DIM_COLUMNS = Map.of(
        "category", "category",
        "province", "province",
        "channel", "channel"
    );

    private final SalesRealtimeMapper salesRealtimeMapper;

    @Override
    public SalesOverviewVo getOverview(Long tenantId) {
        SalesOverviewVo vo = salesRealtimeMapper.selectOverview(tenantId);
        if (ObjectUtil.isNull(vo)) {
            vo = new SalesOverviewVo();
            vo.setSaleAmount(BigDecimal.ZERO);
            vo.setOrderCount(0L);
            vo.setProductCount(0L);
        }
        // 客单价 = 销售额 / 订单数
        if (ObjectUtil.isNotNull(vo.getOrderCount()) && vo.getOrderCount() > 0) {
            vo.setAvgOrderAmount(vo.getSaleAmount().divide(BigDecimal.valueOf(vo.getOrderCount()), 2, RoundingMode.HALF_UP));
        } else {
            vo.setAvgOrderAmount(BigDecimal.ZERO);
        }
        return vo;
    }

    @Override
    public List<SalesTrendVo> getTrend(Long tenantId, Integer minutes) {
        int range = ObjectUtil.defaultIfNull(minutes, 60);
        LocalDateTime startTime = LocalDateTime.now().minusMinutes(range);
        return salesRealtimeMapper.selectTrend(tenantId, startTime);
    }

    @Override
    public List<SalesDimRankVo> getDimRank(Long tenantId, String dim, Integer topN) {
        String dimColumn = DIM_COLUMNS.get(dim);
        if (ObjectUtil.isNull(dimColumn)) {
            throw new ServiceException("不支持的排行维度：" + dim);
        }
        return salesRealtimeMapper.selectDimRank(tenantId, dimColumn, ObjectUtil.defaultIfNull(topN, 10));
    }

    @Override
    public List<SalesProductRankVo> getProductRank(Long tenantId, Integer topN) {
        List<SalesProductRankVo> list = salesRealtimeMapper.selectProductRank(tenantId, ObjectUtil.defaultIfNull(topN, 10));
        return CollUtil.isNotEmpty(list) ? list : CollUtil.newArrayList();
    }
}
