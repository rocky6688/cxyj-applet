## 项目结构

* `apps/api`：NestJS 服务（Auth、Users、Categories、Templates、Compute、Health）

* `prisma/`：`schema.prisma`、迁移与种子数据

* `docker/`：`docker-compose.yml`（`mysql`、`redis`、`api`）

* `config/`：环境变量加载（分 `dev`/`prod`）

* `docs/`：接口说明（自动生成 Swagger）

## 技术选型与依赖

* 框架：`NestJS + TypeScript`

* ORM：`Prisma`

* 数据库：`MySQL`（可选 PostgreSQL）

* 缓存与限流：`Redis`

* 鉴权：`JWT (access + refresh)`、`Passport`

* 校验：`class-validator` + `class-transformer`

* 日志：`pino` 或 `winston`

* 文档：`@nestjs/swagger`

## 环境与部署（Windows 友好）

* 使用 Docker Desktop；`docker compose up -d`

* 容器：`api`、`mysql`、`redis`

* 环境变量：`DATABASE_URL`、`JWT_SECRET`、`REDIS_URL`、`NODE_ENV`

* 健康检查：`GET /health`；容器重启策略与探针

## 数据模型与 Prisma Schema（简化）

* `User(id, username, passwordHash, role[ADMIN/STAFF], status, createdAt, updatedAt)`

* `CategoryGroup(id, name, slug, description?, orderIndex, isActive, createdBy, createdAt, updatedAt)`

* `CategoryItem(id, groupId(FK), name, slug, description?, orderIndex, isActive, createdBy, createdAt, updatedAt)`

* `Template(id, name, isDefault, status[DRAFT/PUBLISHED], createdBy, createdAt, updatedAt)`

* `TemplateGroup(id, templateId(FK), groupId(FK), orderIndex)`

* `TemplateItem(id, templateGroupId(FK), itemId(FK), orderIndex)`

* 可选：`AuditLog(id, actorId, action, resourceType, resourceId, payload, createdAt)`、软删除 `deletedAt`

## 鉴权与 RBAC

* `AuthModule`：登录、刷新、登出；`JwtStrategy`；`AuthService`

* `RolesGuard`：基于 `role` 控制接口访问；装饰器 `@Roles('ADMIN')`

* 密码：Argon2 或 bcrypt；账户锁定与复杂度策略

* Token：`access`（短期）、`refresh`（长期）黑名单（Redis）

## 模块划分与接口

* `UsersModule`：管理员创建员工、查询当前用户 `GET /me`

* `CategoriesModule`：

  * 大类：`GET/POST/PUT/DELETE /category-groups`、`POST /category-groups/reorder`

  * 子类：`GET/POST/PUT/DELETE /category-items`、`POST /category-items/reorder`

* `TemplatesModule`：

  * `GET /templates`、`POST /templates`（从当前配置生成）

  * `PUT /templates/:id`、`POST /templates/:id/publish`

  * `POST /templates/:id/set-default`、`GET /templates/default`

* `ComputeModule`：`GET /compute/config`（员工拉取默认模板或指定模板）

* `HealthModule`：`GET /health`

## 拖拽排序实现

* 排序字段：`orderIndex`（同层级唯一）

* 前端拖拽后提交批量更新：`[{id, orderIndex}]`

* 服务端校验：同层级唯一性、事务更新、返回新序列

## 模板快照实现

* 从当前数据库配置生成模板快照：复制 `Group`/`Item` 与 `orderIndex`

* `publish`：设置状态与生效范围；`set-default` 保证唯一默认模板（事务）

* 支持预览未发布模板：管理员接口返回草稿模板结构

## 审计与安全

* 审计：管理员的增删改查写入 `AuditLog`

* 限流：登录与管理接口 `Redis` 基于 IP/账户限流

* 输入校验：DTO 全量校验；统一错误码与异常过滤器

* CORS：按小程序合法域名配置；避免敏感信息泄露

## 缓存与性能

* 读取默认模板与分类列表缓存（Redis），失效策略：写操作后清缓存

* 分页与索引：为 `slug`、`orderIndex`、外键建立索引

* 幂等：批量排序、模板设默认采用幂等请求

## 小程序对接

* 域名与 HTTPS（或内网穿透）作为合法请求域名

* 响应格式统一：`{code, message, data}`；错误码映射

* 登录态：小程序存储 `access_token`；过期后用 `refresh_token` 刷新

## 迁移与种子数据

* `prisma migrate dev/deploy` 管理版本

* `seed`：

  * 创建首个管理员账号

  * 从“现有计算页结构”生成初始默认模板（通过导入 JSON 或接口抓取）

## 测试与验证

* 单元测试：Service 与 Guard 测试

* 集成测试：Auth、Categories、Templates 关键路径

* Swagger：自动文档与 Mock，便于联调

* 本地验证：`docker compose up` 后，用 Postman/curl 验证登录、模板读取、排序

## 交付物

* 可运行的 NestJS 项目骨架与 Docker 编排

* Prisma 数据模型与迁移、种子脚本

* 基本接口实现与 Swagger 文档

* Windows 端本地启动说明与环境变量模板

## 下一步

* 我将按该计划创建项目骨架（不改动你现有小程序代码），落地各模块与接口，并提供 `docker-compose.yml`、`schema.prisma`、基础种子与 Swagger 文档。你确认后我即可开始实现。🎯

