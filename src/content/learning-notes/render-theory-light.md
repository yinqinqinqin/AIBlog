---
title: 渲染理论 - Light
category: learning-notes
date: 2026-08-27
readTime: 1 min read
excerpt: 渲染理论 学习记录，整理 光源基础、光源类型、直接光 & 间接光 & GI 等内容。
tags: [渲染理论]
cover: ""
---

[Toc]

# 光源基础

```
Light Color
Intensity
Color Temperature
Attenuation Radius
Inverse Square Falloff 平方反比衰减
光源单位：Lumens / Candelas / Lux
```



# 光源类型

```
Directional Light
Point Light
Spot Light
Rect Light
Sky Light
```

# 直接光 & 间接光 & GI

```
Lighting
├─ Direct Lighting
│
├─ Indirect Diffuse
│
├─ Indirect Specular
│
└─ Global Illumination
```



# Static / Stationary / Movable

|                 | Static         | Stationary | Movable            |
| --------------- | -------------- | ---------- | ------------------ |
| 移动光源        | ❌              | ❌          | ✅                  |
| 动态改颜色/强度 | ❌              | ✅          | ✅                  |
| 预计算光照      | ✅              | ✅          | ❌                  |
| 动态物体光照    | 有限制         | ✅          | ✅                  |
| 动态阴影        | ❌/以预计算为主 | ✅          | ✅                  |
| 运行时成本      | 最低           | 中等       | 最高               |
| 典型用途        | 固定场景       | 固定灯具   | 太阳、手电、移动灯 |

Epic 当前文档明确指出，在启用 Lumen 的场景中，传统预计算静态光照并不是主要工作方式；如果要使用 baked lighting，需要关闭 Lumen GI。

> **Static 是完全预计算光源，运行时基本不能变化，性能最低；Stationary 是预计算和动态光照的混合方案，位置固定但颜色和强度等属性可以修改，并且可以给动态物体提供动态光照；Movable 是完全动态光源，位置、颜色、强度等都能实时变化，自由度最高但通常成本也最高。UE5 使用 Lumen 的动态光照项目中，Movable Light 会更加常见。**
# 总结分析

- 这篇主要记录 `Light` 相关内容，核心集中在 光源基础、光源类型、直接光 & 间接光 & GI。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
