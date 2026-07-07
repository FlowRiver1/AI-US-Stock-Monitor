# 飞书妙搭部署指南

## 前置条件

1. 已安装 lark-cli：`npm install -g @anthropic/lark-cli`
2. 已登录飞书账号：`lark-cli auth login --as user`

## 部署静态 HTML 站点

### 1. 确认文件大小合规

```bash
# 单个 .html ≤ 10MB, tar.gz ≤ 20MB, 未压缩总量 ≤ 200MB
wc -c public/index.html
```

### 2. 创建妙搭应用

```bash
lark-cli apps +create --name "项目名称" --app-type html --as user
# 记录返回的 app_id: app_xxx
```

### 3. 发布静态文件

```bash
cd <项目根目录>
lark-cli apps +html-publish --app-id app_xxx --path ./public --as user
# 返回 data.url 即发布态链接
```

### 4. 设置公开访问（免登陆）

```bash
lark-cli apps +access-scope-set --app-id app_xxx --scope public --require-login=false --as user
```

### 5. 更新已部署应用

```bash
# 修改前端后重新发布即可，复用同一个 app_id
cd <项目根目录>
lark-cli apps +html-publish --app-id app_xxx --path ./public --as user
```

## 关键链接

| 类型 | 格式 | 说明 |
|------|------|------|
| 发布态 | `https://{subdomain}.aiforce.cloud/app/app_xxx` | 分享给用户的链接 |
| 管理态 | `https://miaoda.feishu.cn/app/app_xxx` | 进入妙搭编辑/开发 |

## 常见问题

- **`--path must be relative`**：先 cd 到项目根目录，使用相对路径 `./public`
- **`--require-login is required`**：公开访问必须显式 `--require-login=false`
- **权限不足**：检查 `lark-cli auth status` 确认已登录

## AI US Stock Monitor 部署记录

- App ID: `app_179njw8pczs`
- 发布态: https://vwxx9iaco8c.aiforce.cloud/app/app_179njw8pczs
- 管理态: https://miaoda.feishu.cn/app/app_179njw8pczs
- 部署时间: 2026-07-07
