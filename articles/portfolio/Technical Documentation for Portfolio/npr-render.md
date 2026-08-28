---
title: 爱弥斯角色渲染
category: portfolio
date: 2026-08-27
readTime: 8 min read
excerpt: 爱弥斯角色 NPR 渲染复刻记录，包含材质拆分、三色明暗、MatCap 高光、闪粉、视差、文字流动和消散效果。
tags: [风格化渲染, NPR]
cover: ""
pinned: true
pinnedOrder: 2
---

# 1. 项目概述

- 项目：爱弥斯角色渲染复刻
- 引擎：UE5.7
- 方向：NPR 角色渲染

------

# 2. 模型与材质结构

## 模型

- Hair
- HairBack
- Eyes
- Face
- HeartFX
- Item
- Cloth-Up
- Cloth-Down

## 材质

- Hair
- Eyes
- Face
- Item
- HeartFX
- Cloth

------

# 3. 基础材质制作步骤

## 3.1 获取贴图通道和材质ID

**BaseColor**

- RGB：BaseColor
- A：Shadow / Emissive

**Normal**

- RG：Normal
- A：Roughness

**FTM**

- R：Opacity
- G：Metallic
- B：战损 Mask

**ID**

用于区分不同材质区域。

------

## 3.2 颜色调整

使用：

- MX_HSVAdjust
- MF_Tonemap

```hlsl
#include "/Engine/Private/TonemapCommon.ush"
return FilmToneMapInverse(Input);
```

------

## 3.3 光照

**Lambert**

```hlsl
float NdotL = dot(N, L);
```

用于获得基础明暗关系。

**MatCap 风格化高光**

将法线转换到 View Space：

```hlsl
float2 MatCapUV = NormalVS.xy * 0.5 + 0.5;
```

流程：

```text
NormalWS
↓
NormalVS
↓
取 XY
↓
0~1
↓
采样 MatCap
```

------

# 4. 阴影

## 4.1 三色过渡明暗分层

普通 Toon 通常是：

```text
暗部 → 亮部
```

这里增加一个中间色：

```text
暗部 → 中间色 → 亮部
```

使用两个 Remap 区间产生两个 Mask：

```hlsl
float mask1 = saturate(
    (L - DarkMin) /
    (DarkMax - DarkMin)
);

float mask2 = saturate(
    (L - LightMin) /
    (LightMax - LightMin)
);

float3 color =
    lerp(DarkColor, MidColor, mask1);

color =
    lerp(color, LightColor, mask2);
```

核心：

```text
一个阈值 → 两个颜色
两个阈值 → 三个颜色
```

------

# 5. 透明度

FTM 的 R 通道作为 Opacity。

用于控制衣服部分的透明区域。

------

# 6. 最终结构

```text
贴图
↓
颜色调整
↓
Lambert
↓
三色光照
↓
MatCap
↓
Voronoi 闪粉
↓
透明度
↓
最终材质
```

# 特殊材质制作

## SDF 脸部阴影







## 闪粉效果

使用程序化 Voronoi 生成随机法线。

流程：

```text
Position
↓
Voronoi
↓
随机 Cell
↓
随机 Normal
↓
MatCap
↓
闪粉
```

将随机值从：

```text
0~1
```

转换到：

```text
-1~1
```

作为法线方向：

```hlsl
float3 n = finalColor * 2.0 - 1.0;

n.z = abs(n.z) + 0.2;

n = normalize(n);

return n * 0.5 + 0.5;
```

再与原始 Normal 混合，通过 MatCap 产生闪粉高光。

# 视差效果

基于切线空间 View Direction 的简单视差偏移

## 原理

```glsl
  // 输入：uv, viewDirTS（切线空间）, strength float3 V = normalize(viewDirTS); 
  // 只用方向，不用深度 float2 offset =V.xy * strength;
   // 输出 return uv + offset;
    
    uv = uv *2.0-1.0; 
    uv = uv * ParallaxMap_ST.xy + ParallaxMap_ST.zw; 
    uv = uv *0.5+0.5; 
    float cosTheta = dot (viewTS,float3(0,0,1)); 
    float ViewTSLength = depth / cosTheta; 
    float3 startPoint = float3(uv,0); 
    float3 endPoint = startPoint + viewTS * ViewTSLength;
     return endPoint.xy;
```

# 文字流动效果

![image-20260825142144504](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825142144851.png)

![image-20260825141216707](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825141217171.png)

- **UV 翻转并拆分 XY**：将 UV 的 Y 方向反转，再分别处理横向和纵向。
-  **划分列**：X 方向乘缩放后 `Floor`，把画面切成一列一列。
-  **生成随机速度**：用每一列的编号作为 Seed，让不同列获得不同的流动速度。
-  **纵向循环移动**：`Y + Time × RandomSpeed`，再通过 `Frac` 实现不断循环。
-  **生成流动区域**：用 `SmoothStep` 和 `Length` 控制每条流光的长度和边缘。
-  **采样字符纹理**：另一套 UV 采样字符/点阵纹理。
- **组合效果**：`字符纹理 × 流动 Mask`，最终输出到自发光。

# 麦克风消散效果

![image-20260825150538981](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825150539397.png)

![image-20260825151436353](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825151436690.png)

## Voronoi 纹理

```
// 输入参数：UV(对应节点「矢量」，接纹理坐标)、Scale(对应「缩放」)、Jitter(对应「糙度」)
float2 P = UV * Scale;

float2 Pi = floor(P);
float2 Pf = frac(P);

float minDist = 1.0; // F1：采样点到最近细胞中心的距离

[unroll]
for (int y = -1; y <= 1; y++)
{
    [unroll]
    for (int x = -1; x <= 1; x++)
    {
        float2 offset = float2(x, y);
        float2 p = Pi + offset;
        
        // 2D哈希生成细胞随机点，适配UV平面采样
        p = frac(p * 0.1031);
        p += dot(p, p.yx + 33.33);
        float2 randomPoint = frac((p.xx + p.yy) * p.yx);

        // 糙度控制：0=规则方格，1=最大随机偏移
        randomPoint = lerp(0.5, randomPoint, Jitter);

        float2 diff = offset + randomPoint - Pf;
        
        // 曼哈顿点距（对应节点选项，细胞呈棱角方形）
        float dist = abs(diff.x) + abs(diff.y);
        
        // 记录最近距离 F1
        minDist = min(minDist, dist);
    }
}

// 间隙度处理，对应节点「间隙度=2.0」
float Gap = 2.0;
float voronoi = pow(minDist, Gap);

// 输出灰度距离图，对应节点的「距离」输出引脚
return float3(voronoi, voronoi, voronoi);
```

- 在物体空间中，使用上述**Vonoroi**纹理代码，在物体中产生消散纹理
- 利用**RemapValue**节点，获取到小方片的边框
- 在消散之前，还需要纹理的流动产生光效
- 麦克风的其他材质也和角色一样通过matcap给金属部分添加高光，并调整最终的颜色

# 场景制作

![image-20260825152722159](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825152722345.png)

![image-20260825152816253](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825152816432.png)

- 通过floor和frac对uv进行分组
- 使用代码生成noise图（这里不能使用random，random每一帧刷新会导致卡顿），通过noise图对长度进行扰动
- 使用length得到圆形SDF，uv会导致拉伸，需要注意在-1 - 1的范围内进行uv变换

## 代码生成扰动噪声

```glsl
float Scale = 10;
int Detail = 100;
float Roughness =0.5;

float3 p = float3(UV.x, UV.y, W) * Scale;
float total = 0.0;
float amplitude = 1.0;
float frequency = 1.0;
float max_value = 0.0;


for (int i = 0; i < Detail; i++)
{
    float3 sp = p * frequency;
    float3 si = floor(sp);
    float3 sf = frac(sp);
    // Hermite 平滑曲线，替代线性插值获得自然过渡
    sf = sf * sf * (3.0 - 2.0 * sf);
    
    // 立方体8个顶点哈希值，全部内联无自定义函数
    float n000 = frac(sin(dot(si + float3(0.0, 0.0, 0.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    float n100 = frac(sin(dot(si + float3(1.0, 0.0, 0.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    float n010 = frac(sin(dot(si + float3(0.0, 1.0, 0.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    float n110 = frac(sin(dot(si + float3(1.0, 1.0, 0.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    float n001 = frac(sin(dot(si + float3(0.0, 0.0, 1.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    float n101 = frac(sin(dot(si + float3(1.0, 0.0, 1.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    float n011 = frac(sin(dot(si + float3(0.0, 1.0, 1.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    float n111 = frac(sin(dot(si + float3(1.0, 1.0, 1.0), float3(127.1, 311.7, 74.7))) * 43758.5453123);
    
    // 三线性插值
    float x0 = lerp(n000, n100, sf.x);
    float x1 = lerp(n010, n110, sf.x);
    float y0 = lerp(x0, x1, sf.y);
    
    float x2 = lerp(n001, n101, sf.x);
    float x3 = lerp(n011, n111, sf.x);
    float y1 = lerp(x2, x3, sf.y);
    
    float noise_val = lerp(y0, y1, sf.z);
    
    // FBM 分形叠加
    total += noise_val * amplitude;
    max_value += amplitude;
    amplitude *= Roughness;
    frequency *= 2.0;
}

return total / max_value;
```

# 代码分析

- `FilmToneMapInverse(Input)` 是把颜色从 Tonemap 之后的状态拉回线性处理思路里，方便后面继续做风格化颜色控制。
- `dot(N, L)` 是最基础的 Lambert，用法线和灯光方向的夹角拿到明暗关系，后面三色分层就是基于这个值去切阈值。
- 三色阴影里用了两个 `Remap` 思路，`mask1` 负责暗部到中间色，`mask2` 负责中间色到亮部，比单纯二分 Toon 更柔和。
- MatCap 部分直接用 `NormalVS.xy * 0.5 + 0.5`，逻辑和前面 MatCap 文档一致，适合快速补一个稳定的风格化高光。
- 闪粉的 Voronoi 是先生成随机 Cell，再把随机颜色转成 `-1~1` 的法线方向，最后用 MatCap 去把这些随机法线变成闪点。
- 视差部分本质是用切线空间视线方向偏移 UV，`cosTheta` 用来估算视线斜看时需要走多远。
- 场景里的 noise 没用每帧 random，而是用固定哈希和 FBM 叠加，这样能保持随机感，同时不会每帧跳动。
