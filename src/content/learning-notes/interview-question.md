---
title: 面试 - InterviewQuestion
category: learning-notes
date: 2026-08-27
readTime: 9 min read
excerpt: 面试 学习记录，整理 一、实时渲染管线、二、材质和 Shader、1. PBR基础 等内容。
tags: [面试]
cover: ""
---

# 一、实时渲染管线

这是渲染向 TA 最重要的部分之一。

需要掌握：

- CPU 如何提交 Draw Call；
- 顶点着色器、光栅化、像素着色器；
- Early-Z、Depth Prepass；
- Base Pass；
- GBuffer；
- Lighting Pass；
- 阴影 Pass；
- 半透明 Pass；
- 后处理；
- Tonemap；
- UI 合成；
- Present。

UE 方向重点理解：
$$
GameThread \rightarrow RenderThread \rightarrow RHIThread \rightarrow GPU
$$
常见面试题：

1. Forward 和 Deferred 有什么区别？
2. 为什么延迟渲染不擅长处理透明物体？
3. GBuffer 中通常保存什么？
4. 为什么法线、粗糙度可以放进 GBuffer，但完整材质逻辑不能？
5. Base Pass 在做什么？
6. PrePass 有什么作用？
7. Early-Z 为什么能提升性能？
8. 为什么开启 Masked 材质后 Early-Z 行为可能发生变化？
9. 后处理发生在光照前还是光照后？
10. Tonemap 为什么通常在 HDR 光照计算之后？

更高级一点会问：

- Mesh Draw Command；
- Mesh Pass Processor；
- RDG；
- Render Target 生命周期；
- Compute Shader 和 Pixel Shader 的区别；
- Forward+ 或 Clustered Lighting；
- Shader 编译和 Shader Permutation。

------

# 二、材质和 Shader

你目前在这一部分已经有一定积累，但面试不只问“会不会连节点”，而是问你是否理解底层原因。

# 1. PBR基础

必须掌握：

- Base Color；
- Metallic；
- Roughness；
- Specular；
- Normal；
- AO；
- Emissive；
- Opacity；
- Clear Coat；
- Anisotropy。

常见问题：

- 金属为什么没有漫反射？
- 金属的反射颜色来自哪里？
- 非金属的 F0 通常表示什么？
- Roughness 如何影响高光形状？
- 为什么 Metallic 通常不应该大量使用中间灰？
- AO 为什么不应该直接影响直接光？
- Emissive 为什么不等于真正光源？

# 2. BRDF

至少要理解：
$$
f_r=f_d+f_s
$$
镜面反射通常可以拆成：
$$
f_s=\frac{DGF}{4(N\cdot L)(N\cdot V)}
$$
分别知道：

- $D$：法线分布函数；
- $G$：几何遮蔽项；
- $F$：菲涅耳项。

不一定要求现场完整推导 GGX，但必须能够解释：

- GGX 为什么比 Blinn-Phong 更符合真实高光；
- Fresnel 为什么在掠射角更强；
- Roughness 如何改变微表面分布；
- 能量守恒是什么。

# 3. Shader实际知识

需要掌握：

- `step`、`smoothstep`、`lerp`；
- `dot`、`cross`、`reflect`；
- `frac`、`floor`、`fmod`；
- `ddx`、`ddy`、`fwidth`；
- Texture Sample、Sampler；
- Mip Level；
- Texture LOD；
- Dynamic Branch；
- Static Switch；
- Shader Permutation；
- Vertex Shader 和 Pixel Shader 的适用范围；
- Custom Node 和原生 `.ush/.usf` Shader 的区别。

面试经常给一个效果，让你说明实现思路，例如：

- 溶解；
- 描边；
- 扫光；
- 水面；
- 屏幕空间扭曲；
- 视差；
- SDF 遮罩；
- 卡通分层；
- 各向异性；
- 雪地覆盖；
- 交互波纹。

UE 材质系统支持节点化材质、材质实例和 Shader 开发；实际优化时需要同时关注材质指令、纹理采样和 Shader 复杂度。

------

# 三、坐标空间和数学

你当前正在学习的内容属于这一部分。

必须熟练区分：

- Local Space；
- Object Space；
- World Space；
- Translated World Space；
- View Space；
- Clip Space；
- NDC；
- Screen Space；
- Tangent Space；
- Light Space。

高频问题：

1. World Position 如何转换成 Screen UV？
2. Screen UV 如何利用深度重建 World Position？
3. 为什么方向向量 $w=0$，位置 $w=1$？
4. 为什么法线不能简单乘模型矩阵？
5. 为什么法线需要逆转置矩阵？
6. TBN 是什么？
7. Camera Vector 的方向到底是相机到像素，还是像素到相机？
8. `reflect(-V,N)` 为什么可能需要负号？
9. Clip Space 为什么还没有进行 `/w`？
10. Viewport UV 和 Buffer UV 有什么区别？

还要掌握：

- 点积和投影；
- 叉积和坐标基；
- 重心坐标；
- 透视正确插值；
- Ray–Plane Intersection；
- Ray–Sphere Intersection；
- SDF；
- Hash 和 Noise；
- 四元数基础；
- 欧拉角和万向节锁。

------

# 四、灯光、阴影和曝光

# 1. 灯光

需要理解：

- Directional Light；
- Point Light；
- Spot Light；
- Rect Light；
- Static、Stationary、Movable；
- 直接光和间接光；
- Skylight；
- Reflection Capture；
- IBL；
- Light Function。

常见问题：

- 为什么阴影不是完全黑色？
- Skylight 提供的是直接光还是间接环境光？
- 为什么增加光源数量会增加成本？
- Deferred 为什么比较适合多光源？
- Forward+ 是如何处理多光源的？
- 半透明材质怎么接受光照？

# 2. 阴影

需要掌握：

- Shadow Map；
- CSM；
- VSM；
- Distance Field Shadow；
- Contact Shadow；
- Ray Traced Shadow；
- Shadow Bias；
- Shadow Acne；
- Peter Panning；
- PCF 和软阴影基本原理。

# 3. UE5重点系统

需要知道这些系统之间的关系：

- Nanite：几何；
- Lumen：动态全局光照和反射；
- Virtual Shadow Maps：高分辨率阴影；
- World Partition：大世界管理；
- TSR：时域超分辨率。

不能只知道“效果好”，还需要回答：

- 适用条件；
- 不支持或不擅长什么；
- 性能成本；
- 出现问题如何诊断；
- 如何降级。

Epic 的文档明确描述了 Nanite、Lumen 和 Virtual Shadow Maps 之间的协作关系，同时也强调这些功能仍然具有实际限制和性能成本。

------

# 五、性能优化与性能分析

这是技术美术面试的必考部分。

最重要的不是背“优化方法”，而是建立正确流程：
$$
\boxed{
发现问题\rightarrow确定瓶颈\rightarrow定位Pass\rightarrow验证原因\rightarrow修改\rightarrow重新测量
}
$$

# 1. 帧时间

必须能计算：
$$
60FPS\approx16.67ms
$$
不能只说“FPS 下降了”，要判断：

- Game Thread Bound；
- Render Thread Bound；
- GPU Bound；
- Memory Bound；
- Loading/Stall。

# 2. 常用工具

UE 中需要知道：

- `stat unit`；
- `stat gpu`；
- `ProfileGPU`；
- Unreal Insights；
- GPU Visualizer；
- Shader Complexity；
- Quad Overdraw；
- Light Complexity；
- Primitive Stats；
- Memory Insights；
- RenderDoc。

Unreal Insights 可以分析 CPU、GPU、内存、网络和资产加载等数据；Epic 也建议结合 Shader Complexity、材质指令数及具体 GPU Pass 来验证优化，而不是凭感觉判断。

# 3. 常见性能知识点

需要区分：

- Draw Call 数量；
- 三角形数量；
- Pixel Shader 成本；
- Overdraw；
- 带宽；
- 纹理显存；
- Shader 指令；
- Texture Sample；
- Shader Permutation；
- 动态阴影；
- 半透明排序；
- GPU 粒子；
- CPU 粒子。

高频问题：

- Draw Call 多和三角形多，哪个更严重？
- 透明烟雾为什么三角形很少却很贵？
- 为什么全屏后处理成本高？
- 为什么 Shader 指令少不代表一定快？
- 为什么纹理采样受缓存和带宽影响？
- 为什么分辨率下降能明显提高某些效果的性能？
- Instance、ISM、HISM 和普通 Actor 有什么区别？
- Nanite 是否意味着完全不用关心三角形数量？

------

# 六、纹理与资产规范

# 1. 纹理基础

必须掌握：

- 分辨率；
- Mipmap；
- Texture Streaming；
- Texture Compression；
- sRGB；
- Linear Space；
- BC 压缩；
- Channel Packing；
- Virtual Texture；
- UDIM；
- Texel Density。

常见问题：

- Base Color 为什么开 sRGB？
- Roughness、Metallic、Normal 为什么通常不开 sRGB？
- 法线贴图为什么大部分是蓝色？
- DirectX 和 OpenGL 法线贴图有什么区别？
- Mipmap 如何减少远处闪烁？
- 一张 RGBA8 纹理占多少内存？
- 为什么纹理磁盘体积不等于运行时显存？
- 为什么 UV 边缘会出现黑线或颜色泄漏？

一个未压缩 RGBA8 纹理的基础级显存可以近似计算为：
$$
Width\times Height\times4\text{ Bytes}
$$
加上完整 Mipmap 后，大约再增加三分之一。

# 2. 模型资产

需要掌握：

- Pivot；
- Scale；
- 坐标轴；
- UV；
- Lightmap UV；
- Normal；
- Tangent；
- Smoothing Group；
- LOD；
- Nanite；
- Collision；
- Socket；
- Vertex Color；
- Morph Target。

常见问题：

- Blender 导入 UE 为什么缩放异常？
- 为什么法线在 Blender 正常，进入 UE 后错误？
- 硬边和 UV 切缝有什么关系？
- 什么情况下应当拆 UV？
- 什么情况下需要自定义法线？
- 为什么负缩放可能导致三角形翻面？

------

# 七、工具开发和流程自动化

渲染向 TA 不一定以工具为主，但企业通常希望你能够减少重复劳动。

需要掌握三种层级：

# Blueprint

适合：

- 快速原型；
- Editor Utility Widget；
- Asset Action Utility；
- Actor Action Utility；
- 简单批处理；
- 美术可维护工具。

# Python

适合：

- 批量重命名；
- 导入导出；
- 检查资产；
- 自动设置参数；
- 跨 DCC 流程；
- 构建资产管理管线。

# C++

适合：

- 高性能运行时工具；
- 深度编辑器扩展；
- 自定义节点；
- 自定义资产类型；
- Slate；
- 引擎接口；
- 需要稳定维护的正式插件。

高频问题：

- Blueprint、Python 和 C++ 怎么选？
- Python 为什么通常只用于编辑器？
- 如何保证批处理失败后不会破坏资产？
- 如何支持 Undo/Redo？
- 如何设计资产命名检查工具？
- 如何检查错误材质、错误分辨率、缺失 LOD？
- 如何设计团队能使用而不是只有自己能使用的工具？

UE 官方提供 Blueprint、Python、Editor Utility、Scripted Actions 和 Data Validation 等编辑器自动化方案，可以用于资产导入、管理、验证和批处理。

------

# 八、Niagara、PCG和程序化技术

# Niagara

需要了解：

- System、Emitter、Particle；
- Spawn 和 Update；
- CPU Simulation；
- GPU Simulation；
- Data Interface；
- Collision；
- Event；
- Ribbon；
- Mesh Particle；
- Bounds；
- Sort；
- Overdraw；
- Effect Type 和 Scalability。

面试题：

- 什么时候用 GPU 粒子？
- GPU 粒子为什么不一定总比 CPU 粒子好？
- 粒子消失可能是不是 Bounds 问题？
- 烟雾如何优化 Overdraw？
- Niagara 如何读取 Scene Depth、Mesh Data 或 Render Target？

Epic 为 Niagara 提供了独立的性能测量、Debugger、GPU Tick、Shader Complexity 和 Scalability 工作流。

# PCG

需要了解：

- Point Data；
- Attribute；
- Seed；
- Deterministic；
- Spatial Query；
- Density；
- Bounds；
- Runtime Generation；
- Partition；
- GPU PCG；
- 缓存和内存预算。

常见问题：

- PCG 和普通蓝图生成有什么区别？
- 如何保证结果可重复？
- 如何避免运行时生成卡顿？
- 大量实例为什么应该配合 HISM 或 GPU Processing？
- PCG 工具如何暴露给关卡美术使用？

UE 的 PCG 系统不仅用于内容生成，也包含 GPU 执行、运行时调试、缓存和内存预算等技术问题。

------

# 九、动画和角色管线

即使不是角色向 TA，也常会考基础。

需要掌握：

- Skeleton；
- Bind Pose；
- Skinning；
- Bone Weight；
- Animation Sequence；
- Animation Blueprint；
- State Machine；
- Blend Space；
- Layered Blend Per Bone；
- Root Motion；
- IK；
- Control Rig；
- Morph Target；
- Retargeting；
- Socket；
- Cloth；
- VAT；
- Pivot Painter。

基础蒙皮公式：
$$
P'=\sum_i w_iM_iP
$$
常见问题：

- 为什么权重总和需要接近 1？
- Bind Pose 逆矩阵有什么作用？
- Root Motion 和 In-Place 动画有什么区别？
- Morph Target 为什么导入后不存在？
- 两个动画如何同时作用于不同骨骼？
- VAT 和骨骼动画的优缺点是什么？
- Pivot Painter 适合哪些类型的物体？

------

# 十、调试和问题定位

面试官可能不会直接问定义，而是给你一个错误现象：

> 材质出现黑边，你怎么查？

> 法线方向错误，你怎么查？

> GPU突然增加 5ms，你怎么查？

> 物体缩小后羽化仍然存在，你怎么查？

应该展示系统化方法：

1. 确认可复现条件；
2. 判断是资产、材质、渲染设置还是引擎问题；
3. 将复杂效果逐步关闭；
4. 输出中间变量；
5. 检查坐标空间；
6. 检查数值范围；
7. 检查 NaN、除零和精度；
8. 查看对应 GPU Pass；
9. 使用 RenderDoc 检查资源和 Shader；
10. 修改后重新测量，而不是只看视觉结果。

当前高级 TA 岗位会直接要求候选人能够调试帧预算、修复损坏的 Shader，并处理资产和渲染问题。

------

# 十一、工程与团队能力

这一部分容易被忽视。

需要掌握：

- Git 或 Perforce；
- 分支和冲突处理；
- 命名规范；
- 文件夹规范；
- 技术文档；
- 参数暴露；
- 错误提示；
- 版本兼容；
- 平台差异；
- 性能预算；
- 可维护性；
- 工具用户体验。

面试可能问：

- 美术要求非常昂贵的效果怎么办？
- 程序认为效果性能不合格，你怎么沟通？
- 你制作的工具如何让其他人使用？
- 如何定义资产规范？
- 如何处理历史资产不符合新规范？
- 你的材质如何支持多个项目和多种质量等级？

技术美术岗位本身就是连接美术和工程的职位，因此当前招聘要求不仅关注结果，也强调可扩展流程、文档、沟通和团队工具。

# 十二、作品集追问

你的每个作品最好能回答下面的问题：

1. 这个效果的目标是什么？
2. 为什么采用这个方案？
3. 有哪些替代方案？
4. 技术原理是什么？
5. CPU 和 GPU 分别做了什么？
6. 使用了哪些坐标空间？
7. 最贵的部分是什么？
8. 如何测量性能？
9. 优化前后数据是多少？
10. 有哪些限制？
11. 如何暴露参数给美术？
12. 如何在不同质量等级下降级？
13. 能否批量使用？
14. 是否可以复用？
15. 出现过什么问题，如何定位？

不要只展示：

> 我做了一个很好看的效果。

最好展示：
$$
\boxed{\text{视觉目标＋技术原理＋性能数据＋工具化＋问题复盘}}
$$

# 按你的情况，最需要补强的内容

根据你前面提到的项目，你的优势已经比较明确：

- UE材质和Shader效果；
- BRDF和渲染管线学习；
- 后处理和屏幕空间效果；
- RenderDoc；
- 体积云、天气和卡通渲染；
- PCG、Pivot Painter、动画流程；
- Blueprint、C++插件和Slate；
- Blender脚本及资产流程。

现在应该优先补强：

# 第一优先级

- 系统化性能分析；
- Unreal Insights、ProfileGPU、RenderDoc配合使用；
- 每个作品给出明确的毫秒、Draw Call、显存或 Shader 成本；
- 深度、坐标空间、法线矩阵、TBN彻底掌握。

# 第二优先级

- Shader Permutation；
- Static Switch 和动态分支；
- 材质架构和质量分级；
- Texture Streaming、Mip、压缩和显存计算；
- Nanite、Lumen、VSM 的限制与排错。

# 第三优先级

- Python或C++资产检查工具；
- Data Validation；
- 自动导入、命名、贴图设置、LOD检查；
- 工具的错误处理、Undo和文档。

# 第四优先级

- UE渲染源码框架；
- Renderer、RenderCore、RHI；
- RDG；
- Mesh Pass；
- Shader注册与编译；
- 找到 RenderDoc Event 对应的 C++ 和 Shader 文件。

对你这种**渲染向技术美术**，不需要所有模块达到同样深度。比较合理的能力结构是：
$$
\boxed{
\text{Shader/渲染深入}
+
\text{性能分析扎实}
+
\text{工具开发可用}
+
\text{其他管线能够排错}
}
$$
比“所有模块都学一点但没有核心优势”更适合作品集和面试。
# 总结分析

- 这篇主要记录 `InterviewQuestion` 相关内容，核心集中在 一、实时渲染管线、二、材质和 Shader、1. PBR基础。
- 归类到 `面试` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
