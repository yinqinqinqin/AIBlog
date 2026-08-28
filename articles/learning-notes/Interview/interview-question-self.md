---
title: 面试 - InterviewQuestionSelf
category: learning-notes
date: 2026-08-27
readTime: 1 min read
excerpt: 面试 学习记录，整理 渲染管线、前向渲染管线、延迟渲染管线 等内容。
tags: [面试]
cover: ""
---

[TOC]

# 渲染管线

## 前向渲染管线

## 延迟渲染管线

## ColorRT DepthRT

## DrawCall / MRT / overdraw

## Gbuffer

常会保存==BaseColor、World Normal、Roughness、Metallic、Specular/AO、Shading Model==等信息，

### Unity URP的Gbuffer

![image-20260814163549075](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260814163549406.png)

## Early-Z / Z-Prepass / AlphaTest / Stencil Test

- Early-Z
  - 将深度测试提前到像素着色器前面
  - 失效问题
    - `clip()` / `discard`
    - PS 修改 Depth
  - 包括了模板测试，通常将两者放一起
    - 模板测试判断哪一些区域需要绘制
    - 深度测试判断物体的遮挡关系
- Z-Prepass
  - Early-Z失效后，避免重复绘制
  - 提前将最终深度图写入，再对比深度进行绘制
- AlphaTest
  - UE中的Mask遮照
  - 当透明度小于一个阈值的时候直接剔除

## Clustered Lighting

把相机视锥体划分成很多 3D 小块 Cluster，然后提前计算每个 Cluster 会受到哪些灯光影响。渲染像素时，只遍历当前 Cluster 对应的灯光。

**Forward+ 是渲染方式，Clustered Lighting 是灯光筛选方式。**

## Shadow Pass

# PBR

# 光照

# 阴影

## Shadow Map

## PCF / PCSS

## CSM

## VSM / Virtual Shadow Maps

## Contact Shadow

# 材质

## 贴图采样

## MatCap

## 描边

## 各向异性

# 后处理

## Bloom

## Tonemapping

## TAA / TSR / FXAA

## SSR/SSAO

# 性能优化

发现问题 → 定位瓶颈 → 验证 → 优化。

# 基础知识点

### sRGB

sRGB 不是“显示的颜色”本身，而是一种面向显示设备的颜色编码/色彩空间。
# 总结分析

- 这篇主要记录 `InterviewQuestionSelf` 相关内容，核心集中在 渲染管线、前向渲染管线、延迟渲染管线。
- 归类到 `面试` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
