---
title: 渲染理论 - ToonMap
category: learning-notes
date: 2026-08-27
readTime: 1 min read
excerpt: 渲染理论 学习记录，整理 定义、算法、使用方法 等内容。
tags: [渲染理论]
cover: ""
---

# 定义

**在PBR中**，最终的输出颜色的值时常超过1，而超过1的部分，在显示器中显示就会泛白过曝，为了解决这个问题，将HDR的颜色值转换到LDR到算法叫做ToneMapping（色调映射）

# 算法

在Tone Mapping算法中，ACESTonemapping效果与性能兼优

```
float3 ACESToneMapping(float3 x)
{
	float a = 2.51f;
	float b = 0.03f;
	flaot c = 2.43f;
	float d = 0.59f;
	float e = 0.14f;
	return saturate((x * (a * x + b)) / (x * (c * x + d) + e));
}
```

# 使用方法

一般在后处理之后使用，使用后处理体积进行调整

也可以使用节点调整
# 总结分析

- 这篇主要记录 `ToonMap` 相关内容，核心集中在 定义、算法、使用方法。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
