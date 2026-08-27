---
title: PivotPoint
category: portfolio
date: 2026-08-27
readTime: 2 min read
excerpt: Pivot Point 与 Pivot Painter 的使用记录，主要整理 Houdini 写入枢轴信息和 UE 中通过 UV 还原位置控制 WPO 的流程。
tags: [PivotPoint, WPO]
cover: ""
---

# Pivot Point用途

**Pivot Point** 是物体进行 **旋转、缩放和位置变换时的参考中心点**。

在 UE 中，Pivot Point 常用于：

- 控制模型旋转 / 缩放中心
- 作为 WPO 动画的局部参考点
- 植物、机械等分层动画
- 配合 **Pivot Painter** 将多个物体的 Pivot 信息存入纹理，用 Shader 在 GPU 上实现大规模动画

我们可以使用Blender，Houdini制作枢纽点图形的UV，

Houdini中有对应UE所使用的节点Unreal\_PivotPaint,只需要对每个点写入pieceID，和两个UV即可

Blender中，需要使用两套UV确定枢纽点，分别得到枢纽点的x，y值和z值，或者交给codex帮助实现模型处理，

# Houdini中处理

![image-20260824143732690](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824143735394.png)

关键在attribwrangle节点中，给每个点增加一个pieceID值，告诉UV每个点代表

```
// Primitives 模式下运行
s@name = sprintf("piece%d", @primnum);
v@up = set(0, 1, 0); // 全局Y轴向上，所有盒子不会歪扭
```

![image-20260824143605727](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824143606345.png)

# UE中处理

![image-20260824144946268](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824144946369.png)

![image-20260824145043180](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824145043298.png)

主要是通过UE自带的这个节点得到每个模型的位置

![image-20260824145133258](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824145133384.png)

打开后可以看到这里也是通过处理两套UV得到具体的世界空间坐标

- 获取 Pivot Position
- 转换 Pivot 坐标空间
- 计算 Pivot 与 TargetPos 的距离
- 用 Radius 控制影响范围
- 用 Hardness 控制衰减
- 反转得到中心强、外围弱的 Mask
- 将 Mask 乘位移量，控制 WPO 效果

# 总结分析

- `s@name = sprintf("piece%d", @primnum);` 是给每个 primitive 写一个唯一名字，后面 Pivot Painter 可以按 piece 区分不同的小物体。
- `v@up = set(0, 1, 0);` 是指定统一的向上方向，避免生成 pivot 信息时每个物体的朝向混乱。
- Houdini 这一步主要负责把每个物体的 pivot 数据准备好，再通过 UV 或贴图传给 UE。
- UE 里拿到 Pivot Position 后，可以算当前点和目标点之间的距离，再用 `Radius` 和 `Hardness` 做影响范围。
- 最后把这个 Mask 乘到 WPO 上，就可以实现以每个物体自身 Pivot 为中心的位移、旋转或缩放效果。
