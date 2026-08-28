---
title: 关键字与节点 - UE基础节点
category: learning-notes
date: 2026-08-27
readTime: 1 min read
excerpt: 关键字与节点 学习记录，整理 向量类、viewDir（视线方向）、Normal（法线） 等内容。
tags: [关键字与节点]
cover: ""
---

[toc]

# 向量类

# viewDir（视线方向）

```
ViewDir = normalize(-CameraVector);
```

# Normal（法线）

```
float3 N = normalize(PixelNormalWS);
```

# 光照方向（LightDir）

```
float3 L = normalize(LightPosition - WorldPosition);
```

# 反射方向（Reflection Vector）

```
float3 R = reflect(-viewDir, N);
```

# 切线空间（TBN）

```
float3 T = normalize(Tangent);
float3 N = normalize(Normal);
float3 B = cross(N, T);
```

# 坐标/空间

# 世界坐标（World Position）

```
float3 worldPos = AbsoluteWorldPosition;
```

# 相机位置（Camera Position）

```
float3 camPos = CameraPosition;
```

# 屏幕UV（Viewport UV）

```
float2 uv = ScreenPosition.xy / ScreenPosition.w;
```

# 视图空间（View Space）

```
float3 viewPos = mul(ViewMatrix, float4(worldPos,1)).xyz;
```

# 裁剪空间（Clip Space）

```
float4 clipPos = mul(ViewProjectionMatrix, float4(worldPos,1));
float2 ndc = clipPos.xy / clipPos.w;
float2 uv = ndc * 0.5 + 0.5;
```

# 光照模型

# Lambert（漫反射）

```
float diff = saturate(dot(N, L));
```

# Blinn-Phong（高光）

```
float3 H = normalize(L + viewDir);
float spec = pow(saturate(dot(N, H)), shininess);
```

# Fresnel（菲涅尔）

```
float fresnel = pow(1 - dot(N, viewDir), power);
```

# 贴图/UV

# Texture Sample （贴图采样）

```
float4 col = Texture.Sample(Sampler, uv);
```

# MatCap

```
float3 R = reflect(-viewDir, N);
float2 uv = R.xy * 0.5 + 0.5;
float3 matcap = tex2D(MatcapTex, uv);
```

# 源码

# BRANCH

GPU 默认会**尽量避免真正的 if 分支**，因为：

- GPU 是 SIMD（同一批线程一起执行）
- 分支会导致 **warp divergence（线程分歧）**
- 可能拖慢性能

所以编译器常常会把：

```
if (A) result = X;
else result = Y;
```

优化成：

```
result = lerp(Y, X, A);
```

导致两个if分支都进行计算

**那 BRANCH 的意义就是：**

👉 **强制使用真实分支，而不是 lerp/混合**
# 总结分析

- 这篇主要记录 `UE基础节点` 相关内容，核心集中在 向量类、viewDir（视线方向）、Normal（法线）。
- 归类到 `关键字与节点` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
