---
title: VAT
category: portfolio
date: 2026-08-27
readTime: 1 min read
excerpt: Vertex Animation Texture 记录，整理 Blender 烘焙动画贴图，以及 UE 中通过帧数和顶点 ID 还原顶点动画的流程。
tags: [VAT, 顶点动画]
cover: ""
---

# Blender中制作动画

![image-20260824162051090](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824162051358.png)

在Blender中制作动画效果，将动画效果通过插件烘培到贴图上

# VAT贴图结构

UE通过当前帧+顶点ID采样纹理，得到顶点位移

```
Position Texture
→ 每个顶点每一帧的位置 / 位移

Normal Texture
→ 每个顶点每一帧的法线


             Frame
          0   1   2   3   4
Vertex 0  ●   ●   ●   ●   ●
Vertex 1  ●   ●   ●   ●   ●
Vertex 2  ●   ●   ●   ●   ●
Vertex 3  ●   ●   ●   ●   ●
```

u值代表帧数

v值代表顶点ID

# UE中解析

![image-20260824162512330](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824162512506.png)

在UE中通过vertexAnimationTools这个节点，对顶点动画贴图进行解析

![image-20260824162604797](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260824162604932.png)

# 总结分析

- VAT 的核心是把模型动画从骨骼或逐帧模型数据，转成贴图采样问题。
- Position Texture 存每个顶点在每一帧的位置或位移，Normal Texture 存每一帧对应的法线。
- 采样时通常用 `U` 表示当前帧，用 `V` 表示顶点 ID，这样每个顶点都能找到自己在当前帧的数据。
- UE 里的 `VertexAnimationTools` 节点负责读取这些贴图，并把结果接到 WPO 或法线相关输入。
- 这种方式适合大量重复播放的复杂动画，能减少骨骼动画开销，但需要注意贴图精度和顶点数量。
