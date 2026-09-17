#!/bin/bash
# ============================================================
# Kafka Topic 初始化脚本（第一阶段：仅订单流）
# 用法：./init-topics.sh
# 前置：ds_kafka 容器已启动且健康
# ============================================================

set -e

BOOTSTRAP="localhost:9092"
TOPIC="ec_order_events"

echo ">>> 创建 Topic: ${TOPIC}"
docker exec ds_kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server "${BOOTSTRAP}" \
  --create \
  --topic "${TOPIC}" \
  --partitions 3 \
  --replication-factor 1 \
  --if-not-exists

echo ">>> 当前 Topic 列表："
docker exec ds_kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server "${BOOTSTRAP}" \
  --list

echo ">>> 完成"
