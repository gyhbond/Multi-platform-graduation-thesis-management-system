# 论文管理系统

## 项目简介

论文管理系统是一个用于高校的在线平台，帮助学生和教师管理选题和论文提交过程。系统支持用户注册、课题管理、选题审核和论文提交等功能。

## 功能特性

- **用户管理**：支持学生、教师和管理员角色，提供不同的权限和功能。
- **课题管理**：教师可以创建和管理课题，学生可以查看和选择课题。
- **选题审核**：教师可以审核学生的选题申请，并提供反馈。
- **论文提交**：学生可以上传论文文件，教师可以查看和评分。

## 技术栈

- **后端**：
  - Node.js
  - Express
  - Sequelize ORM
- **数据库**：
  - MySQL
- **中间件**：
  - JWT（JSON Web Token）用于身份验证
  - Multer 用于文件上传
- **前端**：
  - 假设使用 Vue.js（未提供前端代码）

## 环境配置

1. 克隆项目到本地：

   ```bash
   git clone https://github.com/yourusername/thesis-management-system.git
   cd thesis-management-system
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 配置环境变量：

   在项目根目录下创建一个 `.env` 文件，并添加以下内容：

   ```plaintext
   DB_NAME=thesis_system
   DB_USER=root
   DB_PASSWORD=your_password
   DB_HOST=localhost
   JWT_SECRET=your_jwt_secret_key
   ```

## 启动项目

1. 初始化数据库：

   ```bash
   node backend/config/database.js
   ```

2. 启动服务器：

   ```bash
   npm start
   ```

   服务器将运行在 `http://localhost:3000`。

## API 端点

### 用户认证

- **POST /login**: 用户登录
- **POST /register**: 用户注册

### 学生功能

- **GET /topics/available**: 获取可选课题列表
- **POST /topics/select**: 选择课题
- **GET /topics/my-selection**: 获取学生的选题信息
- **POST /submit**: 提交论文

### 教师功能

- **GET /topics**: 获取教师的课题列表
- **POST /topics**: 创建新课题
- **PUT /topics/:id/status**: 更新课题状态
- **GET /topics/:id**: 获取单个课题详情
- **PUT /topics/:topicId/selections/:studentId**: 审核学生选题

## 贡献

欢迎提交问题和请求合并。请确保在提交请求之前更新测试。
