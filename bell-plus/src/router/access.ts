import type { Menu } from '@/api';
import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteMeta,
  RouteRecordStringComponent,
} from '@/types';

import { getAllMenusApi } from '@/api';
import { generateAccessible } from '@/components/access';
import { BasicLayout, IFrameView } from '@/layouts';
import { $t } from '@/locales';

const forbiddenComponent = () => import('@/views/_core/fallback/forbidden.vue');
const NotFoundComponent = () => import('@/views/_core/fallback/not-found.vue');

/**
 * RuoYi 后端菜单旧图标名 → iconify 图标名映射
 * RuoYi 菜单表里存的是 system/monitor/tool 这类短名，Vben5 需要 iconify 格式
 */
const ICON_MAP: Record<string, string> = {
  '404': 'lucide:file-x',
  bug: 'lucide:bug',
  build: 'lucide:hammer',
  button: 'lucide:toggle-right',
  cascader: 'lucide:list-tree',
  chart: 'lucide:bar-chart-3',
  checkbox: 'lucide:check-square',
  clipboard: 'lucide:clipboard',
  code: 'lucide:code',
  color: 'lucide:palette',
  component: 'lucide:puzzle',
  dashboard: 'lucide:layout-dashboard',
  date: 'lucide:calendar',
  dict: 'lucide:book-open',
  documentation: 'lucide:book',
  download: 'lucide:download',
  drag: 'lucide:move',
  druid: 'lucide:database',
  edit: 'lucide:edit',
  education: 'lucide:graduation-cap',
  email: 'lucide:mail',
  example: 'lucide:layers',
  excel: 'lucide:file-spreadsheet',
  exitfullscreen: 'lucide:minimize',
  eye: 'lucide:eye',
  eyeopen: 'lucide:eye',
  form: 'lucide:file-text',
  fullscreen: 'lucide:maximize',
  github: 'lucide:github',
  guide: 'lucide:compass',
  icon: 'lucide:image',
  input: 'lucide:text',
  international: 'lucide:globe',
  job: 'lucide:briefcase',
  language: 'lucide:languages',
  link: 'lucide:link',
  list: 'lucide:list',
  lock: 'lucide:lock',
  log: 'lucide:scroll-text',
  logininfor: 'lucide:log-in',
  message: 'lucide:message-square',
  money: 'lucide:coins',
  monitor: 'lucide:activity',
  nested: 'lucide:git-branch',
  number: 'lucide:hash',
  online: 'lucide:users',
  password: 'lucide:key',
  pdf: 'lucide:file-text',
  people: 'lucide:users',
  peoples: 'lucide:users',
  phone: 'lucide:smartphone',
  post: 'lucide:briefcase',
  question: 'lucide:help-circle',
  radio: 'lucide:radio',
  rate: 'lucide:star',
  redis: 'lucide:database',
  redislist: 'lucide:database',
  row: 'lucide:rows',
  search: 'lucide:search',
  select: 'lucide:mouse-pointer',
  server: 'lucide:server',
  shopping: 'lucide:shopping-cart',
  size: 'lucide:ruler',
  skill: 'lucide:zap',
  slider: 'lucide:sliders-horizontal',
  star: 'lucide:star',
  swagger: 'lucide:file-code',
  switch: 'lucide:toggle-left',
  system: 'lucide:settings',
  tab: 'lucide:layout',
  table: 'lucide:table',
  textarea: 'lucide:align-left',
  theme: 'lucide:palette',
  time: 'lucide:clock',
  timeRange: 'lucide:calendar-range',
  tool: 'lucide:wrench',
  tree: 'lucide:folder-tree',
  treeTable: 'lucide:folder-tree',
  upload: 'lucide:upload',
  user: 'lucide:user',
  validCode: 'lucide:shield-check',
  wechat: 'lucide:message-circle',
  zip: 'lucide:file-archive',
};

/** 转换菜单图标：已是 iconify 格式(带冒号)直接用，否则走映射表，未命中则返回原名 */
function mapMenuIcon(icon?: string): string | undefined {
  if (!icon) return icon;
  if (icon.includes(':')) return icon;
  return ICON_MAP[icon] ?? icon;
}

/**
 * 后台路由转vben路由
 * @param menuList 后台菜单
 * @param parentPath 上级目录
 * @returns vben路由
 */
function backMenuToVbenMenu(
  menuList: Menu[],
  parentPath = '',
): RouteRecordStringComponent[] {
  const resultList: RouteRecordStringComponent[] = [];
  menuList.forEach((menu) => {
    // 根目录为菜单形式
    // 固定有一个children  children为当前菜单
    if (menu.path === '/' && menu.children && menu.children.length === 1) {
      if (!menu.children || !menu.children[0]) {
        return;
      }

      // 需要处理根目录为内嵌的情况 不会带InnerLink
      if (/^https?:\/\//.test(menu.children[0].path)) {
        menu.children[0].component = 'InnerLink';
        menu.children[0].path = menu.children[0].path
          .replaceAll(/^https?:\/\//g, '')
          .replaceAll('/#/', '')
          .replaceAll('#', '')
          .replaceAll(/[?&]/g, '');
      }

      // 取子路径作为父级路径
      const path = menu.children[0].path;
      // 取子菜单的meta作为当前菜单的meta
      menu.meta = menu.children[0].meta;
      // 由于在一级路由 父级路径需要加上/
      menu.path = `/${path}`;
      menu.component = 'RootMenu';
      // 将子路径设置为''
      menu.children[0].path = '';
    }

    // 外链: http开头 & 组件为Layout || ParentView
    // 正则判断是否为http://或者https://开头
    if (
      /^https?:\/\//.test(menu.path) &&
      (menu.component === 'Layout' || menu.component === 'ParentView')
    ) {
      menu.component = 'Link';
    }

    // 内嵌iframe 组件为InnerLink
    if (menu.meta?.link && menu.component === 'InnerLink') {
      menu.component = 'IFrameView';
    }

    /**
     * 拼接path
     * menu.path为''(根目录路由) 则不拼接
     */
    if (parentPath && menu.path) {
      menu.path = `${parentPath}/${menu.path}`;
    }

    // 创建vben路由对象
    const vbenRoute: RouteRecordStringComponent = {
      component: menu.component,
      meta: {
        // 当前路由不在菜单显示 但是可以通过链接访问
        // 不可访问的路由由后端控制隐藏(不返回对应路由)
        hideInMenu: menu.hidden,
        icon: mapMenuIcon(menu.meta?.icon),
        keepAlive: !menu.meta?.noCache,
        title: menu.meta?.title,
        activePath: menu.meta?.activeMenu,
      },
      name: menu.name,
      path: menu.path,
    };

    // 处理meta映射 TODO: 等待后端添加参数
    if (menu.ext) {
      try {
        const extRouteMeta = JSON.parse(menu.ext);
        if (extRouteMeta) {
          vbenRoute.meta = {
            // 放前面 防止预设参数被覆盖
            ...(extRouteMeta as RouteMeta),
            ...vbenRoute.meta,
          };
        }
      } catch {
        console.error('错误的路由Meta类型, 必须为[json]格式');
      }
    }

    // 添加路由参数信息
    if (menu.query) {
      try {
        const query = JSON.parse(menu.query);
        if (vbenRoute.meta) {
          vbenRoute.meta.query = query;
        }
      } catch {
        console.error('错误的路由参数类型, 必须为[json]格式');
      }
    }

    /**
     * 处理不同组件
     */
    switch (menu.component) {
      /**
       * iframe内嵌
       */
      case 'IFrameView': {
        vbenRoute.component = 'IFrameView';
        if (vbenRoute.meta) {
          vbenRoute.meta.iframeSrc = menu.meta.link;
        }
        /**
         * 需要判断特殊情况  比如vue的hash是带#的
         * 比如链接 aaa.com/#/bbb  path会转换为 aaa/com/#/bbb
         * 比如链接 aaa.com/?bbb=xxx
         * 需要去除#  否则无法被添加到路由
         */
        vbenRoute.path = vbenRoute.path
          // 替换https:// 或者 http://
          .replaceAll(/^https?:\/\//g, '')
          .replaceAll('/#/', '')
          .replaceAll('#', '')
          .replaceAll(/[?&]/g, '');
        break;
      }
      case 'Layout': {
        vbenRoute.component = 'BasicLayout';
        break;
      }
      /**
       * 外链 新窗口打开
       */
      case 'Link': {
        if (vbenRoute.meta) {
          vbenRoute.meta.link = menu.meta.link;
        }
        vbenRoute.component = 'BasicLayout';
        break;
      }
      /**
       * 三级以上菜单 父级component为ParentView
       * 不能为layout 会套两层BasicLayout
       */
      case 'ParentView': {
        vbenRoute.component = '';
        break;
      }
      /**
       * 根目录菜单
       */
      case 'RootMenu': {
        if (vbenRoute.meta) {
          vbenRoute.meta.hideChildrenInMenu = true;
        }
        vbenRoute.component = 'BasicLayout';
        break;
      }
      /**
       * 其他自定义组件 如system/user/index 拼接/
       */
      default: {
        vbenRoute.component = `/${menu.component}`;
        break;
      }
    }

    // children处理
    if (menu.children && menu.children.length > 0) {
      vbenRoute.children = backMenuToVbenMenu(menu.children, menu.path);
    }
    // 添加
    resultList.push(vbenRoute);
  });
  return resultList;
}

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
    NotFoundComponent,
  };

  return await generateAccessible({
    ...options,
    fetchMenuListAsync: async () => {
      // 清除以前的message
      window.message.destroy();
      window.message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1,
      });
      // 后台返回路由/菜单
      const backMenuList = await getAllMenusApi();
      // 转换为vben能用的路由
      const vbenMenuList = backMenuToVbenMenu(backMenuList);
      return vbenMenuList;
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
