-- ============================================================
-- Flink SQL 作业：销售实时聚合（第一阶段）
-- 输入：Kafka topic ec_order_events（订单事件，仅统计 event_type='PAID'）
-- 输出：Doris ds_realtime.sales_realtime_agg（分钟级聚合）
--       Doris ds_realtime.sales_detail（支付明细）
-- 提交方式：StreamPark（Flink SQL 应用，Application 模式）
-- ============================================================

-- 0. 运行参数：开启 checkpoint（Doris 连接器在 checkpoint 时提交 stream load，不开启则数据不落地）
SET 'execution.checkpointing.interval' = '10s';

-- 1. Kafka 源表：订单事件流
CREATE TEMPORARY TABLE order_events (
    order_id        STRING,
    user_id         BIGINT,
    tenant_id       BIGINT,
    event_type      STRING,
    product_id      BIGINT,
    product_name    STRING,
    category        STRING,
    quantity        INT,
    unit_price      DECIMAL(18,2),
    total_amount    DECIMAL(18,2),
    discount_amount DECIMAL(18,2),
    pay_amount      DECIMAL(18,2),
    channel         STRING,
    province        STRING,
    event_time      TIMESTAMP(3),
    process_time    TIMESTAMP(3),
    -- 事件时间 + 5 秒水位线
    WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'ec_order_events',
    'properties.bootstrap.servers' = 'kafka:19092',
    'properties.group.id' = 'flink-sales-realtime',
    'scan.startup.mode' = 'latest-offset',
    'format' = 'json',
    -- 数据生成器时间戳为 'yyyy-MM-dd HH:mm:ss'（空格分隔），需使用 SQL 标准格式
    'json.timestamp-format.standard' = 'SQL',
    'json.ignore-parse-errors' = 'true'
);

-- 2. Doris 结果表：销售实时聚合（分钟 × 租户 × 类目 × 渠道 × 省份）
CREATE TEMPORARY TABLE sales_realtime_agg (
    stat_minute   TIMESTAMP(3),
    tenant_id     BIGINT,
    category      STRING,
    channel       STRING,
    province      STRING,
    order_count   BIGINT,
    sale_amount   DECIMAL(18,2),
    product_count BIGINT
) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris:8030',
    -- all-in-one 镜像 BE 注册为 127.0.0.1，跨容器重定向不可达，改用 benodes 直连
    'benodes' = 'doris:8040',
    'table.identifier' = 'ds_realtime.sales_realtime_agg',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'sales_agg',
    'sink.enable-2pc' = 'false',
    'sink.properties.format' = 'json',
    'sink.properties.read_json_by_line' = 'true'
);

-- 3. Doris 结果表：销售明细
CREATE TEMPORARY TABLE sales_detail (
    order_id     STRING,
    tenant_id    BIGINT,
    user_id      BIGINT,
    product_id   BIGINT,
    product_name STRING,
    category     STRING,
    quantity     INT,
    pay_amount   DECIMAL(18,2),
    channel      STRING,
    province     STRING,
    event_time   TIMESTAMP(3),
    pay_minute   TIMESTAMP(3)
) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris:8030',
    'benodes' = 'doris:8040',
    'table.identifier' = 'ds_realtime.sales_detail',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'sales_detail',
    'sink.enable-2pc' = 'false',
    'sink.properties.format' = 'json',
    'sink.properties.read_json_by_line' = 'true'
);

-- 4. 管道一：分钟级聚合（仅支付事件）
CREATE TEMPORARY VIEW paid_events AS
SELECT * FROM order_events WHERE event_type = 'PAID';

BEGIN STATEMENT SET;

-- 聚合写入：按 1 分钟滚动窗口
INSERT INTO sales_realtime_agg
SELECT
    TUMBLE_START(event_time, INTERVAL '1' MINUTE) AS stat_minute,
    tenant_id,
    category,
    channel,
    province,
    COUNT(*) AS order_count,
    SUM(pay_amount) AS sale_amount,
    SUM(CAST(quantity AS BIGINT)) AS product_count
FROM paid_events
GROUP BY
    TUMBLE(event_time, INTERVAL '1' MINUTE),
    tenant_id,
    category,
    channel,
    province;

-- 明细写入
INSERT INTO sales_detail
SELECT
    order_id,
    tenant_id,
    user_id,
    product_id,
    product_name,
    category,
    quantity,
    pay_amount,
    channel,
    province,
    event_time,
    CAST(DATE_FORMAT(event_time, 'yyyy-MM-dd HH:mm:00') AS TIMESTAMP(3)) AS pay_minute
FROM paid_events;

END;

