# Ambient Occlusion

## Global illumination (GI)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335082.png)

全局光照是一种重要的视觉特征，是真实感渲染的基础，因为大部分真实场景中的照明是来自于间接反射。但是，它通常需要非常复杂的计算，如果没有大量的简化，很难应用在实时渲染中。在这些简化模拟的方案中，Ambient Occlusion(AO)是比较受欢迎的一种，因为它改善了对物体形状的感知(对比度)，并捕捉了全局光照中一些最重要的效果，特别是由于近距离遮挡造成的软阴影。

## Ambient Occlusion(AO)

对于法线为nx的当前点x和指定观察方向ωo的reflected radiance公式，可以表达如下：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351474.png)

「An ambient light illumination model」这篇98年的文章提出的AO概念中，引入一系列假设:i)所有的光来自一个无限均匀的环境光，它可能被x（当前点）周围的几何遮挡;ii) x周围的所有表面都是纯吸收的(即不反射任何光线)，iii) x处的表面是漫反射的。这就把方程(1)变成：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351473.png)

其中的A(x)就是AO项。

AO的值有两种形式，一种是表示局部遮挡程度，一种是表示局部可见性（这个公式里的AO值的含义是可见性），通常烘焙出来的AO属于第二种。基于上述一系列假设算出来的AO项，一般是用于跟Diffuse项相乘。

至于如何计算这个A(x)项，有非常多的方案。其中，最适合实时渲染的就是Screen-Space Ambient Occlusion，及其各种演化和改良版本。

## Screen-Space Ambient Occlusion (SSAO)

屏幕空间环境光遮蔽(Screen-Space Ambient Occlusion, SSAO)是Crytek公司在2007年发布的，并应用在了游戏孤岛危机上。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335084.png)

通过采集片段周围球型核心(Kernel)的多个深度样本，并和当前片段深度值对比而得到的。高于（或低于，本质是判断样本是否比当前片段更接近摄像机）片段深度值样本的个数除以总样本个数得到的值，就是我们想要的遮蔽因子（AO）。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351470.png)

使用固定Kernel会产生banding问题，通过随机旋转采样Kernel和增加blur效果来解决。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351475.png)

因为使用的采样核心是一个球体，它导致平整的墙面也会显得灰蒙蒙的，因为kernel中一半的样本都会在墙这个几何体上，如下图：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335080.png)

改进的方法是，使用一个沿着表面法向量的半球体采样。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351477.png)

具体的实现细节可以看这个教程，讲得非常详细：SSAO - LearnOpenGL CN

## Image-space horizon-based ambient occlusion(HBAO)

HBAO是另外一种在屏幕空间计算AO的方法，他的算法思路如下：

1、对每个像素，沿着几个方向去做Ray Marching（这里的例子是4个方向）

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335083.png)

2、对每个方向，得到一个最大的Horizon angle(水平角)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351467.png)

3、根据当前点位置P和它的法线N，计算出它的Tangent angle(切面角)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351478.png)

4、根据上述两个角，计算AO = sin(h) - sin(t)。直观的理解就是，附近的点的高度越高，Horizon Angle（h）越大，sin(h)越大，同时遮挡程度（AO）也就越大；当法线越往当前RayMarching方向倾斜越多时，Tangent Angle（t）为负，-sin(t)越大，同时遮挡程度（AO）也就越大；反之亦然。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351466.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351468.png)

具体的实现细节，可以看SIGGRAPH2008的这个ppt和相关的文章：

https://developer.download.nvidia.com/presentations/2008/SIGGRAPH/HBAO_SIG08b.pdf

HBAO(屏幕空间的环境光遮蔽)

## Ground Truth Ambient Occlusion(GTAO)

GTAO的论文中表示，GTAO能达到媲美光线追踪的高质量环境光遮蔽，并且在1080P的PS4上只需要跑0.5ms，所以可以用在实时渲染中。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351479.png)

GTAO是基于HBAO改进而来的，GTAO公式不再基于一个光线Marching的方向计算AO，而是基于一个Slice来计算，所以会有两个最大水平角θ1和θ2。公式中没有像HBAO一样考虑Tangent angle(切面角)，而是增加了法线的cosine权重。γ是法线和视线之间的夹角。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351471.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335081.png)

其中，a的部分可以求出解析解：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335085.png)

当采样的slice方向趋于无穷多，且θ1和θ2完全精确时，计算的结果是ground truth的。此方案可以做出比较接光线追踪的AO效果。

### MultiBounce

我们在前面提到过，AO的其中一个假设是，假设当前点x周围的所有表面都是纯吸收的(即不反射任何光线)。这个假设显然是不符合实际的，GTAO基于观察结果，推出了一个Multi Bounce版本，来模拟光线在当前点x周围多次弹射的结果。这个结果也基于了一个假设，就是假设离x无限近的周围像素有着和x一样的albedo。

Multi Bounce的结果和AO之间的关系，可以用三次多项式来拟合。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351472.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351476.png)

他的直观作用是让AO带上了一点albedo的影响，具体细节可以GTAO的论文：

http://iryoku.com/downloads/Practical-Realtime-Strategies-for-Accurate-Indirect-Occlusion.pdf

### Ground Truth Specular Occlusion(GTSO)

我们在前面提到过，AO的另外一个假设是，当前点x处的表面是只有漫反射的。这个显然也是不符合实际的。GTAO这篇文章里提出了GTSO，来处理光照中的Specular项。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351469.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335086.png)

Ωi是visibility cone和specular cone的交集，  Ωs 是specular cone。

```glsl
    float SpecularAO(SurfaceParams S)
    {
        #ifdef BentNormal
            // Jimenez et al. 2016, "Practical Realtime Strategies for Accurate Indirect Occlusion"
            // aperture from ambient occlusion
            float cosAv = sqrt(1.0 - S.occParams.x);
            // aperture from roughness, log(10) / log(2) = 3.321928
            float cosAs = exp2(-3.321928 * S.roughParams.z);
            // angle betwen bent normal and reflection direction
            float cosB  = dot(S.bnDir, S.rDir);

            // Remove the 2 * PI term from the denominator, it cancels out the same term from
            // sphericalCapsIntersection()
            float ao = clamp(sphericalCapsIntersection(cosAv, cosAs, cosB) / (1.0 - cosAs), 0.0, 1.0);
            // float ao = sphericalCapsIntersection(cosAv, cosAs, cosB) / (1.0 - cosAs);
            // Smoothly kill specular AO when entering the perceptual roughness range -0.1..0.8] for metals
            // Without this, specular AO can remove all reflections, which looks bad on metals
            float metallicAO =  mix(1.0, ao, smoothstep(-0.01, 0.64, S.roughParams.y));
            return mix(ao, metallicAO, smoothstep(0.1, 0.7, S.metalParams.x));
        #else
            ....
        #endif
    }
float sphericalCapsIntersection(float cosCap1, float cosCap2, float cosDistance) {
    // Oat and Sander 2007, "Ambient Aperture Lighting"
    // Approximation mentioned by Jimenez et al. 2016
    float r1 = acosFastPositive(cosCap1);
    float r2 = acosFastPositive(cosCap2);
    float d  = acosFast(cosDistance);
    if (min(r1, r2) <= max(r1, r2) - d) {
        return 1.0 - max(cosCap1, cosCap2);
    } else if (r1 + r2 <= d) {
        return 0.0;
    }
    float delta = abs(r1 - r2);
    float x = 1.0 - saturate((d - delta) / max(r1 + r2 - delta, 1e-4));
    // simplified smoothstep()
    float area = x * x * (-2.0 * x + 3.0);
    return area * (1.0 - max(cosCap1, cosCap2));
}
```

具体细节请看GTAO的论文：

http://iryoku.com/downloads/Practical-Realtime-Strategies-for-Accurate-Indirect-Occlusion.pdf（[本地 PDF)

[渲染效果-Bent Normal AO](https://bytedance.feishu.cn/docs/doccnb0gCSuU9tVPhCFR2khXa5g#j33YPl)

## 参考资料

An ambient light illumination model

SSAO - LearnOpenGL CN

https://developer.download.nvidia.com/presentations/2008/SIGGRAPH/HBAO_SIG08b.pdf

http://iryoku.com/downloads/Practical-Realtime-Strategies-for-Accurate-Indirect-Occlusion.pdf

游戏中的全局光照(三) 环境光遮蔽/AO

https://developer.nvidia.com/sites/default/files/akamai/gameworks/downloads/papers/vxao/atatarinov_alpanteleev_advanced_ao.pdf

## 分享视频连接

https://bytedance.feishu.cn/minutes/obcnigdqkn3m4g1e1j2g74r7
