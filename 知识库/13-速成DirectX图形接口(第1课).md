# 速成DirectX图形接口（第1课）

作者：

会议记录：https://bytedance.feishu.cn/minutes/obcn5h6qqrb3xy2pqbk1q613

会议里讲的比文档内容还要多哦～

第二课链接： [速成DirectX图形接口（第2课）](https://bytedance.feishu.cn/docs/doccntVxavzma09rHlMdOf25eOf)

## 【前言】

#### 知识来源

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335073.png)

[附件：Introduction to 3D Game Programming with Directx 11.pdf](https://bytedance.larkoffice.com/file/PDo9bt02ooaWlkxTeEEcGYtYnTc)

[附件：DX11中译.pdf](https://bytedance.larkoffice.com/file/KXd9bcT97oVT5Ax42PCc1nTtnee)

#### 知识储备

###### 必备基础：

C++基础、基本数据结构、智能指针、VisualStudio使用与断点调试

###### 会则更好：

线性代数、3D数学、渲染管线、Shader语言、OpenGL、Vulkan等

#### 什么是DirectX？

知乎简介：DirectX（Direct eXtension）是由微软公司创建的多媒体编程接口。由C++ 编程语言实现，遵循COM。被广泛使用于Microsoft Windows、Microsoft XBOX、Microsoft XBOX 360和Microsoft XBOX ONE电子游戏开发。最新版本为DirectX 12，创建在最新的Windows10。 DirectX 包括安全和性能更新程序，以及许多涵盖所有技术的新功能，加强3D 图形和声音效果，并提供设计人员一个共同的硬件驱动标准，让游戏开发者不必为每一品牌的硬件来写不同的驱动程序，也降低了用户安装及设置硬件的复杂度

#### DirectX和OpenGL的区别？

OpenGL：只包含图形函数库

DirectX：一整套多媒体编程接口。不仅包含图形，还包含声音、输入、网络等模块

OpenGL：跨平台，连工业界的硬件都有支持

DirectX：抱紧微软爸爸大腿～但绝大多数PC游戏都是用DirectX的

OpenGL：性能和画面质量适中，draw调用比DX更快

DirectX：性能表现非常好，尤其在3D画面渲染方面极为出色

OpenGL：使用右手坐标系

DirectX：使用左手坐标系

## 【第一章】前置知识：认识DX的基本组件

#### device、context

D3D设备（ID3D11Device）通常代表一个显示适配器（即显卡），它最主要的功能是用于创建各种所需资源，最常用的资源有：资源类（ID3D11Resource, 包含纹理和缓冲区），视图类以及着色器。此外，D3D设备还能够用于检测系统环境对功能的支持情况。

D3D设备上下文(ID3D11DeviceContext)代表整条渲染管线。通常我们在创建D3D设备的同时也会附赠一个立即设备上下文(Immediate Context)。一个D3D设备仅对应一个D3D立即设备上下文

设备和上下文只要我们拥有其中一方，就能通过各自的方法获取另一方（即ID3D11Device::GetImmediateContext和ID3D11DeviceContext::GetDevice）。

#### handle

handle句柄（32位的unsigned int，像指针，是特殊的智能指针，用来标识内存中的不同实例）

HWND（即handle to a window窗口句柄类型）

#### COM 组件对象模型

百度定义：COM 组件是微软公司为了计算机工业的软件生产更加符合人类的行为方式开发的一种新的软件开发技术。在COM构架下，人们可以开发出各种各样的功能专一的组件，然后将它们按照需要组合起来，构成复杂的应用系统

阐释：其实质为一组函数指针表，一般当做c++的类来用，需初始化，用Release释放，大多数COM对象就是 .dll文件                    注：COM接口都以I为前缀（例:IUnknown）

#### ComPtr智能指针

DirectX11的API是由一系列的COM组件来管理的，这些前缀带I的接口类最终都继承自IUnknown接口类，程序员在复制、删除IUnknown对象时需要手动地对引用计数进行加一、减一，如果出现了忘记释放某个接口指针的情况话，内存泄漏的报错会占满屏幕，并且要你花很久的时间去调试

为了避免上述问题，从繁杂的人工释放指针中解脱，我们大量使用了ComPtr智能指针，如下

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335076.png)

#### DXGI

DirectX Graphics Infrastructure

DXGI是windows系统中用户模式下最底层的图形设备接口

https://blog.csdn.net/yibu_refresh/article/details/53219530

#### DXGI的反走样

详细原理请看闫的GAMES101

#### DXGI的SwapChain

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335074.png)

Video Memory负责缓存图像，而对于交换链可简单理解为缓存的 buffer 控制。一般交换链有多个缓冲区，一个前缓冲（为正在显示的buffer），一个或者多个后缓冲。（例如：一帧图像在显示的时候，另一帧图像在一个后缓冲buffer中处理并等待显示，如下图：）

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335075.png)

## 【第一章】实战：初始化DX

[附件：01 DirectX11初始化.rar](https://bytedance.larkoffice.com/file/Wbnob2Rklo5qoVxP9JEcKyKTn8d)

1. 向Windows操作系统申请一个主窗口

1. 初始化DX

1. 初始化DXGI

## 【第二章】前置知识：认识DX的shader

#### HLSL语法入门

类型：float4、float4x4等等

控制流的属性：[flatten]、[unroll]

```plain%20text
[flatten]
if (x)
{
    x = sqrt(x);
}
```

```plain%20text
times = 4;
sum = times;
[unroll]
while (times--)
{
    sum += times;
}
```

函数特点：按值传递、不支持递归

函数形参的类别：

内置的数学函数：

#### DX编译shader代码的方法

初次编译，DX会在本地为每个hlsl文件生成一个已编译的.cso文件

DX处理shader的逻辑是，优先读取本地的.cso文件，若本地无.cso文件则会重新编译hlsl文件

因此需要注意：若修改了shader代码，想重新编译看看效果，必须先在文件夹里删除原来的.cso文件哦～

#### HLSL常量缓冲区的打包规则

核心：HLSL常量缓冲区是以16字节为一块的

1、C++中的结构体数据是以字节“流”的形式传输给HLSL的；

例

2、HLSL常量缓冲区中的块（16字节）是不允许拆分的；

例

3、HLSL常量缓冲区中的块（16字节）若有空缺且能容纳当前变量，则优先打包进这个块中；

例

4、HLSL常量缓冲区中如果打包结构体，那么结构体的第一个元素不会稀罕有空缺的块（16字节），而是另开一块新块，从第一个元素开始打包；

例

5、数组中的每一个元素都会独自打包成块（16字节），如果数组元素的类型不是16字节的话，那将非常浪费空间

例

[附件：举例.txt](https://bytedance.larkoffice.com/file/Pa7jbSS75ozJQtxmWigcTSz1nfd)

#### 图元类型

枚举D3D_PRIMITIVE_TOPOLOGY

#### c++端怎么传数据给到shader？

1、c++定义一个与hlsl对应的结构体，起名为CBStruct

```cpp
  struct CBStruct
  {
    DirectX::XMVECTOR Color;
    int Enabled;
    float Start;
    float Range;
    float pad;//16字节对齐的填充物，无用
  };
```

2、c++声明一个CBufferObject

```cpp
CBufferObject<序号,CBStruct>  m_CBStruct;
```

3、创建顶点着色器和像素着色器

```cpp
CreateShaderFromFile(顶点着色器hlsl文件路径)
CreateVertexShader()
CreateInputLayout() //创建顶点输入布局

CreateShaderFromFile(像素着色器hlsl文件路径)
CreatePixelShader()
```

4、指向m_CBStruct的指针调用CreateBuffer()

```cpp
CBufferObject指针->CreateBuffer(device));
```

## 【第二章】实战：用DX画一个三角形

1. 创建并绑定着色器

1. 初始化缓冲区并把资源放到缓冲区

1. 为渲染管线的各个阶段绑定好所需的资源

1. 进入update
