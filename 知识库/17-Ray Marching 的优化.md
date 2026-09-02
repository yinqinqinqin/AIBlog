# Ray Marching 的优化

> 主要是针对近期实现SSR过程中了解到的Ray Marching的算法做个整理，主要参考了Stochastic Screen-Space Reflections

#### Ray Marching in SSR

SSR里有个求反射线与场景交点的Ray Marching步骤，目的是通过这个交点的在屏幕上的位置来采样反射颜色。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444778.png)

#### 3D Linear Tracing

基础的对屏幕深度求交算法，是一种在3D空间步进、步长固定的方法。一般会在最后通过Binary Search的方法缩小步长来提高求交的精度。

- 从起点一小步一小步的往方向移动

- 每次移动后采集深度，检测移动点的深度是否大于场景深度

- 直到完全大于场景深度停止追踪 （或者进入步长二分查找）

- 转换到投影空间输出

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444787.png)

#### 2D Linear Tracing

一种对屏幕深度对求交步进优化，采用屏幕空间的2D射线代替3D射线，保证每一个step至少会垂直或水平移动一个像素。之前的3D射线一些明显的问题：

- 实际的屏幕空间中的起点和终点可能只有几个像素的距离，这时进行过多的step计算就非常费。

- 起点与终点之间像素距离可能非常大，这时step数不足又会造成效果的瑕疵。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444783.png)

2D射线使用透视校正后插值的射线的开始点和结束点的Z值，可以在屏幕空间中追踪射线，同时可以得到观察空间的每个step的深度值。

- 把起点和终点转化到屏幕空间，步进长度为像素倍数。

- 每次步进后，对射线的开始点和结束点的Z值的插值进行透视校正，得到观察空间的深度值。检测移动点的深度是否大于场景深度。

- 直到完全大于场景深度停止追踪 （或者进入步长二分查找）。

注意考虑透视矫正，参考Perspective-Correct Interpolation

```c
// Incorrect.
viewDistance = mix(startView.z, endView.z, scale);

// Correct.
viewDistance = (startView.z * endView.z) / mix(endView.z, startView.z, scale);
```

#### Hierarchical Tracing

一种对屏幕深度对求交步进优化，使用了Hierarchical ZBuffer / HiZ。

- 构建 Hierarchical Texture 。对DepthTexture进行DownSample，保存四个像素中的最小值（或最大值，取决于坐标系）

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444786.png)

- 屏幕空间追踪。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444782.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444780.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444784.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444789.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444785.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444788.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444781.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444777.png)

#### Sphere Tracing

如果场景是有限的规则几何体，可以考虑用球体追踪，可以解决以下问题：

- 被检测物体太薄, 导致穿透.。

- 步进不够。

- 步进太多, 造成浪费。

每次步进时候, 基于多个SDF （Signed distance functions）结果相交后给出一个"最优”的步进距离。也是一种变长追踪。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444779.png)

#### Reference

- CGBull Unity Stochastic SSR

- Lettier Screen Space Reflection

- Perspective-Correct Interpolation
