/*
 Navicat Premium Dump SQL

 Source Server         : localhost_3306
 Source Server Type    : MySQL
 Source Server Version : 80044 (8.0.44)
 Source Host           : localhost:3306
 Source Schema         : app_db

 Target Server Type    : MySQL
 Target Server Version : 80044 (8.0.44)
 File Encoding         : 65001

 Date: 21/11/2025 17:42:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for CategoryGroup
-- ----------------------------
DROP TABLE IF EXISTS `CategoryGroup`;
CREATE TABLE `CategoryGroup`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `orderIndex` int NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdBy` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `CategoryGroup_slug_key`(`slug` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of CategoryGroup
-- ----------------------------
INSERT INTO `CategoryGroup` VALUES ('cmi88h34y0000xjkj7d68l25b', '????', 'default-group', NULL, 0, 1, 'admin', '2025-11-21 02:20:55.714', '2025-11-21 02:20:55.714');
INSERT INTO `CategoryGroup` VALUES ('cmi89a0l80000cmmoc250sopb', '基础拆除类', 'demolition', NULL, 0, 1, 'system', '2025-11-21 02:43:25.437', '2025-11-21 03:10:26.762');
INSERT INTO `CategoryGroup` VALUES ('cmi89a0n5000fcmmof3h1g1jl', '墙面类2', 'wall', NULL, 1, 1, 'system', '2025-11-21 02:43:25.505', '2025-11-21 07:31:59.420');
INSERT INTO `CategoryGroup` VALUES ('cmi89a0oc000ocmmoygks9qyr', '天花类', 'ceiling', NULL, 2, 1, 'system', '2025-11-21 02:43:25.549', '2025-11-21 03:10:26.911');
INSERT INTO `CategoryGroup` VALUES ('cmi89a0qu000vcmmohnxz7eg1', '地面类', 'floor', NULL, 3, 1, 'system', '2025-11-21 02:43:25.638', '2025-11-21 03:10:26.941');
INSERT INTO `CategoryGroup` VALUES ('cmi89a0rz0010cmmon28maksn', '综合类', 'comprehensive', NULL, 4, 1, 'system', '2025-11-21 02:43:25.679', '2025-11-21 03:10:26.968');
INSERT INTO `CategoryGroup` VALUES ('cmi8g0hdd007f8iwfoscw2m7c', '11', 'grp_1763704317934', NULL, 0, 1, 'admin', '2025-11-21 05:51:57.936', '2025-11-21 05:51:57.936');
INSERT INTO `CategoryGroup` VALUES ('cmi8idk5w00009fvpbpj5crca', '1', 'grp_1763708287314', NULL, 0, 1, 'admin', '2025-11-21 06:58:07.316', '2025-11-21 06:58:07.316');
INSERT INTO `CategoryGroup` VALUES ('cmi8jtddj00079fvpggw0skys', '牛逼类', 'grp_1763710704625', NULL, 0, 1, 'admin', '2025-11-21 07:38:24.626', '2025-11-21 07:38:24.626');

-- ----------------------------
-- Table structure for CategoryItem
-- ----------------------------
DROP TABLE IF EXISTS `CategoryItem`;
CREATE TABLE `CategoryItem`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `groupId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `orderIndex` int NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdBy` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `price` int NOT NULL DEFAULT 0,
  `unit` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `minQuantity` int NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `CategoryItem_slug_key`(`slug` ASC) USING BTREE,
  INDEX `CategoryItem_groupId_fkey`(`groupId` ASC) USING BTREE,
  CONSTRAINT `CategoryItem_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `CategoryGroup` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of CategoryItem
-- ----------------------------
INSERT INTO `CategoryItem` VALUES ('cmi88hktr0002xjkjvrusueij', 'cmi88h34y0000xjkj7d68l25b', '????', 'default-item', NULL, 0, 1, 'admin', '2025-11-21 02:21:18.639', '2025-11-21 02:21:18.639', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0lm0002cmmo6l24fwpr', 'cmi89a0l80000cmmoc250sopb', '拆墙', 'wall_removal', '每平', 0, 1, 'system', '2025-11-21 02:43:25.450', '2025-11-21 08:52:26.866', 50, '每平', 8);
INSERT INTO `CategoryItem` VALUES ('cmi89a0lv0004cmmoge1st9kh', 'cmi89a0l80000cmmoc250sopb', '铲天花', 'ceiling_removal', '每平', 1, 1, 'system', '2025-11-21 02:43:25.460', '2025-11-21 08:42:06.773', 5, '米', 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0m40006cmmow0kdhf2h', 'cmi89a0l80000cmmoc250sopb', '磨防水', 'waterproof_grinding', '每平', 2, 1, 'system', '2025-11-21 02:43:25.468', '2025-11-21 08:41:57.893', 100, '项', 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0ma0008cmmoi45kpr71', 'cmi89a0l80000cmmoc250sopb', '砌墙（含粉刷）', 'wall_building', '每平', 3, 1, 'system', '2025-11-21 02:43:25.475', '2025-11-21 08:44:36.820', 5, '套', 2);
INSERT INTO `CategoryItem` VALUES ('cmi89a0mh000acmmoxdbrstn7', 'cmi89a0l80000cmmoc250sopb', '垃圾外运', 'garbage_transport', '4方车', 4, 1, 'system', '2025-11-21 02:43:25.482', '2025-11-21 08:52:29.898', 65, '每平', 4);
INSERT INTO `CategoryItem` VALUES ('cmi89a0mp000ccmmo1z12rxqc', 'cmi89a0l80000cmmoc250sopb', '水电局改', 'plumbing_modification', '项', 5, 1, 'system', '2025-11-21 02:43:25.489', '2025-11-21 08:42:40.706', 5, '个', 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0mw000ecmmof7ex4ovh', 'cmi89a0l80000cmmoc250sopb', '成品保护', 'protection', '项', 6, 1, 'system', '2025-11-21 02:43:25.496', '2025-11-21 03:10:26.865', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0nb000hcmmoyf0u5llr', 'cmi89a0n5000fcmmof3h1g1jl', '铲刷', 'wall_scraping', '每平', 0, 1, 'system', '2025-11-21 02:43:25.511', '2025-11-21 07:12:21.212', 50, '项', 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0nk000jcmmocpnl0fb1', 'cmi89a0n5000fcmmof3h1g1jl', '磨刷', 'wall_grinding', '每平', 1, 1, 'system', '2025-11-21 02:43:25.521', '2025-11-21 03:10:26.887', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0ns000lcmmog13k7gbd', 'cmi89a0n5000fcmmof3h1g1jl', '400*800瓷砖上墙', 'tile_400_800', '每平', 2, 1, 'system', '2025-11-21 02:43:25.529', '2025-11-21 03:10:26.895', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0o4000ncmmorvduu4s8', 'cmi89a0n5000fcmmof3h1g1jl', '600*1200瓷砖上墙', 'tile_600_1200', '每平', 3, 1, 'system', '2025-11-21 02:43:25.540', '2025-11-21 03:10:26.901', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0om000qcmmo7rkg7cgl', 'cmi89a0oc000ocmmoygks9qyr', '石膏板吊顶', 'gypsum_ceiling', '每平', 0, 1, 'system', '2025-11-21 02:43:25.559', '2025-11-21 08:59:37.245', 0, '每平', 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0p0000scmmoc6cmzamv', 'cmi89a0oc000ocmmoygks9qyr', '窗帘盒', 'curtain_box', '米', 1, 1, 'system', '2025-11-21 02:43:25.572', '2025-11-21 03:10:26.926', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0qc000ucmmo2h2r5vz6', 'cmi89a0oc000ocmmoygks9qyr', '30*60铝扣板吊顶', 'aluminum_ceiling', '每平', 2, 1, 'system', '2025-11-21 02:43:25.620', '2025-11-21 03:10:26.933', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0r9000xcmmocfaw4p7q', 'cmi89a0qu000vcmmohnxz7eg1', '800*800瓷砖铺贴', 'tile_800_800', '每平', 0, 1, 'system', '2025-11-21 02:43:25.653', '2025-11-21 03:10:26.950', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0rm000zcmmo9oo0u69c', 'cmi89a0qu000vcmmohnxz7eg1', '600*1200瓷砖铺贴', 'tile_600_1200_floor', '每平', 1, 1, 'system', '2025-11-21 02:43:25.666', '2025-11-21 03:10:26.958', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0sa0012cmmolim00my4', 'cmi89a0rz0010cmmon28maksn', '花洒', 'shower', '个', 0, 1, 'system', '2025-11-21 02:43:25.690', '2025-11-21 03:10:26.976', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0sh0014cmmoi9d1iy2z', 'cmi89a0rz0010cmmon28maksn', '马桶', 'toilet', '个', 1, 1, 'system', '2025-11-21 02:43:25.697', '2025-11-21 03:10:26.985', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0sp0016cmmo7ly5irlf', 'cmi89a0rz0010cmmon28maksn', '浴室柜', 'bathroom_cabinet', '个', 2, 1, 'system', '2025-11-21 02:43:25.705', '2025-11-21 03:10:26.998', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0sz0018cmmotcvhlank', 'cmi89a0rz0010cmmon28maksn', '五金挂件', 'hardware', '套', 3, 1, 'system', '2025-11-21 02:43:25.715', '2025-11-21 03:10:27.006', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0t8001acmmog6199ujl', 'cmi89a0rz0010cmmon28maksn', '淋浴隔断（钢化）', 'shower_partition', '每平', 4, 1, 'system', '2025-11-21 02:43:25.724', '2025-11-21 03:10:27.015', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0ti001ccmmowrrmyfmb', 'cmi89a0rz0010cmmon28maksn', 'SPC石塑地板', 'spc_floor', '每平', 5, 1, 'system', '2025-11-21 02:43:25.734', '2025-11-21 03:10:27.024', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0tx001ecmmoi91uigi8', 'cmi89a0rz0010cmmon28maksn', '电动晾衣架', 'electric_dryer', '个', 6, 1, 'system', '2025-11-21 02:43:25.749', '2025-11-21 03:10:27.033', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0u8001gcmmo5ec4qaj0', 'cmi89a0rz0010cmmon28maksn', '电子锁', 'smart_lock', '个', 7, 1, 'system', '2025-11-21 02:43:25.760', '2025-11-21 03:10:27.042', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0ul001icmmoklyt7gm6', 'cmi89a0rz0010cmmon28maksn', '铝合金推拉门', 'aluminum_door_sliding', '每平', 8, 1, 'system', '2025-11-21 02:43:25.773', '2025-11-21 03:10:27.051', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0uw001kcmmo6hje8htu', 'cmi89a0rz0010cmmon28maksn', '铝合金单开门', 'aluminum_door_single', '单扇', 9, 1, 'system', '2025-11-21 02:43:25.785', '2025-11-21 03:10:27.059', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0va001mcmmomxd7xoe3', 'cmi89a0rz0010cmmon28maksn', '实木复合木门', 'wooden_door', '单扇', 10, 1, 'system', '2025-11-21 02:43:25.798', '2025-11-21 03:10:27.069', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0vm001ocmmoag4fy7kz', 'cmi89a0rz0010cmmon28maksn', '橱柜吊柜', 'kitchen_wall_cabinet', '米', 11, 1, 'system', '2025-11-21 02:43:25.810', '2025-11-21 03:10:27.078', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0vz001qcmmo3e0q3695', 'cmi89a0rz0010cmmon28maksn', '橱柜地柜（含石英石台面）', 'kitchen_base_cabinet', '米', 12, 1, 'system', '2025-11-21 02:43:25.824', '2025-11-21 03:10:27.087', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0wf001scmmo9nhs18lf', 'cmi89a0rz0010cmmon28maksn', '橱柜洗菜盆（含龙头+下水）', 'kitchen_sink', '套', 13, 1, 'system', '2025-11-21 02:43:25.839', '2025-11-21 03:10:27.096', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0ws001ucmmoa9q0oadx', 'cmi89a0rz0010cmmon28maksn', '定制柜', 'custom_cabinet', '每平', 14, 1, 'system', '2025-11-21 02:43:25.852', '2025-11-21 03:10:27.104', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0x2001wcmmoay9tll7l', 'cmi89a0rz0010cmmon28maksn', '隐形防盗网', 'invisible_security_net', '每平', 15, 1, 'system', '2025-11-21 02:43:25.862', '2025-11-21 03:10:27.113', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0xe001ycmmo0sdu3idw', 'cmi89a0rz0010cmmon28maksn', '美缝（美缝剂）', 'grout', '每平', 16, 1, 'system', '2025-11-21 02:43:25.874', '2025-11-21 03:10:27.122', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0xo0020cmmo1dbqwvut', 'cmi89a0rz0010cmmon28maksn', '楼梯房上楼费', 'stairs_fee', '总价*2%', 17, 1, 'system', '2025-11-21 02:43:25.885', '2025-11-21 09:26:11.977', 5, '每平', 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0xy0022cmmol3a8p0rj', 'cmi89a0rz0010cmmon28maksn', '铝合金封窗', 'aluminum_window', '每平', 18, 1, 'system', '2025-11-21 02:43:25.894', '2025-11-21 09:26:20.667', 5, '每平', 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0y80024cmmob43t3dsx', 'cmi89a0rz0010cmmon28maksn', '1.4断桥铝封窗（开启扇另计）', 'broken_bridge_window', '每平', 19, 1, 'system', '2025-11-21 02:43:25.904', '2025-11-21 03:10:27.147', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi89a0yh0026cmmo8o72f27q', 'cmi89a0rz0010cmmon28maksn', '1', 'bathroom_waterproof', '每平', 20, 1, 'system', '2025-11-21 02:43:25.914', '2025-11-21 07:59:34.219', 1000, '套', 1);
INSERT INTO `CategoryItem` VALUES ('cmi8jle8300049fvpvoujd7e4', 'cmi89a0n5000fcmmof3h1g1jl', 'hah ', 'item_1763710332480', NULL, 0, 1, 'admin', '2025-11-21 07:32:12.483', '2025-11-21 07:32:12.483', 0, NULL, 1);
INSERT INTO `CategoryItem` VALUES ('cmi8jtsay000b9fvp6m67uo7g', 'cmi8jtddj00079fvpggw0skys', '垃圾外运', 'item_1763710723974', NULL, 0, 1, 'admin', '2025-11-21 07:38:43.978', '2025-11-21 08:33:26.061', 65, '方车', 4);
INSERT INTO `CategoryItem` VALUES ('cmi8lvm0f000111kq9e1yuglg', 'cmi89a0l80000cmmoc250sopb', '垃圾外运', 'item_1763714168361', NULL, 0, 1, 'admin', '2025-11-21 08:36:08.367', '2025-11-21 08:36:08.367', 0, NULL, 1);

-- ----------------------------
-- Table structure for Template
-- ----------------------------
DROP TABLE IF EXISTS `Template`;
CREATE TABLE `Template`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('DRAFT','PUBLISHED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdBy` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of Template
-- ----------------------------
INSERT INTO `Template` VALUES ('cmi89a0yr0027cmmohef9ndfd', '默认模板', 1, 'PUBLISHED', 'system', '2025-11-21 02:43:25.923', '2025-11-21 07:53:19.723');
INSERT INTO `Template` VALUES ('cmi8g0266004y8iwf6p9eljmg', '测试模板1', 0, 'PUBLISHED', 'admin', '2025-11-21 05:51:38.238', '2025-11-21 07:53:19.723');

-- ----------------------------
-- Table structure for TemplateGroup
-- ----------------------------
DROP TABLE IF EXISTS `TemplateGroup`;
CREATE TABLE `TemplateGroup`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `templateId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `groupId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderIndex` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `TemplateGroup_templateId_fkey`(`templateId` ASC) USING BTREE,
  INDEX `TemplateGroup_groupId_fkey`(`groupId` ASC) USING BTREE,
  CONSTRAINT `TemplateGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `CategoryGroup` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `TemplateGroup_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `Template` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of TemplateGroup
-- ----------------------------
INSERT INTO `TemplateGroup` VALUES ('cmi89a0zs002dcmmoonufjoix', 'cmi89a0yr0027cmmohef9ndfd', 'cmi89a0l80000cmmoc250sopb', 0);
INSERT INTO `TemplateGroup` VALUES ('cmi89a121002tcmmoowyts5i1', 'cmi89a0yr0027cmmohef9ndfd', 'cmi89a0n5000fcmmof3h1g1jl', 1);
INSERT INTO `TemplateGroup` VALUES ('cmi89a13q0033cmmod7oxerhs', 'cmi89a0yr0027cmmohef9ndfd', 'cmi89a0oc000ocmmoygks9qyr', 3);
INSERT INTO `TemplateGroup` VALUES ('cmi89a15j003bcmmonyxxdyzo', 'cmi89a0yr0027cmmohef9ndfd', 'cmi89a0qu000vcmmohnxz7eg1', 2);
INSERT INTO `TemplateGroup` VALUES ('cmi89a167003hcmmo0gkip935', 'cmi89a0yr0027cmmohef9ndfd', 'cmi89a0rz0010cmmon28maksn', 4);
INSERT INTO `TemplateGroup` VALUES ('cmi8g0282005k8iwf48ywjpuo', 'cmi8g0266004y8iwf6p9eljmg', 'cmi89a0n5000fcmmof3h1g1jl', 1);
INSERT INTO `TemplateGroup` VALUES ('cmi8g029b00628iwfryxq4not', 'cmi8g0266004y8iwf6p9eljmg', 'cmi89a0qu000vcmmohnxz7eg1', 2);
INSERT INTO `TemplateGroup` VALUES ('cmi8g029s00688iwfa3y6s9k0', 'cmi8g0266004y8iwf6p9eljmg', 'cmi89a0rz0010cmmon28maksn', 3);
INSERT INTO `TemplateGroup` VALUES ('cmi8idk6600029fvpgy1o9wlo', 'cmi89a0yr0027cmmohef9ndfd', 'cmi8idk5w00009fvpbpj5crca', 0);
INSERT INTO `TemplateGroup` VALUES ('cmi8jtddr00099fvp4odcapyn', 'cmi8g0266004y8iwf6p9eljmg', 'cmi8jtddj00079fvpggw0skys', 0);

-- ----------------------------
-- Table structure for TemplateItem
-- ----------------------------
DROP TABLE IF EXISTS `TemplateItem`;
CREATE TABLE `TemplateItem`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `templateGroupId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderIndex` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `TemplateItem_templateGroupId_fkey`(`templateGroupId` ASC) USING BTREE,
  INDEX `TemplateItem_itemId_fkey`(`itemId` ASC) USING BTREE,
  CONSTRAINT `TemplateItem_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `CategoryItem` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `TemplateItem_templateGroupId_fkey` FOREIGN KEY (`templateGroupId`) REFERENCES `TemplateGroup` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of TemplateItem
-- ----------------------------
INSERT INTO `TemplateItem` VALUES ('cmi89a105002fcmmogx4fdk6u', 'cmi89a0zs002dcmmoonufjoix', 'cmi89a0lm0002cmmo6l24fwpr', 0);
INSERT INTO `TemplateItem` VALUES ('cmi89a10f002hcmmop449w3e3', 'cmi89a0zs002dcmmoonufjoix', 'cmi89a0lv0004cmmoge1st9kh', 2);
INSERT INTO `TemplateItem` VALUES ('cmi89a10p002jcmmok0edn4l2', 'cmi89a0zs002dcmmoonufjoix', 'cmi89a0m40006cmmow0kdhf2h', 1);
INSERT INTO `TemplateItem` VALUES ('cmi89a110002lcmmo3skst9l9', 'cmi89a0zs002dcmmoonufjoix', 'cmi89a0ma0008cmmoi45kpr71', 3);
INSERT INTO `TemplateItem` VALUES ('cmi89a11a002ncmmogwc7pv1x', 'cmi89a0zs002dcmmoonufjoix', 'cmi89a0mh000acmmoxdbrstn7', 4);
INSERT INTO `TemplateItem` VALUES ('cmi89a11j002pcmmokxopqb6g', 'cmi89a0zs002dcmmoonufjoix', 'cmi89a0mp000ccmmo1z12rxqc', 5);
INSERT INTO `TemplateItem` VALUES ('cmi89a11s002rcmmop5mcewb3', 'cmi89a0zs002dcmmoonufjoix', 'cmi89a0mw000ecmmof7ex4ovh', 6);
INSERT INTO `TemplateItem` VALUES ('cmi89a12b002vcmmouulzz17v', 'cmi89a121002tcmmoowyts5i1', 'cmi89a0nb000hcmmoyf0u5llr', 0);
INSERT INTO `TemplateItem` VALUES ('cmi89a12k002xcmmoihbbwv3e', 'cmi89a121002tcmmoowyts5i1', 'cmi89a0nk000jcmmocpnl0fb1', 2);
INSERT INTO `TemplateItem` VALUES ('cmi89a12x002zcmmoe37n22rj', 'cmi89a121002tcmmoowyts5i1', 'cmi89a0ns000lcmmog13k7gbd', 1);
INSERT INTO `TemplateItem` VALUES ('cmi89a13b0031cmmoeetlj9s1', 'cmi89a121002tcmmoowyts5i1', 'cmi89a0o4000ncmmorvduu4s8', 3);
INSERT INTO `TemplateItem` VALUES ('cmi89a1440035cmmoz2j2vugi', 'cmi89a13q0033cmmod7oxerhs', 'cmi89a0om000qcmmo7rkg7cgl', 0);
INSERT INTO `TemplateItem` VALUES ('cmi89a14i0037cmmotf54v7lf', 'cmi89a13q0033cmmod7oxerhs', 'cmi89a0p0000scmmoc6cmzamv', 1);
INSERT INTO `TemplateItem` VALUES ('cmi89a14y0039cmmo2gt2ml90', 'cmi89a13q0033cmmod7oxerhs', 'cmi89a0qc000ucmmo2h2r5vz6', 2);
INSERT INTO `TemplateItem` VALUES ('cmi89a15r003dcmmo6kmqetf8', 'cmi89a15j003bcmmonyxxdyzo', 'cmi89a0r9000xcmmocfaw4p7q', 0);
INSERT INTO `TemplateItem` VALUES ('cmi89a15z003fcmmojuxqd5gk', 'cmi89a15j003bcmmonyxxdyzo', 'cmi89a0rm000zcmmo9oo0u69c', 1);
INSERT INTO `TemplateItem` VALUES ('cmi89a16i003jcmmotzatu0d6', 'cmi89a167003hcmmo0gkip935', 'cmi89a0sa0012cmmolim00my4', 0);
INSERT INTO `TemplateItem` VALUES ('cmi89a16q003lcmmohlwcticj', 'cmi89a167003hcmmo0gkip935', 'cmi89a0sh0014cmmoi9d1iy2z', 1);
INSERT INTO `TemplateItem` VALUES ('cmi89a171003ncmmojr84f4ew', 'cmi89a167003hcmmo0gkip935', 'cmi89a0sp0016cmmo7ly5irlf', 2);
INSERT INTO `TemplateItem` VALUES ('cmi89a179003pcmmo4892ep9z', 'cmi89a167003hcmmo0gkip935', 'cmi89a0sz0018cmmotcvhlank', 3);
INSERT INTO `TemplateItem` VALUES ('cmi89a17i003rcmmouuogg9ff', 'cmi89a167003hcmmo0gkip935', 'cmi89a0t8001acmmog6199ujl', 4);
INSERT INTO `TemplateItem` VALUES ('cmi89a17w003tcmmoqyyrhbwo', 'cmi89a167003hcmmo0gkip935', 'cmi89a0ti001ccmmowrrmyfmb', 5);
INSERT INTO `TemplateItem` VALUES ('cmi89a18a003vcmmoqvoxv81z', 'cmi89a167003hcmmo0gkip935', 'cmi89a0tx001ecmmoi91uigi8', 6);
INSERT INTO `TemplateItem` VALUES ('cmi89a18l003xcmmov3tm60ic', 'cmi89a167003hcmmo0gkip935', 'cmi89a0u8001gcmmo5ec4qaj0', 7);
INSERT INTO `TemplateItem` VALUES ('cmi89a18u003zcmmoh83k98x7', 'cmi89a167003hcmmo0gkip935', 'cmi89a0ul001icmmoklyt7gm6', 8);
INSERT INTO `TemplateItem` VALUES ('cmi89a1900041cmmoed50zufh', 'cmi89a167003hcmmo0gkip935', 'cmi89a0uw001kcmmo6hje8htu', 9);
INSERT INTO `TemplateItem` VALUES ('cmi89a1990043cmmowwhh22wo', 'cmi89a167003hcmmo0gkip935', 'cmi89a0va001mcmmomxd7xoe3', 10);
INSERT INTO `TemplateItem` VALUES ('cmi89a19h0045cmmosfo5sxgj', 'cmi89a167003hcmmo0gkip935', 'cmi89a0vm001ocmmoag4fy7kz', 11);
INSERT INTO `TemplateItem` VALUES ('cmi89a19q0047cmmo0m5ga58k', 'cmi89a167003hcmmo0gkip935', 'cmi89a0vz001qcmmo3e0q3695', 12);
INSERT INTO `TemplateItem` VALUES ('cmi89a19x0049cmmo09geq3d5', 'cmi89a167003hcmmo0gkip935', 'cmi89a0wf001scmmo9nhs18lf', 13);
INSERT INTO `TemplateItem` VALUES ('cmi89a1a5004bcmmoqw2o6gri', 'cmi89a167003hcmmo0gkip935', 'cmi89a0ws001ucmmoa9q0oadx', 14);
INSERT INTO `TemplateItem` VALUES ('cmi89a1ad004dcmmok5hy9b1q', 'cmi89a167003hcmmo0gkip935', 'cmi89a0x2001wcmmoay9tll7l', 15);
INSERT INTO `TemplateItem` VALUES ('cmi89a1an004fcmmoslxnth04', 'cmi89a167003hcmmo0gkip935', 'cmi89a0xe001ycmmo0sdu3idw', 16);
INSERT INTO `TemplateItem` VALUES ('cmi89a1az004jcmmorrwh2hnr', 'cmi89a167003hcmmo0gkip935', 'cmi89a0xy0022cmmol3a8p0rj', 18);
INSERT INTO `TemplateItem` VALUES ('cmi89a1b7004lcmmo1tt21dfo', 'cmi89a167003hcmmo0gkip935', 'cmi89a0y80024cmmob43t3dsx', 19);
INSERT INTO `TemplateItem` VALUES ('cmi89a1bg004ncmmo972e2bw3', 'cmi89a167003hcmmo0gkip935', 'cmi89a0yh0026cmmo8o72f27q', 20);
INSERT INTO `TemplateItem` VALUES ('cmi8g0288005m8iwftclmsrmf', 'cmi8g0282005k8iwf48ywjpuo', 'cmi89a0nb000hcmmoyf0u5llr', 1);
INSERT INTO `TemplateItem` VALUES ('cmi8g028c005o8iwfp6dqp0vn', 'cmi8g0282005k8iwf48ywjpuo', 'cmi89a0nk000jcmmocpnl0fb1', 2);
INSERT INTO `TemplateItem` VALUES ('cmi8g028i005q8iwfmwg92dni', 'cmi8g0282005k8iwf48ywjpuo', 'cmi89a0ns000lcmmog13k7gbd', 0);
INSERT INTO `TemplateItem` VALUES ('cmi8g028n005s8iwf85mt7m5o', 'cmi8g0282005k8iwf48ywjpuo', 'cmi89a0o4000ncmmorvduu4s8', 3);
INSERT INTO `TemplateItem` VALUES ('cmi8g029h00648iwfqxbi7icu', 'cmi8g029b00628iwfryxq4not', 'cmi89a0r9000xcmmocfaw4p7q', 0);
INSERT INTO `TemplateItem` VALUES ('cmi8g029m00668iwfcwht45pu', 'cmi8g029b00628iwfryxq4not', 'cmi89a0rm000zcmmo9oo0u69c', 1);
INSERT INTO `TemplateItem` VALUES ('cmi8g029x006a8iwfxpxwgwh1', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0sa0012cmmolim00my4', 0);
INSERT INTO `TemplateItem` VALUES ('cmi8g02a5006c8iwf5dbshw73', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0sh0014cmmoi9d1iy2z', 1);
INSERT INTO `TemplateItem` VALUES ('cmi8g02aa006e8iwfc9z6za4j', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0sp0016cmmo7ly5irlf', 2);
INSERT INTO `TemplateItem` VALUES ('cmi8g02ag006g8iwfmvm7yuio', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0sz0018cmmotcvhlank', 3);
INSERT INTO `TemplateItem` VALUES ('cmi8g02al006i8iwf4w7kzyjb', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0t8001acmmog6199ujl', 4);
INSERT INTO `TemplateItem` VALUES ('cmi8g02as006k8iwf2u4yrudq', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0ti001ccmmowrrmyfmb', 5);
INSERT INTO `TemplateItem` VALUES ('cmi8g02ax006m8iwffv55kqdo', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0tx001ecmmoi91uigi8', 6);
INSERT INTO `TemplateItem` VALUES ('cmi8g02b2006o8iwfkwxjubug', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0u8001gcmmo5ec4qaj0', 7);
INSERT INTO `TemplateItem` VALUES ('cmi8g02b8006q8iwfbo8rdo9d', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0ul001icmmoklyt7gm6', 8);
INSERT INTO `TemplateItem` VALUES ('cmi8g02be006s8iwfx5to8abm', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0uw001kcmmo6hje8htu', 9);
INSERT INTO `TemplateItem` VALUES ('cmi8g02bj006u8iwf8aidrowy', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0va001mcmmomxd7xoe3', 10);
INSERT INTO `TemplateItem` VALUES ('cmi8g02bp006w8iwfj5adi3yq', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0vm001ocmmoag4fy7kz', 11);
INSERT INTO `TemplateItem` VALUES ('cmi8g02bu006y8iwf0lgfl4ld', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0vz001qcmmo3e0q3695', 12);
INSERT INTO `TemplateItem` VALUES ('cmi8g02c000708iwfhiep594v', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0wf001scmmo9nhs18lf', 13);
INSERT INTO `TemplateItem` VALUES ('cmi8g02c600728iwfe8cyfqqe', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0ws001ucmmoa9q0oadx', 14);
INSERT INTO `TemplateItem` VALUES ('cmi8g02cc00748iwf564d0lhr', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0x2001wcmmoay9tll7l', 15);
INSERT INTO `TemplateItem` VALUES ('cmi8g02ch00768iwfp2afrfcy', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0xe001ycmmo0sdu3idw', 16);
INSERT INTO `TemplateItem` VALUES ('cmi8g02cm00788iwfw9i5c860', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0xo0020cmmo1dbqwvut', 17);
INSERT INTO `TemplateItem` VALUES ('cmi8g02ct007a8iwfcs6464mp', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0xy0022cmmol3a8p0rj', 18);
INSERT INTO `TemplateItem` VALUES ('cmi8g02d0007c8iwfahqlkvjn', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0y80024cmmob43t3dsx', 19);
INSERT INTO `TemplateItem` VALUES ('cmi8g02d6007e8iwf1s4daaju', 'cmi8g029s00688iwfa3y6s9k0', 'cmi89a0yh0026cmmo8o72f27q', 20);
INSERT INTO `TemplateItem` VALUES ('cmi8jtsb8000d9fvp76dhd6xo', 'cmi8jtddr00099fvp4odcapyn', 'cmi8jtsay000b9fvp6m67uo7g', 0);

-- ----------------------------
-- Table structure for User
-- ----------------------------
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User`  (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','STAFF','USER') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `avatarUrl` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `nickName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `wechatOpenId` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `User_username_key`(`username` ASC) USING BTREE,
  UNIQUE INDEX `User_wechatOpenId_key`(`wechatOpenId` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of User
-- ----------------------------
INSERT INTO `User` VALUES ('cmi88ayeu000013pa9cmejjtc', 'admin', '$argon2id$v=19$m=65536,t=3,p=4$CPKcmnLbQCTBjCdvbTQSjw$adUqnD8yU0AnMt28sol/XEMNAM1V9iO5kIWzzvHrB+Y', 'ADMIN', 'ACTIVE', '2025-11-21 02:16:09.654', '2025-11-21 02:16:09.654', NULL, NULL, NULL);
INSERT INTO `User` VALUES ('cmi8ash8x0000lfkfi95zulxt', 'dev_user', '$argon2id$v=19$m=65536,t=3,p=4$+MtUOgcfOwM+KumZ9cwnpg$IZCup8pGm5t9vqzODLY390L2B3P6F3NQ7Zi1RQV2Tl0', 'USER', 'ACTIVE', '2025-11-21 03:25:46.450', '2025-11-21 03:25:46.450', NULL, NULL, NULL);

-- ----------------------------
-- Table structure for _prisma_migrations
-- ----------------------------
DROP TABLE IF EXISTS `_prisma_migrations`;
CREATE TABLE `_prisma_migrations`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) NULL DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `rolled_back_at` datetime(3) NULL DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of _prisma_migrations
-- ----------------------------
INSERT INTO `_prisma_migrations` VALUES ('7edcd1cb-af64-4fcd-bd14-c585f8ccb617', '41ea68f88159f8237d443f221b36ed45fea44a61cf849b63636a931eba5a9948', '2025-11-21 02:01:32.462', '20251121020132_', NULL, NULL, '2025-11-21 02:01:32.060', 1);

SET FOREIGN_KEY_CHECKS = 1;
