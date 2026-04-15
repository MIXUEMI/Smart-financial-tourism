# AI配置说明

## 问题诊断

您遇到的"调用AI用哪里？是不是不太对"问题是因为：

1. **缺少API密钥配置** - 项目没有配置有效的DeepSeek API密钥
2. **硬编码的无效密钥** - 配置文件中有一个硬编码的API密钥，可能无效
3. **缺少环境变量文件** - 没有 `.env` 文件来管理敏感配置

## 解决方案

### 方法1：配置真实的DeepSeek API密钥

1. 访问 [DeepSeek平台](https://platform.deepseek.com/)
2. 注册账号并获取API密钥
3. 在项目根目录创建 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# DeepSeek API 配置
DEEPSEEK_API_KEY=your_real_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 其他API配置（可选）
WEATHER_API_KEY=
MAP_API_KEY=

# CORS配置
CORS_ORIGIN=*
```

### 方法2：使用模拟AI响应（当前状态）

项目已经配置了模拟AI响应功能，当没有配置API密钥时，会自动使用模拟响应：

- ✅ 理财相关问题 → 提供理财产品建议
- ✅ 旅游相关问题 → 提供旅游建议
- ✅ 天气相关问题 → 提供天气建议
- ✅ 贷款相关问题 → 提供银行服务建议
- ✅ 其他问题 → 提供通用帮助

## 当前状态

项目已经修复了以下问题：

1. ✅ 移除了硬编码的无效API密钥
2. ✅ 添加了API密钥检查机制
3. ✅ 实现了模拟AI响应功能
4. ✅ 添加了错误处理和降级机制

## 测试AI功能

1. 启动服务器：`npm start`
2. 访问：`http://localhost:3000/main`
3. 点击右下角的AI助手按钮
4. 输入问题测试AI功能

即使没有配置真实的API密钥，AI功能也能正常工作（使用模拟响应）。


