---
title: ElectricDreams优化
category: portfolio
date: 2026-08-27
readTime: 5 min read
excerpt: Electric Dreams Environment 性能优化记录，整理固定测试条件、性能数据采集、瓶颈判断和贴图、Actor、Nanite 等优化方向。
tags: [性能优化, UE]
cover: ""
pinned: true
pinnedOrder: 3
---

# 目标

## 优化目标

```
测试案例：Electric Dreams Environment
测试地图：/Game/Levels/ElectricDreams_Env
测试构建：Windows Development 打包版本
渲染接口：DirectX 12
目标输出分辨率：1920 × 1080
内部渲染比例：100%
目标帧率：60 FPS
目标帧时间：16.67 ms
最低可接受帧率：30 FPS
最低可接受帧时间：33.33 ms
```

## 影响帧率因素

- Lumen GI：开启；
- Lumen Reflections：使用 SSR；
- Hardware Ray Tracing：关闭；
- Virtual Shadow Maps：开启；
- Nanite：开启；
- TSR：开启；
- 输出分辨率固定；
- `r.ScreenPercentage` 固定；
- Scalability 固定。

# 版本管理

# 固定运行条件

在正式采集前输入：

```text
r.VSync 0
t.MaxFPS 0
r.DynamicRes.OperationMode 0
```

# 采集数据

## 记录线程

输入：

```text
stat unit
stat unitgraph
```

记录：

```text
Frame：总帧时间
Game：Game Thread
Draw：Render Thread
GPU：GPU 帧时间
```

判断原则：

- GPU 最大并长期接近 Frame：通常 GPU Bound；
- Game 最大：Game Thread Bound；
- Draw 最大：Render Thread Bound；
- 大部分时间正常，但偶尔几十毫秒：Hitch，需要查加载、PCG、PSO 或资源流送。

**记录**

```text
Frame：总帧时间Z
Game：Game Thread
Draw：Render Thread
GPU：GPU 帧时间
```

## 记录GPU Pass

输入：

```text
stat gpu
profilegpu
```

保存 ProfileGPU 截图，重点记录：

```text
PrePass
BasePass
Nanite
ShadowDepths / VirtualShadowMaps
Lumen Scene Lighting
Lumen Screen Probe Gather
Lumen Reflections
Translucency
PostProcessing
TSR
Volumetric Fog
```

## 记录渲染规模

输入：

```text
stat rhi
stat scenerendering
```

记录：

- Draw Primitive Calls；
- Draw Calls；
- 三角形或 Primitive 数量；
- Dynamic Mesh Elements；
- Visible Lights；
- Shadowed Lights；
- 实例数量。

## 记录纹理流送

输入：

```text
stat streaming
```

记录：

- Texture Pool；
- Wanted Pool；
- Required Pool；
- Visible Mips；
- Hidden Mips；
- Over Budget；
- Streaming Update 时间。

# 判断 CPU、GPU 或内存瓶颈

##  GPU Bound

特征：

- `stat unit` 中 GPU 明显最高；
- 降低分辨率后 FPS 明显提升；
- ProfileGPU 中某个 Pass 耗时突出。

##  Game Thread Bound

特征：

- Game Thread 最高；
- 降低分辨率没有明显变化；
- Insights 中大量 Tick、PCG、碰撞、蓝图或对象生成。

##  Render Thread Bound

特征：

- Draw/Render Thread 最高；
- Draw Call 和 Primitive 数量大；
- 大量独立 Actor 和独立材质状态。

## 内存或流送问题

特征：

- 平均帧正常，但移动时卡顿；
- `stat streaming` 经常 Over Budget；
- VRAM 接近物理上限；
- Nanite 或纹理反复 Stream In/Out；
- World Partition Cell 加载时出现几十毫秒停顿。

# 优化方法

## 降低过大贴图分辨率

**查看统计数据**

![image-20260803151505737](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260803151506709.png)

打开统计面板数据，查看当前关卡中，每个物体占用情况

![image-20260803155758410](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260803155759377.png)

红框这一行 **`CloudFillingRGB`**：

修改为

```
最大纹理尺寸：2048
```

![image-20260803161416469](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260803161417365.png)

对比得到纹理占用内存减少很多

使用相同方法，对多次使用，并内存较大的纹理进行压缩

## 处理重复，不该存在的Actor

**对静态网格体体处理**

在统计数据中，找到实例较多的植物，岩石，批量编辑审计资产，降低植物的质量

![image-20260804144101600](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260804144101677.png)

![image-20260804144037139](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260804144038282.png)这个石块使用了223次，并且有千万面

## 降低物体的面数，确认是否开启Nanite

例如下面的石块

- 降低三角形保持百分比
- 减少使用数量

**优化后**：减少到10万

![image-20260804144741445](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260804144741630.png)

## 优化着色器

## 优化植被阴影、WPO和VSM

# 总结分析

- 这篇的重点是先固定测试条件，再采集数据，否则每次优化结果都不容易对比。
- `stat unit` 用来判断大方向，先分清是 GPU、Game Thread 还是 Render Thread 卡住。
- `profilegpu` 更适合继续拆 GPU Pass，重点看 Lumen、VSM、TSR、Translucency、Volumetric Fog 这些大项。
- `stat streaming` 主要看纹理和显存压力，如果出现 Over Budget 或移动时卡顿，通常要先处理贴图尺寸和流送。
- Electric Dreams 这种大场景里，贴图、重复 Actor、高面数资源、阴影和 WPO 都很容易成为主要成本。
- 优化顺序建议先做可量化收益大的项，比如超大贴图、明显重复资源、异常高面数模型，再处理着色器和阴影细节。
