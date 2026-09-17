package org.dromara.sales.controller;

import lombok.RequiredArgsConstructor;
import org.dromara.common.core.domain.R;
import org.dromara.sales.domain.vo.SalesDimRankVo;
import org.dromara.sales.domain.vo.SalesOverviewVo;
import org.dromara.sales.domain.vo.SalesProductRankVo;
import org.dromara.sales.domain.vo.SalesTrendVo;
import org.dromara.sales.service.ISalesRealtimeService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 销售实时分析（数据源：Doris，多租户行级隔离）
 *
 * @author ds-hadoop
 */
@Validated
@RequiredArgsConstructor
@RestController
@RequestMapping("/sales/realtime")
public class SalesRealtimeController {

    private final ISalesRealtimeService salesRealtimeService;

    /**
     * 当日销售总览（金额/订单量/件数/客单价）
     *
     * @param tenantId 租户ID
     * @return 总览指标
     */
    @GetMapping("/overview")
    public R<SalesOverviewVo> overview(@RequestParam Long tenantId) {
        return R.ok(salesRealtimeService.getOverview(tenantId));
    }

    /**
     * 分钟级销售趋势
     *
     * @param tenantId 租户ID
     * @param minutes  回溯分钟数（默认 60）
     * @return 趋势点列表
     */
    @GetMapping("/trend")
    public R<List<SalesTrendVo>> trend(@RequestParam Long tenantId,
                                       @RequestParam(required = false, defaultValue = "60") Integer minutes) {
        return R.ok(salesRealtimeService.getTrend(tenantId, minutes));
    }

    /**
     * 维度销售排行（类目/省份/渠道）
     *
     * @param tenantId 租户ID
     * @param dim      维度：category / province / channel
     * @param topN     排行数量（默认 10）
     * @return 排行列表
     */
    @GetMapping("/dimRank")
    public R<List<SalesDimRankVo>> dimRank(@RequestParam Long tenantId,
                                           @RequestParam(required = false, defaultValue = "category") String dim,
                                           @RequestParam(required = false, defaultValue = "10") Integer topN) {
        return R.ok(salesRealtimeService.getDimRank(tenantId, dim, topN));
    }

    /**
     * 商品销售排行
     *
     * @param tenantId 租户ID
     * @param topN     排行数量（默认 10）
     * @return 排行列表
     */
    @GetMapping("/productRank")
    public R<List<SalesProductRankVo>> productRank(@RequestParam Long tenantId,
                                                   @RequestParam(required = false, defaultValue = "10") Integer topN) {
        return R.ok(salesRealtimeService.getProductRank(tenantId, topN));
    }
}
