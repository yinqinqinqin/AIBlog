# HDR&色调映射_肖智予

原始附件：[HDR&色调映射_肖智予.pptx](./resources/HDR&色调映射_肖智予.pptx)

## 第 1 页

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914276.png)

HDR & 色调映射演讲者：肖智予

## 第 2 页

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914277.png)

## 第 3 页

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914278.png)

## 第 4 页

如何把这样一样LDR图变成HDR图呢？

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914279.png)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914280.png)

## 第 5 页

第一个挑战：场景中的亮度变化范围广

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914281.png)

真实世界亮度变化范围

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914282.png)

相机能感知范围

差异太大！
如何解决？

## 第 6 页

第二个挑战：显示设备上无法完全展现图片的亮度范围

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914283.png)

如何合理映射？

## 第 7 页

如何解决？

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914284.png)

多次曝光生成HDR高动态范围像

色调映射

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914285.png)

利用HDR图片信息，进行合理的色调映射，使得显示设备能够正确显示

## 第 8 页

01

步骤一：HDR

一系列不同曝光的线性LDR图片的组合

## 第 9 页

多重曝光摄影

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914286.png)

## 第 10 页

组合获取HDR图片

输入
N张不同曝光的LDR图
图片是线性空间的
只有曝光不同

输出
一张HDR图
数值可能大于1.0

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914287.png)

## 第 11 页

一个简单的例子

ImageA：快门速度 1/30 s
ImageB: 快门速度 1/120 s
ImageHDR = 平均(4* ImageB + 1* ImageA)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914288.png)

## 第 12 页

通用HDR生成过程

对于太亮的像素，去掉（该区域往往过曝）
比如：> 0.99
对于太暗的像素，也去掉（该区域容易有噪点）
比如：< 0.002

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914289.png)

## 第 13 页

通用HDR生成过程

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914290.png)

如果我们用这三张图来生成一张HDR图片，那么对于最终(x,y)位置的像素值，我们可以如下计算得到：

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914291.png)

K值是根据曝光度计算的，如果每一张图片
的快门速度不同，那么k值就不同，例如：
第一张曝光为1/30s 第二张为1/60s 第三张为1/120s
那么k值分别为：1 、1/2、1/4

## 第 14 页

02

步骤二：色调映射

使得显示设备能够正确显示

## 第 15 页

色调映射(Tonemapping)的目的

技术上来说：
在一个小空间内拟合大范围的值且尽可能保留值之间的差异

艺术上来说：
再现摄影师/艺术家的所见所闻
风格化照片

Output Result

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914292.png)

Input HDR

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914293.png)

色调映射

## 第 16 页

简单方案

去掉低频信息，保留高频信息；低频图采用高斯模糊获取

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914294.png)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154914295.png)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934564.png)

## 第 17 页

进阶方案

对于边缘，降低模糊，使用双向滤波获取低频图

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934565.png)

## 第 18 页

高斯模糊 vs 双向滤波模糊

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934566.png)

横向对比可以发现，双向滤波(bilateral filtering) 比高斯模糊（Gaussian Blur)更能保留边缘的信息

## 第 19 页

双向滤波原理

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934567.png)

## 第 20 页

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934568.png)

自然界线性灰度

使用Log域

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934569.png)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934570.png)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934571.png)

很重要的一点就是我们的计算是需要在log域的
原因是因为我们人眼对局部对比更敏感

## 第 21 页

使用Log域

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934572.png)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934573.png)

## 第 22 页

色调映射整体流程

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934574.png)

## 第 23 页

HDR格式种类

HDRI（High-DynamicRange Image）就是记录采用了HDR技术的图象数据文件。常用的HDRI文件有OpenEXR、RadianceRGBE、FloatTIFF三种格式。 
来源：http://www.anyhere.com/gward/hdrenc/hdr_encodings.html

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934575.png)

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154934576.png)

## 第 24 页

谢谢聆听！

大家有什么问题吗？
