package org.dromara.sales.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 销售实时总览指标（当日）
 *
 * @author ds-hadoop
 */
@Data
public class SalesOverviewVo implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 销售额（实付合计） */
    private BigDecimal saleAmount;

    /** 支付订单数 */
    private Long orderCount;

    /** 商品件数 */
    private Long productCount;

    /** 客单价（销售额 / 订单数） */
    private BigDecimal avgOrderAmount;
}
