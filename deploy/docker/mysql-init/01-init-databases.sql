-- ============================================================
-- MySQL 初始化：创建业务库 / 后端库 / StreamPark 库
-- 自动在 MySQL 容器首次启动时执行
-- ============================================================

-- 1. 后端业务库（RuoYi-Vue-Plus + 12 个业务模块）
CREATE DATABASE IF NOT EXISTS `ry-vue-plus` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. StreamPark 元数据库
CREATE DATABASE IF NOT EXISTS `streampark` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. 系统业务元数据库（数据源配置、任务配置、报表配置等）
CREATE DATABASE IF NOT EXISTS `ds_platform` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 演示账号（仅本地开发使用）
CREATE USER IF NOT EXISTS 'ds_app'@'%' IDENTIFIED BY 'ds_app_2026';
GRANT ALL PRIVILEGES ON `ry-vue-plus`.* TO 'ds_app'@'%';
GRANT ALL PRIVILEGES ON `ds_platform`.* TO 'ds_app'@'%';
FLUSH PRIVILEGES;
