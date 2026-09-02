# 容器里的水的制作思路

## 效果展示

[附件：videoCacheC1D14459-F081-4DFF-8430-577E3831E9CC.mov.mp4](https://bytedance.larkoffice.com/file/Aot6breaVoIe3cxLmvTcDMoYnMb)（[本地附件](./resources/attachments/videoCacheC1D14459-F081-4DFF-8430-577E3831E9CC.mov.mp4))

[附件：videoCache74F5E299-BB9C-413E-B3BE-974CE5546CE0.mov.mp4](https://bytedance.larkoffice.com/file/Iz0RbOWG1oRWhuxd2xLcSpK4nBb)（[本地附件](./resources/attachments/videoCache74F5E299-BB9C-413E-B3BE-974CE5546CE0.mov.mp4))

## 制作思路

容器里的水主要分为容器以及水两个部分。水体部分会分为水体的渲染（liquid shader）以及水的运动控制部分；容器部分会简单讲一下玻璃的shader。

### 水体基本渲染部分

对于制作在容器里的水，因为需要绘制水体和容器的交界面，因此就不能像绘制地形水体的方式那样直接用一个带顶点动画的面片去当作水面。

为了让水体的侧壁和容器保持一致，我们这里可以直接选用容器的模型作为我们水体的模型。然后在shader中，片元位置高于法线轴线上某个阈值的我们直接discard掉（假设默认为0），作为控制水面高度的方法。

```cpp
float surface_y = dot(v_WorldPosition - u_PlaneCenter, topNormalWorld);
if (surface_y >= 0.0) discard;
```

以下图片是水体的使用的模型以及discard后的情况。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826703.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826716.png)

因为我们需要渲染水和容器的交界侧面部分以及水体朝上的水平表面部分，我们需要用某种方式去标记水体的这两部分的范围。幸运的是我们可以直接用mesh的面朝向去标记这个范围，对于单面模型，我们认为正面朝向摄像机部分是交界侧面部分，背面朝向摄像机部分是水平面部分。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826710.png)

由于之后计算反射光照等信息需要法线信息，现在我们需要在shader中得到法线。对于侧面部分，我们可以直接认为表面法线就是模型顶点储存的法线信息；而对于水平面部分我们却不能直接使用顶点法线，因为这里我们实际上是要渲染水体水平面，因此我们需要在这一部分强行将法线变为(0,1,0)（或者脚本计算的水面法线）。下图是法线示意图以及法线的可视化颜色图。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826719.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826715.png)

为了让水面更生动，我们可以对水平面法线做一定的扭曲，这里我们可以引入法线贴图。现在的问题是，使用什么UV对法线贴图采样，以及法线贴图如何应用到水平面上？

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826714.png)

对于第一个问题，对法线贴图采样的UV应该是水平面上的位置信息。因为这里片元实际位置是模型背面朝向相机的“球壳”部分，因此我们不能直接使用片元在世界空间中的位置，而是需要根据视线的方向去找到视线与水平面的交点；因此这里我们需要做一次射线平面相交的计算。

```cpp
//hitPos 视线和水的平面交点位置，减去平面中心位置做归零
float t = (dot(u_PlaneCenter, topNormalWorld) - dot(u_WorldSpaceCameraPos, topNormalWorld)) / dot(viewDirWorld, topNormalWorld);
vec3 hitPos = (u_WorldSpaceCameraPos + t * viewDirWorld) - u_PlaneCenter;
```

我们得到了视线与平面在世界空间中的交点位置，但是我们想要的应该是交点在平面的切线空间中的坐标，因为直接用在世界空间中的交点位置的xz分量的话，在水面倾角比较大的情况下采样uv会出现很大的畸变。

因此我们需要将世界空间中的坐标点转换到水平面的切线空间中，这里我们需要逆TBN矩阵做这个操作。如果水平面法线N是(0, 1, 0)的话，我们取一个切线T(0,0,1)，那么用T叉乘N即可得到副切线B。如果水平面法线不定，那么可以用N叉乘一个Forward向量(0,0,1)得到T，再用T叉乘N得到副切线B。

TBN矩阵是一个正交矩阵，因此逆TBN矩阵就是TBN矩阵的转置。将法线贴图得到的切空间法线左乘逆TBN矩阵即可得到扭曲后的水平面法线。

下图是视线在平面上交点位置的可视化表示，分别使用世界空间坐标的xz分量以及切线空间坐标的xy分量；可以看到直接使用xz分量会在这种大倾角状态下产生比较明显的uv拉伸。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826704.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845898.png)

现在我们要解决的问题是如何将法线贴图应用到这个表面上。其实上文已经提到了TBN矩阵了，这里我们直接对切线法线左乘TBN矩阵转换到世界空间即可。下图是应用法线贴图后的世界空间法线表示。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826700.png)

现在我们应用上反射、折射等效果（具体和以前分享过的水体渲染做法差不多，这里不细讲了）：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826707.png)

看起来还行，有点像水了，但是水体的侧面和水平面的过度太“硬”了。我们可以仔细观察一下真实的水在容器里面的样子：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826718.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826711.png)

我们能观察到其实水体侧面和之间水平面其实有一圈很明显颜色不同的线，这其实是由于水的表面张力造成的弯液面现象（https://en.wikipedia.org/wiki/Meniscus_(liquid)）。水在容器壁附近的法线并不是一成不变的，由于表面张力的存在越靠近容器壁附近的水的法线会越像容器内壁法线弯曲。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826712.png)

因此我们根据此现象，对比较接近水平面附近的片元，我们同样可以做类似的对法线的扭曲：

```cpp
//用meniscusFactor去扭曲弯曲液面处的法线，正背面扭曲程度不同
float meniscusFactorFront = saturate((surface_y + 0.5) * 2.0);
float meniscusFactorBack = saturate((surface_y + 1.5) * 0.666666);
//viewFactor保证在从下往上看水时法线不会扭曲过多导致菲涅尔效果过于强烈
float meniscusViewFactor = (smoothstep(-0.1, 0.0, dot(-viewDirWorld, u_PlaneNormal)) * 0.7 + 0.3);
meniscusFactorFront = meniscusFactorFront * meniscusViewFactor;
//用facing控制世界空间中的法线
meniscusFactorFront = smoothstep(0.1, 0.9, meniscusFactorFront);
meniscusFactorBack = pow(meniscusFactorBack, 3.0);
float meniscusFactor = mix(meniscusFactorBack, meniscusFactorFront, facing);
//meniscusFactor = pow(meniscusFactor, 2.5);
vec3 blendNormal = mix(-worldFrontNormal, u_PlaneNormal, facing);
vec3 normalWorld = mix(topNormalWorld, worldFrontNormal, facing);
normalWorld = normalize(mix(normalWorld, blendNormal, meniscusFactor));
```

下图分别是世界空间法线法线、黑色背景渲染、室内背景渲染的示意图。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845899.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845900.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826708.png)

### 玻璃渲染部分

因为玻璃部分有一定的折射扭曲，我们其实渲染玻璃时其实仍然只是渲染了朝向摄像机的正面。所以我们主要需要解决的问题是如何体现出玻璃的厚度以及体积感。我们可以观察一下真实的水缸：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826717.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826713.png)

我们其实可以发现在玻璃壁的部分扭曲的量比较高因此和周围的颜色相差较大，我们其实能够间接地感受到玻璃壁的厚度。

因此，在shader中我们近似的认为视线和表面法线点乘结果接近0的部位都是玻璃壁，我们在这些部分强行给玻璃增加一个大的折射扭曲。下图是增加玻璃壁扭曲后的黑色背景渲染和室内背景渲染效果。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845896.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826705.png)

下图是在渲染的水体上加上玻璃的效果：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845895.png)

### 水体运动部分

现在我们完成了水体的基础渲染和玻璃的渲染。但是由于水面一直是平的，没有任何波动，这样的水体同样会显得不真实、不生动；因此我们首先考虑对这个平的表面做一定的波动。我们刚才的做法是直接使用法线轴线上的y分量去discard，现在我们使用一张波形纹理给这个高度一个offset去改变discard的高度。下图是波形offset纹理。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845897.png)

我们还可以使用时间给这个纹理的采样坐标做一个平移，以展现出动态的效果。

```cpp
vec3 posOffset = v_WorldPosition - u_PlaneCenter;
vec2 waveSampleUV = vec2(dot(posOffset, topTangentWorld), dot(posOffset, topBitangentWorld));
vec2 waveSpeed = vec2(0.05, 0.15);
float wave = ((texture2D(u_WavesTex, fract(waveSampleUV * 0.008 + u_Time.y * waveSpeed)).r) - 0.5) * 30.0 * (u_WavesMult + 0.05);

float surface_y = dot(posOffset, topNormalWorld) + wave; // 调整水面高度
if (surface_y >= 0.0) discard;
```

视频简单展示了波形offset对水体带来的影响。

[附件：屏幕录制2020-12-20 上午10.58.20.mov](https://bytedance.larkoffice.com/file/PPeKbhA99o1F4lx1ITUcAzJVngd)（[本地附件](./resources/attachments/屏幕录制2020-12-20%20上午10.58.20.mov))

现在水体的波形有了一个波动的效果，但是这样还不足以体现出水体本身的惯性。为了体现出水体自身的惯性，我们需要对传入shader默认法线做出一定的调整。这里我自己摸索出的方法是一种使用悬挂点模拟质心的方法。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845901.png)

设O为平面原点，A为O下固定距离位置的一点。此时我们假设点B是类似水体质心的存在，B的运动受到且仅受到一个朝向点A的拉力F的影响，设：

那么有加速度a为：

其中，x为运动点B到固定点A的位置向量，v为运动点B的速度向量；同时我们可以认为k/m和c/m为两个自由调节的参数。此时，从运动点B到O的归一化向量我们即可认为是法线N。

这其实是一个标准的带阻尼二阶运动微分方程：

我们可以通过调节c/m参数和k/m参数使系统达到欠阻尼、过阻尼、临界阻尼状态。这里详细可以参考：https://zh.wikipedia.org/wiki/%E9%98%BB%E5%B0%BC

我们设c/m为b1，设k/m为b2，那么我们可以得到阻尼比为：

模拟水体的运动我们考虑将系统维持在欠阻尼状态，使水平面会因为惯性有一定的振荡，体现出水的流动性。下图展示了不同阻尼比导致的质点运动状态：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826709.png)

因此，我们需要将阻尼比维持在ζ<1的状态，也就是：

我们取b1=1，b2=20，计算过程如下：

```lua
local b1 = 0.75
local b2 = 20.0
local hangPointAcceleration = (hangTargetPoint - self.hangPoint) * b2 - self.hangPointVelocity * b1
self.hangPointVelocity = (self.hangPointVelocity + hangPointAcceleration * deltaTime)
self.hangPoint = self.hangPoint + self.hangPointVelocity * deltaTime
```

得到的效果如下：

[附件：videoCache6350DD42-8491-40FF-BCE2-D9657DA6EBF1.mov.mp4](https://bytedance.larkoffice.com/file/ZWWiblwngoMZjHx02yscab7unTf)（[本地附件](./resources/attachments/videoCache6350DD42-8491-40FF-BCE2-D9657DA6EBF1.mov.mp4))

可以看到液体表面在运动停下之后是处于振荡状态的，说明此时系统在欠阻尼状态。

我们也可以尝试以下达到临界状态的表现，取b1 = 8，b2 = 16时表现如下：

[附件：videoCache8DEAA073-C6A7-4778-9068-72CEE2162BA4.mov.mp4](https://bytedance.larkoffice.com/file/O4lJbupQIoixrDxCmU4cZzArnge)（[本地附件](./resources/attachments/videoCache8DEAA073-C6A7-4778-9068-72CEE2162BA4.mov.mp4))

在运动停下之后，水体也渐渐恢复到了平衡位置，此时系统处于临界阻尼状态。因此，我们可以使用b1和b2两个参数去一定程度上控制水体的运动特性。

我们如果将运动点B运动的速度大小视为运动的激烈程度，作为参数传入shader，还可以对法线贴图的应用做一定的调整。在水体运动激烈时，液体表面的法线也应该受到更大的扰动；为了产生涟漪状的法线扭曲，我们可以将Domain Warping的思路应用到这里。这里大概的思路就是用噪声来扭曲噪声的采样；我们将采样波形贴图的值作为offset去扭曲采样法线贴图的UV，这样我们便可以得到类似涟漪的效果。

```cpp
vec3 GetWaveNormal(vec2 hitPos, float wave){            //获取法线贴图采样，是两个采样的叠加，用wave控制采样scale模拟碎的水花
    float scale = 0.005 + wave * 0.0035;
    vec3 normal1 = texture2D(u_NormalTex, fract( (hitPos * 0.3 * scale + u_Time.y * vec2(1.0, 3.0) * 0.015))).rgb * 2.0 - 1.0;
    vec3 normal2 = texture2D(u_NormalTex, fract( (hitPos * 0.3 * scale + u_Time.y * vec2(1.4, -1.4)* 0.015))).rgb * 2.0 - 1.0;
    vec3 normal = normalize((normal1 + normal2) * 0.5);
    return normal;
}

float waveOnPlane = ((texture2D(u_WavesTex, fract(hitPosOnPlane * 0.005 + u_Time.y * vec2(0.1, 0.3))).r) - 0.5) * 200.0 * (u_WavesMult + 0.05);
vec3 normalSampled = GetWaveNormal(hitPosOnPlane + waveOnPlane * vec2(0.4), u_WavesMult * 10.0);
```

下图展示了将采样UV缩放和扭曲量放大数倍后的夸张效果。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826706.png)

有关噪声贴图的使用还有很多可以讲，可以参考https://thebookofshaders.com/13/?lan=ch

有关Domain Warping可以参考https://www.iquilezles.org/www/articles/warp/warp.htm

## 拓展和改进

目前还有很多可以继续改进的地方。目前的水体渲染和运动都还可以微调，还可以更加自然更加真实。由于shader里数据比较多，许多计算中的数值都是基于经验的或者冗余的，还可以再把部分多余的数据去除并且将比较有意义的参数暴露出来调整。

目前法线的采样UV是基于视线和平面相交得到的坐标值，这样会在波形变动比较大的情况下出现折射扭曲或者反射和水面不和谐的情况。可以想到的办法是大致使用类似视差贴图的方法，使用交点波形高度对采样UV做一个offset，让折射和反射的观察视觉效果尽可能接近有一定波形的状态。

另外，这个效果本身是为了开发人头在鱼缸中的道具制作的。这里如果要体现出人头在水中的状态，需要有一定合理的遮挡关系。这里感谢引擎的兢业同学提供的思路，首先我们给shader传入matting遮罩，当渲染背面时，当前片元轴向Y位置(surface_y)大于某个低于水面位置时，如果片元处于matting遮罩中就直接渲染人脸颜色；当渲染正面时，当前片元轴向Y位置大于某个高于水面位置时，如果片元处于matting遮罩中就直接渲染人脸颜色。这个位置偏移的具体计算可能需要用到视线方向和水面法线等等信息。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826701.png)

此外，根据需求，渲染上我们还可以添加自下而上的气泡、摇晃时表面泡沫、次表面散射等等特性；动力学上还可以增加液体和容器壁的摩擦力，使得容器在旋转时也能够对水体造成一定的影响。

最后还发现一个问题，目前RT的传递貌似会偶现延迟一帧的情况……

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152826702.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152845902.png)

## 工程文件

[附件：liquid-tutorial.ecpj](https://bytedance.larkoffice.com/file/M9OKbNMAPodOP7x2hhHcKy6KnAc)（[本地附件](./resources/attachments/liquid-tutorial.ecpj))
