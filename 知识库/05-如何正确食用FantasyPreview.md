# 如何正确食用FantasyPreview

## FantasyPreview是什么？

- 一个关爱小众业务线的预览工具

- 一个不改变你原有开发习惯的生产提效工具

- 一个可以模拟客户端/服务端行为的模拟器

基于Effect开发平台

[FantasyPreview Release Note](https://bytedance.feishu.cn/docs/doccnGzRNp82F3ezNlzzKn2pWqf)

## 如何调用接口完成渲染的？

### 普通道具

### MV&一键大片

### MIMO道具

## 渲染之外，还做了些什么？

### 日志

日志是子线程处理，所以需要保证日志回调的线程安全

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902141957266.png)

### 客户端消息😈

客户端消息是主线程同步处理的，所以不需要考虑客户端消息的线程安全

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902141958709.png)

## 如何使用Fantasy进行高效的开发？

### 客户端模拟

[附件：ClientMsgDemo.zip](https://bytedance.larkoffice.com/file/IsQkbUCadoUEs5xxH7ecQiU7nYe)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902141956491.png)

### 一键预览

[vscode 一键预览插件](https://bytedance.feishu.cn/wiki/wikcnIjB4U6OnC92ggogoXQ7Eae)

打开FantasyPreview，使用一键预览插件的a Preview in Fantasy功能，FantasyPreview会加载对应道具

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902141959572.png)

### 一键debug

打开FantasyPreview，使用一键预览插件的a Debug Lua Use Fantasy As Client功能，然后按F5运行调试服务器，等待道具连接

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902141954095.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902141954930.png)
