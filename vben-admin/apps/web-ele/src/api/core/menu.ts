import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/** RuoYi-Vue-Plus 路由 meta 结构 */
interface RuoYiRouterMeta {
  activeMenu?: null | string;
  icon?: string;
  link?: null | string;
  noCache?: boolean;
  title?: string;
}

/** RuoYi-Vue-Plus getRouters 返回的路由结构 */
interface RuoYiRouter {
  alwaysShow?: boolean;
  children?: RuoYiRouter[];
  component?: null | string;
  hidden?: boolean;
  meta?: RuoYiRouterMeta;
  name?: string;
  path?: string;
  redirect?: string;
}

/** RuoYi 图标 → iconify 图标映射 */
const ICON_MAP: Record<string, string> = {
  build: 'mdi:wrench-outline',
  chart: 'mdi:chart-line',
  checkbox: 'mdi:checkbox-marked-outline',
  dashboard: 'mdi:view-dashboard-outline',
  demo: 'mdi:flask-outline',
  dict: 'mdi:book-open-page-variant-outline',
  drag: 'mdi:drag-variant',
  edit: 'mdi:pencil-outline',
  eye: 'mdi:eye-outline',
  'eye-open': 'mdi:eye-outline',
  form: 'mdi:form-select',
  guide: 'mdi:link-variant-outline',
  icon: 'mdi:emoticon-outline',
  input: 'mdi:form-textbox',
  job: 'mdi:clock-outline',
  log: 'mdi:text-box-outline',
  logininfor: 'mdi:login-variant',
  message: 'mdi:message-outline',
  monitor: 'mdi:monitor',
  online: 'mdi:access-point',
  peoples: 'mdi:account-multiple-outline',
  phone: 'mdi:phone-outline',
  post: 'mdi:account-tie-outline',
  question: 'mdi:help-circle-outline',
  redis: 'mdi:database-outline',
  search: 'mdi:magnify',
  server: 'mdi:server',
  star: 'mdi:star-outline',
  swagger: 'mdi:api',
  system: 'mdi:cog-outline',
  table: 'mdi:table',
  time: 'mdi:clock-outline',
  tool: 'mdi:tools',
  tree: 'mdi:file-tree-outline',
  'tree-table': 'mdi:table-tree',
  upload: 'mdi:upload-outline',
  user: 'mdi:account-outline',
  validCode: 'mdi:shield-check-outline',
};

/** 将 RuoYi meta 转换为 Vben RouteMeta */
function convertMeta(ruoYiMeta?: RuoYiRouterMeta, index?: number) {
  const meta: Record<string, any> = {};
  meta.title = ruoYiMeta?.title ?? '';
  if (ruoYiMeta?.icon && ruoYiMeta.icon !== '#' && ICON_MAP[ruoYiMeta.icon]) {
    meta.icon = ICON_MAP[ruoYiMeta.icon];
  }
  if (ruoYiMeta?.noCache === false) {
    meta.keepAlive = true;
  }
  if (ruoYiMeta?.activeMenu) {
    meta.activePath = ruoYiMeta.activeMenu;
  }
  if (typeof index === 'number') {
    meta.order = index;
  }
  return meta;
}

/** 判断是否为外链菜单 */
function isExternalLink(router: RuoYiRouter): boolean {
  return Boolean(
    router.meta?.link ||
      (router.path && /^https?:\/\//.test(router.path)) ||
      router.component === 'InnerLink',
  );
}

/** 递归转换 RuoYi 路由树为 Vben 路由格式 */
function convertRouter(
  router: RuoYiRouter,
  isTopLevel: boolean,
  index: number,
): null | RouteRecordStringComponent[] | RouteRecordStringComponent {
  // 外链菜单暂不渲染（第一阶段全自研，外链页后续接入）
  if (isExternalLink(router)) {
    return null;
  }

  // 顶级单菜单（path 为 '/' 的包装结构）：提升子级为顶级路由，避免与根路由冲突
  if (isTopLevel && (router.path === '/' || !router.path)) {
    return (router.children ?? [])
      .map((child, idx) => convertRouter(child, false, idx))
      .filter(Boolean)
      .map((child) => {
        const route = child as RouteRecordStringComponent;
        route.path = route.path?.startsWith('/')
          ? route.path
          : `/${route.path}`;
        return route;
      });
  }

  const children = (router.children ?? [])
    .map((child, idx) => convertRouter(child, false, idx))
    .flat()
    .filter(Boolean) as RouteRecordStringComponent[];

  const component = router.component ?? '';
  const isContainer =
    component === 'Layout' || component === 'ParentView' || component === '';

  const route: RouteRecordStringComponent = {
    children: children.length > 0 ? children : undefined,
    // 容器组件（Layout/ParentView）不映射前端组件，由 Vben 根布局承载
    component: isContainer ? undefined : component,
    meta: convertMeta(router.meta, isTopLevel ? index : undefined),
    name: router.name ?? '',
    path: router.path ?? '',
    redirect: router.redirect,
  } as RouteRecordStringComponent;

  if (router.hidden) {
    route.meta = { ...route.meta, hideInMenu: true };
  }
  return route;
}

/**
 * 获取用户所有菜单（RuoYi-Vue-Plus getRouters 接口，转换为 Vben 路由格式）
 */
export async function getAllMenusApi() {
  const routers = await requestClient.get<RuoYiRouter[]>(
    '/system/menu/getRouters',
  );
  return (routers ?? [])
    .map((router, index) => convertRouter(router, true, index))
    .flat()
    .filter(Boolean) as RouteRecordStringComponent[];
}
