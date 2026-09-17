-- ============================================================
-- Doris 建表脚本（第一阶段：销售实时分析）
-- 执行方式：docker exec -i ds_doris mysql -uroot -P9030 -h127.0.0.1 < doris-schema.sql
-- 库：ds_realtime
-- ============================================================

CREATE DATABASE IF NOT EXISTS ds_realtime;

-- 1. 销售实时聚合表（分钟 × 租户 × 类目 × 渠道 × 省份）
CREATE TABLE IF NOT EXISTS ds_realtime.sales_realtime_agg (
    stat_minute    DATETIME       COMMENT '统计分钟',
    tenant_id      BIGINT         COMMENT '租户 ID',
    category       VARCHAR(64)    COMMENT '商品类目',
    channel        VARCHAR(32)    COMMENT '下单渠道',
    province       VARCHAR(64)    COMMENT '省份',
    order_count    BIGINT         COMMENT '支付订单数',
    sale_amount    DECIMAL(18,2)  COMMENT '销售额（实付合计）',
    product_count  BIGINT         COMMENT '商品件数'
)
UNIQUE KEY(stat_minute, tenant_id, category, channel, province)
DISTRIBUTED BY HASH(stat_minute) BUCKETS 4
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true"
);

-- 2. 销售明细表（支付订单明细，用于排行与钻取）
CREATE TABLE IF NOT EXISTS ds_realtime.sales_detail (
    order_id      VARCHAR(64)    COMMENT '订单号',
    tenant_id     BIGINT         COMMENT '租户 ID',
    user_id       BIGINT         COMMENT '用户 ID',
    product_id    BIGINT         COMMENT '商品 ID',
    product_name  VARCHAR(128)   COMMENT '商品名称',
    category      VARCHAR(64)    COMMENT '类目',
    quantity      INT            COMMENT '数量',
    pay_amount    DECIMAL(18,2)  COMMENT '实付金额',
    channel       VARCHAR(32)    COMMENT '渠道',
    province      VARCHAR(64)    COMMENT '省份',
    event_time    DATETIME       COMMENT '事件时间',
    pay_minute    DATETIME       COMMENT '支付分钟（截断）'
)
UNIQUE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 4
PROPERTIES (
    "replication_num" = "1",
    "enable_unique_key_merge_on_write" = "true"
);
