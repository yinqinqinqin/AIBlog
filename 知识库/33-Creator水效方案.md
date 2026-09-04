# Creator水效方案

#### Creator水效方案

因为没有或者我不知道怎么用depth buffer、stencil buffer和grabpass因此用了三个相机：一个编码距离信息（RG通道）和模板信息（B通道）绘制到RT1，第二个绘制水底和各种生物到RT2作为水的背景，第三个专门绘制水。

RT1和RT2如图：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920861.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920866.png)

注意RT2的水底shader有专门处理过，先绘制正面再绘制背面，背面部分不能直接剔除而需要用屏幕坐标采样拍摄输入，要不然被背面遮挡住的正面也会被错误渲染。右图的黑色部分其实是“透明”的。

水面波形部分采用8个gerstner wave，水面顶点只有5000个左右所以计算量可接受。这里网格顶点距离比最短波波长的一半稍大一点，根据Nyquist theorem小波长分量会有少量失真但是波高比较小基本可以忽略。

波形部分可以参考康其润同学的分享：水体渲染-波形 [https://bytedance.feishu.cn/slides/sldcnz1D3tlELVCMUhgN5pYI0te](https://bytedance.feishu.cn/slides/sldcnz1D3tlELVCMUhgN5pYI0te)

fragment shader主要分折射部分和反射部分，两个部分用菲涅尔定律做mix。最后会对结果有一个近似的tone mapping，并且引入一个exposure factor控制散射光、反射、高光的相对比例。

折射部分是将用world normal扭曲过的RT2颜色和假定基底颜色（吸收环境光后的散射颜色，可以认为是水最“深”处的颜色，_ScatteredColor）做mix。mix factor基于近似的比尔朗伯定律，RGB三个通道的衰减呈距离的指数关系，底数为三个通道的吸收系数（_WaterAttenuation）。水底的焦散是用水底的世界空间坐标在某个平面上的投影坐标采样得到的，水底世界空间坐标可以用view direction+RT1的distance复原。下图是不同衰减系数和基底散射颜色组合+调节曝光（_ExposureFactor）的渲染结果。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920859.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920863.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920862.png)

反射部分出于性能考虑用的各向同性颜色+blinnphong高光，为了提升高光的效果近似模拟了一下球形光源，对blinnphong模型有稍作修改（_SpecularRadius）。另外最开始发现整体水效有些突兀，和岩壁场景融合的不是很好；观察后发现主要问题是岩壁附近的反射没有衰减和遮挡，使用RT1的距离信息对反射做衰减后问题解决。下图是添加反射遮挡前后对的对比。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920865.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920867.png)

下图是模拟不同半径球形光源高光的对比。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920864.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920868.png)

creator参数面板如图所示：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152920860.png)

几种不同效果的动效：

[附件：1.mov](https://bytedance.larkoffice.com/file/Gu6JbrnXFoXP85x6jtScRiCynIe)

[附件：2.mov](https://bytedance.larkoffice.com/file/ZnvjbLnDHoq3rGx6w3bcmgaXnv5)

[附件：3.mov](https://bytedance.larkoffice.com/file/AlfKb9RkIoNNQcxIjn1czkkSnob)

[附件：4.mov](https://bytedance.larkoffice.com/file/SAblblp8PowIOKxUR6acCCfYngc)

[附件：5.mov](https://bytedance.larkoffice.com/file/MIz6blh4Co8W2bxHidPcJvpan63)

AR+地面分割+水族馆资源包（710）：

[附件：aquarium.zip](https://bytedance.larkoffice.com/file/QjAAbCEzUo9TzDxoB10cW67enhg)

creator工程（可能需要pro550）：

[附件：aqua_ar.ecpj](https://bytedance.larkoffice.com/file/XAD3bCO6toEB9ZxUgdqcPV87n8e)
