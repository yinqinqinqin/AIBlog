---
title: 渲染理论 - RenderLine
category: learning-notes
date: 2026-08-27
readTime: 3 min read
excerpt: 渲染理论 学习记录，整理 图形流水线、核心流程、应用阶段 等内容。
tags: [渲染理论]
cover: ""
---

[Toc]

# 图形流水线

# 核心流程

CPU → 顶点处理 → 图元组装 → 光栅化 → Early-Z → 像素着色 → 深度/模板/混合 → Render Target

## 应用阶段

CPU准备好：

1. 模型
2. 材质
3. 位置
4. 纹理
5. 参数

通过drawcall告诉GPU

## 顶点处理

对模型的每个顶点进行处理

MVP变换

```
模型空间
↓
世界空间
↓
观察空间
↓
裁剪空间
```

UE 的 **WPO** 也主要发生在这里。

## 图元组装

根据 Index Buffer，把顶点组合成三角形。

三角形在同一个面上，更好计算

## 光栅化

把三角形转换成屏幕上的像素。

## 深度测试 / Early-Z

判断这个像素有没有被其他物体挡住。

## 像素着色

对剩下的像素进行真正的材质计算。

## 深度/模板/混合

Pixel Shader 算完后，还会进行最终判断。

### Depth Test

判断前后遮挡。

### Stencil Test

根据 Stencil 值决定这个像素要不要绘制。

## 输出到屏幕

最后结果写入 Render Target。

```
SceneColor
Depth Buffer
GBuffer
```

# 前向渲染管线

```
场景准备 / 剔除
↓
阴影 Pass
↓
Depth Prepass（可选）
↓
Opaque Forward Pass
↓
Sky / Atmosphere
↓
Translucency Pass
↓
Post Process
↓
UI
↓
最终画面
```



# 延迟渲染管线

```
场景准备 / 剔除
↓
Shadow Pass
↓
Depth Prepass（可选）
↓
Base Pass
↓
写入 GBuffer
↓
Lighting Pass
↓
Translucency Pass
↓
Post Process
↓
UI
↓
最终画面
```



# ColorRT & DepthRT & OtherRT

> **ColorRT 保存颜色或材质属性，DepthRT 保存深度，其他 RT 则可以保存法线、速度、ID、阴影等中间数据。**

# DrawCall & OverDraw

## DrawCall

Draw Call 是 CPU 向 GPU 提交的一次绘制命令，告诉 GPU 使用哪套 Mesh、材质、Shader 和渲染状态去绘制一批几何体。

Draw Call 过多主要会增加 CPU 提交和状态切换开销，通常可以通过 Instancing、Batch、减少材质 Slot 和 HLOD 等方式优化。

## OverDraw

Overdraw 是同一个屏幕像素在一帧中被重复绘制多次的现象，前面的结果最后可能被后面的物体覆盖，因此产生了额外的像素着色和带宽开销。

优化核心方法：

- 减少半透明层数
- 减少大面积透明粒子
- 缩小 Particle Quad
- 能 Masked 就考虑不用 Translucent
- 降低粒子数量
- 使用 LOD
- 避免大量全屏透明效果
- 优化 Shader 复杂度
- 利用 Depth / Early-Z
- 对植被合理使用 Masked

# Gbuffer & MRT

GBuffer 是数据，MRT 是一次写多个 RT 的技术。

# Early-Z & Z- Prepass & AlphaTest & Stencil Test

这四个知识点可以放在一起理解，核心都围绕：

> **在执行昂贵的 Pixel Shader 之前，尽可能判断这个 Fragment 有没有必要继续计算。**

## Early-Z

Early-Z 是 GPU 的一种硬件优化，会尽可能在 Pixel Shader 执行之前进行深度测试。如果 Fragment 已经被前面的物体遮挡，就可以直接丢弃，从而减少无效的 Pixel Shader 计算。

## Z-Prepass

Z-Prepass，也叫 Depth Prepass，是正式 Base Pass 之前额外执行一次只写 Depth 的 Geometry Pass，提前生成 Depth Buffer，让后面的 Base Pass 更容易利用 Early-Z 剔除被遮挡像素。

## Alpha Test

Alpha Test 在 UE 里面基本对应：

> **Masked Material**

## Stencil Test

Stencil Test 是基于 Stencil Buffer 中的整数值，对 Fragment 进行条件判断，从而决定这个 Fragment 是否允许继续绘制。

# Forward+ & Deferred+ & Clustered Lighting

这三个技术的核心都在解决同一个问题：

> **场景灯光很多时，不要让每个像素遍历所有灯光，而是先筛选“哪些灯会影响这个区域”。**

## Forward+

Forward+ 是对传统前向渲染的优化。它会先把屏幕划分成多个 Tile，并根据灯光在屏幕上的影响范围，为每个 Tile 建立 Light List。之后 Forward Pass 在计算光照时，只遍历当前 Tile 中的灯光，而不是遍历场景所有灯光。

Forward+ 只是优化了：

> **灯光筛选。**

## Deferred+

> Deferred+ 通常指基于 Tile 的延迟光照。Base Pass 仍然先生成 GBuffer，然后把屏幕划分成 Tile，为每个 Tile 筛选影响它的灯光，Lighting Pass 只计算对应 Tile 的 Light List，从而减少大量无关灯光计算。

区别：

> **Forward+ 是在 Forward Pass 中使用筛好的灯。**

> **Deferred+ 是在 Deferred Lighting Pass 中使用筛好的灯。**

## Clustered Lighting

Clustered Lighting 流程

```
Camera Frustum
↓
X/Y 划分 Tile
↓
Z 方向继续切片
↓
形成 3D Cluster
↓
Light 和 Cluster 求交
↓
每个 Cluster 建立 Light List
↓
Pixel 找到自己所在 Cluster
↓
只计算该 Cluster 的灯
```



# Lighting Pass & Shadow Pass & Postprocess Pass

| Pass             | 输入                     | 输出        | 作用         |
| ---------------- | ------------------------ | ----------- | ------------ |
| Shadow Pass      | Geometry + Light         | Shadow Map  | 判断遮挡     |
| Lighting Pass    | GBuffer + Light + Shadow | SceneColor  | 计算光照     |
| Postprocess Pass | SceneColor / Depth 等    | Final Color | 处理最终画面 |

Shadow Pass 是先从光源视角渲染场景深度，生成 Shadow Map；Lighting Pass 再读取材质信息、灯光和 Shadow Map，通过 BRDF 计算最终光照并写入 SceneColor；Postprocess Pass 则发生在场景主体渲染之后，对 SceneColor、Depth、Velocity 等屏幕空间数据进行 Bloom、Tonemap、TAA、DOF 等后处理，最终得到输出画面。
# 总结分析

- 这篇主要记录 `RenderLine` 相关内容，核心集中在 图形流水线、核心流程、应用阶段。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
