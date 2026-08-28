---
title: Stylized Anisotropy
category: portfolio
date: 2026-08-27
readTime: 2 min read
excerpt: 风格化头发各向异性高光的实现记录，主要记录高光方向构造、视角遮罩和最终颜色混合。
tags: [风格化渲染, 各向异性]
cover: ""
---

# 风格化头发

![image-20260824170148081](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824170148193.png)

# 风格化各向异性原理

- 使用代码生成各向异性高光形状
- 确定好各向异性高光位置
- 根据视线与物体之间的夹角进行计算，以近似真实各项异性效果

## 各项异性基本代码

 ````glsl
 float3 N_TS = TransformWorldToTangent(NormalWS);
 
 float3 A_TS =
     cross(float3(1.0, 0.0, 0.0), N_TS)
     + N_TS * HeightTex;
 
 float3 A_WS = TransformTangentToWorld(A_TS);
 
 float AV = dot(A_WS, CameraDir);
 
 float AnisoMask =
     sqrt(saturate(1.0 - AV * AV));
 
 AnisoMask =
     saturate(pow(AnisoMask, AnisoPower));
 
 
 float NoV = dot(NormalWS, CameraDir);
 
 float ViewMask =
     saturate(pow(NoV, RimMaskPower));
 
 
 float3 FinalColor =
     AnisoMask
     * ViewMask
     * HighlightColor;
 ````

# 代码分析

- `N_TS` 是把世界空间法线转到切线空间，方便基于局部方向做高光方向控制。
- `A_TS` 是构造出来的各向异性方向，`cross(float3(1.0, 0.0, 0.0), N_TS)` 提供一个垂直于法线的方向，再加上 `HeightTex` 做扰动，让高光不会太死板。
- `A_WS` 再转回世界空间，用来和相机方向计算夹角。
- `AV = dot(A_WS, CameraDir)` 表示各向异性方向和视线方向的接近程度。
- `sqrt(saturate(1.0 - AV * AV))` 可以理解成把正对视线的部分压下去，让侧向位置形成高光带。
- `pow(AnisoMask, AnisoPower)` 用来控制高光带的硬度，数值越大，高光越窄越锐。
- `NoV = dot(NormalWS, CameraDir)` 是普通的法线视角关系，用来做一个视角遮罩。
- 最终颜色就是 `各向异性遮罩 * 视角遮罩 * 高光颜色`，重点不是模拟完整物理光照，而是得到一个可控的风格化头发高光形状。
