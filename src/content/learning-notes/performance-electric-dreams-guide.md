---
title: 性能优化 - Electric Dreams 性能优化作品集执行手册（精简重写版）
category: learning-notes
date: 2026-08-27
readTime: 13 min read
excerpt: 性能优化 学习记录，整理 目录、1. 整套优化只按这一条路线执行、1.1 固定测试条件 等内容。
tags: [性能优化]
cover: ""
---

> 这份手册只保留两类内容：必要的数据记录，以及可以直接照着操作的 Electric Dreams 优化步骤。

> 当前测试机：Intel Core Ultra 7 265K、RTX 5060 8GB、64GB内存、NVMe SSD。主线目标为 1920×1080、50% Screen Percentage、60 FPS / 16.67 ms。

> 主线地图：`/Game/Levels/PCG/ElectricDreams_PCGCloseRange`。完整 `ElectricDreams_Env` 地图只在最后做可选验证，不参与前期优化。

---

# 目录

1. [整套优化只按这一条路线执行](#1-整套优化只按这一条路线执行)
2. [数据记录速查](#2-数据记录速查)
3. [修改前先准备工作副本](#3-修改前先准备工作副本)
4. [优化一：解决8GB显存超预算](#4-优化一解决8gb显存超预算)
5. [优化二：减少PCG河床与悬崖中的无效小物件](#5-优化二减少pcg河床与悬崖中的无效小物件)
6. [优化三：植被阴影、WPO和VSM](#6-优化三植被阴影wpo和vsm)
7. [优化四：大型悬崖与Nanite Overdraw](#7-优化四大型悬崖与nanite-overdraw)
8. [优化五：河床、岩石和植被材质](#8-优化五河床岩石和植被材质)
9. [优化六：Lumen GI与反射](#9-优化六lumen-gi与反射)
10. [优化七：第一次运行与加载卡顿](#10-优化七第一次运行与加载卡顿)
11. [最终测试与性能录制](#11-最终测试与性能录制)
12. [建议实际执行顺序](#12-建议实际执行顺序)
13. [命令速查](#13-命令速查)
14. [最终检查清单](#14-最终检查清单)

---

# 1. 整套优化只按这一条路线执行

不要一次修改很多系统。严格按照下面顺序：

```text
建立工作地图
→ 固定测试条件
→ 记录Baseline
→ 先解决显存报警
→ 优化PCG小物件
→ 优化植被阴影和WPO
→ 优化Nanite重叠
→ 优化热点材质
→ 最后才调整Lumen
→ 处理加载卡顿
→ 最终三次测试
```

每完成一个步骤都必须：

1. 只修改一个变量；
2. 保存修改前截图；
3. 使用同一条相机路线；
4. 预热一次；
5. 正式测试三次；
6. 如果没有稳定改善就恢复，不继续叠加修改。

# 1.1 固定测试条件

优化前后保持：

```text
地图：ED_CloseRange_Working
分辨率：1920×1080
Screen Percentage：50
画质等级：High
VSync：关闭
帧率上限：关闭
Lumen模式：固定
Hardware Ray Tracing：固定
测试路线：同一个Level Sequence
测试方式：Standalone对Standalone
```

进入测试后输入：

```text
r.VSync 0
t.MaxFPS 0
r.DynamicRes.OperationMode 0
r.ScreenPercentage 50
```

# 1.2 哪些操作不能算内容优化

下面操作可以提高帧率，但必须单独标注为画质伸缩，不能和内容优化混在一起：

- 把 Screen Percentage 从50降低到更低；
- 把High直接改成Low；
- 完全关闭Lumen；
- 完全关闭阴影；
- 把CloseRange结果冒充完整 `ElectricDreams_Env` 结果。

---

# 2. 数据记录速查

你已经理解数据记录，本章只保留必须使用的内容。

# 2.1 屏幕上显示的数据

```text
stat fps
stat unit
```

重点看：

```text
Frame：总帧时间
Game：游戏线程
Draw：渲染线程
GPU：显卡帧时间
```

60 FPS要求：

```text
Frame ≤ 16.67 ms
GPU ≤ 16.67 ms
```

# 2.2 GPU Pass

```text
stat gpu
profilegpu
```

只记录最贵的前五项，例如：

```text
BasePass
Virtual Shadow Maps
Lumen Screen Probe Gather
Lumen Reflections
Nanite
TSR
Translucency
```

# 2.3 纹理与显存

```text
stat streaming
```

记录：

```text
Texture Pool
Wanted Pool
Over Budget
是否出现Video Memory Exhausted
```

# 2.4 最小记录表

```markdown
| 版本 | FPS | Frame ms | Game ms | Draw ms | GPU ms | Texture Over Budget | 显存警告 |
|---|---:|---:|---:|---:|---:|---:|---|
| Baseline | | | | | | | |
| 修改后 | | | | | | | |
```

---

# 3. 修改前先准备工作副本

# 3.1 复制地图

1. 打开内容浏览器；
2. 定位：

```text
/Game/Levels/PCG/ElectricDreams_PCGCloseRange
```

3. 右键地图；
4. 选择 **Duplicate（复制）**；
5. 新建目录：

```text
/Game/PortfolioOptimization/Maps
```

6. 保存为：

```text
/Game/PortfolioOptimization/Maps/ED_CloseRange_Working
```

7. 以后只打开 `ED_CloseRange_Working`。

# 3.2 创建自己的资产目录

```text
/Game/PortfolioOptimization/
├── Maps
├── PCG
├── Materials
├── Meshes
└── Sequences
```

修改PCG Graph、材质或Mesh之前先复制到自己的目录。不要直接覆盖官方资产。

# 3.3 每次修改的恢复方法

最简单的做法：

1. 修改前复制目标资产；
2. 后缀命名：

```text
_Original
_Test01
_Optimized
```

3. 每次只让工作地图引用测试副本；
4. 测试失败时把引用换回 `_Original`。

---

# 4. 优化一：解决8GB显存超预算

你已经实际遇到：

```text
Video memory has been exhausted
```

因此显存是第一项必须处理的问题。显存超预算时，纹理会反复换入换出，帧率测试也会不稳定。

# 4.1 先确认问题是否来自纹理

1. 重启UE；
2. 只打开 `ED_CloseRange_Working`；
3. 不打开完整 `ElectricDreams_Env`；
4. 关闭材质编辑器、Static Mesh Editor和不用的Sequencer；
5. 将视口Screen Percentage设置为50%；
6. 进入Standalone；
7. 输入：

```text
stat streaming
stat unit
```

8. 等待30秒；
9. 记录是否显示 `Over Budget`。

判断：

```text
stat streaming也Over Budget
→ 纹理是主要原因之一，继续4.2和4.3。

stat streaming正常，但仍显示显存耗尽
→ 还可能是RTAS、VSM、Lumen Render Target或Nanite Buffer，继续4.2和4.4。
```

# 4.2 使用Render Resource Viewer找到最大的资源

1. 回到编辑器；
2. 点击顶部 **Tools（工具）**；
3. 打开 **Render Resource Viewer**；
4. 点击 **Refresh**；
5. 点击 `Size` 列，从大到小排列；
6. 截图前20项；
7. 查看每一项的 `Flags` 和 `Owner`。

重点区分：

```text
Streaming：纹理
Render Target：分辨率、后处理、Lumen、阴影相关资源
RTAS：硬件光追加速结构
Vertex/Index Buffer：网格和Nanite数据
```

定位资产：

1. 右键资源；
2. 选择 **Browse to Asset**，或者按 `Ctrl+B`；
3. 记录资产路径；
4. 判断它是否真的在测试镜头中出现。

只处理同时满足下面两项的资源：

- 位于前20项；
- 在固定测试路线中确实可见。

# 4.3 逐张降低不必要的纹理分辨率

每次只处理3～5张纹理。

## 打开纹理后检查

```text
Imported Size
Displayed Size
Max Texture Size
Texture Group
Mip Gen Settings
Never Stream
Compression Settings
```

## 大型悬崖和主岩石

1. 如果Imported Size是8192，先把 `Max Texture Size` 设为4096；
2. 保存；
3. 回到固定镜头；
4. 查看悬崖近景、法线和苔藓细节；
5. 看不出明显区别时才保留；
6. 不要直接把主悬崖降到1024。

## 河床小石头、落叶和枝条

1. 8192或4096纹理先测试2048；
2. 只在远处出现的小Mask可测试1024；
3. Base Color、Normal和Mask不要求使用相同分辨率；
4. 每次都检查湿润边缘和法线闪烁。

## Streaming设置

1. 普通场景纹理的 `Never Stream` 应关闭；
2. `Mip Gen Settings` 不应为 `NoMipmaps`；
3. Base Color使用合适的World组；
4. Normal使用WorldNormalMap组；
5. Mask通常关闭sRGB并使用正确的Masks压缩。

## 不要这样处理

```text
r.Streaming.PoolSize 0
```

这代表不限制纹理池，不是解决显存问题。

如需临时测试8GB显卡的纹理池，可先查询：

```text
r.Streaming.PoolSize
```

如果项目当前值明显高于3000MB，可以临时测试：

```text
r.Streaming.UseFixedPoolSize 1
r.Streaming.PoolSize 3000
r.Streaming.LimitPoolSizeToVRAM 1
```

如果当前值本来就小于或等于3000，不要反而把它调大。

# 4.4 如果RTAS很大，测试Software Ray Tracing

只有Render Resource Viewer中RTAS占用明显时才执行。

1. 打开：

```text
Edit
→ Project Settings
→ Engine
→ Rendering
→ Hardware Ray Tracing
```

2. 截图记录当前设置；
3. 复制一份项目配置或建立版本节点；
4. 关闭 `Use Hardware Ray Tracing when available`；
5. 按提示重启UE；
6. 等待Shader编译完成；
7. 保持1080p、50%、High不变；
8. 重新测试同一镜头；
9. 对比：

```text
GPU ms
RTAS占用
总显存警告
河床反射
悬崖暗部
植被表现
```

如果Software RT明显降低显存、帧时间更稳定且画面可接受，可以作为本机8GB档。这个结果属于设备配置，不属于内容优化。

# 4.5 显存优化通过标准

- 连续运行三次测试路线不持续显示显存耗尽；
- `stat streaming` 不持续Over Budget；
- 没有使用无限纹理池；
- 主悬崖和近景岩石仍然清晰；
- 快速移动时纹理不会反复模糊和清晰。

---

# 5. 优化二：减少PCG河床与悬崖中的无效小物件

本步骤不删除主悬崖，也不破坏河床构图。只处理数量很多、对轮廓贡献很小的：

```text
小石头
落叶
细枝
地面碎片
隐藏在大型悬崖内部的Clutter
```

先理解四个名称：

```text
PCG Actor：放在关卡里的程序化生成对象。
PCG Component：Actor中负责执行PCG的组件。
PCG Graph：决定“在哪里生成、生成多少、生成什么”的节点图。
Static Mesh Spawner：Graph末端真正生成石头、树枝等Mesh的节点。
```

你这一章真正要做的事情只有三件：减少Clutter数量、关闭小装饰碰撞、确认它们使用实例。

# 5.1 找到工作地图实际使用的PCG Graph

1. 打开 `ED_CloseRange_Working`；
2. 在World Outliner搜索：

```text
PCG
Ground
LargeAssembly
Ditch
```

3. 选择带PCG Component的Actor；
4. 在Details中找到：

```text
PCG Component
→ Graph
```

5. 点击放大镜定位Graph；
6. 记录实际路径。

Electric Dreams常见候选路径：

```text
/Game/PCG/Graphs/Ground/PCGDemo_Ground
/Game/PCG/Graphs/Forest/PCGDemo_Forest
/Game/PCG/Graphs/Ditch/PCGDemo_DitchBP
/Game/PCG/Assets/BP_PCG_LargeAssembly
```

不要求全部修改。只修改当前组件真正引用的Graph。

# 5.2 复制Graph并绑定副本

1. 右键目标Graph；
2. Duplicate到：

```text
/Game/PortfolioOptimization/PCG
```

3. 命名，例如：

```text
PCG_Ground_Test
PCG_LargeAssembly_Test
```

4. 回到工作地图；
5. 选择PCG Component；
6. 将Graph替换为测试副本；
7. 点击Generate/Regenerate；
8. 确认画面与原版完全相同；
9. 保存。

# 5.3 先找到Clutter分支，不要随便删节点

Electric Dreams的Assembly点中常见标签：

```text
Clutter：小装饰，可以降密度
NoCol：不需要碰撞
Helper：只用于生成规则，不应该最终生成Mesh
```

操作：

1. 双击打开Graph副本；
2. 在Debug Object中选择工作地图里的实际PCG Component；
3. 搜索或查找 `Clutter`；
4. 找到它连接的Point Filter、Density或随机过滤区域；
5. 在过滤前后节点上开启Debug；
6. 记录过滤前后点数；
7. 不要修改 `ApplyHierarchy`、`ActorIndex`、`ParentActorIndex` 等层级结构。

# 5.4 降低Clutter密度

优先调整Graph中已经存在的Clutter密度参数。

1. 记录原值，例如1.0；
2. 第一轮改成0.85；
3. Regenerate；
4. 检查：

```text
河床是否变空
悬崖轮廓是否改变
小石头和枝条是否仍有层次
是否出现大块空白
```

5. 测试Frame、Game、Draw、GPU；
6. 有收益且画面正常时，再测试0.75；
7. 不建议第一次低于0.75；
8. 主悬崖、大岩石、主树和轮廓资产保持原密度。

如果Graph没有现成Clutter过滤，不要直接在复杂层级Graph中随意加删除节点。先使用官方拆解地图确认结构：

```text
/Game/Levels/PCG/Breakdown_Levels/ElectricDreams_PCGLargeAssembly
/Game/Levels/PCG/Breakdown_Levels/ElectricDreams_PCGDitchAssembly
/Game/Levels/PCG/Breakdown_Levels/ElectricDreams_PCGForest
```

# 5.5 关闭NoCol和小Clutter碰撞

1. 在Graph中找到 `NoCol` 或小Clutter数据流；
2. 找到最终的 `Static Mesh Spawner`；
3. 复制Spawner设置或Descriptor；
4. 对该分支设置：

```text
Collision：NoCollision
Generate Overlap Events：关闭
Can Ever Affect Navigation：关闭
```

5. Regenerate；
6. 打开Player Collision视图；
7. 确认小石头和落叶没有碰撞；
8. 确认地面、主岩石和主悬崖仍有碰撞；
9. 进入游戏走过测试区域，确认没有穿地或卡住。

# 5.6 确认重复物体使用实例

1. 查看Static Mesh Spawner输出；
2. 河床小石头、落叶、枝条和重复岩石应使用ISM/HISM；
3. 不应每个小物体生成一个独立StaticMeshActor；
4. 不要为了随机颜色创建大量独立材质；
5. 需要颜色、湿度变化时使用Per Instance Custom Data；
6. 输入：

```text
stat scenerendering
```

7. 对比Actor、Primitive和Draw Calls。

# 5.7 PCG优化通过标准

- 只减少Clutter，没有改变主悬崖和河床结构；
- Helper不会生成最终Mesh；
- NoCol没有碰撞、Overlap和导航成本；
- 重复小物体仍使用实例；
- 没有浮空、穿插或大片空白；
- 点数、生成时间或运行时成本至少有一项改善。

---

# 6. 优化三：植被阴影、WPO和VSM

植被可能同时造成：

```text
叶片透明遮罩Overdraw
风动画WPO
Virtual Shadow Map缓存失效
大量小植被阴影
```

先理解两个名称：

```text
WPO：World Position Offset，材质用它让树叶和草产生风动画。
VSM：Virtual Shadow Maps，当前场景使用的虚拟阴影系统。
```

远处植物仍执行WPO，会浪费顶点计算，还可能让已经缓存的阴影页面反复失效。

本步骤先处理最安全的两项：小植被阴影和远距离WPO。

# 6.1 找到问题植被

1. 在固定路线找到树叶或草最多的镜头；
2. 打开：

```text
View Mode
→ Optimization Viewmodes
→ Quad Overdraw
```

3. 再打开：

```text
View Mode
→ Nanite Visualization
→ Evaluate WPO
```

4. 截图亮度最高的区域；
5. 选择其中一种树、灌木或草；
6. `Ctrl+B`定位Mesh；
7. 打开Mesh，找到叶片Material Instance和Master Material。

# 6.2 先关闭小Clutter阴影

不要先关闭主树阴影。按照这个顺序：

```text
小草、落叶、细枝
→ 小型灌木
→ 中型灌木
→ 最后才考虑主树冠
```

操作：

1. 在PCG Graph中找到小Clutter对应Spawner；
2. 复制Spawner/Descriptor；
3. 关闭该分支 `Cast Shadow`；
4. 主树干、主树冠保持阴影；
5. Regenerate；
6. 在正午、侧光和逆光各看一次；
7. 输入：

```text
profilegpu
```

8. 对比Virtual Shadow Maps时间；
9. 如果画面几乎不变而VSM下降，保留；
10. 如果地面明显失去层次，恢复并只关闭更小的物件。

# 6.3 设置小植被剔除距离

在PCG Static Mesh Spawner的实例Descriptor或对应Foliage Type中找到：

```text
Start Cull Distance
End Cull Distance
```

建议从较保守值开始测试：

```text
落叶/小枝：Start 1500，End 3000
小草：Start 2000，End 4000
灌木：Start 4000，End 8000
主树：先不修改
```

单位通常为厘米。实际值必须根据镜头调整。

1. 输入起始值；
2. Regenerate；
3. 缓慢向前移动；
4. 检查是否突然消失；
5. 如果跳变明显，提高End距离；
6. 快速飞行再检查一次；
7. 对比实例数、Draw/GPU和视觉。

# 6.4 给远距离风动画增加WPO淡出

## 准备材质副本

1. 复制植被Master Material到：

```text
/Game/PortfolioOptimization/Materials
```

2. 创建新的Material Instance；
3. 只让工作地图中的目标植被使用副本；
4. 保存原始WPO节点截图。

## 添加距离淡出节点

在材质编辑器添加：

```text
CameraPositionWS
Absolute World Position（Excluding Material Shader Offsets）
Distance
Scalar Parameter：WPO_FadeStart
Scalar Parameter：WPO_FadeEnd
SmoothStep
OneMinus
Multiply
```

连接：

```text
Distance(CameraPositionWS, Absolute World Position)
→ SmoothStep(WPO_FadeStart, WPO_FadeEnd)
→ OneMinus
→ 与原始风动画WPO相乘
→ World Position Offset
```

起始测试值：

```text
小草：1500～3000
灌木：3000～6000
树冠：5000～10000
```

验证：

1. 编译材质；
2. 缓慢远离植被；
3. 确认风动画逐渐减弱，不是突然停止；
4. 查看Nanite Evaluate WPO；
5. 查看VSM Cached Page/Invalidated Page；
6. 再次ProfileGPU；
7. 如果树冠明显僵硬，提高Fade距离。

# 6.5 查看VSM缓存是否改善

1. 打开：

```text
Virtual Shadow Map Visualization
→ Cached Page
```

2. 再查看：

```text
Shadow Casters
```

3. 固定同一镜头；
4. 等待缓存稳定；
5. 原版截图；
6. WPO淡出后截图；
7. 小Clutter阴影关闭后截图；
8. 最终测试前关闭VSM可视化，因为可视化自身有成本。

# 6.6 植被优化通过标准

- 主树阴影仍保留；
- 小Clutter阴影减少；
- 远处WPO不再大面积执行；
- VSM失效页或VSM GPU时间下降；
- 小草和枝条不会突然大片消失；
- 树冠移动没有明显僵硬分界。

---

# 7. 优化四：大型悬崖与Nanite Overdraw

CloseRange中的大型悬崖Assembly和河床岩石可能存在大量内部重叠。Nanite可以处理高三角形，但不代表无限重叠没有成本。

`Nanite Overdraw` 可以简单理解为：同一个屏幕像素后面叠了很多层Nanite几何体，GPU需要处理这些层。这个项目中应优先减少悬崖内部看不到的重复小装饰，而不是破坏外轮廓。

# 7.1 在拆解地图中定位

1. 打开：

```text
/Game/Levels/PCG/Breakdown_Levels/ElectricDreams_PCGLargeAssembly
```

2. 打开：

```text
View Mode
→ Nanite Visualization
→ Overview
```

3. 依次查看：

```text
Mask
Instances
Clusters
Overdraw
Pixel Programmable
Evaluate WPO
```

4. 保存悬崖正面和侧面截图；
5. 回到 `ED_CloseRange_Working` 的同一悬崖镜头再截图。

拆解地图只用于找问题，最终FPS必须在工作地图测试。

# 7.2 确认主要岩石是否启用Nanite

1. 在悬崖或大型岩石实例上按 `Ctrl+B`；
2. 打开Static Mesh；
3. 查看Nanite Settings；
4. 如果已经开启，不要重复修改；
5. 如果高面数静态岩石没有开启：

```text
复制Mesh
→ Enable Nanite Support
→ Apply Changes
→ 等待构建
```

6. 回到Nanite Mask确认；
7. 检查材质和碰撞；
8. 重新ProfileGPU；
9. 只有实际变快才保留。

# 7.3 找出Overdraw来自哪一层

1. 固定Nanite Overdraw最亮的镜头；
2. 每次只隐藏一组：

```text
Large Assembly
河床岩石
小Clutter
植被
地表贴片
```

3. 哪一组隐藏后亮度明显降低，就定位到哪一组；
4. 恢复其他组；
5. 不要直接删除整个Large Assembly。

# 7.4 减少内部不可见Clutter

1. 回到对应PCG Graph副本；
2. 找到该Assembly的Clutter分支；
3. 不要删除父级根点和Hierarchy属性；
4. 只降低完全隐藏在悬崖内部或重复覆盖的小装饰密度；
5. 第一轮降低10%；
6. Regenerate；
7. 检查外轮廓；
8. 再看Nanite Overdraw；
9. 测试Nanite/VSM/GPU时间；
10. 没有明显收益就恢复。

# 7.5 不建议的Nanite操作

- 不要看到Nanite成本就批量关闭Nanite；
- 不要默认把所有高模重新减面；
- 不要删除悬崖外轮廓资产；
- 不要修改Fallback Mesh来假装运行时三角形减少；
- 不要用拆解地图FPS代替工作地图FPS。

# 7.6 Nanite优化通过标准

- 明确知道Overdraw来自哪一组；
- 只减少内部或重复Clutter；
- 悬崖轮廓保持；
- Nanite Overdraw或GPU时间下降；
- 没有新增空洞、闪烁和碰撞问题。

---

# 8. 优化五：河床、岩石和植被材质

不要把所有材质都优化。只处理固定路线中最亮、最贵的三个材质。

先理解：

```text
Master Material：包含完整节点逻辑的母材质。
Material Instance：使用母材质逻辑，只调整开关、纹理和数值的实例。
```

初学阶段优先调整Material Instance中已经暴露的选项，不要直接拆改复杂的官方Master Material。

# 8.1 找到热点材质

1. 打开：

```text
View Mode
→ Optimization Viewmodes
→ Shader Complexity
```

2. 再查看 `Shader Complexity with Quad Overdraw`；
3. 找出最亮的三个区域；
4. 选择物体；
5. `Ctrl+B`定位Mesh；
6. 打开Material Instance；
7. 记录Master Material路径。

优先检查：

```text
河床湿润材质
悬崖/岩石材质
植被叶片材质
```

# 8.2 先只修改Material Instance里已有的参数

1. 复制Material Instance；
2. 只让工作地图引用副本；
3. 查看是否已有以下开关或参数：

```text
Detail Normal
Macro Variation
Wetness
Puddle
Pixel Depth Offset
Displacement
Extra Blend Layer
Wind/WPO
```

4. 每次只关闭一个；
5. 编译并保存；
6. 回到同一镜头；
7. 运行ProfileGPU；
8. 对比BasePass、Lumen Reflections和视觉；
9. 没有收益立即恢复。

如果Material Instance没有暴露这些参数，初学阶段先跳过，不要直接在复杂官方Master中大范围删节点。

# 8.3 河床湿润材质的测试顺序

严格按这个顺序：

```text
第二层Detail Normal
→ 高频Macro Noise
→ 额外材质混合层
→ Pixel Depth Offset
→ Wetness/Reflection质量
```

每一步：

1. 保存Before截图；
2. 关闭或降低一个功能；
3. 查看近景；
4. 查看逆光；
5. 查看反射；
6. 测量BasePass和Lumen Reflection；
7. 记录收益和画质损失；
8. 决定保留或恢复。

不要一次关闭湿润、法线和反射，否则无法知道哪个操作有效。

# 8.4 岩石材质的安全优化

优先关闭远距离看不到的：

- 第二套Detail Normal；
- 多次重复的Macro Variation；
- 对远景没有贡献的程序噪声；
- 不必要的Pixel Depth Offset；
- 静态岩石上的无意义WPO。

保留：

- 主法线；
- 主要粗糙度；
- 苔藓/湿润轮廓；
- 大尺度颜色变化。

# 8.5 植被材质的安全优化

1. Blend Mode应是Masked，不应误用Translucent；
2. 不要为每个实例创建独立材质；
3. 随机颜色和湿度使用Per Instance Custom Data；
4. WPO使用第6章的距离淡出；
5. 轻微调整Opacity Mask Clip Value时检查树叶边缘；
6. 树叶明显变薄或闪烁就恢复。

# 8.6 材质优化通过标准

- 只改了实际热点材质；
- 每个功能都有独立A/B；
- BasePass或Lumen Reflection稳定下降；
- 河床仍有湿润感；
- 岩石和苔藓层次仍在；
- 树叶没有明显变薄和闪烁。

---

# 9. 优化六：Lumen GI与反射

只有满足下面条件才继续：

```text
Lumen相关Pass位于ProfileGPU前五
或者Lumen总成本明显占用16.67ms预算
```

如果Lumen不是主要成本，记录“已检查，不处理”，直接进入第10章。

`Surface Cache` 可以理解为Lumen为场景表面准备的简化光照信息。可视化中的大面积粉红通常表示Lumen没有正确覆盖该表面，可能造成间接光或反射发黑。

# 9.1 记录当前设置

打开：

```text
Edit
→ Project Settings
→ Rendering
```

记录：

```text
Dynamic Global Illumination Method
Reflection Method
Use Hardware Ray Tracing when available
Ray Lighting Mode
```

后续测试中保持固定。

# 9.2 检查Surface Cache错误

在视口依次打开：

```text
Lumen Overview
Lumen Scene
Lumen Surface Cache
Lumen Performance Overview
```

输入：

```text
r.Lumen.Visualize.CardPlacement 1
```

关闭：

```text
r.Lumen.Visualize.CardPlacement 0
```

检查Large Assembly和主岩石是否出现大面积粉红色。

# 9.3 修复关键Mesh的Surface Cache

只处理会影响主镜头GI和反射的大型Mesh。

1. 选择问题Mesh；
2. 打开Static Mesh Editor；
3. 找到Build Settings；
4. 小幅提高 `Max Lumen Mesh Cards`；
5. Apply/Build；
6. 重新查看Surface Cache；
7. 检查反射黑斑和悬崖暗部；
8. 重新ProfileGPU。

不要给所有小石头增加Cards。Cards增加也会增加更新和内存成本。

# 9.4 Hardware RT与Software RT对照

如果Hardware RT导致显存或RTAS压力：

1. 保留当前版本为方案A；
2. 关闭 `Use Hardware Ray Tracing when available`，作为方案B；
3. 重启并等待Shader；
4. 两组都使用1080p、50%、High；
5. 同一镜头测试三次；
6. 对比：

```text
GPU
显存
Lumen Reflections
河床反射
植被
悬崖暗部
```

对RTX 5060 8GB，如果Software RT明显稳定且画面可接受，可以作为最终8GB配置。

# 9.5 小幅降低Lumen质量

只有Lumen仍是主要成本时执行：

1. 在工作地图找到生效的Post Process Volume；
2. Details搜索 `Lumen`；
3. 一次只测试一个参数：

```text
Lumen Scene Quality
Final Gather Quality
Lumen Reflections Quality
```

4. 只降低一个小档；
5. 检查暗部、逆光、河床反射；
6. 测试三次；
7. 没有明显收益就恢复；
8. 这个修改应标注为画质伸缩，不是纯内容优化。

# 9.6 Lumen优化通过标准

- Lumen确实是主要成本才修改；
- Surface Cache关键错误减少；
- 没有盲目增加所有Mesh Cards；
- Hardware/Software RT选择有数据；
- 河床反射和悬崖暗部可接受；
- Lumen GPU时间或显存压力下降。

---

# 10. 优化七：第一次运行与加载卡顿

平均FPS正常，但第一次经过某处突然卡顿，需要单独处理。

# 10.1 分开测试冷运行和热运行

## 冷运行

1. 完全关闭Standalone或打包程序；
2. 重新启动；
3. 第一次进入地图立即开始记录；
4. 第一次播放测试路线；
5. 标记为Cold。

## 热运行

1. 不退出程序；
2. 再播放一次作为预热；
3. 连续记录三次；
4. 标记为Warm。

Cold和Warm不能计算到同一个平均值中。

# 10.2 判断卡顿来源

使用Unreal Insights，在慢帧位置查看：

```text
Shader / PSO
Asset Load
Texture Streaming
Nanite Streaming
Component Register
PCG Generate
Game Thread
Render Thread
GPU
```

判断：

```text
只第一次发生，第二次消失
→ Shader、PSO或首次加载。

每次经过同一位置发生
→ 特定纹理、Nanite资源或Actor加载。

PCG Generate没有出现
→ 不要把卡顿写成PCG运行时问题。
```

# 10.3 处理大资源首次加载

1. 找到卡顿发生的镜头位置；
2. 查看刚进入画面的新岩石、植被或效果；
3. 使用Size Map或Render Resource Viewer定位大资源；
4. 检查纹理Max Texture Size和Mip；
5. 检查Nanite资源是否异常大；
6. 降低单个突发资源后重新冷启动测试；
7. 不要只增大Pool，否则可能重新导致显存超预算。

# 10.4 处理Shader/PSO

1. 正式测试前等待Shader编译完成；
2. 删除没有用途的材质排列；
3. 检查第一次出现的湿润材质、粒子和反射；
4. 最终在Development包检查PSO Precache；
5. 保存Cold与Warm两张帧时间曲线。

# 10.5 卡顿优化通过标准

- Cold和Warm结果分开；
- >33.3ms帧数减少；
- 最大慢帧原因明确；
- 热运行不会重复发生同一卡顿；
- 最终打包版本至少复测一次。

---

# 11. 最终测试与性能录制

# 11.1 最终测试前关闭可视化

关闭：

```text
Shader Complexity
Quad Overdraw
Nanite Visualization
Lumen Visualization
Virtual Shadow Map Visualization
PCG Debug
```

这些视图自身会影响性能。

# 11.2 最终测试步骤

1. 启动Standalone或Development包；
2. 等待30～60秒；
3. 播放一次路线预热；
4. Run 1；
5. Run 2；
6. Run 3；
7. 取中位数；
8. 再重启程序完成一次Cold测试；
9. 填写最终表。

# 11.3 最终数据表

```markdown
| 指标 | Baseline | Optimized | 变化 |
|---|---:|---:|---:|
| 平均FPS | | | |
| 1% Low | | | |
| Frame P95 ms | | | |
| Game ms | | | |
| Draw ms | | | |
| GPU ms | | | |
| Texture Pool | | | |
| 显存是否报警 | | | |
| >33.3ms慢帧 | | | |
```

# 11.4 性能视频与画质视频分开

## 性能对比

使用Standalone或Windows Development实机运行：

```text
stat fps
stat unit
```

然后使用Xbox Game Bar或OBS录制同一条路线。

## 画质展示

使用Movie Render Queue输出，不显示FPS。

MRQ是离线逐帧渲染，不能证明实时性能。

---

# 12. 建议实际执行顺序

如果你现在就开始操作，先只完成前三天。

# 第一天：只处理显存

```text
打开ED_CloseRange_Working
→ 1080p / 50% / High
→ stat streaming
→ Render Resource Viewer
→ 找出Top 20
→ 只处理3～5张最大的可见纹理
→ 连续三次不持续报警
```

# 第二天：只处理PCG小物件

```text
找到实际PCG Graph
→ 复制Graph
→ 找Clutter分支
→ 密度1.0测试到0.85
→ NoCol关闭碰撞/导航
→ 确认ISM/HISM
→ 三次A/B
```

# 第三天：只处理植被

```text
找到小草/落叶/灌木Spawner
→ 关闭小Clutter阴影
→ 设置Cull Distance
→ WPO距离淡出
→ 查看VSM缓存
→ 三次A/B
```

前三天完成后，再根据ProfileGPU决定做Nanite、材质还是Lumen。不要三个系统同时修改。

---

# 13. 命令速查

# 固定环境

```text
r.VSync 0
t.MaxFPS 0
r.DynamicRes.OperationMode 0
r.ScreenPercentage 50
```

# 性能

```text
stat fps
stat unit
stat unitgraph
stat gpu
profilegpu
stat scenerendering
```

# 纹理与内存

```text
stat streaming
r.Streaming.PoolSize
```

# CSV

```text
csvprofile start
csvprofile stop
```

# Lumen

```text
r.Lumen.Visualize.CardPlacement 1
r.Lumen.Visualize.CardPlacement 0
```

---

# 14. 最终检查清单

# 测试条件

- [ ] 使用 `ED_CloseRange_Working`；
- [ ] Baseline与Optimized都是1920×1080、50%、High；
- [ ] 使用同一条Sequence；
- [ ] 每个修改只改变一个变量；
- [ ] 每个版本测试三次；
- [ ] Cold和Warm分开。

# 显存

- [ ] 不持续显示Video Memory Exhausted；
- [ ] Texture Pool不持续Over Budget；
- [ ] 没有使用无限纹理池；
- [ ] 近景纹理仍清晰。

# PCG

- [ ] 只减少Clutter；
- [ ] 主悬崖、主岩石和主树不受影响；
- [ ] NoCol关闭碰撞和导航；
- [ ] 重复物体使用ISM/HISM；
- [ ] 没有浮空和大片空白。

# 植被与阴影

- [ ] 小Clutter阴影减少；
- [ ] 主树阴影保留；
- [ ] WPO远距离淡出；
- [ ] 没有明显植被突然消失；
- [ ] VSM成本或失效页下降。

# Nanite、材质与Lumen

- [ ] Nanite Overdraw来源明确；
- [ ] 没有删除悬崖外轮廓；
- [ ] 只修改三个以内热点材质；
- [ ] 河床湿润和苔藓层次仍在；
- [ ] Lumen只有在确实昂贵时才调整；
- [ ] Hardware/Software RT选择有数据。

# 最终交付

- [ ] 有Baseline与Optimized数据表；
- [ ] 有同镜头画质截图；
- [ ] 有实机性能录屏；
- [ ] MRQ视频不用于证明FPS；
- [ ] 未把CloseRange成绩写成完整地图成绩；
- [ ] 未达到60FPS时如实填写最终结果。

---

# 官方参考资料

- [Electric Dreams Environment](https://dev.epicgames.com/documentation/en-us/unreal-engine/electric-dreams-environment-in-unreal-engine)
- [Procedural Content Generation in Electric Dreams](https://dev.epicgames.com/documentation/en-us/unreal-engine/procedural-content-generation-in-electric-dreams)
- [Render Resource Viewer](https://dev.epicgames.com/documentation/unreal-engine/render-resource-viewer-in-unreal-engine?lang=en-US)
- [Virtual Shadow Maps](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)
- [Lumen Technical Details](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-technical-details-in-unreal-engine)
- [Lumen Performance Guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/lumen-performance-guide-for-unreal-engine)
- [Working with Nanite-Enabled Content](https://dev.epicgames.com/documentation/unreal-engine/working-with-naniteenabled-content)
- [Stat Commands](https://dev.epicgames.com/documentation/en-us/unreal-engine/stat-commands-in-unreal-engine)
# 总结分析

- 这篇主要记录 `Electric Dreams 性能优化作品集执行手册（精简重写版）` 相关内容，核心集中在 目录、1. 整套优化只按这一条路线执行、1.1 固定测试条件。
- 归类到 `性能优化` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
