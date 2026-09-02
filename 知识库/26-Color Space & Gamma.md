# Color Space & Gamma

- 人眼感受颜色的过程，其实是光线进入人眼，然后人眼中的感光细胞开始运作

- 因此，Photoshop中的一个颜色(128,128,128)，在绘制到显示器上，然后被人眼看到以后，是否真的就是一个中间灰度呢？

#### 人眼对光线的感知是非线性的

- 大致符合 1/2.2 的幂律：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749210.png)

- 一个简单例子：

- 因此，在计算机颜色存储精度有限时（例如RGB24bit），用更多的精度来存储暗部信息，ROI更高

#### 显示器的发光原理是非线性的

- 大致符合 2.2 的幂律：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749212.png)

- 所以，显示器发光，其实对RGB的亮部更友好。例如上图中

- 为什么有这个2.2次幂，一个经常说的例子：

- 因为CRT显示器的 2.2 次幂，和人眼感知光线的 1/2.2 次幂，刚好互相取消，因此，即使CRT显示器已经被淘汰了，这个规则还是延续了下来。参考知乎：色彩校正中的gamma值是什么↓：RGB为(0.5,0.5,0.5)时，实际得到的物理光强，不是中间灰度，而是22%的一个「偏黑」的灰度（因为显示器发光，有一个 次幂）。但，因为人眼感光有一个   次幂，所以实际感知到的灰度，刚好差不多是

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749209.png)

- 当然实际上当前显示器的幂律不一定是 2.2。可以参考 冯乐乐：我理解的Gamma校正，以及「RealTimeRendering 4th. Chapter 5.6 Display Encoding」

#### Gamma Encoding & Decoding

人使用相机拍照

- 所以，如果人使用相机拍照（拍照的「曝光」过程，其实就是将真实的光照强度、转换为(R,G,B) digital values），然后将数字照片显示到屏幕上，用肉眼观看。实际上经历的是如下↓两个流程：

- 也就是说：按↑流程，实际图片中存储的 (R,G,B) "Pixel Values"数值，不是真实的物理光强，而是物理光强的 1.0/2.2 次幂。大部分时候（比如拍照场景），这没啥问题。但如果是要做 Shading渲染，那么可能就会有问题。例如：

- 物理光照强度 1.0 的一束光，和物理光照强度也为 1.0 的另一束光，叠加以后，按说得到的光照强度，应该是2.0

- 但如果直接把(1.0,1.0,1.0)的RGB值，和另一个(1.0,1.0,1.0)的RGB值相加，按↑流程，实际得到的物理光强（Displayed Radiance），是

人使用绘图软件、绘制数字图片

- 人在绘图的时候，存在类似的情况

- 设计师用Photoshop绘图时的预期是：用颜色(0.5,0.5,0.5)画一笔刷子，画出来的颜色，肉眼感知是「中间灰（绝对的白色和绝对的黑色中间的一个50%平均亮度）」

- 要感知到中间灰，需要的光照强度是  (因为人眼感光有个 1/2.2 幂律)

- 要显示器显示这个   光照强度，按照CRT显示器的规范，需要像素值为  (因为显示器有个 2.2 幂律)。也就是像素值为

- 也就是说：

- 但是这就有问题了：

- 总结一下就是：

- sRGB color space format的提出：20世纪90年代，微软联合HP等公司，提出了 sRGB 颜色空间标准，其主要想要规范的，就是建议现代显示器统一都使用 2.2 作为显示的 gamma 值，这样Photoshop等工具，在存储数字图片时，可以放心地使用 1.0/2.2 来进行处理

关于「线性空间」的一些补充说明

- 所谓线性空间，是指可以对光照进行符合「线性变换」规则的计算的空间

- 线性变换，可最简单地理解为，输入变量的线性变化，会引起输出变量的等比例线性变化

- 常见的Photoshop混合模式的介绍

#### 在sRGB空间进行颜色计算的问题举例

##### Photoshop

- 举一些实际例子，说明在 sRGB 颜色空间进行颜色计算（比如光照计算，或者Photoshop中常用的、图层之间的颜色混合计算），可能会出的问题（示例也可参考 YouTube：Color Is Broken）

- 使用两张测试图片如下：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749206.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749205.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749203.png)

- 在Photoshop里，如果把上述两张图，用两个图层叠在一起，且使用「Normal（正常）」混合模式，那么得到的结果是↓左图：

- 从Photoshop混合模式介绍知道，「Normal（正常）」混合模式的计算公式是：

> 记图层1为 ，图层2为 。图层1和图层2计算混合，结果记为
>
> Alpha通道： ，也即是，Alpha通道保持不受影响

- 混合结果参加↑上图，可以看到出现了一些莫名其妙的黑边。之所以出现黑边，就是因为这个混合是在 sRGB 颜色空间计算的。究其原因：

- 可基于↑稍微做一点数学演算：两个图层的颜色数值各自是  和  ，现在要按透明度50%来计算混合

##### 实时渲染

- 除了Photoshop，其实实时渲染中，也会遇到因为在 sRGB 空间进行颜色计算，而导致的效果问题。比如：

- 1、需要在 fragment shader 中做一点光照计算，把一个「点光源」和另一个「平行光」的光照结果相加

- 2、使用了 AlphaBlend 模式，在fragment shader输出结果中，输出的alpha值不为1.0，需要由渲染管线，按照渲染配置，去将本次shader的渲染结果，「混合」到结果buffer上。常见的混合模式是：

- 3、mipmap 的计算生成，以及贴图采样时的miplevel采样（如Bilinear \ Trilinear Filtering）。因为mipmap的计算要计算两个像素的RGB数值的插值，因此，在不开启线性颜色空间的情况下，其实 mipmap 的计算结果，可能都是有偏差的(参考GPU Gems3. Chapter 24 - The Importance of Being Linear)

#### 解决办法

##### Photoshop

- 上面举例的这个Photoshop混合问题，可以通过修改如↓的Photoshop配置来解决，在Photoshop的「编辑 - 颜色设置」选项中，修改配置：（注意，这个设置，不改变Photoshop每个图层中存放下来的像素值(RGB or Alpha)，只改变不同图层的混合计算公式和结果）

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749208.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749207.png)

##### Shader

- 以Unity为例，来看看Shader中如何处理这个在 sRGB空间进行颜色计算，可能导致的问题

- 在Unity 里面有 Color Space 的设置 和 贴图 sRGB 的设置，需要两者配合使用，才能彻底解决问题

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749204.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152749211.png)

- 贴图「sRGB」设置决定的是：这张texture在shader中采样时，是否自动进行一个 2.2 次幂(从 sRGB颜色空间，转换回线性颜色空间)

- 工程「Color Space」设置决定的是：每个shader 输出到 framebuffer 时，是否自动进行 1/2.2 次幂操作，从线性颜色空间转换到 sRGB颜色空间，保证人眼感知的正确性

- 注意：

##### 建议的实际操作规范

最物理正确的流程

- 引擎（比如Unity）：开启LinearColorSpace；相应的贴图，也正确地勾选上「sRGB」选项

- 工具（比如Photoshop）：开启「用灰度系数混合RGB颜色」

近似物理正确的流程

- 引擎（比如Unity）：使用GammaColorSpace。在Shader里做额外处理：

- 工具(比如Photoshop)：开启「用灰度系数混合RGB颜色」

性能最省的流程

- 也就是都保持默认状态，啥都不做

- 引擎（比如Unity）：使用GammaColorSpace，不做额外处理

- 工具（比如Photoshop）：不开启「用灰度系数混合RGB颜色」

#### 参考文档

- GPU Gems3. Chapter 24 - The Importance of Being Linear

- RealTimeRendering 4th. Chapter 5.6 Display Encoding

- 知乎：聊聊Unity的Gamma校正以及线性工作流

- 冯乐乐：我理解的Gamma校正

- 知乎：色彩校正中的gamma值是什么

- YouTube：Color Is Broken

- 知乎：PS混合模式的原理
