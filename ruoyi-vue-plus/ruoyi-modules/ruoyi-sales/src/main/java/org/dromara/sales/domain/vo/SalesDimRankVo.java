package org.dromara.sales.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 销售维度排行（类目/省份/渠道通用）
 *
 * @author ds-hadoop
 */
@Data
public class SalesDimRankVo implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 维度名称（类目/省份/渠道） */
    private String name;

    /** 销售额 */
    private BigDecimal saleAmount;

    /** 支付订单数 */
    private Long orderCount;
}
