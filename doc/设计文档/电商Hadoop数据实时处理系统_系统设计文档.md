# 电商 Hadoop 数据实时处理系统 —— 系统设计文档

| 项目     | 内容                                                                            |
| -------- | ------------------------------------------------------------------------------- |
| 系统名称 | 电商 Hadoop 数据实时处理系统                                                    |
| 版本     | V1.0                                                                            |
| 文档类型 | 系统设计文档                                                                    |
| 编写日期 | 2026-09-16                                                                      |
| 技术路线 | Apache Flink + StreamPark + Kafka + Doris + Vben Admin（Vue 3）+ RuoYi-Vue-Plus |

---

## 目录

1. [项目概述](#1-项目概述)
2. [需求分析](#2-需求分析)
3. [技术选型](#3-技术选型)
4. [总体架构设计](#4-总体架构设计)
5. [多租户设计](#5-多租户设计)
6. [数据库设计](#6-数据库设计)
7. [实时计算任务设计](#7-实时计算任务设计)
8. [接口设计](#8-接口设计)
9. [前端页面设计](#9-前端页面设计)
10. [部署方案](#10-部署方案)
11. [开发计划](#11-开发计划)
12. [风险与应对](#12-风险与应对)

---

## 1. 项目概述

### 1.1 项目背景

原《电商 Hadoop 数据实时处理系统》软著文档描述了一套基于 Hadoop 生态的电商大数据实时处理平台，用于实时处理和分析电商平台的交易数据、用户行为及库存信息，为电商企业提供及时的决策支持。

本项目在保留原系统**功能范围**的基础上，采用**现代主流开源技术栈**进行重新实现，核心目标：

- 用实时流计算（Flink）替代传统批处理，降低分析延迟
- 引入 **StreamPark** 作为多租户的实时任务管理平台，替代自研的任务配置模块
- 后端采用 **RuoYi-Vue-Plus 单体版**现成中后台底座（多租户/权限/日志开箱即用），前端采用 **Vben Admin（Vue 3）**，最大化复用成熟组件
- 支持**多租户**隔离，满足多业务线/多客户共用一套平台的需求

### 1.2 项目目标

1. 实时采集、处理、分析电商海量数据（交易、行为、库存）
2. 输出销售实时分析、实时推荐、营销费用分析等业务结果
3. 提供完整的数据源配置、任务配置、数据质量与异常监控能力
4. 多租户数据与资源隔离，支持按租户独立管理与计费

### 1.3 与原系统的关系

| 维度     | 原系统（软著文档） | 本设计                           |
| -------- | ------------------ | -------------------------------- |
| 计算引擎 | Hadoop 批处理      | Apache Flink 流批一体            |
| 任务管理 | 自研（PHP）        | Apache StreamPark（多租户）      |
| 分析存储 | MySQL / MongoDB    | Apache Doris + MySQL             |
| 前端     | 传统页面           | Vben Admin（Vue 3）+ ECharts     |
| 后端     | PHP                | RuoYi-Vue-Plus 单体版（Java 21） |
| 功能模块 | 12 个              | 12 个（保持一致）                |

---

## 2. 需求分析

### 2.1 功能需求（对应原文档 12 个模块）

#### 一、任务配置管理（5 个）

| 模块                 | 功能说明                                      | 实现方式                                                                              |
| -------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| 数据源配置管理       | 管理多种数据源（MySQL、Kafka、API）的连接配置 | **dynamic-datasource（RuoYi-Vue-Plus 已内置）+ 自研配置管理页面**                     |
| 事件流原始数据管理   | 采集、查看实时事件流数据                      | Kafka + Flink，平台提供查看                                                           |
| 数据挖掘任务配置管理 | 配置离线/挖掘任务                             | StreamPark（Spark 作业）                                                              |
| 实时处理任务配置管理 | 配置实时计算任务                              | StreamPark（Flink 作业）                                                              |
| 报表配置管理         | 配置报表的指标、维度、刷新频率                | **自研（ECharts 实时大屏 + 报表配置表）**；核心链路跑通后再评估引入 DataEase/DataRoom |

#### 二、业务分析管理（3 个）

| 模块                 | 功能说明               | 实现方式                         |
| -------------------- | ---------------------- | -------------------------------- |
| 营销费用分析管理     | 营销支出跟踪与效果分析 | Flink/批处理 + Doris + ECharts   |
| 实时推荐结果记录管理 | 记录并优化实时推荐结果 | Flink 实时计算 + Doris           |
| 销售实时分析结果管理 | 销售数据实时统计与监控 | Flink 实时聚合 + Doris + ECharts |

#### 三、系统监控与日志管理（4 个）

| 模块                 | 功能说明                 | 实现方式                   |
| -------------------- | ------------------------ | -------------------------- |
| 系统异常检测记录管理 | 系统运行异常的记录与告警 | 自研 + StreamPark 告警     |
| 数据接口访问日志管理 | 记录接口访问，保障安全   | 自研（AOP 拦截）           |
| 数据质量监控结果管理 | 数据质量校验结果展示     | Flink 质量规则作业 + Doris |
| 用户行为日志管理     | 采集分析用户行为数据     | Kafka + Flink + Doris      |

### 2.2 非功能需求

| 需求   | 指标                                   |
| ------ | -------------------------------------- |
| 多租户 | 支持租户级数据隔离、资源配额、权限管理 |
| 实时性 | 流处理端到端延迟 ≤ 5 秒                |
| 并发   | 支持 ≥ 200 并发用户                    |
| 可用性 | 平台可用性 ≥ 99.5%                     |
| 安全性 | 登录鉴权（JWT）、接口权限、访问审计    |
| 可扩展 | 模块化解耦，支持水平扩展               |

### 2.3 实施约束（已确认）

| 项目         | 决策                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 项目定位     | **实际项目交付**，需保证代码质量、稳定性与可维护性                                                                                        |
| 数据来源     | **先用模拟数据**跑通全链路（数据生成器写入 Kafka），预留真实数据源切换能力                                                                |
| 部署环境     | **本地 Mac 开发环境**（M1 Pro / 32GB 内存），Docker Desktop 内存维持约 8GB，采用**轻量化最小配置**（详见 10.3）                           |
| 开发优先级   | **先跑通核心链路**：模拟数据接入 → 销售实时分析作业 → 实时大屏展示，再逐步补全其余模块                                                    |
| 前端方案     | **Vben Admin + 接口适配**：适配 RuoYi-Vue-Plus 的登录（Sa-Token）、用户信息、动态菜单接口                                                 |
| 运行环境     | 本机已有 **Amazon Corretto 21.0.11**（`~/Library/Java/JavaVirtualMachines/corretto-21.0.11`）、Node 22 + pnpm 10、Maven 3.9，无需额外安装 |
| 模拟数据范围 | **第一阶段仅生成订单/销售数据流**，支撑销售实时分析链路；用户行为、营销等其他数据流后续阶段再补                                           |
| 展示工具     | **第一阶段全自研**（Vben + ECharts 实时大屏），DataEase / DataRoom 暂缓，核心链路跑通后再评估引入                                         |
| 交付节奏     | 无硬性时间节点，按质量优先、阶段化推进                                                                                                    |
| 代码管理     | **本地 Git 版本管理**（不推送远程仓库）                                                                                                   |

### 2.4 交付物清单（实际交付要求，全部提供）

| 交付物         | 说明                                                                               |
| -------------- | ---------------------------------------------------------------------------------- |
| 系统源代码     | 后端（RuoYi-Vue-Plus 业务扩展模块）+ 前端（Vben）+ Flink SQL 作业 + 模拟数据生成器 |
| 数据库脚本     | MySQL 建表/初始化 SQL、Doris 建表 SQL                                              |
| 部署文档       | 环境要求、Docker Compose 部署、配置说明、启动与验证步骤                            |
| 操作手册       | 面向用户的 12 个功能模块操作指引（参照原软著手册格式）                             |
| 接口文档       | 后端 RESTful API（Knife4j/Swagger 自动生成）+ 补充说明                             |
| 数据库设计文档 | 表结构、字段说明、多租户设计说明                                                   |

---

## 3. 技术选型

### 3.1 技术栈总览

| 层次       | 技术                                  | 版本建议 | 说明                                            |
| ---------- | ------------------------------------- | -------- | ----------------------------------------------- |
| 前端框架   | Vue 3 + Vite                          | 3.4+     | 组合式 API，响应式                              |
| 前端脚手架 | **Vben Admin (Vue Vben)**             | 5.x      | 企业级中后台框架（含权限/主题/布局）            |
| 前端组件   | Element Plus                          | 2.x      | UI 组件（Vben 可集成）                          |
| 前端图表   | ECharts                               | 5.x      | 实时大屏、报表                                  |
| 状态管理   | Pinia                                 | 2.x      | Vue 3 官方推荐                                  |
| 后端底座   | **RuoYi-Vue-Plus（单体版）**          | 6.0.0    | 现成中后台框架（含多租户/权限/日志）            |
| 后端框架   | Spring Boot                           | 3.x      | RuoYi-Vue-Plus 基于 Spring Boot 3               |
| 后端安全   | Sa-Token（JWT 风格）                  | 1.39+    | 登录鉴权、权限校验                              |
| 多租户插件 | MyBatis-Plus TenantLine               | 3.5+     | tenant_id 自动注入                              |
| 多数据源   | **dynamic-datasource（苞米豆）**      | 4.3+     | 动态增删/切换数据源（RuoYi-Vue-Plus 已内置）    |
| ORM        | MyBatis-Plus                          | 3.5+     | 数据访问 + 代码生成器                           |
| 后端语言   | Java                                  | 21       | RuoYi-Vue-Plus 6.0 基线                         |
| 计算引擎   | Apache Flink                          | 1.18+    | 流批一体实时计算                                |
| 任务平台   | Apache StreamPark                     | 2.1.7    | 多租户任务管理                                  |
| 消息队列   | Apache Kafka                          | 3.x      | 实时数据管道                                    |
| 分析数据库 | Apache Doris                          | 2.x      | 实时 OLAP 分析                                  |
| 业务数据库 | MySQL                                 | 8.0      | 配置、元数据、租户                              |
| 缓存       | Redis                                 | 7.x      | 会话、热点数据缓存                              |
| 开源 BI    | DataEase / DataRoom（**暂缓，备选**） | —        | 第一阶段全自研（ECharts），核心链路跑通后再评估 |
| 容器化     | Docker + Docker Compose               | —        | 本地/测试部署                                   |

### 3.2 关键选型理由

**1. 为什么用 StreamPark 而不是自研任务管理？**

- 多租户（Team）原生支持，业务线隔离开箱即用
- Apache 顶级项目，持续更新，生产验证
- 覆盖作业开发、部署、监控、告警、Savepoint 管理，省去大量自研工作
- 本系统通过其 **REST API** 集成，前端统一入口

**2. 为什么用 Doris 而不是直接用 MySQL？**

- 实时写入 + 亚秒级多维聚合分析，适合销售/推荐/营销等实时看板
- 兼容 MySQL 协议，后端查询成本低

**3. 为什么后端选 RuoYi-Vue-Plus 单体版（而非从零写 Spring Boot）？**

- **多租户开箱即用**：内置 MyBatis-Plus 租户插件，`tenant_id` 自动注入 SQL，与本文多租户设计完全一致
- **权限/日志/字典现成**：用户、角色、菜单、操作日志、登录日志、代码生成器全部自带，对应本文 12 个模块中系统管理类功能
- **版本新、维护活跃**：v6.0.0（2026-07 发布），JDK 21 + Spring Boot 3.x，dromara 组织维护，持续更新
- **单体架构够用**：本系统面向内部运营与租户用户，无需微服务（Cloud 版）带来的 Nacos/网关运维负担；模块化 Maven 工程，后期有拆分空间
- **注意**：基于 Sa-Token（而非 Spring Security），团队需简单适应；需 JDK 21 运行环境
- （备选：若团队更熟悉 Python，可用 FastAPI 替代，整体架构不变）

**4. 为什么前端选 Vben Admin？**

- 基于 Vue 3 + Vite + Pinia 的企业级中后台框架，开箱即用
- 内置**权限路由（动态菜单）、多标签页、主题切换、国际化**，正好覆盖本系统的多租户多权限需求
- 模块化设计（monorepo），可裁剪不需要的功能
- 社区活跃、文档完善，适配本系统 12 个功能模块的页面快速搭建
- 与 ECharts 集成方便，适合实时大屏与报表

**5. 数据源管理为什么用 dynamic-datasource？**

- RuoYi-Vue-Plus **已内置**，零额外引入成本
- 支持运行时**动态增删数据源**（API 往 `DynamicRoutingDataSource` 注册/移除），正好实现"数据源配置管理"模块：配置表存连接信息（密码加密存储）→ 后端调用其 API 动态注册 → 业务查询按 `@DS` 注解或租户上下文路由
- 支持多租户按租户/按库切换（SPEL 解析）、国产数据库适配
- 后续对接真实电商业务库（MySQL/Oracle/达梦等）时直接复用

**6. 报表展示为什么引入 DataEase（开源 BI）？**

- 国产开源、Java+Vue 技术栈、中文界面，与主系统技术栈一致，更新非常活跃（2026-08 发布 V3）
- 支持**多数据源接入**（MySQL、Doris、ClickHouse、API 等），"报表配置管理"模块的指标/维度/刷新配置可直接在 DataEase 完成
- 支持 **iframe/组件嵌入**，可嵌入本系统前端，与多租户菜单体系打通
- 分工：核心实时大屏（销售实时分析）自研（ECharts，秒级刷新体验好）；常规报表、自助分析交给 DataEase，避免重复造轮子
- 轻量部署（Docker 一键），资源占用可接受

---

## 4. 总体架构设计

### 4.1 逻辑架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          展示层（前端）                            │
│  Vben Admin (Vue 3) + Element Plus + ECharts （多租户门户/大屏/报表）│
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTPS / REST
┌──────────────────────────────┴──────────────────────────────────┐
│                        应用服务层（后端）                          │
│   RuoYi-Vue-Plus（Sa-Token 鉴权 / 多租户拦截 / AOP 日志 / 代码生成） │
│   ┌────────────┬────────────┬─────────────┬────────────────┐   │
│   │ 租户与权限  │ 数据源配置  │ 报表与查询   │ 监控与日志      │   │
│   │ 服务       │ 服务        │ 服务         │ 服务           │   │
│   └────────────┴────────────┴─────────────┴────────────────┘   │
└───────┬───────────────────┬───────────────────┬─────────────────┘
        │                   │                   │
┌───────┴──────┐  ┌─────────┴────────┐  ┌───────┴──────────────┐
│  MySQL 8.0   │  │  Apache Doris     │  │  Redis               │
│ (配置/租户/   │  │  (分析结果/指标)   │  │  (缓存/会话)          │
│  日志/元数据) │  │                   │  │                      │
└──────────────┘  └─────────▲────────┘  └──────────────────────┘
                            │ 实时写入
┌───────────────────────────┴─────────────────────────────────────┐
│                      实时计算层（Flink）                          │
│   销售实时聚合 / 推荐计算 / 营销分析 / 数据质量 / 用户行为加工      │
│              （作业由 StreamPark 统一托管与调度）                  │
└───────────────────────────▲─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                      数据管道层（Kafka）                          │
│        订单事件流 / 用户行为流 / 库存变更流 / 营销数据流            │
└───────────────────────────▲─────────────────────────────────────┘
                            │ 采集
┌───────────────────────────┴─────────────────────────────────────┐
│                        数据源层                                  │
│    电商业务库(MySQL)  /  埋点日志  /  第三方 API  /  模拟数据生成器  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 数据流转

```
数据源 → Kafka(采集) → Flink(清洗/计算) → Doris(存储)
                                              ↓
                                    后端(查询聚合) → 前端(展示)

任务管理侧：后端 ↔ StreamPark REST API ↔ Flink 作业
```

### 4.3 模块职责

| 模块                       | 职责                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| 前端门户                   | 登录、多租户切换、功能菜单、实时大屏、报表                                                       |
| 后端服务（RuoYi-Vue-Plus） | 业务逻辑、鉴权（Sa-Token）、租户拦截、对接 Doris/MySQL/StreamPark；用户/角色/菜单/日志由框架提供 |
| StreamPark                 | Flink/Spark 作业的开发、提交、监控、告警（多租户）                                               |
| Kafka                      | 事件流缓冲与解耦                                                                                 |
| Flink                      | 实时计算（销售/推荐/营销/质量/行为）                                                             |
| Doris                      | 实时分析结果存储与查询                                                                           |
| MySQL                      | 租户、权限、配置、日志等元数据                                                                   |

---

## 5. 多租户设计

### 5.1 租户模型

采用**共享应用 + 租户字段隔离**为主，敏感数据可升级为独立库隔离。

- 每个租户（租户/业务线/客户）拥有唯一 `tenant_id`
- 业务表均带 `tenant_id` 字段，查询时强制过滤
- 通过 MyBatis-Plus 多租户插件自动注入 `tenant_id`，避免遗漏

### 5.2 隔离策略

| 维度         | 策略                                              |
| ------------ | ------------------------------------------------- |
| 数据隔离     | 业务表 `tenant_id` 字段 + 拦截器自动过滤          |
| 计算资源隔离 | StreamPark 按 Team 划分，对应租户作业组与资源配额 |
| 权限隔离     | RBAC：角色 + 菜单 + 数据权限（只能看本租户数据）  |
| 配置隔离     | 数据源、报表配置均按租户隔离                      |

### 5.3 权限模型（RBAC）

```
用户(User) ──多对多──> 角色(Role) ──多对多──> 权限(Permission)
   │                    │
   └── 归属 租户(Tenant) └── 绑定 菜单/接口
```

- **平台管理员**：管理租户、全局监控
- **租户管理员**：管理本租户用户、数据源、报表
- **普通用户**：查看报表、配置授权内的任务

---

## 6. 数据库设计

> 以下为核心表设计（MySQL 8.0，均含 `tenant_id`、`create_time`、`update_time`、`deleted` 公共字段）。

### 6.1 多租户与权限

| 表名                  | 说明      | 关键字段                                             |
| --------------------- | --------- | ---------------------------------------------------- |
| `sys_tenant`          | 租户      | id, tenant_code, tenant_name, status, contact        |
| `sys_user`            | 用户      | id, tenant_id, username, password, real_name, status |
| `sys_role`            | 角色      | id, tenant_id, role_code, role_name                  |
| `sys_permission`      | 权限      | id, perm_code, perm_name, type, path                 |
| `sys_user_role`       | 用户-角色 | user_id, role_id                                     |
| `sys_role_permission` | 角色-权限 | role_id, permission_id                               |

### 6.2 任务配置管理

| 表名               | 说明         | 关键字段                                                                           |
| ------------------ | ------------ | ---------------------------------------------------------------------------------- |
| `tb_datasource`    | 数据源配置   | id, tenant_id, ds_name, ds_type(mysql/kafka/api), conn_config(json), status        |
| `tb_event_stream`  | 事件流元数据 | id, tenant_id, stream_name, topic, schema_def(json), status                        |
| `tb_mining_task`   | 挖掘任务配置 | id, tenant_id, task_name, engine(spark), streampark_app_id, cron, params(json)     |
| `tb_realtime_task` | 实时任务配置 | id, tenant_id, task_name, engine(flink), streampark_app_id, checkpoint_cfg, status |
| `tb_report_config` | 报表配置     | id, tenant_id, report_name, metrics(json), dimensions(json), refresh_interval      |

### 6.3 业务分析管理

| 表名                  | 说明         | 关键字段                                                    |
| --------------------- | ------------ | ----------------------------------------------------------- |
| `tb_marketing_cost`   | 营销费用分析 | id, tenant_id, channel, cost, roi, stat_date                |
| `tb_recommend_result` | 实时推荐结果 | id, tenant_id, user_id, item_id, score, reason, rec_time    |
| `tb_sales_realtime`   | 销售实时分析 | id, tenant_id, category, sales_amount, order_cnt, stat_time |

> 说明：`tb_sales_realtime`、`tb_recommend_result` 等高频实时数据实际存储在 **Doris**，MySQL 仅存配置与归档。

### 6.4 系统监控与日志管理

| 表名                | 说明             | 关键字段                                                                                   |
| ------------------- | ---------------- | ------------------------------------------------------------------------------------------ |
| `tb_anomaly_record` | 系统异常检测记录 | id, tenant_id, anomaly_type, source_name, task_name, severity, content, status, occur_time |
| `tb_access_log`     | 数据接口访问日志 | id, tenant_id, user_id, api_path, method, ip, status_code, cost_ms, access_time            |
| `tb_data_quality`   | 数据质量监控结果 | id, tenant_id, table_name, rule_name, check_result, error_rate, check_time                 |
| `tb_user_behavior`  | 用户行为日志     | id, tenant_id, user_id, event_type, page, item_id, event_time                              |

---

## 7. 实时计算任务设计

> 均为 Flink SQL 作业，通过 StreamPark 提交与管理。

### 7.1 任务清单

| 作业名                   | 输入              | 逻辑                              | 输出                           |
| ------------------------ | ----------------- | --------------------------------- | ------------------------------ |
| `ods_order_ingest`       | MySQL CDC（订单） | 采集订单变更                      | Kafka topic                    |
| `dws_sales_realtime`     | 订单事件流        | 按品类/租户实时聚合销售额、订单量 | Doris `tb_sales_realtime`      |
| `dws_recommend_realtime` | 用户行为流        | 实时计算推荐分数                  | Doris `tb_recommend_result`    |
| `dws_marketing_analysis` | 营销数据流        | 营销费用与效果关联分析            | Doris `tb_marketing_cost`      |
| `dqc_quality_check`      | 各事件流          | 空值率、波动、重复率校验          | Doris `tb_data_quality` + 告警 |
| `behavior_etl`           | 埋点日志          | 用户行为清洗与加工                | Doris `tb_user_behavior`       |

### 7.2 示例：销售实时聚合（Flink SQL）

```sql
-- 源：Kafka 订单事件流
CREATE TABLE source_order (
    tenant_id   BIGINT,
    order_id    BIGINT,
    category    STRING,
    amount      DECIMAL(18,2),
    order_time  TIMESTAMP(3),
    WATERMARK FOR order_time AS order_time - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'order_event',
    'properties.bootstrap.servers' = 'kafka:9092',
    'format' = 'json'
);

-- 目标：Doris 销售实时分析表
CREATE TABLE sink_sales (
    tenant_id     BIGINT,
    category      STRING,
    sales_amount  DECIMAL(18,2),
    order_cnt     BIGINT,
    stat_time     TIMESTAMP
) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris-fe:8030',
    'table.identifier' = 'ecom.sales_realtime',
    'username' = 'root',
    'password' = ''
);

-- 每分钟滚动窗口聚合
INSERT INTO sink_sales
SELECT
    tenant_id,
    category,
    SUM(amount)          AS sales_amount,
    COUNT(*)             AS order_cnt,
    TUMBLE_END(order_time, INTERVAL '1' MINUTE) AS stat_time
FROM source_order
GROUP BY TUMBLE(order_time, INTERVAL '1' MINUTE), tenant_id, category;
```

---

## 8. 接口设计

### 8.1 接口规范

- 风格：RESTful，统一前缀 `/api/v1`
- 鉴权：请求头 `Authorization: Bearer <token>`，由 RuoYi-Vue-Plus 的 Sa-Token 校验；`tenant_id` 由租户拦截器从登录上下文注入
- 响应格式：

```json
{ "code": 200, "message": "success", "data": {} }
```

### 8.2 核心接口清单

| 模块     | 方法                | 路径                         | 说明                    |
| -------- | ------------------- | ---------------------------- | ----------------------- |
| 认证     | POST                | `/auth/login`                | 登录，返回 JWT          |
| 认证     | POST                | `/auth/logout`               | 登出                    |
| 租户     | GET                 | `/tenants`                   | 租户列表（管理员）      |
| 租户     | POST                | `/tenants`                   | 创建租户                |
| 数据源   | GET/POST/PUT/DELETE | `/datasources`               | 数据源 CRUD             |
| 实时任务 | GET                 | `/realtime-tasks`            | 实时任务列表            |
| 实时任务 | POST                | `/realtime-tasks/{id}/start` | 启动（转发 StreamPark） |
| 实时任务 | POST                | `/realtime-tasks/{id}/stop`  | 停止（转发 StreamPark） |
| 销售分析 | GET                 | `/analysis/sales/realtime`   | 销售实时统计            |
| 推荐结果 | GET                 | `/analysis/recommend`        | 实时推荐结果            |
| 营销分析 | GET                 | `/analysis/marketing`        | 营销费用分析            |
| 异常记录 | GET/POST/PUT/DELETE | `/anomaly-records`           | 异常记录 CRUD           |
| 访问日志 | GET                 | `/access-logs`               | 访问日志查询            |
| 数据质量 | GET                 | `/data-quality`              | 质量监控结果            |
| 用户行为 | GET                 | `/user-behaviors`            | 用户行为日志            |
| 报表     | GET/POST/PUT/DELETE | `/reports`                   | 报表配置 CRUD           |

### 8.3 与 StreamPark 集成

后端通过 StreamPark **REST API** 完成作业的创建、启动、停止、状态查询，对前端屏蔽底层细节。租户与 StreamPark 的 Team 一一映射。

---

## 9. 前端页面设计

### 9.1 页面结构

```
门户首页（多租户大屏）
├── 登录 / 注册
├── 任务配置管理
│   ├── 数据源配置管理
│   ├── 事件流原始数据管理
│   ├── 数据挖掘任务配置
│   ├── 实时处理任务配置
│   └── 报表配置管理
├── 业务分析管理
│   ├── 营销费用分析
│   ├── 实时推荐结果
│   └── 销售实时分析（实时大屏）
└── 系统监控与日志
    ├── 系统异常检测记录
    ├── 数据接口访问日志
    ├── 数据质量监控结果
    └── 用户行为日志
```

### 9.2 页面说明

| 页面             | 主要组件               | 数据来源          |
| ---------------- | ---------------------- | ----------------- |
| 销售实时分析大屏 | ECharts 折线/柱状/地图 | 后端 → Doris      |
| 实时处理任务配置 | 表格 + 表单 + 启停按钮 | 后端 → StreamPark |
| 数据源配置       | 表格 + 连接测试        | 后端 → MySQL      |
| 异常检测记录     | 表格 + 详情弹窗 + 分页 | 后端 → MySQL      |
| 数据质量监控     | 仪表盘 + 趋势图        | 后端 → Doris      |
| 报表配置         | 拖拽指标/维度配置      | 后端 → MySQL      |

### 9.3 前端工程结构（基于 Vben Admin）

采用 Vben Admin 作为基础框架，业务代码集中在 `apps/web-ele`（Element Plus 版本）或 `apps/web-antd`（Ant Design Vue 版本），按需选择其一。

```
vben5/                              # Vben Admin monorepo 根目录
├── apps/
│   └── web-ele/                    # 本系统业务应用（Element Plus 风格）
│       └── src/
│           ├── api/                # 接口封装（按 12 模块）
│           ├── views/              # 页面（任务配置/业务分析/监控日志）
│           │   ├── task-config/    # 任务配置管理
│           │   ├── analysis/       # 业务分析管理
│           │   └── monitor/        # 系统监控与日志
│           ├── router/routes/      # 路由（支持后端动态菜单）
│           ├── store/              # 用户/租户状态
│           └── adapter/            # 组件适配（VxeTable/ECharts）
├── packages/                       # Vben 核心能力（权限/主题/请求等）
└── internal/                       # 工程化配置
```

要点：

- **动态路由**：菜单与按钮权限由后端接口下发，配合多租户角色控制可见页面
- **请求封装**：统一在 `request` 中注入 JWT 与 `tenant_id`
- **大屏页面**：销售实时分析使用独立全屏路由 + ECharts

---

## 10. 部署方案

### 10.1 本地/测试环境（Docker Compose）

```yaml
services:
  mysql: # 业务库 + StreamPark 元数据
  redis: # 缓存
  kafka: # 消息队列
  flink-jobmanager / flink-taskmanager: # 计算
  doris: # 分析库（fe + be）
  streampark: # 任务管理平台
  backend: # RuoYi-Vue-Plus（JDK 21）
  frontend: # Vue（Nginx）
```

### 10.2 生产环境建议

- 计算层：Flink on Kubernetes（StreamPark 原生支持），弹性伸缩
- 各组件独立集群，Kafka/Doris 高可用部署
- 前端经 Nginx 反向代理，HTTPS
- 监控：Prometheus + Grafana 监控各组件

### 10.3 本地轻量化部署配置（Docker 内存约 8GB / M1 Pro ARM）

核心思路：**能省则省、能裸机则裸机**，优先使用 ARM 原生镜像，避免 x86 模拟带来的额外开销。

| 组件                | 部署方式                                          | 轻量化配置                                           | 内存预算      |
| ------------------- | ------------------------------------------------- | ---------------------------------------------------- | ------------- |
| MySQL 8.0           | Docker                                            | 单节点，`innodb_buffer_pool_size=256M`               | ~0.5GB        |
| Redis 7             | Docker                                            | 单节点，`maxmemory 256mb`                            | ~0.3GB        |
| Kafka               | Docker（KRaft 模式，**无 ZooKeeper**）            | 单节点，1 个分区即可                                 | ~1.0GB        |
| Flink 1.18+         | Docker                                            | 1 JobManager + 1 TaskManager，TM slots=2、heap ≈ 2GB | ~2.5GB        |
| Doris               | Docker（apache/doris all-in-one quickstart 镜像） | FE+BE 单容器一体，关闭多余副本                       | ~3.0GB        |
| StreamPark          | **宿主机直接运行**（JDK 21 + 上面的 MySQL）       | 避免镜像架构问题，heap ≈ 1GB                         | 宿主机 1GB    |
| 后端 RuoYi-Vue-Plus | 宿主机 IDE 运行                                   | JDK 21（Corretto 21）                                | 宿主机 ~0.5GB |
| 前端 Vben           | 宿主机 `pnpm dev`                                 | Vite 开发服务器                                      | 宿主机 ~0.3GB |
| 数据生成器          | 宿主机运行                                        | 轻量 Java/Python 进程                                | 宿主机 ~0.2GB |

要点：

1. **Kafka 用 KRaft 模式**，省去 ZooKeeper（省约 1GB）
2. **StreamPark 不进 Docker**，直接用本机 JDK 21 跑，规避 ARM 镜像兼容问题
3. 全部组件总预算 ≈ Docker 7.3GB + 宿主机 2GB，在 8GB Docker + 32GB 物理内存下可行
4. 若后期需要更全组件，可将 Docker Desktop 内存调至 16GB（Settings → Resources → Memory）

---

## 11. 开发计划

> 详细任务清单（编号/状态/依赖）见 `doc/任务/任务拆分清单.md`，本章为里程碑视图。

| 里程碑              | 对应阶段                                                                                                                                                                                                                                                                                                                      | 交付物            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| **M1 核心链路跑通** | 阶段一：环境搭建（Kafka/Flink/Doris/StreamPark/MySQL/Redis）<br>阶段二：引入 RuoYi-Vue-Plus + Vben，打通登录与动态菜单（T3.1、T4.1）<br>阶段三：数据接入（模拟订单流生成器 → Kafka，T2.1~T2.3）<br>阶段四：销售实时聚合作业（T2.5、T2.7）<br>阶段五：Doris 查询接口（T3.4、T3.5）<br>阶段六：销售实时分析大屏（T4.3，全自研） | 可演示的核心链路  |
| **M2 功能模块齐全** | 推荐/质量/异常 3 个 Flink 作业（T2.6）<br>12 模块建表与代码生成（T3.2、T3.3）<br>StreamPark 任务接口（T3.6）+ 接口文档（T3.7）<br>12 模块管理页面 + 工作台（T4.2、T4.5）                                                                                                                                                      | 完整功能          |
| **M3 交付就绪**     | 多租户全链路验证（T5.1）<br>模块与作业联动（T5.2）<br>压测调优（T5.4）<br>部署文档/操作手册/数据库设计文档/接口文档（T6.1~T6.4）                                                                                                                                                                                              | 上线 + 全套交付物 |

### 里程碑验收标准

| 里程碑 | 验收标准                                                                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M1     | ① 模拟订单数据持续写入 Kafka；② 销售实时聚合作业在 StreamPark 运行、结果入 Doris；③ 后端接口可查销售实时指标；④ 大屏秒级刷新；⑤ StreamPark 双租户（两个 Team）；⑥ Git 有核心代码提交 |
| M2     | ① 12 模块 CRUD 页面全部可用；② 3 个扩展 Flink 作业正常运行；③ StreamPark 任务管理接口接入；④ 接口文档完整；⑤ 工作台与外链页可用                                                      |
| M3     | ① 多租户数据隔离验证通过；② 监控模块与作业联动；③ 压测报告可用；④ 6 项交付物齐备                                                                                                     |

---

## 12. 风险与应对

| 风险             | 应对                            |
| ---------------- | ------------------------------- |
| 多租户数据串扰   | 强制租户拦截器 + 单元测试覆盖   |
| Flink 作业失败   | StreamPark 自动重启 + 告警通知  |
| Doris 写入压力   | 批量写入 + 合理分区/分桶        |
| 数据量增长快     | Kafka/Doris 水平扩展，冷热分层  |
| 团队不熟悉 Flink | 以 Flink SQL 为主，降低开发门槛 |

---

## 附录：技术组件版本对照

| 组件              | 版本  | 用途                        |
| ----------------- | ----- | --------------------------- |
| Apache Flink      | 1.18+ | 实时计算                    |
| Apache StreamPark | 2.1.7 | 多租户任务管理              |
| Apache Kafka      | 3.x   | 消息队列                    |
| Apache Doris      | 2.x   | 实时分析                    |
| MySQL             | 8.0   | 元数据/配置                 |
| Redis             | 7.x   | 缓存                        |
| RuoYi-Vue-Plus    | 6.0.0 | 后端底座（单体版，dromara） |
| Sa-Token          | 1.39+ | 鉴权                        |
| Vue               | 3.4+  | 前端                        |
