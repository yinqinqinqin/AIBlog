# 基于matcap的材质制作流程设想

## matcap是什么

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152942952.jpg)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152942955.png)

原理：用相机空间的法线对材质球的截图进行采样

## 擅长表现什么

整体有固定颜色物体的光影

## 优势

1. 制作新材质足够快速高效

1. 可以制作移动端难以实时渲染的复杂材质

1. 计算量非常小

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152942957.png)

## 使用限制

1. 光源方向无法变化

1. 不能清晰的反射

## 制作流程

没用的技术千篇一律，靠谱的流程万里挑一

so ,how?

3D美术 -- Substance Painter & ZBrush & Blender & ……

SP的材质：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152942953.png)

SP的smart material，可以方便的混合，多层叠加，做旧，有各种参数：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902153003568.png)

ZB的材质库：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152942954.png)

2D -- PS & 准备材质库

google到的matcap图片，可以收集起来作为2D材质库

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152942956.png)

期望流程

| TA写模板；（多个matcap贴图分通道各种混合） | 3D美术寻找合适的材质；调整光源方向及材质各种参数，截图 | 2D美术(需求方)PS调整；用截图或现有图片PS成理想的效果 |
| --- | --- | --- |

## 实际使用案例：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902153003567.png)

todo:

需要总结使用场合
