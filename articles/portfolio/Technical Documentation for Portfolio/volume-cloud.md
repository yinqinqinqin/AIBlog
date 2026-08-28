---
title: VolumeCloud
category: portfolio
date: 2026-08-27
readTime: 3 min read
excerpt: 体积云实现记录，包含 UE 体积云材质、ElectricDreams 官方体积云思路、光线步进和 Unity 手搓体积云方向。
tags: [体积云, RayMarching]
cover: ""
---

# UE 体积云系统

## 自定义体积云

需要将材质设置为addtive模式，并且勾选体积云使用

![image-20260825164401074](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825164401214.png)

![image-20260825162343793](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260825162344090.png)

这部分先使用世界空间 2D Mask 控制云的大范围分布，再叠加世界空间 3D Noise 对云进行侵蚀和细节塑形，最终生成用于体积云的 Extinction/Density。

## ElectricDreams 官方使用体积云

![image-20260826105528622](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260826105528705.png)

在lookdev环境中制作的体积云，对比自定义的体积云增加了云层混合的效果，并且参数调整也更加流畅

![image-20260826110917316](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260826110917495.png)



体积云专用调整不同高度的效果面板

![image-20260826111042784](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260826111042870.png)

材质制作流程：

```
World Position
      ↓
2D Pattern / Weather Mask
      ↓
决定哪里有云
      ↓
Height Mask
      ↓
限制云底与云顶
      ↓
Base 3D Noise
      ↓
制作大型立体云形
      ↓
Detail Noise
      ↓
侵蚀 / 打碎云边缘
      ↓
Wind + Time
      ↓
让云流动
      ↓
Density
      ↓
Extinction
      ↓
Albedo + Phase + Multi Scattering
      ↓
Volumetric Cloud Ray Marching
      ↓
最终体积云
```

# UE光线步进

输入：

- CameraPos
- WorldPos
- ObjectPos
- SphereRadius

```
#define MIN_STEP 1
#define MAX_MARCHINGTIMES 1024

float3 RayOrgin = CameraPos;
float3 RayStep = normalize(WorldPos - CameraPos) * MIN_STEP;

for(half i = 0; i < MAX_MARCHINGTIMES; i++)
{
    RayOrgin += RayStep;
    float Dist = length(RayOrgin - ObjectPos);
    if(Dist < SphereRadius)
    {
        return 1;
    }
}

return 0;
```

流程：

```
CameraPos
   ↓
计算 Camera → WorldPos 的射线方向
   ↓
每次前进 MIN_STEP
   ↓
计算当前采样点到球心 ObjectPos 的距离
   ↓
Dist < SphereRadius ?
   ├─ 是 → return 1
   └─ 否 → 继续步进
   ↓
超过最大步数
   ↓
return 0
```

# Unity手搓体积云

## sdf光线步进

## 3dTexture体积云

# 总结分析

- UE 体积云主要是通过材质生成 Density / Extinction，再交给体积云系统进行 Ray Marching。
- 自定义体积云可以先用 2D Weather Mask 控制大范围分布，再用 3D Noise 和 Detail Noise 做体积感和边缘侵蚀。
- ElectricDreams 的体积云更偏完整生产流程，会把高度、云层混合、风向流动、多重散射等参数拆得更细。
- 光线步进代码的核心是从相机位置沿视线方向逐步前进，检查采样点是否进入目标体积范围。
- `MAX_MARCHINGTIMES` 控制最大步数，步数越高越精细，但成本也越高。
- Unity 手搓体积云可以从 SDF 光线步进开始，再逐步换成 3D Texture 密度采样。
