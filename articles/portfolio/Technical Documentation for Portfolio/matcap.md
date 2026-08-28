---
title: MatCap
category: portfolio
date: 2026-08-27
readTime: 1 min read
excerpt: MatCap 的 UV 计算记录，主要包含手动构造相机局部坐标系和直接使用 View Space 法线两种方式。
tags: [风格化渲染, MatCap]
cover: ""
---

# 计算UV

float Viewdir = normalize(Camera - WorldPositon);

float a = normalize(Viewedir x (0,0,1));

Float b = a x Viewer;

float x = a · N;

Float y = N · b;

float2 uv = append(a , b);

uv = uv *0.5+0.5;

# 手动构造一个面向相机的局部坐标系

```glsl
float3 V = normalize(CameraPos - WorldPos);
float3 R = normalize(cross(V, float3(0,0,1)));
float3 U = cross(R, V);

float2 matcapUV;
matcapUV.x = dot(N, R);
matcapUV.y = dot(N, U);

matcapUV = matcapUV * 0.5 + 0.5;
```

# 直接使用真正的 View Space 相机坐标系

```
float2 MatCapUV = NormalVS.xy * 0.5 + 0.5;
```

# 代码分析

- MatCap 主要是用法线去查一张已经画好光照效果的贴图，所以重点在 UV 怎么算。
- `V = normalize(CameraPos - WorldPos)` 是从当前像素指向相机的方向，也就是视线方向。
- `R = normalize(cross(V, float3(0,0,1)))` 用视线方向和世界上方向叉乘，算出一个横向方向。
- `U = cross(R, V)` 再算出纵向方向，这样就有了一个跟着相机看的局部坐标系。
- `dot(N, R)` 和 `dot(N, U)` 是把法线投影到这个坐标系上，分别作为 UV 的 x 和 y。
- `matcapUV = matcapUV * 0.5 + 0.5` 是把结果从 `[-1, 1]` 转成 `[0, 1]`，方便直接采样贴图。
- 如果能拿到 `NormalVS`，直接用 `NormalVS.xy` 会更干净，因为它已经是在相机空间里的法线。
