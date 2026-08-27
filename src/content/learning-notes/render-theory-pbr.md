---
title: 渲染理论 - PBR
category: learning-notes
date: 2026-08-27
readTime: 2 min read
excerpt: 渲染理论 学习记录，整理 PBR定义、PBR参数、BaseColor 等内容。
tags: [渲染理论]
cover: ""
---

[Toc]

# PBR定义

**PBR = Physically Based Rendering，基于物理的渲染。**

核心目的：

> 使用接近真实世界的光照规律描述材质，让材质在不同光照环境下仍然保持合理的视觉表现。

PBR 不是某一个具体 Shader，而是一套渲染思想和材质模型。

核心原则：

- 能量守恒
  - 一个表面反射出去的能量不能超过接收到的能量。
- 菲涅尔效应
- 微表面

# PBR参数

## BaseColor

物体的基础颜色。

对于：

**非金属：**

- BaseColor 主要表示漫反射颜色

**金属：**

- BaseColor 主要决定镜面反射颜色
- 金属基本没有传统漫反射

## BaseColor

物体的基础颜色。

对于：

**非金属：**

- BaseColor 主要表示漫反射颜色

**金属：**

- BaseColor 主要决定镜面反射颜色
- 金属基本没有传统漫反射

## Roughness

控制微表面的粗糙程度。

Roughness 主要改变的是高光的分布范围，不是简单改变高光亮度。

## Specular

UE 中主要用于控制**非金属材质的 F0**。

# BRDF公式

Cook-Torrance BRDF

fspecular=4(N⋅L)(N⋅V)D⋅F⋅G

```
D = Normal Distribution Function
    法线分布函数

F = Fresnel
    菲涅尔项

G = Geometry Function
    几何遮蔽项
```



# F0

# IBL

Image Based Lighting

使用环境贴图：

```
Cubemap / HDRI
```

模拟周围环境产生的光照。

# Substrate

PBR 是理论基础，Cook-Torrance / GGX 是光照模型，Substrate 是 UE 用来组织和表达这些 PBR/BSDF 材质的新框架。

**Substrate 并不是取代 PBR，而是 UE 在 PBR/BSDF 理论之上重新设计的一套材质框架。传统 UE 主要使用 BaseColor、Metallic、Specular、Roughness 这种面向美术的 Metallic Workflow，而 Substrate 更直接使用 Diffuse Albedo、F0、F90、Roughness、Mean Free Path 等物理参数描述一层物质。**

**同时 Substrate 最大的变化是 Slab 和 BSDF Layering，可以让多个具有独立光学属性的材质进行真正的垂直分层或水平混合，例如清漆覆盖金属、液体覆盖表面，而不只是简单地 Lerp 两套材质参数。**
# 总结分析

- 这篇主要记录 `PBR` 相关内容，核心集中在 PBR定义、PBR参数、BaseColor。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
