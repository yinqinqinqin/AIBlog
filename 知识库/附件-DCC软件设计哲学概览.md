# DCC软件设计哲学概览

原始附件：[DCC软件设计哲学概览.pptx](./resources/DCC软件设计哲学概览.pptx)

## 第 1 页

DCC软件设计哲学概览

Maya Max Houdini C4D Blender

## 第 2 页

Maya

设计哲学和数据组织方式：高效数据库和操作接口Maya Open API
模块化：模型 动画 特效等
界面和操作脚本化，界面的交互模式成为电影生产标准，Mel
因为以上形式，Maya特别容易扩展：脚本扩展和插件扩展，非常容易自定义流程和开发项目流程，新的扩展调用形式和Maya一致

## 第 3 页

![幻灯片图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902154949177.png)

## 第 4 页

Maya API

https://help.autodesk.com/view/MAYAUL/2022/ENU/?guid=Maya_SDK_cpp_ref_group_open_maya_anim_html

PxNode
MFn

## 第 5 页

Houdini

设计哲学：Unix+shell，Pipe+正则表达式+vex，节点即工具, 数据一般不在Houdini中，而是在Houdini外部（参数设置除外）
数据：/路径/.../Primitive（数据、参数）

https://www.sidefx.com/docs/hdk/index.html

## 第 6 页

C4D

设计哲学：超级稳定和模块化，标签+xpresso，现在大量的节点化
https://help.maxon.net/c4d/en-us/

## 第 7 页

Blender

设计哲学：小而全，模式+开放的文件格式

## 第 8 页

Modo

设计哲学：Lightwave的继承者，精确的尺寸细分建模和雕刻

## 第 9 页

Max

设计哲学和数据组织方式：堆栈+修改器，数据开放

## 第 10 页

其他的

https://3dcoat.com/
https://pixologic.com/
https://shade3d.jp/en/
http://www.wings3d.com/ 
http://www.makehumancommunity.org/

## 第 11 页

没有一个中国开发的

CAD领域里面有
游戏引擎有，没有开放的
