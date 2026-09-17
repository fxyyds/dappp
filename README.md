# 电商 Hadoop 数据实时处理系统

基于 **Flink + Kafka + Doris** 的电商数据实时处理系统，支持多租户数据隔离。
模拟订单事件经 Kafka 流入 Flink SQL 实时聚合，写入 Doris，由后端查询并经前端大屏秒级展示。

## 技术选型

| 层次      | 技术                                   | 说明                                |
| --------- | -------------------------------------- | ----------------------------------- |
| 消息队列  | Apache Kafka 3.7（KRaft 单节点）       | 订单事件流                          |
| 实时计算  | Apache Flink 1.18（SQL 作业）          | 1 分钟滚动窗口聚合                  |
| 作业管理  | Apache StreamPark 2.1.7                | 宿主机部署，多租户管理 Flink 作业   |
| OLAP 存储 | Apache Doris 4.1（all-in-one）         | 聚合表 + 明细表                     |
| 后端      | RuoYi-Vue-Plus v6.0.0（Spring Boot 3） | 多租户、动态数据源（MySQL + Doris） |
| 前端      | bell-plus（适配 v6 的 Vben5 完整前端） | 全部管理页面 + 自研销售实时大屏     |
| 部署      | Docker Compose（轻量化单容器）         | 共享网络 `ds_net`                   |

## 数据链路

```
模拟数据生成器(datagen)
      │ 订单事件 JSON（含 tenant_id）
      ▼
   Kafka (ec_order_events)
      │ Flink SQL：过滤 PAID 订单，1 分钟滚动窗口聚合
      ▼
   Doris (sales_realtime_agg / 明细表)
      │ @DS("doris") 动态数据源查询
      ▼
   RuoYi 后端 (/sales/realtime/*)
      │ 3 秒轮询
      ▼
   前端销售实时大屏（双租户切换）
```

## 目录结构

```
├── deploy/
│   └── docker/            # 中间件编排（MySQL/Redis/Kafka/Flink/Doris）+ 初始化脚本
│                          # StreamPark 发行包与 Flink 连接器按需下载（见快速开始）
├── datagen/               # 模拟数据生成器（Java，持续写入双租户订单事件）
├── flink-jobs/            # Flink SQL 作业定义（sales-realtime.sql）
├── ruoyi-vue-plus/        # 后端（含自研 ruoyi-sales 销售实时分析模块）
├── bell-plus/             # 前端（管理页面 + 销售实时大屏 views/screen）
├── vben-admin/            # 早期裸 Vben 模板（已被 bell-plus 取代，保留备查）
└── doc/                   # 设计文档 / 任务拆分清单 / 数据契约 / 原始文献
```

## 环境要求

- Docker（建议分配 ≥ 8GB 内存，Doris 较吃内存）
- JDK 21（后端打包/运行、datagen）
- Node.js ≥ 20 + pnpm（前端）

## 快速开始

### 1. 启动中间件

```bash
cd deploy/docker
docker compose -f docker-compose-base.yml up -d      # MySQL + Redis + Kafka
docker compose -f docker-compose-bigdata.yml up -d   # Flink + Doris（首次拉镜像较慢）
bash init-topics.sh                                  # 创建 Kafka topic
```

导入基础数据（MySQL 容器健康后执行）：

```bash
# RuoYi 基座表 + 演示数据（含 AI/任务调度脚本，按需导入）
mysql -h127.0.0.1 -uroot -pds_hadoop_2026 ry-vue-plus < ../../ruoyi-vue-plus/script/sql/ry_vue.sql
# 销售实时大屏菜单
mysql -h127.0.0.1 -uroot -pds_hadoop_2026 ry-vue-plus < sales-menu.sql
# Doris 建表：用 MySQL 客户端连 9030 执行 doris-schema.sql
```

### 2. 启动 StreamPark 并提交 Flink 作业

```bash
# 下载并解压（约 470MB，首次需要）
curl -fO https://archive.apache.org/dist/streampark/2.1.7/apache-streampark_2.12-2.1.7-bin.tar.gz
tar -xzf apache-streampark_2.12-2.1.7-bin.tar.gz
cd apache-streampark_2.12-2.1.7-bin
bin/startup.sh    # Web UI http://localhost:10000，默认 admin/streampark
```

StreamPark 元数据库使用 compose 中的 MySQL（库名 `streampark`，已自动创建）。

提交作业前需准备 Flink 连接器（下载后放入 `deploy/docker/flink-lib/`，compose 已挂载该目录）：

```bash
mkdir -p deploy/docker/flink-lib && cd deploy/docker/flink-lib
curl -fO https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-kafka/3.1.0-1.18/flink-sql-connector-kafka-3.1.0-1.18.jar
curl -fO https://repo.maven.apache.org/maven2/org/apache/doris/flink-doris-connector-1.18/24.0.1/flink-doris-connector-1.18-24.0.1.jar
```

然后在 StreamPark 中以 Flink SQL 模式提交 `flink-jobs/sales-realtime.sql`。

### 3. 启动数据生成器

```bash
cd datagen
mvn -q package
java -jar target/order-datagen.jar
```

### 4. 启动后端（JDK 21）

```bash
cd ruoyi-vue-plus
./mvnw -q package -DskipTests
java -jar ruoyi-admin/target/ruoyi-admin.jar --spring.profiles.active=dev
```

### 5. 启动前端

```bash
cd bell-plus
pnpm install
pnpm dev    # http://localhost:5666
```

## 端口与账号

| 服务       | 地址                         | 账号                            |
| ---------- | ---------------------------- | ------------------------------- |
| 前端       | http://localhost:5666        | admin / admin123（租户 000000） |
| 后端       | http://localhost:8080        | —                               |
| MySQL      | localhost:3306               | root / ds_hadoop_2026           |
| Redis      | localhost:6379               | ds_hadoop_2026                  |
| Kafka      | localhost:9092               | —                               |
| Flink UI   | http://localhost:8081        | —                               |
| Doris      | localhost:9030（MySQL 协议） | root（空密码）                  |
| StreamPark | http://localhost:10000       | admin / streampark              |

> 注意：RuoYi-Vue-Plus v6 所有 API 请求需携带 `clientid` 请求头；dev 环境已关闭接口加密与验证码。

## 文档索引

- [系统设计文档](doc/设计文档/电商Hadoop数据实时处理系统_系统设计文档.md)：三阶段里程碑与技术选型
- [任务拆分清单](doc/任务/任务拆分清单.md)：M1/M2/M3 任务状态与验收标准
- [数据契约文档](doc/数据契约文档/数据契约文档_第一阶段订单流.md)：订单事件消息格式

## 当前进度

- **M1 核心链路** ✅：模拟数据 → Kafka → Flink → Doris → 大屏全链路跑通，双租户隔离验证通过
- **M2 功能模块** 待做：12 个业务模块 CRUD、3 个扩展 Flink 作业、StreamPark API 对接、Knife4j 接口文档
