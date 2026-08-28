---
title: 关键字与节点 - Node
category: learning-notes
date: 2026-08-27
readTime: 1 min read
excerpt: 关键字与节点 学习记录，整理 LightNode、SkyAtmosphereViewLuminance & skyAtmosphereLightDiskLuminance、SkyAtmosphereViewLuminance 等内容。
tags: [关键字与节点]
cover: ""
---

# LightNode

## SkyAtmosphereViewLuminance & skyAtmosphereLightDiskLuminance

用于在材质中程序化采样物理大气的亮度数据，常见于自定义天空材质、水面反射、自发光面片等效果。两者用 Add 节点相加，是官方标准的「完整天空亮度」计算写法。



![image-20260710170329409](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260710170329615.png)

### SkyAtmosphereViewLuminance

采样**任意世界空间方向上的大气散射亮度**，也就是我们肉眼看到的 “天空本身的渐变色彩”。它基于物理大气模型，计算该方向上的瑞利散射、米氏散射效果，输出天空的颜色渐变（比如高空的深蓝色、地平线的暖雾 / 橙红色光晕）。

### SkyAtmosphereLightDiskLuminance [0]

采样**指定光源的盘面亮度**，也就是太阳（或月亮）本身的实体亮斑。

节点上的 `[0]` 是**光源索引**，对应场景中绑定到天空大气的定向光源

输出高动态范围的 RGB 亮度值，只有正对光源的方向会输出极高的亮度，其余方向为 0。它专门用来模拟太阳实体光盘的强光，通常会触发后期 Bloom 泛光，形成太阳的光晕效果。

# Volumetric Advanced Input

这是 UE**体积云（Volumetric Cloud）系统**的专属材质节点，全称 **Volumetric Advanced Input（体积高级输入）**，是体积云「两级光线步进优化机制」的核心组成部分，专门用于降低体积云的渲染开销.

![image-20260710181331432](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260710181331790.png)![image-20260710181521331](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260710181521502.png)
# 总结分析

- 这篇主要记录 `Node` 相关内容，核心集中在 LightNode、SkyAtmosphereViewLuminance & skyAtmosphereLightDiskLuminance、SkyAtmosphereViewLuminance。
- 归类到 `关键字与节点` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
