<script lang="ts" setup>
import type { EChartsOption } from 'echarts';

import { onBeforeUnmount, onMounted, ref } from 'vue';

import {
  getSalesDimRank,
  getSalesOverview,
  getSalesProductRank,
  getSalesTrend,
} from '@/api/sales';

import BaseChart from '@/views/dashboard/analytics/components/base-chart.vue';

defineOptions({ name: 'SalesScreen' });

/** 租户列表（与模拟数据生成器对齐：租户1/租户2） */
const TENANTS = [
  { id: 1, name: '租户一' },
  { id: 2, name: '租户二' },
];

/** 图表通用配色 */
const COLORS = [
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#a78bfa',
  '#fb7185',
  '#4ade80',
  '#60a5fa',
];
const AXIS_COLOR = 'rgba(226,232,240,0.65)';
const SPLIT_COLOR = 'rgba(148,163,184,0.15)';

const tenantId = ref(1);
const connected = ref(true);
const now = ref(new Date());
const overview = ref<SalesApi.Overview>({
  avgOrderAmount: 0,
  orderCount: 0,
  productCount: 0,
  saleAmount: 0,
});
const productRank = ref<SalesApi.ProductRankItem[]>([]);

const trendOption = ref<EChartsOption>({});
const categoryOption = ref<EChartsOption>({});
const provinceOption = ref<EChartsOption>({});
const channelOption = ref<EChartsOption>({});

const fmtMoney = (value: number | string) =>
  `¥${Number(value || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
const fmtNum = (value: number) =>
  Number(value || 0).toLocaleString('zh-CN');
const fmtTime = (minute: string) => (minute || '').slice(11, 16);

function tooltipStyle() {
  return {
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderColor: 'rgba(56,189,248,0.35)',
    textStyle: { color: '#e2e8f0', fontSize: 12 },
  };
}

function buildTrendOption(points: SalesApi.TrendPoint[]): EChartsOption {
  return {
    backgroundColor: 'transparent',
    grid: { bottom: 24, left: 12, right: 16, top: 36, containLabel: true },
    legend: {
      data: ['销售额', '订单量'],
      textStyle: { color: AXIS_COLOR },
      top: 4,
    },
    series: [
      {
        areaStyle: {
          color: {
            colorStops: [
              { color: 'rgba(56,189,248,0.35)', offset: 0 },
              { color: 'rgba(56,189,248,0.02)', offset: 1 },
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1,
          } as any,
        },
        data: points.map((p) => Number(p.saleAmount || 0)),
        itemStyle: { color: '#38bdf8' },
        lineStyle: { width: 2 },
        name: '销售额',
        smooth: true,
        type: 'line',
      },
      {
        data: points.map((p) => p.orderCount),
        itemStyle: { color: '#34d399' },
        lineStyle: { width: 2 },
        name: '订单量',
        smooth: true,
        type: 'line',
        yAxisIndex: 1,
      },
    ],
    tooltip: { ...tooltipStyle(), trigger: 'axis' },
    xAxis: {
      axisLabel: { color: AXIS_COLOR },
      axisLine: { lineStyle: { color: SPLIT_COLOR } },
      data: points.map((p) => fmtTime(p.statMinute)),
      type: 'category',
    },
    yAxis: [
      {
        axisLabel: { color: AXIS_COLOR },
        name: '销售额(元)',
        nameTextStyle: { color: AXIS_COLOR },
        splitLine: { lineStyle: { color: SPLIT_COLOR } },
        type: 'value',
      },
      {
        axisLabel: { color: AXIS_COLOR },
        name: '订单量',
        nameTextStyle: { color: AXIS_COLOR },
        splitLine: { show: false },
        type: 'value',
      },
    ],
  };
}

function buildRankBarOption(items: SalesApi.DimRankItem[]): EChartsOption {
  const sorted = [...items].reverse();
  return {
    backgroundColor: 'transparent',
    grid: { bottom: 8, left: 8, right: 24, top: 8, containLabel: true },
    series: [
      {
        barMaxWidth: 14,
        data: sorted.map((item) => Number(item.saleAmount || 0)),
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: {
            colorStops: [
              { color: 'rgba(56,189,248,0.55)', offset: 0 },
              { color: '#38bdf8', offset: 1 },
            ],
            type: 'linear',
            x: 0,
            x2: 1,
            y: 0,
            y2: 0,
          } as any,
        },
        label: {
          color: AXIS_COLOR,
          fontSize: 11,
          formatter: (params: any) => fmtNum(params.value),
          position: 'right',
          show: true,
        },
        type: 'bar',
      },
    ],
    tooltip: {
      ...tooltipStyle(),
      formatter: (params: any) =>
        `${params.name}<br/>销售额：${fmtMoney(params.value)}<br/>订单量：${fmtNum(sorted[params.dataIndex]?.orderCount ?? 0)}`,
      trigger: 'axis',
    },
    xAxis: {
      axisLabel: { color: AXIS_COLOR },
      splitLine: { lineStyle: { color: SPLIT_COLOR } },
      type: 'value',
    },
    yAxis: {
      axisLabel: { color: AXIS_COLOR },
      data: sorted.map((item) => item.name),
      type: 'category',
    },
  };
}

function buildChannelOption(items: SalesApi.DimRankItem[]): EChartsOption {
  return {
    backgroundColor: 'transparent',
    color: COLORS,
    legend: {
      bottom: 0,
      textStyle: { color: AXIS_COLOR },
    },
    series: [
      {
        data: items.map((item) => ({
          name: item.name,
          value: Number(item.saleAmount || 0),
        })),
        itemStyle: { borderColor: '#0b1220', borderWidth: 2 },
        label: { color: AXIS_COLOR, formatter: '{b}\n{d}%' },
        radius: ['38%', '62%'],
        roseType: 'radius',
        type: 'pie',
      },
    ],
    tooltip: {
      ...tooltipStyle(),
      formatter: (params: any) =>
        `${params.name}<br/>销售额：${fmtMoney(params.value)}（${params.percent}%）`,
    },
  };
}

async function fetchData() {
  try {
    const [ov, trend, category, province, channel, products] =
      await Promise.all([
        getSalesOverview(tenantId.value),
        getSalesTrend(tenantId.value, 60),
        getSalesDimRank(tenantId.value, 'category', 8),
        getSalesDimRank(tenantId.value, 'province', 8),
        getSalesDimRank(tenantId.value, 'channel', 6),
        getSalesProductRank(tenantId.value, 10),
      ]);
    overview.value = ov;
    productRank.value = products ?? [];
    trendOption.value = buildTrendOption(trend ?? []);
    categoryOption.value = buildRankBarOption(category ?? []);
    provinceOption.value = buildRankBarOption(province ?? []);
    channelOption.value = buildChannelOption(channel ?? []);
    connected.value = true;
  } catch {
    connected.value = false;
  }
}

let dataTimer: number | undefined;
let clockTimer: number | undefined;

function switchTenant(id: number) {
  if (tenantId.value === id) return;
  tenantId.value = id;
  fetchData();
}

onMounted(() => {
  fetchData();
  // 秒级刷新：数据 3 秒轮询，时钟 1 秒刷新
  dataTimer = window.setInterval(fetchData, 3000);
  clockTimer = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  if (dataTimer) window.clearInterval(dataTimer);
  if (clockTimer) window.clearInterval(clockTimer);
});
</script>

<template>
  <div class="sales-screen">
    <!-- 头部 -->
    <header class="screen-header">
      <div class="header-left">
        <span class="status-dot" :class="{ offline: !connected }"></span>
        <span class="status-text">{{ connected ? '实时链路正常' : '链路连接异常' }}</span>
      </div>
      <h1 class="screen-title">销售实时分析大屏</h1>
      <div class="header-right">
        <div class="tenant-switch">
          <button
            v-for="tenant in TENANTS"
            :key="tenant.id"
            :class="{ active: tenantId === tenant.id }"
            class="tenant-btn"
            type="button"
            @click="switchTenant(tenant.id)"
          >
            {{ tenant.name }}
          </button>
        </div>
        <span class="screen-clock">{{ now.toLocaleString('zh-CN') }}</span>
      </div>
    </header>

    <!-- 核心指标 -->
    <section class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">今日销售额</div>
        <div class="kpi-value amount">{{ fmtMoney(overview.saleAmount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">今日订单量</div>
        <div class="kpi-value">{{ fmtNum(overview.orderCount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">商品销量（件）</div>
        <div class="kpi-value">{{ fmtNum(overview.productCount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">客单价</div>
        <div class="kpi-value">{{ fmtMoney(overview.avgOrderAmount) }}</div>
      </div>
    </section>

    <!-- 中部：趋势 + 类目排行 -->
    <section class="chart-row">
      <div class="panel panel-wide">
        <div class="panel-title">近 1 小时销售趋势</div>
        <div class="panel-body">
          <BaseChart :option="trendOption" height="100%" />
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">类目销售排行</div>
        <div class="panel-body">
          <BaseChart :option="categoryOption" height="100%" />
        </div>
      </div>
    </section>

    <!-- 底部：省份排行 + 商品排行 + 渠道分布 -->
    <section class="chart-row">
      <div class="panel">
        <div class="panel-title">省份销售排行</div>
        <div class="panel-body">
          <BaseChart :option="provinceOption" height="100%" />
        </div>
      </div>
      <div class="panel panel-wide">
        <div class="panel-title">商品销售排行 TOP10</div>
        <div class="panel-body product-table">
          <table>
            <thead>
              <tr>
                <th>排名</th>
                <th>商品名称</th>
                <th>类目</th>
                <th>销售额</th>
                <th>销量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in productRank" :key="item.productId">
                <td>
                  <span class="rank-badge" :class="`rank-${idx < 3 ? idx + 1 : 'n'}`">
                    {{ idx + 1 }}
                  </span>
                </td>
                <td class="ellipsis">{{ item.productName }}</td>
                <td>{{ item.category }}</td>
                <td class="amount">{{ fmtMoney(item.saleAmount) }}</td>
                <td>{{ fmtNum(item.saleQuantity) }}</td>
              </tr>
              <tr v-if="productRank.length === 0">
                <td class="empty" colspan="5">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <div class="panel-title">渠道销售分布</div>
        <div class="panel-body">
          <BaseChart :option="channelOption" height="100%" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sales-screen {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 720px;
  padding: 14px 16px;
  overflow: hidden;
  color: #e2e8f0;
  background:
    radial-gradient(ellipse at top, rgba(56, 189, 248, 0.08), transparent 60%),
    linear-gradient(180deg, #0b1220 0%, #0f172a 100%);
}

.screen-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 180px;
  font-size: 13px;
  color: #94a3b8;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.8);
  animation: pulse 2s infinite;
}

.status-dot.offline {
  background: #fb7185;
  box-shadow: 0 0 8px rgba(251, 113, 133, 0.8);
}

@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}

.screen-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #f1f5f9;
  text-shadow: 0 0 20px rgba(56, 189, 248, 0.5);
}

.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
  min-width: 320px;
  justify-content: flex-end;
}

.tenant-switch {
  display: flex;
  padding: 2px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 6px;
}

.tenant-btn {
  padding: 4px 14px;
  font-size: 12px;
  color: #94a3b8;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 4px;
  transition: all 0.2s;
}

.tenant-btn.active {
  color: #0b1220;
  background: #38bdf8;
  font-weight: 600;
}

.screen-clock {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #94a3b8;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  flex-shrink: 0;
}

.kpi-card {
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 8px;
}

.kpi-label {
  font-size: 13px;
  color: #94a3b8;
}

.kpi-value {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #38bdf8;
}

.kpi-value.amount {
  color: #fbbf24;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 8px;
}

.panel-wide {
  grid-column: span 2;
}

.panel-title {
  flex-shrink: 0;
  padding: 10px 14px 4px;
  font-size: 14px;
  font-weight: 600;
  color: #7dd3fc;
}

.panel-title::before {
  margin-right: 6px;
  content: '';
  display: inline-block;
  width: 3px;
  height: 12px;
  background: #38bdf8;
  border-radius: 2px;
}

.panel-body {
  flex: 1;
  min-height: 0;
  padding: 4px 8px 8px;
}

.product-table {
  padding: 0 14px 8px;
  overflow-y: auto;
}

.product-table table {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.product-table th {
  padding: 6px 8px;
  font-weight: 500;
  color: #64748b;
  text-align: left;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}

.product-table td {
  padding: 6px 8px;
  color: #cbd5e1;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.product-table td.amount {
  color: #fbbf24;
  font-variant-numeric: tabular-nums;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 12px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.rank-badge.rank-1 {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.rank-badge.rank-2 {
  background: rgba(226, 232, 240, 0.2);
  color: #e2e8f0;
}

.rank-badge.rank-3 {
  background: rgba(251, 146, 60, 0.2);
  color: #fb923c;
}

.ellipsis {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  padding: 24px;
  color: #64748b;
  text-align: center;
}
</style>
