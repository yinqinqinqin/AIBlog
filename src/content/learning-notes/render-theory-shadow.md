---
title: 渲染理论 - Shadow
category: learning-notes
date: 2026-08-27
readTime: 1 min read
excerpt: 渲染理论 学习记录，整理 Shadow Map、PCF & PCSS、CSM & VSM 等内容。
tags: [渲染理论]
cover: ""
---

[Toc]

# Shadow Map

先从光源视角生成一张深度图，再从相机视角比较当前像素深度和 Shadow Map 中记录的深度，判断是否被遮挡。

Shadow Map 最大的问题：

```
有限分辨率
↓
一个 Texel 覆盖一定空间
↓
阴影出现锯齿
```

因此后面：

> PCF、PCSS、CSM、Bias 等技术，本质上很多都是在解决 Shadow Map 的问题。

# PCF & PCSS

PCF：

> **对 Shadow Map 周围多个位置进行深度比较，然后求平均。**

PCF 不只采一个点，而是采周围多个点：

```
亮 亮 亮
亮 黑 黑
黑 黑 黑
```

然后取平均。

PCSS：

PCSS = 可以根据遮挡物和地面的距离改变阴影软硬。

距离越远越柔



PCF 主要解决 Shadow Map 锯齿，而 PCSS 在 PCF 基础上根据遮挡物与接收面的距离估算半影，实现接触处硬、远处软的阴影。	

# CSM & VSM 

# CSM

# **Cascaded Shadow Maps**

主要给太阳这种 Directional Light 用。

CSM = 把相机前方按距离切成几段，每段使用不同 Shadow Map。

# VSM

做一张超级高精度 Shadow Map，但是只加载当前真正需要的区域。

主要适合：

```
UE5
Nanite
高精度场景
```

# Contact Shadow

这个非常简单。

Shadow Map 有时候看不到特别小的阴影。

例如人物脚，所以补一层很近距离的小阴影：

Contact Shadow = 专门补物体接触位置的小阴影。

# Shadow Acne & Bias

# Shadow Acne

Shadow Map 做深度比较的时候会有精度误差。

自己把自己判断成阴影了导致Shadow Acne，自阴影错误。

# Bais

Bias = 给 Shadow Map 深度比较增加一点偏移，防止自阴影错误。

# Ray Traced Shadow 

Ray Traced Shadow = 直接发射光线检查光源和像素之间有没有障碍物。
# 总结分析

- 这篇主要记录 `Shadow` 相关内容，核心集中在 Shadow Map、PCF & PCSS、CSM & VSM。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
