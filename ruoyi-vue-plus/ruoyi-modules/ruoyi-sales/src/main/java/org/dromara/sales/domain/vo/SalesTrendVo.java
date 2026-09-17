package org.dromara.sales.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 销售实时分钟趋势点
 *
 * @author ds-hadoop
 */
@Data
public class SalesTrendVo implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 统计分钟 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime statMinute;

    /** 销售额 */
    private BigDecimal saleAmount;

    /** 支付订单数 */
    private Long orderCount;
}
