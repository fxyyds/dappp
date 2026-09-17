-- ============================================================
-- 销售实时大屏菜单（自定义菜单，导入 ry_vue.sql 之后执行）
-- 执行：mysql -uroot -pds_hadoop_2026 ry-vue-plus < sales-menu.sql
-- ============================================================

INSERT INTO `sys_menu` (`menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`,
    `query_param`, `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`,
    `active_menu`, `ext`, `create_dept`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`)
VALUES (999100001, '销售实时大屏', 0, -1, 'screen', 'screen/index',
    NULL, 'N', 'Y', 'C', '0', '0', 'sales:realtime:view', 'chart',
    '', '', 103, 1761100000000000001, NOW(), NULL, NULL, '销售实时分析大屏（数据源 Doris，全自研）')
ON DUPLICATE KEY UPDATE `menu_name` = VALUES(`menu_name`), `icon` = VALUES(`icon`);

-- 给超级管理员角色授权该菜单（role_id=1 为超管，超管默认拥有全部权限，此步可选）
INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 999100001);
