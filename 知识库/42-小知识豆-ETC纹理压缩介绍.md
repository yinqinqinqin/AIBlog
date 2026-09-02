# 小知识豆-ETC纹理压缩介绍

## 为何需要压缩纹理

首先要明确图片和纹理是两个不同的概念。

常见的图片文件格式有BMP，TGA，JPG，GIF，PNG等；

常用的纹理格式有R5G6B5(后面会展开说为什么G多一个位)，A4R4G4B4，A1R5G5B5，R8G8B8, A8R8G8B8等。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219475.png)

图片格式是图像为了存储信息而使用的对信息的特殊编码方式，它存储在磁盘中，或者内存中，但是并不能被GPU所识别，因为以向量计算见长的GPU对于这些复杂的计算无能为力。例如对于PNG压缩算法是根据图片整体进行压缩(比如采用霍夫曼编码)，像素和像素之间存在依赖关系，无法直接实现单个像素级别的解析，这就没办法发挥显卡的优势。

这些文件格式当被游戏读入后，还是需要经过CPU解压成R5G6B5，A4R4G4B4，A1R5G5B5，R8G8B8, A8R8G8B8等像素/纹理格式，再传送到GPU端进行使用。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219490.png)

所以一张图片在游戏引擎中运行时占用的显存大小，与这种图片本身占用磁盘大小无关，只和图片的宽和高相关。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219478.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219489.png)

磁盘占用 左>右

内存占用 左=右

纹理格式是能被GPU所识别的像素格式，能被快速寻址并采样。

那么问题来了。首先是内存的限制。

以A8R8G8B8格式为例，一个像素占四个字节。如果是一张512x512的纹理。那么就要占用512x512x4 b=1048576 b=1 M。对于一个游戏，或者仔仔项目，动辄同一时刻就需要载入上百张纹理。这是无法接受的。

另一个问题是带宽。

在渲染时，会有大量纹理由CPU传到GPU。数据传输的带宽过大，容易导致手机发热。进而影响手机的性能。

因此就需要对纹理进行压缩。

## 纹理压缩格式的要求

纹理最终是由显卡来读取的。所以结合显卡的特点，在评估纹理压缩方案时应该考虑以下几点内容

### 1 解析速度

在纹理操作中，读取纹理数据是关键步骤，所以解码速度至关重要，这一点是最应该考虑的。

### 2 随机读取数据

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219476.png)

渲染时只使用需要的部分纹理，并且访问的顺序无法提前预知。此外，三角形区域的邻接并不意味着对应纹理区域的邻接（参见上图）因此，图形子系统的整体性能在很大程度上取决于纹理访问的效率。“随机存取”的需求决定了各种纹理压缩格式的主要特征。

### 3 压缩率和纹理质量

既要保证一个不错的压缩效果，也要把纹理损失控制在一定范围内。压缩率通常用比特率或每texel的平均比特数(bpp bits per pixel)表示。典型的bpp值从2bpp到8bpp

### 4 压缩速度

通常纹理压缩在渲染前已经提前准备好，所以如果压缩的速度比解析速度慢，也是可以接受的。

另外我们需要明确的一点是，纹理压缩文件是可以直击被GPU读取的。而不需要再通过CPU解压。这样可以显著节省带宽，而且在GPU中也不会一次把整张图片进行解压缩，只会在需要采样特定区域的纹理时对这一区域的纹理进行解压缩。

也就意味着，我们直接查看压缩纹理的文件大小就可以确定他的显存占用。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219488.png)

## ETC压缩纹理算法的原理

ETC算法是爱立信公司针对移动端GPU研发的，所以基本上PC的GPU都不支持。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219484.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219480.png)

ETC压缩的主要思想是基于一个众所周知的关于颜色感知的事实，即人眼对亮度比色度更敏感。

ETC1把每4x4像素块编码为64位的字节数据，每一个像素块又分为两个2x4子块（由一个“flip”位控制水平或竖直划分）。每个子块存储一个12位的基色（可以是RGB444/RGB444或RGB555/RGB333格式。由一个“diff”位控制）。以及每个纹素都存储的2位索引(所以每个子块共8*2=16位)。和一个3位的修饰表索引（modifier table index）

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219485.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219481.png)

还原每个像素值的过程：

首先我们有一个12位的基色值，

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219479.png)

其他颜色则是通过改变基色的亮度值来得到的。

通过3位的修饰表索引，我们可以得到对应的4种修饰值

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219482.png)

这样我们就可以得到四个新的颜色值：

color0 = base_color + RGB(modifier0, modifier0, modifier0)

color1 = base_color + RGB(modifier1, modifier1, modifier1)

color2 = base_color + RGB(modifier2, modifier2, modifier2)

color3 = base_color + RGB(modifier3, modifier3, modifier3)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219486.png)

最后通过每个纹素都存储的2位索引，选择上面得到的四个颜色中的一个得到最终颜色值。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219483.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219491.png)

ETC1 OpenGLES 2.0支持几乎所有市面上的Android机，所有iPhone

ETC2 OpenGLES3.0支持大部分高端Android机，iPhone 5S及以上

ETC不支持透明通道，通常由其他方式辅助去存储透明度信息。例如用两张图。

## 为什么选择ETC

主要考虑到覆盖率，压缩质量。压缩质量更优的ASTC覆盖率会比较低，解码时间也比较长。

ASTC在Android 5.0/OpenGL ES 3.1后支持

IOS：在iPhone6以上（包含）都支持ASTC

## BadCase

[附件：飞书20221110-195826.mp4](https://bytedance.larkoffice.com/file/boxcn8NTKMY7Oo0ZyIeVjciifBg)（[本地附件](./resources/attachments/飞书20221110-195826.mp4))

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219474.png)

左边为etc纹理，右边为原始的纹理

## 结论：

如上面所介绍的，对于大多数的压缩算法，RGB三个通道都会互相影响。

如果追求效果尽可能好，那么就类似Unity的做法，把M、R、AO这些信息图单独做一张图。

如果将我们现在的MRAO贴图拆出来。所有资产都会增加贴图。

考虑到目前设计侧反馈的badCase不多。就保持原有的做法。

### 一个小小的知识豆

### - 为什么要有R5G6B5颜色格式

颜色的格式上，常用的就是 16 位和 32 位的颜色。使用 16 位的一个优势在于能使用更少的内存占用。另外，对于颜色表示来说，透明度 A 是可选的，也就是说常用的 ARGB 中，只使用 RGB 也是合理的。此时需要将 16 位分给 RGB 三个通道，显然 16 是不能被 3 整除的。势必需要某个颜色通道和其他通道使用的不相同

格式 R5G6B5 的含义就是红色（R）占5位，绿色（G）占6位，蓝色（B）占5位。那为什么选择让绿色 (G) 多占呢？为什么不是选择红色或蓝色呢

这里绿色多一位是因为人眼对绿光最为敏感，正常人的眼睛接收到波长为530nm的绿光时，只要每秒有6个绿光的光子射入瞳孔，眼睛就能察觉。

引申出来的问题：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219477.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902173219487.png)

为什么HeightMap和AO 都使用的是G通道？

因为G通道通常压缩得更好。例如，DXT1使用565的压缩方式，这意味着红色和蓝色以5位存储，绿色以6位存储。

## 参考

你所需要了解的几种纹理压缩格式原理 [https://zhuanlan.zhihu.com/p/237940807](https://zhuanlan.zhihu.com/p/237940807)

知乎 - 有问题，就会有答案 [https://www.zhihu.com/search?type=content&q=ETC%E7%BA%B9%E7%90%86%20%E9%97%AE%E9%A2%98](https://www.zhihu.com/search?type=content&q=ETC%E7%BA%B9%E7%90%86%20%E9%97%AE%E9%A2%98)

Compressed GPU texture formats – a review and compute shader decoders – part 1 – Maister's Graphics [https://themaister.net/blog/2020/08/12/compressed-gpu-texture-formats-a-review-and-compute-shader-decoders-part-1/](https://themaister.net/blog/2020/08/12/compressed-gpu-texture-formats-a-review-and-compute-shader-decoders-part-1/)

图像块压缩/纹理压缩技术细节（文献翻译） [https://zhuanlan.zhihu.com/p/486903217](https://zhuanlan.zhihu.com/p/486903217)

移动平台纹理压缩知识总结 [https://zhuanlan.zhihu.com/p/59518368](https://zhuanlan.zhihu.com/p/59518368)
