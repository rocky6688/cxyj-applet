# Git提交步骤

由于网络连接限制，无法直接推送到GitHub，请按照以下步骤手动提交：

## 方法1：使用GitHub Desktop
1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 登录你的GitHub账号
3. 添加本地仓库（选择F:\code目录）
4. 提交更改并推送到远程仓库

## 方法2：使用命令行（需要配置认证）

### 1. 配置Git用户信息
```bash
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"
```

### 2. 使用个人访问令牌
1. 访问 https://github.com/settings/tokens
2. 创建新的个人访问令牌（勾选repo权限）
3. 使用令牌代替密码进行推送

### 3. 推送代码
```bash
# 如果推送失败，尝试使用令牌
git push https://你的令牌@github.com/rocky6688/cxyj-applet.git master
```

## 方法3：手动上传
1. 访问 https://github.com/rocky6688/cxyj-applet
2. 点击 "Upload files" 按钮
3. 拖拽整个项目文件夹到上传区域
4. 提交更改

## 当前项目状态
✅ 代码已提交到本地Git仓库
✅ 远程仓库地址已配置
✅ 所有文件已准备好推送

## 项目文件清单
- app.js, app.json, app.wxss - 小程序入口和全局配置
- pages/ - 页面文件（首页和报价页）
- utils/ - 工具函数（数据和计算）
- project.config.json - 项目配置
- README.md - 项目说明文档

提交信息："feat: 完成微信小程序装修报价系统"

如有问题，请检查网络连接或GitHub权限设置。