---
title: 渲染理论 - PBR-BXDF
category: learning-notes
date: 2026-08-27
readTime: 2 min read
excerpt: 渲染理论 学习记录，整理 直接光、间接光、UE中实现PBR 等内容。
tags: [渲染理论]
cover: ""
---

UE的PBR完全是基于BXDF实现，所有核心算法都集中在两个文件里：

- 底层工具函数：`BRDF.ush`（GGX 分布、几何函数、菲涅尔、`Init` 预计算、面光源修正）
- 上层调度逻辑：`ShadingModels.ush`（按不同着色模型调用对应 BRDF，整合光照结果）

# 直接光

基于物理的光照模型必须满足三个条件

- ==基于微平面==
  - 微观上看，物体表面有无数的微表面构成，越粗糙则说明微表面的法线方向越不一致
  - 较高的粗糙度显示出来的镜面反射的轮廓更大一些
  - ![image-20260708105954894](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708105955195.png)
- ==能量守恒==
  - 热力学第一定律，能量既不能凭空产生，也不能凭空消失
  - 能量可以从一个物体传递到另一个物体，也可以转化成其他能量形式，转换过程，总的能量不变
  - 在光照模型中，出射光线的能量永远不能超过入射光线的能量
  - ![image-20260708110458707](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708110459520.png)
  - 按照能量守恒，首先计算镜面反射，它的值等于入射光线被反射的能量所占的百分比，==漫反射则可以直接由镜面反射部分计算得出==
  - 在实时渲染中，会有两种光对物体表面造成影响，分别是直接光和间接光，与漫反射和镜面反射两两组合会出现四种反射情况![image-20260708111500223](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708111501050.png)

- 基于物理的BRDF（双向反射分布函数）

  - BRDF描述的是入射光和反射光的关系，BRDF中也有各种模型，其中Cook-Torrance的效果更广泛![image-20260708123434587](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708123435522.png)

  - 将Cook-Torrance-brdf带入反射方程可以得到![image-20260708111805170](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708111805325.png)

    - \(k_d \cdot \frac{c}{\pi}\)：漫反射分量 = 漫反射能量比例 × Lambert 漫反射 BRDF

      \(k_s \cdot \frac{DFG}{4(\omega_o \cdot n)(\omega_i \cdot n)}\)：镜面分量 = 镜面能量比例 × Cook-Torrance 镜面 BRDF

  - 优于直接光通常是多个光源相加，那么将他们的光照结构相加即是最终的积分结构

  - 直接光的漫反射计算![image-20260708124431562](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708124431736.png)

    - ks是菲涅尔
    - 通过ks求出kd
    - 通过不同的金属度得到不同的kd
    - 再通过算法除以π得到最终的漫反射

  - 直接光的漫反射只需要考虑DFG三项，根据反射方程已经确定DFG的分母是==4 * N·V * N·L==

    - D：法线分布函数
      - 描述微表面的法线方向与半角向量（H）对齐的概率，如果对齐那么==认为该反射光能被看到==，所以通过输入粗糙度可以得到不同的高光
      - D的TrowBridge-Reitz的GGX公式![image-20260708125214435](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708125215241.png)
        - n：法线
        - h：半角向量
        - alpha：粗糙度
      - D代码（GGX高光）![image-20260708125933314](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708125933503.png)
    - F：菲涅尔现象
      - 视线垂直于表面时，反射较弱，
      - F的Schlick公式![image-20260708140512539](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708140512786.png)
      - n代表介质的折射率
      - 非金属的F0数值比较小，金属F0的数值比较大
      - F代码![image-20260708141115607](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708141115810.png)
    - G（几何项）
      - 微表面自我屏蔽现象
        - 光线被吸收
        - 光线被遮挡
      - G的Schlick-GGX公式![image-20260708141610146](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708141610242.png)
      - G项被认为应该分成两个部分光线被吸收和光线被遮挡![image-20260708142032473](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708142032567.png)
      - G的代码![image-20260708142054543](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260708142054610.png)

# 间接光

间接光使用IBL进行模拟

IBL：通常使用环境立方体贴图，将立方体贴图的每个像素视为光源，在渲染方程中直接使用它

UE默认着色

![UE默认着色模型](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260709022816082.png)

自定义PBR

![image-20260709022837134](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260709022837353.png)

# UE中实现PBR
# 总结分析

- 这篇主要记录 `PBR-BXDF` 相关内容，核心集中在 直接光、间接光、UE中实现PBR。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
