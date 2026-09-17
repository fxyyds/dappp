package org.dromara.sales.domain.vo;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 商品销售排行
 *
 * @author ds-hadoop
 */
@Data
public class SalesProductRankVo implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 商品ID */
    private Long productId;

    /** 商品名称 */
    private String productName;

    /** 类目 */
    private String category;

    /** 销售额 */
    private BigDecimal saleAmount;

    /** 销量（件数） */
    private Long saleQuantity;
}
