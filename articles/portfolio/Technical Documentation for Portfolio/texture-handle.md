---
title: TextureHandle
category: portfolio
date: 2026-08-27
readTime: 2 min read
excerpt: 贴图处理相关记录，包含三平面映射、Voronoi 纹理轰炸和 Flipbook 水波纹动画的实现思路。
tags: [贴图处理, 三平面映射]
cover: ""
---

# 三平面平面映射

![image-20260824163631448](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824163631689.png)

- `WorldPosition.GB` → 取得 **YZ 平面 UV**
-  `WorldPosition.RB` → 取得 **XZ 平面 UV**
-  `Normal.G` → `CheapContrast → Saturate`，得到接近 `0/1` 的选择 Mask
-  第一个 `Lerp` → 在 **YZ / XZ** 两套 UV 中选择

然后：

- `WorldPosition.RG` → 取得 **XY 平面 UV**
-  `Normal.B` → `CheapContrast → Saturate`，得到第二个选择 Mask
-  第二个 `Lerp` → 在前面的结果和 **XY UV** 之间选择

# vonoroi轰炸

![image-20260824164342353](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824164342513.png)

![image-20260824164114887](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824164115247.png)

避免重复纹理的方法，使用vonoroi纹理，对各个区域进行不同大小的偏移，再通过lerp原来的贴图，减少差异化

# Puddles（贴图动画）

![image-20260824164513353](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824164513438.png)

![image-20260824165759107](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824165759219.png)

- 使用 WorldPosition XY 生成世界空间 UV
- RippleScale 控制波纹平铺大小
- Frac 实现 UV 循环
- 使用 8×8 Flipbook 保存 64 帧波纹动画
- Time × Speed 控制序列帧播放
- 最终得到世界空间连续的动态水面波纹

这里的贴图是将一套动画序列帧按照顺序放在一张图片中进行采样，通过FlipBook节点对这张贴图进行动画处理

# 总结分析

- 三平面映射主要是为了解决普通 UV 在复杂地形或大模型上拉伸明显的问题。
- `WorldPosition.GB`、`WorldPosition.RB`、`WorldPosition.RG` 分别对应三个方向的投影面。
- 通过法线方向做 Mask，可以让朝向不同的表面选择更合适的投影结果。
- Voronoi 轰炸的作用是打散重复纹理，让同一张贴图在大面积铺开时不那么容易看出重复。
- Puddles 的水波纹用 Flipbook 做序列帧播放，再配合 `Time * Speed` 和 `Frac` 实现循环动画。
