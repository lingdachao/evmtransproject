// app.js

// 引入Express框架
const express = require('express');

// 创建Express应用
const app = express();

// 配置静态属性，例如存放在 public 文件夹中的静态文件
app.use(express.static('public'));

// 设置其他应用程序路由和中间件
// ...

// 启动服务器
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
