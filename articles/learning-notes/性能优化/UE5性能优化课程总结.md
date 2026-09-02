---
title: UE5 性能优化课程总结
category: learning-notes
date: 2026-08-31
readTime: 38 min read
excerpt: UE5 性能优化课程系统笔记，整理性能目标、测试环境、瓶颈判断、Unreal Insights、CPU、内存、GPU 渲染专题和完整优化工作流。
tags: [UE5, 性能优化, Unreal Insights, GPU, CPU]
cover: ""
---

# UE5 性能优化课程总结

这篇笔记整理 UE5 性能优化课程中的核心方法，把零散的工具、命令和优化点收束成一条更接近项目实战的工作流：先定义性能目标，再建立可复现的测试环境，随后区分 CPU、GPU、内存与内容资源问题，最后用 A/B 测试验证优化是否真实有效。

内容不是逐句听写，而是按实际排查顺序重组后的系统笔记。课程中的“原声字幕”和“配音”属于同一内容的不同版本，整理时已经去重。

阅读时可以先看前两部分建立分析习惯，再根据项目瓶颈跳到 CPU、内存或 GPU 专题；最后的工作流和检查表适合在每次优化交付前复查。

---

## 目录

1. [先理解性能优化的目标](#一先理解性能优化的目标)
2. [建立可信的测试环境](#二建立可信的测试环境)
3. [判断 CPU 还是 GPU 瓶颈](#三判断-cpu-还是-gpu-瓶颈)
4. [Unreal Insights 分析方法](#四unreal-insights-分析方法)
5. [内容、场景与资源分析工具](#五内容场景与资源分析工具)
6. [GPU 与渲染分析工具](#六gpu-与渲染分析工具)
7. [UE 线程架构](#七ue-线程架构)
8. [游戏逻辑与蓝图优化](#八游戏逻辑与蓝图优化)
9. [Tick、Timer 与 Timeline](#九ticktimer-与-timeline)
10. [多线程与异步碰撞](#十多线程与异步碰撞)
11. [动画性能优化](#十一动画性能优化)
12. [内存与垃圾回收](#十二内存与垃圾回收)
13. [Nanite 优化](#十三nanite-优化)
14. [Virtual Shadow Maps 优化](#十四virtual-shadow-maps-优化)
15. [灯光与接触阴影](#十五灯光与接触阴影)
16. [材质性能](#十六材质性能)
17. [PSO 缓存与卡顿](#十七pso-缓存与卡顿)
18. [可见性、遮挡与距离裁剪](#十八可见性遮挡与距离裁剪)
19. [Variable Rate Shading](#十九variable-rate-shading)
20. [平台画质伸缩](#二十平台画质伸缩)
21. [完整优化工作流](#二十一完整优化工作流)
22. [常用命令速查](#二十二常用命令速查)
23. [最终检查表](#二十三最终检查表)

---

## 第一部分：性能分析基础

### 一、先理解性能优化的目标

对应课程：**01 基础**

#### 1. FPS 和帧时间

FPS 表示每秒显示多少帧，帧时间表示生成一帧需要多少毫秒：

```text
帧时间（ms）= 1000 ÷ FPS
FPS = 1000 ÷ 帧时间（ms）
```

常见目标：

| 目标帧率 | 单帧最大时间 |
|---:|---:|
| 30 FPS | 33.33 ms |
| 60 FPS | 16.67 ms |
| 90 FPS | 11.11 ms |
| 120 FPS | 8.33 ms |

优化时应优先用毫秒表达结果。FPS 与性能并不是线性关系：

- 从 30 FPS 提升到 40 FPS，帧时间从 33.33 ms 降到 25 ms，节省 8.33 ms。
- 从 100 FPS 提升到 110 FPS，帧时间只从 10 ms 降到约 9.09 ms，节省约 0.91 ms。

因此，“提升了 10 FPS”并不能准确描述优化价值。

#### 2. 不要只看平均 FPS

平均 FPS 可能掩盖严重卡顿。假设绝大多数帧耗时 10 ms，但每隔几秒出现一次 80 ms 的帧，平均值依然可能很好，实际操作却会明显顿挫。

还应关注：

- 帧时间曲线是否平稳。
- 1% Low 和 0.1% Low。
- 最慢帧发生在什么事件。
- 是否存在周期性尖峰。
- 帧生成和显示节奏是否均匀。

#### 3. Frame Pacing

Frame Pacing 是帧与帧之间的时间分布。即便平均帧率相同，均匀的 16.67 ms 通常比 8 ms、25 ms 交替出现更流畅。

影响帧节奏的因素包括：

- Game Thread 生成游戏状态的节奏。
- Render/RHI Thread 提交渲染工作的节奏。
- GPU 完成工作的节奏。
- VSync、帧率上限和显示器刷新率。
- PSO 编译、垃圾回收、资源流送等临时尖峰。

#### 4. 制定帧预算

不能等到项目完成后才开始优化。项目早期应根据最低目标硬件建立预算：

| 子系统 | 应记录的指标 |
|---|---|
| Game Thread | 玩法、蓝图、AI、碰撞、动画更新耗时 |
| Render Thread | 场景更新和渲染命令组织耗时 |
| RHI Thread | 图形 API 与驱动提交耗时 |
| GPU | 阴影、BasePass、灯光、透明、后处理等耗时 |
| CPU 内存 | 对象、关卡、资源和系统常驻内存 |
| GPU 显存 | 纹理、网格、VSM、渲染目标等占用 |
| 卡顿 | PSO、GC、加载和对象初始化尖峰 |

60 FPS 的 16.67 ms 是整帧上限，不应把正常场景长期压在 16.67 ms 附近。还需要为最坏场景、系统波动、驱动开销和未来内容增长留余量。

#### 5. 实操：第一次查看帧时间

这一操作可以先在编辑器中练习，正式结论仍应在打包 Development 版本中采集。

1. 打开一张具有代表性的游戏地图。
2. 点击工具栏的播放按钮进入 PIE，或运行已打包的 Development 程序。
3. 按反引号键 `` ` `` 打开控制台。
4. 输入：

   ```text
   stat unit
   ```

5. 观察屏幕上的 `Frame`、`Game`、`Draw`、`GPU` 和可能出现的 `RHIT`。
6. 再输入：

   ```text
   stat unitgraph
   ```

7. 移动角色、触发战斗或进入最重场景，观察曲线是否出现尖峰。
8. 截图或记录至少 30 秒，不要只看某一瞬间。
9. 再次输入相同命令可以关闭对应显示。

Epic 的 Stat 命令说明中，`stat unit` 用于显示 Frame、Game、Draw、GPU、RHIT 和动态分辨率等基础计时。参见 [Epic：Stat Commands](https://dev.epicgames.com/documentation/unreal-engine/stat-commands-in-unreal-engine)。

##### 如何读第一组数字

以 60 FPS 为目标，假设看到：

```text
Frame  22.0 ms
Game   20.5 ms
Draw    7.2 ms
GPU    11.3 ms
```

这时最可能是 Game Thread 限制，因为 Game 接近整体 Frame，明显高于 GPU。

另一种情况：

```text
Frame  19.0 ms
Game    6.5 ms
Draw    7.0 ms
GPU    18.2 ms
```

这时更可能受 GPU 限制。

这些数字只能用于决定下一步使用哪个工具，不能直接说明具体函数或具体渲染 Pass。

#### 6. 实操：为自己的项目写预算

先确定最低目标平台，再创建一张简单表：

```markdown
| 场景 | 目标 FPS | Game 上限 | Draw/RHI 上限 | GPU 上限 | 内存上限 |
|---|---:|---:|---:|---:|---:|
| 空场景 | 60 | 6 ms | 5 ms | 10 ms | 待定 |
| 普通玩法 | 60 | 9 ms | 7 ms | 13 ms | 待定 |
| 最重战斗 | 60 | 12 ms | 9 ms | 15 ms | 待定 |
```

上表数值只是格式示例，不是通用标准。填写时：

1. 用最低目标硬件跑当前版本。
2. 记录空场景、普通场景和最坏场景。
3. 先把当前实测值写进去。
4. 再根据目标帧率划定必须达到的上限。
5. 给未来内容留出余量。
6. 每次重要优化后更新，不要只在聊天或口头汇报中保存数据。

#### 7. 初学者常见误读

| 误读 | 正确理解 |
|---|---|
| FPS 越高，优化收益一定越大 | 应比较节省的毫秒 |
| Frame 等于 Game + GPU | CPU 与 GPU 通常流水并行，不是简单相加 |
| Game 比 GPU 高就能立刻确定某个蓝图慢 | 只能确定调查方向，还需 Insights |
| GPU 高就降低所有画质 | 应先用 ProfileGPU 找具体 Pass |
| 平均 60 FPS 就合格 | 还要检查最慢帧、低分位和 Frame Pacing |
| 编辑器中达到目标就算完成 | 最终必须在打包版本和目标硬件复测 |

---

### 二、建立可信的测试环境

对应课程：**02 准备解析、03 Unreal Insights 准备**

性能优化的第一步不是修改代码，而是准备一个每次都能以相同方式运行的测试版本。否则你今天看到 18 ms，明天看到 16 ms，可能只是编辑器、温度、后台程序或测试路线不同，并不代表真正优化了 2 ms。

> **课程使用的演示项目：**讲师这里打包和准备 Profiling 构建时使用的是自己的 **Action Roguelike** 示例项目（编辑器标题显示 `ActionRoguelike`），演示地图是 `TestLevel`。课程后面的 **Lyra Starter Game** 是独立案例研究，不是这一节打包操作所用的项目。你不必下载完全相同的案例，直接对自己的 UE 项目执行同样流程即可。

下面以 **Windows + UE5 编辑器 + 本地 PC 项目** 为例。UE 5.3—5.8 的菜单文字可能略有不同，但操作位置基本一致。

#### 1. 先确定本次要测试什么

第一次练习不必建立复杂自动化，只写清楚以下四项：

```text
测试平台：当前 Windows 电脑
测试地图：例如 /Game/Maps/Perf_Test
测试目标：例如 1920×1080、High 画质、60 FPS
测试场景：例如从出生点走到广场，停留 30 秒
```

如果还没有专用性能地图，可以：

1. 选择项目里问题最明显的一张地图。
2. 固定一个出生点。
3. 规定一条容易重复的移动路线。
4. 第一次先手动操作，后面再考虑录制回放或自动相机。

不要一开始同时测多个地图、多个分辨率和多个画质档，否则很难判断数据变化来自哪里。

#### 2. 设置打包后默认进入的地图

如果不设置 Game Default Map，打包程序可能黑屏或进入错误地图。

操作步骤：

1. 打开 UE 项目。
2. 点击顶部菜单 **编辑（Edit）**。
3. 点击 **项目设置（Project Settings）**。
4. 在左侧找到 **项目（Project）→ 地图和模式（Maps & Modes）**。
5. 展开 **Default Maps**。
6. 在 **Game Default Map** 中选择准备测试的地图。
7. 如果项目有启动菜单，也可以把启动菜单作为默认地图，之后用启动参数直接进入测试地图。

官方打包教程也要求先配置 Game Default Map；没有默认地图的项目在独立运行时可能无法加载正确内容。参见 [Epic：Packaging Your Project](https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-your-project)。

##### 如果打包后提示找不到测试地图

说明地图可能没有被 Cook 进包中。可以检查：

1. 打开 **项目设置 → 打包（Packaging）**。
2. 展开高级 Cook/Packaging 设置。
3. 找到类似 **List of Maps to Include in a Packaged Build** 的选项。
4. 把性能测试地图加入列表。
5. 重新打包。

不同 UE 版本中这一选项的显示位置可能略有变化。如果地图已经被默认地图、关卡引用或 Asset Manager 正确管理，通常会自动 Cook，不一定需要手工加入。

#### 3. 选择 Development 构建

第一次分析推荐 **Development**：

- 运行速度比 Debug/DebugGame 更接近正式版本。
- 可以使用控制台命令。
- 可以使用 Stat 和多种分析工具。
- 打包和排错相对容易。

操作步骤：

1. 保持 **项目设置（Project Settings）** 窗口打开。
2. 左侧选择 **项目（Project）→ 打包（Packaging）**。
3. 找到 **Build Configuration**。
4. 选择 **Development**。
5. 暂时不要选择 Debug 或 DebugGame，因为它们关闭了较多优化，性能数据会明显偏慢。

各构建的用途：

| 构建 | 是否适合当前步骤 | 原因 |
|---|---|---|
| Debug | 不适合 | 调试信息最多，优化少，运行很慢 |
| DebugGame | 不适合性能结论 | 适合调试项目代码，不适合测真实性能 |
| Development | **推荐** | 保留控制台和分析能力，同时启用大部分优化 |
| Test | 后期复测 | 接近 Shipping，并保留部分统计和分析能力 |
| Shipping | 最终复测 | 最接近发布，但默认移除大量控制台和分析功能 |

Epic 官方说明 Development 适合开发期间测试；Test 接近 Shipping 但保留部分控制台、Stat 和分析工具；Shipping 会移除面向开发者的控制台和 Profiling 功能。参见 [Epic：Build Configurations Reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/build-configurations-reference-for-unreal-engine)。

#### 4. 打包 Windows Development 版本

操作步骤：

1. 保存所有地图和资产。
2. 先打开 **编辑（Edit）→ 项目设置（Project Settings）→ 打包（Packaging）**。
3. 在 Packaging 页面中搜索或找到 **Build Configuration（构建配置）**，将它设置为 **Development**。
4. 关闭项目设置，点击编辑器顶部工具栏的 **平台（Platforms）**。
5. 在平台列表中选择 **Windows**。
6. 直接点击 **Package Project**，有些版本会显示为 **Package Project → Windows** 或 **打包项目 → Windows（64-bit）**。
7. 如果菜单中出现 **Binary Configuration**，确认它显示 `Development` 或 `Use Project Setting (Development)`；**如果没有该选项，直接忽略即可**，打包会使用第 3 步在 Project Settings 中设置的 Development 配置。
8. 选择一个容易找到的输出目录，例如：

   ```text
   D:\UE_Builds\MyProject_Development
   ```

9. 等待右下角打包进度完成。
10. 如果失败，打开 **Output Log** 或 **Message Log → Packaging Results** 查看第一条实际 Error；普通 Warning 不一定会导致失败。

##### 找不到 Binary Configuration 怎么办

这是正常现象。不同 UE5 小版本、源码版/Launcher 版以及项目类型的 Platforms 菜单并不完全一致。`Binary Configuration` 只是方便从 Platforms 菜单快速切换构建配置，并不是打包的必需选项。

真正需要确认的是：

```text
Edit
└─ Project Settings
   └─ Packaging
      └─ Build Configuration = Development
```

设置完成后，即使 Platforms 菜单里没有 `Binary Configuration`，也可以直接选择：

```text
Platforms → Windows → Package Project
```

如果连 `Build Configuration` 也看不到：

1. 在 Project Settings 左上角搜索框输入 `Build Configuration`。
2. 清除 Project Settings 顶部可能启用的筛选条件。
3. 展开 Packaging 页面中的 **Project** 或高级选项。
4. 某些中文界面会翻译为 **构建配置**、**打包配置**或类似名称。
5. 仍找不到时，打开 **Platforms → Packaging Settings**，它通常会跳到同一个 Packaging 设置页面。

打包包含 Build、Cook、Stage 和 Package 等过程：代码被编译，资产被转换为目标平台格式，再复制和组织成可运行文件。官方流程见 [Epic：Packaging Your Project](https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-your-project)。

##### 打包后程序在哪里

打开刚才选择的输出目录。常见结构类似：

```text
MyProject_Development\
├─ MyProject.exe
└─ MyProject\
   ├─ Binaries\
   ├─ Content\
   └─ ...
```

不同 UE 版本和项目设置可能把真正的可执行文件放在更深层的 `Binaries\Win64`。优先双击输出目录最外层与项目同名的 `.exe`。

##### 打包失败时先看哪一行

右下角的 `PackagingResults: Error: Unknown Error` 只是最终汇总，不是真正原因。

1. 打开 **Window → Developer Tools → Output Log**。
2. 在日志中搜索：

```text
Error:
fatal error
BUILD FAILED
```

3. 从下往上找到**最早出现的红色编译/资源错误**。
4. 先处理第一条真实错误，后面的 `AutomationTool exited`、`Unknown Error` 往往只是连锁结果。

##### 你截图中 C1083 / No such file or directory 的处理

截图中的关键错误是编译器无法创建或找到 `Intermediate\Build\Win64...cpp.obj`。项目名和路径包含中文时，某些编译工具、插件或 UBA 中间过程可能无法正确处理；路径过深也会增加失败概率。

推荐按以下顺序处理：

1. 关闭 UE 编辑器和 Visual Studio。
2. 先完整备份项目。
3. 把项目复制到较短、全英文、无特殊符号的目录，例如：

```text
D:\UEProjects\PerfCourse\
```

4. 确认从盘符到 `.uproject` 的每一级目录都尽量使用英文、数字或下划线。
5. 如果是**纯蓝图项目**，可在副本中把中文 `.uproject` 文件名改成英文，例如：

```text
PerfCourse.uproject
```

6. 删除副本中可重新生成的项目目录：

```text
Intermediate
Binaries
```

7. 重新打开 `.uproject`，等待 Shader/模块准备完成。
8. 再执行 Windows Development 打包。

注意：

- 删除前必须确认操作的是**项目副本**，不要删除 `Content`、`Config`、`Plugins`、`Source` 或 `.uproject`。
- 如果项目含有 `Source`、自定义 C++ Module 或 Target 文件，不能只改 `.uproject` 名；模块名、Target 和代码引用可能需要同步修改。初学者更安全的方式是新建一个英文名 UE 项目，再迁移 Content，或让熟悉 UE C++ 的人员完成重命名。
- 如果移动和缩短路径后仍失败，再检查 Visual Studio 的 Desktop development with C++、Windows SDK 和 UE 所需 MSVC 工具链。
- UBA 只应在确认是 UBA 兼容问题后作为单独排查方向；先解决中文/超长路径这个更直接的问题。

##### 常见打包错误快速判断

| 日志关键字 | 常见原因 | 优先处理 |
|---|---|---|
| `C1083`、`No such file or directory` | 路径、权限、中间文件或编译环境 | 换短英文路径，重建 Intermediate |
| `Missing SDK` | 平台 SDK 未安装 | 在平台/SDK 管理中安装对应 SDK |
| `Visual Studio not installed`、`toolchain` | C++ 编译工具不完整 | 安装 UE 对应 MSVC 和 Windows SDK |
| `Unknown Cook Failure` | 某资产 Cook 失败 | 往上找第一条具体资产错误 |
| `Can't find file`、`Failed to load` | 资源引用丢失 | 修复重定向器和缺失引用 |
| `Plugin ... failed to load` | 插件不支持目标平台或缺模块 | 检查插件平台和构建配置 |
| `Disk space` | Cook/Stage 空间不足 | 清理输出盘并预留足够空间 |

#### 5. 第一次运行并确认控制台可用

1. 双击打包后的 `.exe`。
2. 进入游戏后按键盘左上角的反引号键：

   ```text
   `
   ```

   它通常与 `~` 是同一个键。

3. 如果控制台出现，输入：

   ```text
   stat unit
   ```

4. 按回车。
5. 屏幕上应出现 Frame、Game、Draw、GPU 等时间。
6. 再输入一次 `stat unit` 可以关闭显示。
7. 输入 `quit` 或 `exit` 可以退出 Development 构建。

如果控制台没有出现：

- 检查是否误打包为 Shipping。
- 检查项目是否修改了 Console Keys。
- 尝试按 `~`。
- 如果使用中文输入法，先切换到英文输入。
- 某些项目会主动关闭控制台，需要检查项目自己的配置。

#### 6. 用快捷方式固定启动参数

每次手工改分辨率、地图和窗口模式容易出错。Windows 下可以建立一个专用性能测试快捷方式。

操作步骤：

1. 找到打包后的 `MyProject.exe`。
2. 右键它，选择 **发送到 → 桌面快捷方式**，或选择 **创建快捷方式**。
3. 右键新快捷方式，选择 **属性**。
4. 找到 **目标（Target）**。
5. 不要删除原来的 exe 路径，在结尾的引号之后输入一个空格，再添加参数。

示例：

```text
"D:\UE_Builds\MyProject_Development\MyProject.exe" /Game/Maps/Perf_Test -windowed -ResX=1920 -ResY=1080 -log -dx12
```

其中：

| 内容 | 作用 |
|---|---|
| `"D:\...\MyProject.exe"` | 可执行文件路径；路径有空格时必须保留引号 |
| `/Game/Maps/Perf_Test` | 启动后直接打开指定地图 |
| `-windowed` | 使用窗口模式，方便切换分析工具 |
| `-ResX=1920` | 固定横向分辨率 |
| `-ResY=1080` | 固定纵向分辨率 |
| `-log` | 同时打开日志窗口，便于确认参数与错误 |
| `-dx12` | 强制使用 DX12；只有目标平台确实使用 DX12 时才加 |

地图 URL 参数应紧跟在可执行文件后面，然后再写其他 `-参数`。Epic 官方格式是：

```text
<EXECUTABLE> [URL_PARAMETERS] [ARGUMENTS]
```

详见 [Epic：Command-Line Arguments](https://dev.epicgames.com/documentation/en-us/unreal-engine/command-line-arguments-in-unreal-engine)。

##### 不知道地图路径怎么办

1. 在 Content Browser 中找到地图。
2. 右键地图。
3. 选择 **Copy Reference** 或 **Copy Path**。
4. 得到的内容可能类似：

   ```text
   /Script/Engine.World'/Game/Maps/Perf_Test.Perf_Test'
   ```

5. 启动参数中只保留包路径部分：

   ```text
   /Game/Maps/Perf_Test
   ```

##### DX11 和 DX12 怎么选

- 项目最终以 DX12 发布：使用 `-dx12`。
- 项目最终以 DX11 发布：使用 `-dx11`。
- 不确定：先不要强制 RHI，使用项目默认设置。
- A/B 对比时，A 和 B 必须使用相同 RHI。

不要用 DX11 测一次、DX12 测一次后直接比较，它们的渲染路径和 Shader/PSO 行为可能不同。

#### 7. 固定运行时画质

最稳妥的方法是通过游戏自己的设置菜单选择固定档位，然后退出一次，让设置保存。以后每次测试先确认设置没有变化。

最低限度固定：

```text
窗口模式：
分辨率：
分辨率比例/Screen Percentage：
整体画质档：
VSync：
帧率上限：
动态分辨率：
```

第一次练习建议：

1. 使用固定 1920×1080。
2. 关闭动态分辨率。
3. 固定 High 或项目目标档位。
4. 为了观察真实性能上限，可暂时关闭 VSync 和帧率限制。
5. 如果项目交付时必须锁 60 FPS，再单独做一轮锁帧的 Frame Pacing 测试。

在控制台中可用以下命令检查或临时设置：

```text
r.VSync 0
t.MaxFPS 0
r.ScreenPercentage 100
```

含义：

- `r.VSync 0`：暂时关闭垂直同步。
- `t.MaxFPS 0`：移除引擎帧率上限。
- `r.ScreenPercentage 100`：内部渲染比例设为 100%。

注意：项目代码、平台设置或动态分辨率系统可能再次覆盖这些数值。运行命令后可只输入变量名，例如 `r.VSync`，查看当前值。

不要把这些数值直接当作最终发布配置。它们只是为了让性能测试不被限帧隐藏。

#### 8. 准备一条可重复的测试路线

初学者可以用“固定起点 + 固定操作顺序”：

```text
00—10 秒：出生点静止，让流送稳定
10—30 秒：沿固定路线走到广场
30—50 秒：触发战斗
50—60 秒：原地转动镜头一周
60 秒：结束
```

每次都尽量：

- 使用同一个存档。
- 使用同一角色和装备。
- 使用相同 AI 数量。
- 不临时打开菜单。
- 不在测试过程中切换画质。
- 不改变镜头方向和路线。

如果场景依赖随机 AI，可在项目逻辑中提供固定测试模式。引擎也提供 `-FixedSeed`，使 `FRandomStream` 使用固定种子 0；`-Deterministic` 相当于 `-UseFixedTimeStep -FixedSeed`。但固定时间步会改变游戏运行方式，不能不加判断地用来代表真实玩家体验。参数定义可查 [Epic：Command-Line Arguments Reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-command-line-arguments-reference)。

初学阶段更推荐通过项目自己的测试关卡、固定生成点和固定 AI 配置来控制随机性。

#### 9. 预热一次，再进行正式测试

第一次运行路线时可能发生：

- Shader 或 PSO 首次创建。
- 纹理和网格首次加载。
- 纹理 Mip 流送。
- 文件系统缓存建立。
- 系统和对象首次初始化。

为了测稳定运行性能：

1. 启动打包程序。
2. 完整走一遍测试路线，但不记录最终结果。
3. 回到相同起点。
4. 等待 5—10 秒。
5. 再开始正式记录。

但首次玩家体验也非常重要，因此应分成两套测试：

| 测试 | 是否预热 | 主要查什么 |
|---|---|---|
| 冷启动/首次运行测试 | 否 | PSO、首次加载、首次生成和启动卡顿 |
| 稳定性能测试 | 是 | 持续 CPU/GPU 帧时间和资源稳定状态 |

两套数据不能混在一起取平均。

#### 10. 减少电脑本身造成的波动

正式测试前：

1. 重启电脑或至少关闭长时间占用资源的软件。
2. 关闭浏览器大型页面、下载工具、视频播放和录屏软件。
3. 暂停系统更新和云盘同步。
4. 笔记本接通电源。
5. Windows 电源模式使用稳定的高性能设置。
6. 确保没有温度过高导致 CPU/GPU 降频。
7. 不要在打包、Shader 编译或复制大文件时测试。
8. 同一个测试过程中不要打开编辑器。

不建议为了“成绩好看”关闭项目正常运行时一定会存在的功能。例如实际游戏会运行反作弊、语音或网络系统，就应在最终平台测试中保留它们。

#### 11. 连续测试三次

简单做法：

1. 完成预热。
2. 按固定路线运行一次。
3. 记录结果。
4. 回到相同起点并等待 5—10 秒。
5. 重复共 3 次。

记录表：

| 次数 | Game ms | Draw ms | GPU ms | 最明显尖峰 | 备注 |
|---:|---:|---:|---:|---:|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
| 中位数 |  |  |  |  |  |

为什么用中位数：三次结果是 12.1、12.3、18.8 ms 时，18.8 ms 可能受到一次后台波动影响。中位数 12.3 ms 更能描述通常表现，但 18.8 ms 仍要记录并调查是否属于真实尖峰。

#### 12. 最简单的合格测试流程

如果上面的内容暂时太多，可以先严格完成以下最小流程：

1. 在 **Project Settings → Maps & Modes** 设置 Game Default Map。
2. 在 **Project Settings → Packaging** 选择 Development。
3. 通过 **Platforms → Windows → Package Project** 打包。
4. 给 exe 创建快捷方式，固定地图、1920×1080 和 DX12/DX11。
5. 启动后输入：

   ```text
   r.VSync 0
   t.MaxFPS 0
   r.ScreenPercentage 100
   stat unit
   ```

6. 完整走一遍路线进行预热。
7. 再按同一路线测试 3 次。
8. 记录 Game、Draw、GPU 和最明显尖峰。
9. 修改一个变量后，以完全相同方式重新测试。

只要能稳定重复这 9 步，就已经建立了基本可信的性能对比环境。

#### 13. 本步骤常见错误

| 错误 | 造成的问题 | 修正方法 |
|---|---|---|
| 只在编辑器 PIE 中测 | 编辑器开销和资源状态污染数据 | 用打包 Development 版本 |
| A 用 1080p，B 用 1440p | GPU 工作量不同，无法比较 | 固定分辨率和 Screen Percentage |
| 一次改多个设置 | 无法知道哪项真正有效 | 一次只改一个主要变量 |
| 开着 VSync 测最大性能 | 帧时间可能被刷新率限制隐藏 | 分析吞吐时关闭，另做锁帧测试 |
| 第一次运行直接当稳定数据 | 混入 PSO 和加载尖峰 | 冷启动与预热测试分开 |
| 测试路线随意变化 | 屏幕内容和 AI 数量不同 | 固定起点、路线和事件 |
| 笔记本不接电 | CPU/GPU 功耗限制变化 | 接电并固定电源模式 |
| Development 与 Shipping 直接对比 | 构建功能和优化程度不同 | 同构建做 A/B，最后用 Shipping 复测 |

#### 14. 测试记录模板

可以直接复制：

```markdown
## 性能测试记录

- 日期：
- 项目版本/提交：
- UE 版本：
- 构建：Development / Test / Shipping
- 电脑配置：
- 系统与显卡驱动：
- 测试地图：
- 分辨率：
- Screen Percentage：
- 画质：
- RHI：DX11 / DX12 / Vulkan
- VSync：
- 帧率上限：
- 是否动态分辨率：
- 是否预热：
- 启动参数：
- 测试路线：

| 次数 | Game ms | Draw ms | GPU ms | 最慢帧/尖峰 | 备注 |
|---:|---:|---:|---:|---:|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |
| 3 |  |  |  |  |  |
| 中位数 |  |  |  |  |  |
```

---

### 三、判断 CPU 还是 GPU 瓶颈

对应课程：**01 基础、05 GPU 和渲染分析**

优化前先回答：这一帧究竟在等谁？

#### 1. 初步观察

可以用 `stat unit` 查看常见指标：

- **Frame**：整体帧时间。
- **Game**：Game Thread 时间。
- **Draw**：通常代表 Render Thread 相关时间。
- **GPU**：GPU 时间。

最慢的一项通常最值得先调查，但还要注意线程之间可能存在等待。

#### 2. 降低分辨率实验

显著降低 `r.ScreenPercentage`：

- GPU 时间明显下降：通常存在像素相关的 GPU 瓶颈。
- GPU 时间变化很小：可能是 CPU、几何、阴影生成、固定 GPU 开销或其他问题。
- Game Thread 通常不会因为渲染分辨率降低而明显变快。

这个实验只用于判断方向，不是最终优化方案。

#### 3. 常见瓶颈表现

| 表现 | 优先检查 |
|---|---|
| Game 时间最高 | Tick、蓝图循环、AI、动画、碰撞、Spawn、GC、同步加载 |
| Draw/Render 时间最高 | 可见对象、Section、Draw Call、动态场景更新、Render State |
| RHI 时间最高 | 绘制提交、资源创建、驱动状态、PSO、同步 |
| GPU 时间最高 | ProfileGPU 中最昂贵的 Pass |
| 偶尔出现长尖峰 | PSO、GC、流送、加载、批量生成销毁、存档 |
| 周期性尖峰 | GC、Timer 批任务、AI 批更新、后台系统 |

#### 4. CPU 与 GPU 不是简单相加

CPU 和 GPU 可以流水并行。假设 CPU 需要 10 ms，GPU 需要 12 ms，整帧通常不会简单变成 22 ms，而更接近其中较慢的一方以及同步开销。

所以：

- CPU 还有余量但 GPU 已满时，继续优化 CPU 不一定提升 FPS。
- 把 CPU 动画移到 GPU 后，CPU 可能变快，但 GPU 可能成为新瓶颈。
- 任何“转移工作”的优化都要检查接收方是否有预算。

#### 5. 实操：五分钟完成第一次瓶颈判断

##### 步骤 A：解除限帧

在 Development 构建控制台依次输入：

```text
r.VSync 0
t.MaxFPS 0
stat unit
stat unitgraph
```

先确保项目没有被 30/60 FPS 上限或 VSync 隐藏真实性能。完成测试后要恢复项目原本设置。

##### 步骤 B：等待稳定

1. 到达问题场景。
2. 停留 10 秒，让纹理和资源流送稳定。
3. 不打开菜单、不切换窗口。
4. 记录 Game、Draw、GPU。
5. 如果数据跳动很大，先找加载或后台任务，不要急着判断持续瓶颈。

##### 步骤 C：做分辨率实验

先记录基线：

```text
r.ScreenPercentage 100
```

再降低内部渲染比例：

```text
r.ScreenPercentage 50
```

等待 5 秒后再次记录。

判读示例：

| 结果 | 解释 | 下一步 |
|---|---|---|
| GPU 从 20 ms 降到 9 ms | GPU 像素相关成本很大 | ProfileGPU、材质、灯光、后处理 |
| GPU 从 20 ms 只降到 18 ms | 不主要受分辨率影响 | 查阴影几何、固定 Pass、带宽或 CPU |
| Game 始终约 22 ms | Game Thread 是主要方向 | Unreal Insights |
| Draw 始终最高 | 场景提交或 Render Thread 方向 | Insights + SceneRendering Stats |

实验结束后恢复：

```text
r.ScreenPercentage 100
```

如果项目使用动态分辨率或 TSR，实际输出可能被其他系统覆盖；应先确认项目设置和游戏菜单中的动态分辨率状态。

#### 6. 实操：功能隔离实验

只有在固定测试路线中一次关闭一个系统：

```text
基线 → 临时关闭阴影 → 恢复
基线 → 临时关闭后处理 → 恢复
基线 → 隐藏敌人 → 恢复
基线 → 停止粒子 → 恢复
```

功能隔离用于归因，不是最终修改。例如关闭阴影后节省 7 ms，只能说明阴影值得深入调查；最终方案可能是修正一个大范围动态灯，而不是永久关闭全部阴影。

#### 7. 持续慢和偶发卡顿要分开

##### 持续慢

表现：

- 几乎每一帧都在 20 ms 左右。
- 相同镜头下曲线较稳定。

处理：

- 用 `stat unit` 确认主线程或 GPU。
- CPU 转 Insights。
- GPU 转 ProfileGPU。

##### 偶发卡顿

表现：

- 平时 10 ms，突然出现 50—300 ms。
- 可能只在第一次出现特效、转向新区或定时发生。

处理：

1. 用 `stat unitgraph` 观察出现时机。
2. 录制包含尖峰前后数秒的 Insights Trace。
3. 给“开始战斗、进入新区、生成 Boss”等事件加 Bookmark。
4. 判断是否为 PSO、GC、同步加载、流送或批量生成。

#### 8. 瓶颈判断记录模板

```markdown
## 瓶颈初筛

- 场景：
- 分辨率：
- 画质：
- 是否预热：
- VSync：
- 帧率上限：

| 测试 | Frame | Game | Draw/RHI | GPU |
|---|---:|---:|---:|---:|
| ScreenPercentage 100 |  |  |  |  |
| ScreenPercentage 50 |  |  |  |  |

- 初步结论：
- 下一工具：Unreal Insights / ProfileGPU / Memory Insights
- 仍不确定的地方：
```

#### 9. 常见错误

- 在暂停游戏时读取计时。
- 同时改变分辨率和画质档。
- 开着 VSync 判断最大性能。
- 用一个非常轻的镜头代表最坏场景。
- 把偶发加载尖峰当成持续 GPU 瓶颈。
- 只凭任务管理器的 CPU/GPU 百分比判断 UE 内部瓶颈。

---

## 第二部分：分析工具

### 四、Unreal Insights 分析方法

对应课程：**03 Unreal Insights、07 A/B Testing、09 UE 架构**

Unreal Insights 是分析 CPU、线程、任务、帧循环、加载和内存的重要工具。

#### 1. Trace 录制原则

Trace 不应越长越好。建议只录制：

1. 数秒稳定基线。
2. 问题发生前的准备阶段。
3. 问题本身。
4. 数秒恢复阶段。

打开的 Trace Channel 越多，文件越大，记录本身的开销也可能越高。只启用当前问题需要的通道。

#### 2. 阅读时间轴的正确顺序

1. 在 Frame 轨道找到慢帧或尖峰区间。
2. 比较 Game、Render、RHI 和 GPU 哪条轨道越线。
3. 展开对应线程，找到最长事件。
4. 判断该事件是在实际工作，还是在等待任务、锁或其他线程。
5. 查看它的调用次数、Inclusive Time 和 Exclusive Time。
6. 用聚合统计确认它是偶发尖峰还是持续累计热点。

#### 3. Inclusive 与 Exclusive

- **Inclusive Time**：函数本身加上所有子调用的总时间。
- **Exclusive Time**：只计算函数自身，不包含子调用。

例如某个系统更新总耗时 5 ms，但 Exclusive 只有 0.1 ms，说明真正成本在它调用的下层函数。反之，Exclusive 很高说明函数自身逻辑昂贵。

#### 4. 调用次数与总耗时

不要只看单次最慢事件。两种热点都需要处理：

- 单次调用耗时 5 ms：明显长任务。
- 单次只耗时 0.01 ms，但一帧调用 1000 次：累计也是 10 ms。

高频小调用常见解决方法是：

- 批处理。
- 降低更新频率。
- 缓存结果。
- 减少对象数量。
- 改为集中管理。

#### 5. Bookmark、截图和自定义事件

在以下时刻添加 Bookmark：

- 战斗开始。
- Boss 出现。
- 进入新区域。
- 开始异步加载。
- 批量生成敌人。
- 切换画质或 CVar。

这样可以把业务事件与性能时间轴对齐。自定义 C++ Trace、Counter 和命名事件还能记录“处理了多少个对象”“提交了多少次查询”等上下文。

#### 6. 目标设备分析

编辑器或高端开发机上的结论不能代替目标设备。Steam Deck、主机、移动平台和最低配置 PC 在以下方面都有差异：

- CPU 架构与核心数量。
- GPU 架构。
- 内存带宽和共享内存。
- 驱动和 RHI。
- 功耗、温度与动态频率。

可通过网络连接目标设备进行实时 Trace；无法连接时，也可在设备生成 Trace 文件后传回分析。

#### 7. 严格 A/B 测试

A/B 测试要求：

- A 与 B 使用同一基础版本。
- 一次只改变一个目标变量。
- 使用同一测试路线和时间段。
- 两边采用相同的预热方式。
- 每组运行多次。
- 同时记录平均、慢帧、内存和画质差异。

如果一次改了阴影、分辨率和特效数量，即使帧率提升，也无法确定真正原因。

#### 8. 实操：启动 Unreal Insights

##### 方法一：从编辑器启动

1. 打开 UE 编辑器。
2. 点击顶部菜单 **工具（Tools）**。
3. 找到 **Unreal Insights**。
4. 点击 **Run Unreal Insights**。
5. 出现 Session Browser 后保持窗口运行。

##### 方法二：直接运行程序

在引擎安装目录中找到：

```text
Engine\Binaries\Win64\UnrealInsights.exe
```

例如 Launcher 版可能位于：

```text
C:\Program Files\Epic Games\UE_5.x\Engine\Binaries\Win64\UnrealInsights.exe
```

双击运行。

Epic 官方快速入门同时提供这两种方式。参见 [Epic：Trace Quick Start Guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/trace-quick-start-guide-in-unreal-engine)。

#### 9. 实操：录制打包程序的 CPU Trace

最容易成功的本地流程：

1. 先启动 `UnrealInsights.exe`。
2. 再启动打包好的 Development 游戏。
3. 回到 Insights 的 Session Browser。
4. 等待几秒，看是否出现带 `LIVE` 标记的会话。
5. 回到游戏，按 `` ` `` 打开控制台。
6. 输入：

   ```text
   Trace.Status
   ```

7. 确认 CPU、Frame、Bookmark 等目标通道已启用。
8. 执行固定测试路线。
9. 回到 Session Browser，双击 LIVE 会话即可边录边看，也可等游戏退出后再打开。

如果没有自动出现 LIVE 会话，可改用启动参数明确指定：

```text
-trace=cpu,frame,bookmark,log -tracehost=127.0.0.1
```

完整快捷方式示例：

```text
"D:\Builds\MyGame.exe" /Game/Maps/Perf_Test -windowed -ResX=1920 -ResY=1080 -trace=cpu,frame,bookmark,log -tracehost=127.0.0.1
```

官方 Trace 参考将 `-trace=<channels>` 用于选择通道，`-tracehost=<ip>` 用于指定 Trace Store。参见 [Epic：Unreal Insights Reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-insights-reference-in-unreal-engine-5)。

#### 10. 实操：直接录制到文件

如果 LIVE 连接不稳定，可以把 Trace 写到文件。

在游戏控制台输入：

```text
Trace.File PerfTest.utrace cpu,frame,bookmark,log
```

开始测试。完成后输入：

```text
Trace.Stop
```

默认文件通常保存在：

```text
项目或打包运行目录\Saved\Profiling
```

然后：

1. 打开 Unreal Insights。
2. 在 Session Browser 点击 **Open Trace** 旁边的箭头。
3. 选择 **Open File**。
4. 选择刚生成的 `.utrace`。

也可以把 `.utrace` 直接拖进 Session Browser。

#### 11. 实操：给关键事件加标记

在控制台输入：

```text
Trace.Bookmark Start_Combat
```

战斗结束输入：

```text
Trace.Bookmark End_Combat
```

需要把当时画面一起保存时：

```text
Trace.Screenshot CombatSpike true
```

在 Timing Insights 中会出现对应竖线或截图标记。Bookmark 适合低频、重要状态变化，不应每帧发送。

#### 12. 实操：在 Timing Insights 中找慢帧

打开 Trace 后：

1. 找到上方帧轨道或 `Game Frames`。
2. 使用鼠标滚轮或快捷缩放，把时间轴缩放到能看到单帧。
3. 找到明显比周围更宽的帧。
4. 拖选该时间范围。
5. 展开 `GameThread`。
6. 找到横向最长的事件块。
7. 再展开它的子调用。
8. 右键可将事件添加到过滤器或查看统计。
9. 打开 **Timing Insights → Timers/Stats** 区域，按 Inclusive Time、Exclusive Time 和 Instance Count 排序。
10. 记录事件名、线程、调用次数和耗时。

##### 不要只看块的宽度

必须同时问：

- 这是真正在工作，还是 `Wait`？
- 这是一次性尖峰，还是每帧都发生？
- 单次很慢，还是调用数量过多？
- 它位于关键路径吗？
- 优化它后，GPU 是否仍然更慢？

#### 13. 实操：调查高频函数

1. 在 Timers/Stats 中选择测试时间范围。
2. 按 `Count` 或 `Instance Count` 从高到低排序。
3. 找到数量异常的业务函数或 Tick。
4. 查看其总 Inclusive Time。
5. 回到时间轴定位它集中出现在哪些帧。
6. 记录“每帧调用多少次”，再决定批处理、降频或缓存。

示例记录：

```text
函数：BP_Enemy_C::ReceiveTick
测试区间：10 秒
总调用：12,000
平均每帧：20 次
Inclusive：42 ms/10 秒
结论：单次不慢，但对象数量和持续 Tick 值得处理
```

#### 14. Trace 太大或录制很卡怎么办

- 缩短录制时间。
- 关闭不需要的 Channel。
- 不要默认启用 Memory、Callstack、Network 等所有重型通道。
- 只录制问题前后几十秒。
- 避免长时间开启 Verbose Named Events。
- 目标设备存储较慢时优先发送到 Trace Store，而不是持续本地写盘。

#### 15. Session 不出现怎么办

按顺序检查：

1. Unreal Insights 是否先于游戏启动。
2. 游戏是否为支持 Trace 的 Development/Test 构建。
3. 控制台执行 `Trace.Status` 是否有输出。
4. 快捷方式是否正确加入 `-tracehost=127.0.0.1`。
5. 防火墙是否阻止了 Unreal Insights 或游戏。
6. 游戏与 Insights 是否在同一台电脑。
7. 若通过 Session Frontend 控制 Standalone，会话可能需要 `-messaging` 参数。官方说明见 [Epic：Trace Control Tab](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-the-trace-control-tab-in-unreal-insights-for-unreal-engine)。

#### 16. 本章完成标准

- [ ] 能启动 Unreal Insights。
- [ ] 能让打包 Development 游戏出现在 LIVE Session。
- [ ] 能录制 20—60 秒 Trace。
- [ ] 能添加两个 Bookmark。
- [ ] 能找到一个慢帧。
- [ ] 能展开 GameThread 找到最长事件。
- [ ] 能区分 Inclusive、Exclusive 和 Count。
- [ ] 能保存 `.utrace` 和测试条件。

---

### 五、内容、场景与资源分析工具

对应课程：**04 内容和场景、06 内存**

#### 1. Statistics 与 Primitive Stats

用于检查场景中的对象和资源统计，重点关注：

- Primitive 或实例数量。
- 网格三角形数量。
- Section 数量。
- 材质槽数量。
- 纹理大小。
- 灯光和阴影关系。

一个网格即使三角形不多，如果有很多材质槽，也会被拆成多个 Section，增加绘制提交、材质状态切换和阴影 Pass 工作。

#### 2. Texture Stats

检查：

- 纹理分辨率是否超过实际屏幕占比需要。
- 压缩格式是否合理。
- 是否生成 Mip。
- LOD Bias 是否合理。
- 是否允许流送。
- 纹理池是否超预算。

一个只在远处显示几十像素的物体通常不需要常驻 4K 纹理。

#### 3. Size Map

Size Map 用于查看资产及其依赖带来的体积。UE 5.3+ 的 Cooked Metadata 可以帮助查看更接近打包结果的数据。

需要区分：

- 编辑器显示的资产大小。
- Cook 后磁盘体积。
- 运行时 CPU 内存。
- GPU 显存。

这些并不是同一个指标。Size Map 能发现依赖膨胀，但运行时内存仍要用对应的内存分析工具确认。

#### 4. Reference Viewer

Reference Viewer 用来发现意外硬引用。高风险情况包括：

- GameInstance 或常驻单例引用了所有角色资源。
- UI 图标通过角色蓝图带入完整模型、动画和音频。
- Data Asset 硬引用所有可选内容。
- 一个关卡对象引用了不属于该关卡的大型资源。

常见修正：

- 使用软引用。
- 使用 Asset Manager 和 Primary Asset。
- 按需异步加载。
- 拆分资源生命周期。

但异步加载需要处理加载中、加载失败、对象失效和释放时机，不能只把硬引用机械改成软引用。

#### 5. 实操：打开 Statistics 面板

1. 打开需要分析的地图。
2. 点击顶部菜单 **工具（Tools）**。
3. 根据 UE 版本查找 **Audit、Statistics、Statistics Viewer** 或 **统计信息**。
4. 打开后，在下拉列表选择 **Primitive Stats**。
5. 点击列标题排序，例如按 `Count`、`Sections`、`Triangles` 或 `Resource Size`。
6. 找到排名靠前且数量异常的资产。
7. 双击条目或使用定位功能，在 Content Browser 中找到资源。

如果菜单名称不同，可在 Tools 菜单搜索 `Statistics`。Primitive Stats 的字段定义可参考 [Epic：UPrimitiveStats](https://dev.epicgames.com/documentation/unreal-engine/API/Editor/StatsViewer/UPrimitiveStats)。

##### 第一次重点看什么

| 列 | 初学者判读 |
|---|---|
| Count | 同一资源在当前统计范围出现多少次 |
| Sections | 网格被拆成多少绘制部分 |
| Triangles | 几何量线索，不能单独代表总成本 |
| Resource Size | 资源内存线索 |
| Lightmap Data | 烘焙光照数据体积 |

操作建议：

1. 先按 Count 排序，找大量重复对象。
2. 再按 Sections 排序，找材质槽过多的网格。
3. 最后结合实际屏幕贡献决定是否值得改。

#### 6. 实操：查看 Texture Stats

1. 在同一个 Statistics 窗口切换为 **Texture Stats**。
2. 按尺寸、当前内存或格式排序。
3. 找出 4K/8K 且实际只小范围显示的纹理。
4. 双击打开 Texture Editor。
5. 检查：

   ```text
   Maximum Texture Size
   LOD Bias
   Mip Gen Settings
   Never Stream
   Compression Settings
   Texture Group
   ```

6. 每次修改后保存，在目标场景检查清晰度和 `stat streaming`。

不要一次批量把所有纹理都降到 1K。角色脸部、UI、地表、法线和遮罩对分辨率与压缩的需求不同。

#### 7. 实操：用 Size Map 找依赖膨胀

1. 在 Content Browser 找到一个蓝图、关卡或 Data Asset。
2. 右键资产。
3. 选择 **Size Map**。
4. 等待依赖分析完成。
5. 大矩形通常代表较大资源。
6. 点击或双击大块，确认它为什么被该资产引用。
7. 记录最重的前 5 个依赖。

推荐从这些资产开始：

- GameInstance。
- Player Character 蓝图。
- 主菜单 Widget。
- 常驻 GameMode。
- 大型 Data Asset。
- 首次加载很慢的关卡。

Size Map 展示资产和依赖的磁盘或内存可视化，并可从 Reference Viewer 打开。参见 [Epic：Reference Viewer](https://dev.epicgames.com/documentation/unreal-engine/reference-viewer-in-unreal-engine)。

#### 8. 实操：用 Reference Viewer 追查硬引用

1. 在 Content Browser 右键目标资产。
2. 选择 **Reference Viewer**。
3. 中央是当前资产。
4. 左侧通常是引用它的资产，即 Referencers。
5. 右侧通常是它引用的资产，即 Dependencies。
6. 在工具栏或右键选项中打开 Hard/Soft 等过滤显示。
7. 双击节点继续展开引用链。
8. 发现异常资源后，回到蓝图默认值、变量类型、组件资源或 Data Asset 中查找引用来源。

##### 例子：UI 图标为什么加载角色模型

可能引用链：

```text
WBP_CharacterEntry
→ BP_Character
→ SkeletalMesh
→ AnimBlueprint
→ Animation Set
```

如果 UI 只需要头像，直接保存 `BP_Character` 类型的硬引用会把整套角色资源带入。可以考虑让 UI 数据只引用头像纹理和一个软对象路径。

#### 9. 实操：Asset Audit

1. 在 Content Browser 选择一个或多个资产。
2. 右键或在 Tools/Audit 中打开 **Audit Assets**。
3. 检查磁盘大小、内存估计、Chunk、平台数据等列。
4. 点击右上角齿轮选择需要显示的列。
5. 需要团队分析时导出 CSV。

Reference Viewer 官方文档说明 Asset Audit 可从设置菜单导出 `.csv`。

#### 10. 修改引用后的验证

把硬引用改成软引用后必须验证：

- [ ] 首次打开 UI 时不会卡死或显示空白。
- [ ] 加载中有占位状态。
- [ ] 异步完成时对象仍然有效。
- [ ] 退出界面后资源能在合适时机释放。
- [ ] 打包版本中资产被正确 Cook。
- [ ] 联机客户端和服务器路径都正确。

#### 11. 常见误区

- Size Map 最大的资产不一定是当前帧最慢资产。
- 资产磁盘大小不等于运行时显存。
- Nanite 网格也有磁盘、流送和材质成本。
- 软引用不会自动加载，必须有明确加载流程。
- 删除引用后仍可能被其他常驻对象引用。
- 只在编辑器查看资源，不验证 Cook 后数据。

---

### 六、GPU 与渲染分析工具

对应课程：**05 GPU 和渲染、08 RenderDoc**

#### 1. ProfileGPU

ProfileGPU 用于捕获并展开一帧的 GPU 工作。常见 Pass：

| Pass | 成本高时优先检查 |
|---|---|
| ShadowDepths | 投影对象、VSM 页面失效、动态灯、WPO、骨骼网格 |
| ShadowProjection | 阴影灯数量、屏幕覆盖、过滤质量 |
| BasePass | 材质复杂度、像素覆盖、几何提交 |
| Lighting | 灯数量、影响半径、重叠、阴影 |
| Translucency | 透明层数、粒子、屏幕覆盖、过绘制 |
| PostProcessing | 景深、泛光、运动模糊、反射和全屏效果 |
| Lumen 相关 | GI/反射质量、更新、场景复杂度 |

正确流程是：

1. ProfileGPU 找到“哪个 Pass 贵”。
2. 用可视化模式查明“为什么贵”。
3. 修改内容或配置。
4. 再次 ProfileGPU 验证。

#### 2. 常见优化视图

| 视图 | 用途 |
|---|---|
| Shader Complexity | 查看像素 Shader 复杂区域 |
| Quad Overdraw | 查看透明或微小三角形导致的过绘制 |
| Light Complexity | 查看每个像素受到多少灯影响 |
| Lightmap Density | 检查烘焙光照纹素密度 |
| Bounds | 检查包围盒是否过大或错误 |
| Buffer Visualization | 检查 GBuffer、深度和中间渲染结果 |

可视化颜色只是线索，不是最终毫秒数据。不同硬件对 Shader、带宽和几何的敏感程度不同，必须回到目标 GPU 计时。

#### 3. Console Variables Editor

可把多个 CVar 保存成配置组，例如：

- 基准设置。
- 无阴影实验。
- 低画质。
- VSM 调试。
- VRS 实验。

这样能减少手动输入错误，也便于还原基线。

#### 4. RenderDoc

RenderDoc 适合检查单帧图形命令：

- 某个 Pass 有多少 Draw Call。
- 一个 Draw 使用了什么 Shader 和纹理。
- 深度测试与混合状态是否合理。
- Render Target 在各阶段如何变化。
- 是否存在意外资源绑定或重复绘制。

RenderDoc 不替代 Unreal Insights。前者擅长单帧 GPU 图形命令，后者擅长跨帧 CPU、线程和任务分析。

#### 5. 实操：捕获一帧 ProfileGPU

1. 运行打包的 Development 版本。
2. 进入目标场景并预热。
3. 固定相机，避免正在加载或快速转镜头。
4. 打开控制台。
5. 输入：

   ```text
   ProfileGPU
   ```

6. 等待捕获完成。
7. GPU Visualizer 出现后，从总帧向下展开最重事件。
8. 记录前三个最重 Pass 的毫秒。
9. 截图并写下当时分辨率、画质和镜头位置。

如果 `ProfileGPU` 没有窗口或输出：

- 确认不是 Shipping 构建。
- 尝试在编辑器 Standalone/Development 中验证命令是否可用。
- 检查目标平台是否支持对应 GPU 计时。
- 关闭第三方 Overlay 或冲突的 GPU 捕获工具。

#### 6. 如何读 GPU Visualizer

建议只展开一层一层调查：

```text
Frame
├─ ShadowDepths 6.8 ms
├─ BasePass 3.2 ms
├─ Lighting 2.4 ms
└─ PostProcessing 1.1 ms
```

此时先调查 ShadowDepths，不要同时优化四项。

展开 ShadowDepths 后继续问：

- 是 Directional Light 还是某个 Local Light？
- 是静态场景首次生成，还是每帧重绘？
- 是否出现大量 Skeletal Mesh 或 WPO？
- 是否因 VSM 页面失效？

记录格式：

```markdown
| Pass | 修改前 | 修改后 | 变化 |
|---|---:|---:|---:|
| ShadowDepths | 6.8 ms | 3.9 ms | -2.9 ms |
| GPU Frame | 17.4 ms | 14.3 ms | -3.1 ms |
```

#### 7. 实操：打开优化视图

在编辑器视口左上角打开 **View Mode/视图模式**：

1. 选择 **Optimization Viewmodes**。
2. 依次检查：

   - Shader Complexity。
   - Quad Overdraw。
   - Light Complexity。
   - Lightmap Density。

3. 使用相同镜头截图。
4. 点击 **Show → Advanced → Bounds** 检查包围盒。
5. 修改后回到 `Lit` 模式检查画质。
6. 最终再用 ProfileGPU 验证毫秒变化。

##### Shader Complexity 看到红白区域怎么办

1. 确认该区域是否在真实游戏中占屏幕很大。
2. 找到对应材质。
3. 查看透明层数和纹理采样。
4. 暂时换成简单材质做 A/B。
5. 若 GPU 明显下降，再优化材质本身。

颜色阈值是提示，不同平台性能不同，不能只以“全部变绿”为目标。

#### 8. 实操：缓冲区可视化

1. 打开视口的 **View Mode**。
2. 选择 **Buffer Visualization**。
3. 查看 Base Color、World Normal、Roughness、Scene Depth 等目标缓冲区。
4. 如果课程中使用 `vis` 命令，可在控制台输入 `vis` 查看当前版本提供的提示，再选择具体缓冲区。
5. 退出时恢复 `Lit` 模式。

用途示例：

- Scene Depth 检查遮挡和屏幕空间效果所用深度。
- World Normal 检查法线细节是否异常。
- Roughness 检查反射相关输入。
- Custom Depth 检查描边对象是否意外大量写入。

#### 9. 实操：Console Variables Editor 做 A/B

1. 打开 **窗口（Window）或工具（Tools）→ Console Variables Editor**。
2. 新建一个 Preset，命名 `Perf_Baseline`。
3. 添加需要固定的 CVar，例如：

   ```text
   r.VSync
   r.ScreenPercentage
   t.MaxFPS
   ```

4. 保存基线。
5. 复制一个 Preset，命名 `Perf_Test_Shadow`。
6. 只修改本次需要测试的变量。
7. 在完全相同场景切换两个 Preset。
8. 每次切换后等待数秒再记录。

不要把几十个不理解的网络 CVar 一次性导入并作为“优化配置”。

#### 10. 实操：启用 RenderDoc 插件

1. 安装 RenderDoc。
2. 在 UE 中打开 **编辑 → 插件（Plugins）**。
3. 搜索 `RenderDoc`。
4. 确认 RenderDoc Plugin 已启用。
5. 按提示重启编辑器。
6. 打开 **编辑 → 项目设置 → Plugins → RenderDoc**。
7. 检查 RenderDoc 可执行文件路径。
8. 需要自动附加时启用 **Auto attach on startup**。
9. 重新启动项目后，视口右上角应出现 RenderDoc 捕获图标。
10. 到目标场景点击捕获按钮。

也可以给编辑器或游戏快捷方式添加：

```text
-AttachRenderDoc
```

Epic 官方集成步骤见 [Epic：Using RenderDoc with Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-renderdoc-with-unreal-engine)。

#### 11. RenderDoc 中第一次看什么

1. 在 Event Browser 找到主要 Render Pass。
2. 展开 Shadow、BasePass、Lighting 或 Translucency。
3. 选中一个 Draw。
4. 查看 Pipeline State。
5. 检查绑定的 Vertex/Pixel Shader。
6. 查看纹理和 Render Target。
7. 在 Texture Viewer 查看该 Draw 对画面的贡献。
8. 检查同一对象是否被意外重复绘制。

初学者先回答三个问题即可：

- 这个 Pass 有多少 Draw？
- 最多 Draw 来自哪类对象？
- 最重对象绑定了什么材质和纹理？

#### 12. GPU 捕获注意事项

- RenderDoc 捕获会造成停顿和大文件，这是正常现象。
- 不要用捕获时的 FPS 作为性能数据。
- 一帧捕获不能代表跨帧尖峰。
- 打开 Capture All Call Stacks、Reference All Resources 会显著增加捕获体积。
- 分析结束后关闭 RenderDoc 自动附加，避免日常运行持续受影响。

---

## 第三部分：CPU 与游戏逻辑

### 七、UE 线程架构

对应课程：**09 虚幻引擎架构**

#### 1. 主要线程

- **Game Thread**：Actor、Component、蓝图、玩法、AI、Tick 和部分动画逻辑。
- **Render Thread**：整理场景数据和渲染命令。
- **RHI Thread**：向图形 API 和驱动提交工作。
- **Task Graph / Worker Threads**：执行可以并行拆分的任务。
- **GPU**：执行图形和计算工作。

#### 2. 优化关键路径

多线程优化的目标不是让所有核心都很忙，而是缩短决定整帧完成时间的关键路径。

常见无效并行：

- 创建异步任务后同一帧立即等待。
- 任务太小，调度成本超过计算成本。
- 多个任务争用同一个锁或共享容器。
- Game Thread 必须等待所有 Worker Task 才能继续。
- 并行结果集中回收时又形成新的单线程尖峰。

#### 3. 等待时间不等于热点

一个线程在 Insights 中出现长时间空白或 Wait，通常说明它正在等待其他线程。此时应沿依赖关系找到真正阻塞者，而不是优化等待函数本身。

#### 4. 实操：在 Insights 中认识主要线程

1. 按第四章的方法录制一个包含正常玩法的 CPU Trace。
2. 打开 Timing Insights。
3. 在左侧展开 CPU Tracks。
4. 找到以下轨道：

   ```text
   GameThread
   RenderThread
   RHIThread
   TaskGraphThreadNP 2...N
   Worker/Foreground Worker
   AudioThread
   AsyncLoadingThread
   ```

5. 先单独固定 GameThread、RenderThread、RHIThread 到顶部。
6. 选中一帧，观察三个主要线程各自在做什么。
7. 再展开 Worker Threads，查看主线程是否等待某批任务。

Epic 的性能说明将 Game、Rendering、RHI、Task Pools、Audio 和 Loading 列为常见处理线程。参见 [Epic：Common Performance Considerations](https://dev.epicgames.com/documentation/en-us/unreal-engine/common-memory-and-cpu-performance-considerations-in-unreal-engine)。

#### 5. 如何区分工作和等待

常见情况：

```text
GameThread
├─ TickWorld
│  ├─ 更新 AI
│  ├─ 提交并行任务
│  └─ WaitUntilTasksComplete
```

如果 `WaitUntilTasksComplete` 很长：

1. 展开同一时间段的 Worker Threads。
2. 找到直到等待结束才完成的任务。
3. 调查那个任务的实际内容。
4. 不要把 `WaitUntilTasksComplete` 本身当作业务热点。

另一个情况：

```text
RenderThread：长时间等待
GameThread：持续忙到帧尾
```

这通常说明 RenderThread 在等 GameThread，优先优化 GameThread。

#### 6. 实操：找关键路径

1. 选中一帧。
2. 从最终帧结束位置向左看。
3. 找出最后完成、阻止下一阶段继续的线程。
4. 展开它的最长事件。
5. 如果它等待另一个线程，继续沿等待关系追踪。
6. 直到找到真正执行工作的事件。
7. 记录：

   ```text
   瓶颈线程：
   直接热点：
   等待对象：
   工作线程任务：
   是否每帧发生：
   ```

#### 7. 线程分析常见误区

- CPU 总利用率只有 30% 不等于没有 CPU 瓶颈；可能只有一个关键线程满载。
- Worker Threads 全部很忙不等于并行有效；关键路径可能更长。
- RenderThread 显示 Wait 不代表 RenderThread 慢。
- 把任务移到后台后仍在同帧等待，不会隐藏延迟。
- 在多个线程写同一数据，可能引入锁、竞争和难复现错误。
- 不要为了让图表“看起来均匀”而创建更多线程。

#### 8. 本章完成标准

- [ ] 能在 Insights 中找到 GameThread、RenderThread 和 RHIThread。
- [ ] 能识别一个 Wait 事件。
- [ ] 能沿 Worker Thread 找到真正任务。
- [ ] 能说明这一帧的关键路径由哪个线程决定。

---

### 八、游戏逻辑与蓝图优化

对应课程：**10 Lyra 案例、11 游戏编程概述、12 蓝图性能**

#### 1. 优化蓝图组件初始化

大量相同蓝图实例会重复初始化组件数据。课程提到的 **Generate Optimized Blueprint Component Data** 可减少某些初始化成本。

适用前必须实测：

- Spawn 或加载尖峰是否下降。
- 是否增加烹饪数据或内存。
- 动态修改组件默认值是否仍正确。
- 不同构建配置是否表现一致。

#### 2. Auto Manage Attachment

组件生命周期和目标组件绑定时，可使用自动附着管理减少重复的 Attach/Detach 逻辑。

适合：

- 生命周期明确的附属组件。
- 激活时附着、停用时分离的场景。

仍需验证：

- 网络复制。
- 跨对象所有权。
- 复杂激活顺序。
- 目标组件提前销毁。

#### 3. Object Pooling

对象池适合：

- 子弹。
- 命中特效。
- 高频生成的临时对象。
- 构造和销毁已经被证明是热点的对象。

对象池的收益：

- 减少 Spawn/Destroy。
- 降低构造和初始化尖峰。
- 减少短命 UObject 对 GC 的压力。

对象池的代价：

- 增加常驻内存。
- 需要彻底重置对象状态。
- 容量不足或过大都需要处理。
- 生命周期和引用错误更隐蔽。

归还对象时通常要清理：

- Timer。
- Delegate。
- 碰撞。
- 组件激活状态。
- 粒子和音频。
- 材质动态参数。
- 外部引用。
- 网络和玩法状态。

#### 4. 蓝图循环

蓝图本身不是必须消除的问题，真正问题通常是高频路径上的昂贵结构：

- Tick 中遍历大数组。
- 嵌套 `ForEach`。
- 循环体内重复计算纯节点。
- `Get All Actors of Class` 等全局查找。
- 频繁字符串拼接和临时数组创建。
- 大量蓝图与 C++ 边界调用。

优化顺序：

1. 缓存不会频繁变化的结果。
2. 减少遍历对象数量。
3. 降低执行频率。
4. 把工作分散到多帧。
5. 提供一次处理整批数据的 C++ 接口。
6. 最后才考虑迁移整个系统。

#### 5. Lyra：Movement Fast Path

课程案例的关键不是某个固定函数，而是方法：

1. 给移动路径添加时间戳。
2. 确认单次成本和总调用数量。
3. 对近期没有渲染、远距离或不需要精确更新的对象跳过部分工作。
4. 再考虑用 Task Graph 并行。

`WasRecentlyRendered()` 可以作为优化条件，但它不等于“玩家绝对看不到”：

- 对象可能仍会投射阴影。
- 反射或其他视图可能需要它。
- 服务器玩法逻辑不能仅按渲染状态停更。
- 重新进入视野时必须保证状态恢复正确。

#### 6. 实操：先找蓝图热点，而不是猜

1. 打包 Development 版本。
2. 用 Unreal Insights 录制包含问题场景的 CPU Trace。
3. 在 GameThread 中展开：

   ```text
   FEngineLoop::Tick
   → UGameEngine::Tick
   → UWorld::Tick
   → Tick/Blueprint 相关事件
   ```

4. 在 Timers/Stats 中搜索：

   ```text
   Blueprint
   ReceiveTick
   ProcessEvent
   BP_你的类名
   ```

5. 分别按 `Inclusive Time` 和 `Count` 排序。
6. 记录最重蓝图类及实例数量。
7. 回到蓝图，只修改已经被数据证明是热点的路径。

必要时可临时使用命名事件提高蓝图/Stat 事件可读性：

```text
stat namedevents
```

录完后再次输入关闭。命名事件会增加分析开销，不要作为日常发布设置。

#### 7. 实操：检查蓝图 ForEach 循环

对于一个怀疑很慢的循环：

1. 在循环开始前添加测试 Bookmark 或自定义计时。
2. 记录数组长度。
3. 检查循环体内每个“纯节点”是否会被重复求值。
4. 将不会变化的结果提升到循环外并存入局部变量。
5. 如果只需要找到第一个匹配项，找到后立即结束，不要遍历剩余元素。
6. 如果数组很大但不要求本帧完成，按批次分到多帧。
7. 优化前后使用相同数组数据录制 Trace。

示例：

```text
错误方向：
每个敌人 Tick → 遍历所有玩家 → 每次重新获取距离和组件

改进方向：
管理器低频更新玩家列表
→ 缓存位置
→ 敌人按批次查询
```

#### 8. 实操：启用优化后的蓝图组件数据

此功能用于降低 Cook 后蓝图组件构造成本，适合大量生成带多个组件的蓝图。

1. 打开 **编辑 → 项目设置**。
2. 在搜索框输入：

   ```text
   Generate Optimized Blueprint Component Data
   ```

3. 根据版本，在 **Engine → Cooker** 或 Cooker 相关设置中找到它。
4. 可选值通常包括：

   - Disabled。
   - Enabled Blueprints Only。
   - All Blueprints。

5. 第一次只对明确需要的蓝图测试，或选择较保守范围。
6. 重新 Cook/打包，因为该设置影响 Cook 数据。
7. 测试大量 Spawn 的耗时。
8. 同时比较 Cook 后内存和包体。

Epic 官方说明该选项能加快蓝图构造，但可能增加 Cook 后蓝图内存，并依赖默认启用的 Event-Driven Loading。参见 [Epic：Cooker Settings](https://dev.epicgames.com/documentation/en-us/unreal-engine/cooker-settings-in-the-unreal-engine-project-settings)。

#### 9. 实操：判断对象池是否值得做

先完成不使用对象池的基线测试：

1. 在固定场景连续生成并销毁同一类对象。
2. 记录 Spawn 尖峰、Destroy/GC 尖峰和峰值数量。
3. 如果 Spawn/Destroy 并不是热点，不要做池。
4. 如果确认是热点，统计最大同时存活数量。
5. 池容量先设为略高于实际并发峰值，不要无限扩大。

蓝图对象池的基本结构：

```text
BP_ObjectPoolManager
├─ Available：未使用对象数组
├─ Active：正在使用对象数组
├─ Acquire：从 Available 取出并激活
└─ Release：重置后放回 Available
```

初始化：

1. BeginPlay 时预生成固定数量对象。
2. 对对象执行：

   ```text
   Set Actor Hidden In Game = true
   Set Actor Enable Collision = false
   Set Actor Tick Enabled = false
   ```

3. 放入 `Available`。

取出时：

1. 从 `Available` 移除一个。
2. 设置位置和旋转。
3. 重置生命值、速度和特效。
4. 显示、启用碰撞和必要 Tick。
5. 加入 `Active`。

归还时：

1. 停止 Timer、Timeline、Niagara 和音频。
2. 解绑外部 Delegate。
3. 清除目标和临时引用。
4. 隐藏、关闭碰撞和 Tick。
5. 从 `Active` 移除，放回 `Available`。

Epic 也强调对象池用处理时间换常驻内存，主要适合 Actor 等创建销毁成本高的对象。参见 [Epic：Common Performance Considerations](https://dev.epicgames.com/documentation/en-us/unreal-engine/common-memory-and-cpu-performance-considerations-in-unreal-engine)。

#### 10. 实操：使用 Was Recently Rendered 做表现降频

蓝图中：

1. 获取目标 Actor 或 Primitive Component。
2. 搜索节点：

   ```text
   Was Actor Recently Rendered
   ```

   或：

   ```text
   Was Component Recently Rendered
   ```

3. 设置 Tolerance，例如从 `0.1` 或 `0.2` 秒开始测试。
4. 只把结果用于非关键表现逻辑，例如远处装饰动画或辅助更新。
5. 重新进入视野时恢复更新并检查跳变。

官方定义中，Tolerance 表示距离上次渲染最多经过多少秒仍算“最近渲染”。参见 [Epic：Was Actor Recently Rendered](https://dev.epicgames.com/documentation/unreal-engine/BlueprintAPI/Rendering/WasActorRecentlyRendered)。

不要用它停止：

- 服务器权威逻辑。
- 伤害和碰撞判定。
- 存档状态。
- 必须准确运行的 AI。
- 对玩家不可见但仍影响阴影或其他视图的关键对象。

#### 11. 蓝图优化完成后的检查

- [ ] 优化前后 Trace 使用相同输入数据。
- [ ] 循环次数确实下降。
- [ ] GameThread 毫秒确实下降。
- [ ] 没有把成本转移成加载尖峰。
- [ ] 对象池状态可以彻底重置。
- [ ] 不可见对象恢复时没有位置或动画跳变。
- [ ] 联机客户端和服务器行为一致。

---

### 九、Tick、Timer 与 Timeline

对应课程：**13 Ticks、计时器、时间线**

#### 1. Actor 和 Component Tick

Tick 总成本来自两部分：

```text
总 Tick 成本 ≈ 所有活跃 Tick 的调度开销 + Tick 内实际工作
```

即使每个 Tick 几乎没有逻辑，成千上万个空 Tick 也会产生累计成本。

推荐原则：

- 默认关闭不需要 Tick 的 Actor 和 Component。
- 只在对象活跃时启用 Tick。
- 能用事件就不要每帧轮询。
- 不要求逐帧更新时设置 Tick Interval。
- 对远距离或不可见对象降频。
- 大量同类对象可集中到管理器中批处理。

#### 2. Tick 中应避免的工作

- 全场景搜索。
- 同步加载资源。
- 大量 Spawn/Destroy。
- 大数组遍历。
- 重复组件查找。
- 字符串处理。
- 大量同步 Trace/Overlap。
- 每帧重复计算不会变化的数据。

#### 3. Tick Groups

Tick Group 决定更新与物理模拟的先后关系：

- 需要读取物理模拟前状态的逻辑放在物理前。
- 需要使用本帧物理结果的逻辑放在物理后。
- 纯表现更新可以更晚。

设置错误可能导致：

- 读取上一帧结果。
- 出现一帧延迟。
- 产生不必要同步。
- 限制并行。

Tick Prerequisite 可以表达依赖，但依赖过多会把本可并行的更新串行化。

#### 4. Timer

Timer 并不是独立线程，也不是免费 Tick。TimerManager 仍然需要在 Game Thread 管理和调用。

注意：

- 极高频 Timer 可能在一帧内触发多次。
- 对象销毁或停用时要清理 Timer。
- 大量 Timer 在同一时刻触发会形成尖峰。
- 低频任务适合 Timer，但大量同类 Timer 可考虑集中调度。

#### 5. Timeline

Timeline 使用方便，但通常伴随 TimelineComponent 和持续更新。

适合：

- 少量交互对象。
- 简单的时间曲线驱动表现。

大量实例时可考虑：

- 材质参数动画。
- 集中管理。
- 动画系统。
- GPU/WPO。
- 事件驱动的插值系统。

#### 6. 实操：关闭不需要的 Actor Tick

对于蓝图 Actor：

1. 打开蓝图。
2. 点击工具栏 **Class Defaults（类默认值）**。
3. 在 Details 搜索：

   ```text
   Tick
   ```

4. 展开 **Actor Tick**。
5. 如果没有 `Event Tick` 或不需要持续更新，取消：

   ```text
   Start with Tick Enabled
   ```

6. 如果对象永远不需要 Tick，也应检查是否允许 Tick 的相关选项。
7. 编译、保存。
8. 在关卡中验证功能。

对于组件：

1. 在蓝图 Components 面板选择组件。
2. 在 Details 搜索 `Tick`。
3. 关闭不需要的 **Start with Tick Enabled**。

Epic 官方说明 Actor/Component 可以每帧 Tick、按最小时间间隔 Tick，或完全不 Tick。参见 [Epic：Actor Ticking](https://dev.epicgames.com/documentation/en-us/unreal-engine/actor-ticking-in-unreal-engine)。

#### 7. 实操：只在活跃期间启用 Tick

示例：一个门只在开关动画期间需要更新。

```text
默认状态：
Set Actor Tick Enabled(false)

收到开门事件：
Set Actor Tick Enabled(true)

插值完成：
Set Actor Tick Enabled(false)
```

测试：

1. 静止时确认 Tick 不运行。
2. 触发门动画。
3. 动画期间 Tick 工作。
4. 完成后再次关闭。
5. 重复触发确认能重新启用。

#### 8. 实操：设置 Tick Interval

对于不需要逐帧更新的逻辑：

1. 打开 Actor 蓝图的 Class Defaults。
2. 搜索 `Tick Interval`。
3. 输入：

   ```text
   0.1
   ```

   表示约每 0.1 秒更新一次，即约 10 Hz。

4. 测试反应是否仍然可接受。
5. 分别尝试 0.05、0.1、0.2 秒并记录 GameThread。

适合：

- 远距离状态检查。
- 非关键 UI 数据刷新。
- 环境装饰逻辑。

不适合：

- 玩家移动。
- 需要逐帧物理同步的逻辑。
- 高频瞄准和摄像机。

#### 9. 实操：选择 Tick Group

在 Actor/Component Tick 设置中找到 **Tick Group**：

| 需求 | 常见选择 |
|---|---|
| 在物理模拟前更新位置/输入 | Pre Physics |
| 不关心物理结果是否当前帧 | During Physics，谨慎使用 |
| 必须读取本帧物理结果 | Post Physics |
| 很晚的表现更新 | Post Update Work，按实际依赖 |

操作：

1. 写下这个 Tick 读取了什么数据。
2. 确认数据在哪个阶段产生。
3. 选择满足依赖的最早合适组。
4. 用高速运动和低帧率场景检查一帧延迟。
5. 不要为了“更早”把所有 Tick 都放 Pre Physics。

#### 10. 实操：用事件替换轮询

轮询示例：

```text
Event Tick
→ 每帧判断生命值是否 <= 0
```

事件驱动：

```text
ApplyDamage
→ 修改生命值
→ 如果生命值 <= 0
→ 触发 OnDeath
```

转换步骤：

1. 找出 Tick 中“只有状态改变时才有意义”的判断。
2. 找到真正修改该状态的位置。
3. 在修改后广播 Event Dispatcher 或直接调用处理函数。
4. 删除 Tick 中的轮询。
5. 测试所有可能修改状态的入口。

#### 11. 实操：Timer 的正确使用

蓝图中：

1. 搜索 `Set Timer by Event` 或 `Set Timer by Function Name`。
2. 对需要低频执行的任务设置 Time，例如 0.5 秒。
3. 需要循环时启用 Looping。
4. 保存返回的 Timer Handle。
5. 对象停用或销毁前使用 `Clear and Invalidate Timer by Handle`。

建议优先使用 Event/Handle 方式，函数名字符串容易因重命名而失效。

调试时可尝试控制台：

```text
listtimers
```

它会列出活跃 Timer；命令是否可用取决于构建和版本。

检查：

- 是否有已经不需要但仍循环的 Timer。
- 是否有大量 Timer 在同一时间触发。
- Timer 间隔是否小于帧间隔。
- 回调是否执行昂贵循环。

#### 12. 实操：检查 Timeline 数量

1. 在 Content Browser 搜索含 Timeline 的蓝图。
2. 在大量实例场景中录制 Insights。
3. 查看这些蓝图的组件和 Tick 累计成本。
4. 临时减少实例数量做 A/B。
5. 如果数量越多成本线性增长，考虑：

   - 共享管理器。
   - 材质时间节点。
   - 单个曲线资产驱动批量对象。
   - 仅在接近玩家时激活。

#### 13. 实操：查看当前 Tick

可在 Development 控制台尝试：

```text
dumpticks
```

或使用：

```text
stat game
stat tickgroups
```

具体命令可用性随版本和构建不同。Insights 仍是确认每个 Tick 总成本的主要方法。

#### 14. Tick 优化验证表

```markdown
| 类型 | 修改前活跃数量 | 修改后活跃数量 | GameThread 变化 |
|---|---:|---:|---:|
| Actor Tick |  |  |  |
| Component Tick |  |  |  |
| Timer |  |  |  |
| Timeline |  |  |  |
```

- [ ] 静止对象不会继续 Tick。
- [ ] 降频后没有肉眼可见跳动。
- [ ] Timer 在对象退出时清理。
- [ ] Tick Group 没有引入一帧延迟。
- [ ] 优化结果在 Insights 中可见。

---

### 十、多线程与异步碰撞

对应课程：**14 多线程、15 碰撞与物理、10 Lyra 案例**

#### 1. ParallelFor

适合条件：

- 各迭代彼此独立。
- 数据量足够大。
- 单项工作不是极小。
- 使用的数据允许多线程访问。

不适合：

- 小数组和简单计算。
- 循环体大量访问 UObject 或非线程安全 API。
- 每项都写同一个共享容器。
- 结束后马上进行昂贵同步。

并行收益必须大于：

```text
任务拆分 + 调度 + 同步 + 归并 + 缓存不友好成本
```

应对比三种实现：

1. 串行循环。
2. 每项并行。
3. 分块并行。

通常把若干元素组成一个批次，可以减少任务调度数量。

#### 2. 线程安全

并行循环中避免：

- 修改同一个 `TArray`。
- 增加同一个普通计数器。
- 调用只能在 Game Thread 使用的引擎接口。
- 读写可能被其他线程改变的 UObject 状态。

更安全的方式是每个任务生成局部结果，任务完成后统一归并。

#### 3. 同步碰撞查询

同步 Trace 和 Overlap 会等待结果。如果一帧提交大量查询，Game Thread 可能被阻塞。

优化顺序：

1. 删除不必要查询。
2. 降低查询频率。
3. 缩短查询距离和范围。
4. 使用更简单的碰撞形状。
5. 使用准确的 Collision Channel，排除无关对象。
6. 批量提交同类查询。
7. 对允许延迟的查询改为异步。

#### 4. 异步碰撞

异步查询适合：

- AI 环境感知。
- 非关键辅助检测。
- 可以接受一帧或多帧延迟的逻辑。

不适合：

- 必须在本帧决定命中的核心逻辑。
- 结果延迟会明显改变手感的操作。

实现时要处理：

- 查询 Handle。
- 结果何时可用。
- 请求对象是否已销毁。
- 结果是否已经过期。
- 查询顺序和批次对应关系。

#### 5. 实操：判断一个循环是否值得 ParallelFor

先不要改代码，按以下步骤测量：

1. 用 Insights 找到目标循环。
2. 记录每帧元素数量。
3. 记录循环 Inclusive Time。
4. 确认每个元素之间没有顺序依赖。
5. 确认循环不直接调用 Game Thread 专用 UObject API。
6. 如果循环只有几十微秒或元素很少，通常先不并行。
7. 如果循环达到明显毫秒级，再建立并行实验分支。

判断表：

| 条件 | 适合程度 |
|---|---|
| 数千个独立数学计算 | 较适合 |
| 10 个简单加法 | 不适合 |
| 每项都修改同一个数组 | 不安全，需要重新设计 |
| 每项只读输入、写自己的输出位置 | 较适合 |
| 每项调用 Actor/Component 蓝图函数 | 通常不适合直接放工作线程 |

#### 6. C++ ParallelFor 基本结构

示意代码：

```cpp
TArray<FVector> Input;
TArray<float> Output;
Output.SetNum(Input.Num());

ParallelFor(Input.Num(), [&Input, &Output](int32 Index)
{
    // 每个任务只写入自己的 Index，避免互相冲突。
    Output[Index] = Input[Index].SizeSquared();
});
```

注意：

- `Output` 必须在并行前分配好。
- 不要在循环内对同一个 `TArray` 调用 `Add`。
- 不要在工作线程 Spawn/Destroy Actor。
- 不要调用没有明确线程安全保证的 UObject 接口。
- 捕获的对象在任务结束前必须保持有效。

#### 7. 实操：比较串行、逐项并行和分块并行

至少制作三种实现：

```text
A：普通 for
B：ParallelFor 每元素
C：ParallelFor 每批处理 N 个元素
```

每种运行相同输入，分别记录：

| 版本 | 总耗时 | Worker 数量 | GameThread 等待 | 结果正确 |
|---|---:|---:|---:|---|
| A 串行 |  |  |  |  |
| B 逐项并行 |  |  |  |  |
| C 分块并行 |  |  |  |  |

如果并行版本只是让 Worker 很忙，但 GameThread 等待更久，应保留串行或调整批大小。

#### 8. 实操：先减少碰撞查询

在改异步前先做查询清单：

```text
查询来源：
每帧次数：
查询形状：
Trace Channel：
最大距离：
是否必须本帧返回：
命中对象类型：
```

优化：

1. 在 Insights 中定位 Trace/Overlap 调用。
2. 记录最坏场景的调用次数。
3. 把“每个 Actor 都查一次”改为管理器批量处理。
4. 把每帧查询改为按距离或频率分级。
5. 创建专用 Collision Channel，只检测真正需要的对象。
6. 优先使用简单 Sphere/Capsule/Box。
7. 对复杂网格查询确认是否真的需要 `Trace Complex`。

#### 9. 同步查询与异步查询的选择

| 需求 | 建议 |
|---|---|
| 玩家开枪必须本帧得到命中 | 同步，或重新设计预测/延迟策略 |
| AI 每隔 0.2 秒检查视线 | 可考虑异步 |
| 数百个环境探测 | 批量异步更合适 |
| 下一帧使用也没问题 | 异步候选 |
| 查询对象随时可能销毁 | 异步时必须保存安全句柄并校验 |

#### 10. C++ 异步查询工作流

实现思路：

```text
第 N 帧：
收集请求
→ 提交 AsyncLineTrace / AsyncOverlap
→ 保存 TraceHandle 和请求上下文

第 N+1 或后续帧：
查询结果是否完成
→ 校验发起者仍有效
→ 读取结果
→ 应用到玩法或缓存
```

不要在提交后立即阻塞等待，否则异步失去意义。

#### 11. 异步碰撞必须处理的异常

- 发起查询的 Actor 已销毁。
- 目标在结果返回前已经移动。
- 查询结果顺序和请求顺序不同。
- 关卡切换时仍有未完成请求。
- 网络服务器和客户端使用不同结果。
- 延迟一帧造成射击或交互手感变化。

可以为每个请求保存：

```text
请求 ID
弱对象引用
提交帧号
查询参数
允许的最大结果年龄
```

#### 12. 多线程和碰撞优化完成标准

- [ ] 串行基线已保存。
- [ ] 并行任务没有访问非线程安全 UObject。
- [ ] GameThread 等待时间确实下降。
- [ ] 查询数量和距离已先减少。
- [ ] 异步结果延迟对玩法可接受。
- [ ] 对象销毁和切关不会留下无效回调。
- [ ] 最低核心数的目标 CPU 也有收益。

---

### 十一、动画性能优化

对应课程：**10 Lyra 动画案例、18 骨骼动画**

#### 1. AnimGraph Fast Path

Fast Path 让动画节点尽量直接读取可快速访问的数据，减少蓝图 VM 和复杂动态访问。

推荐：

- 在 Event Graph 中准备简单状态。
- AnimGraph 只读取已准备的数据。
- 缓存 Pawn Owner、速度和移动状态。
- 避免在 AnimGraph 里执行复杂函数和重复转换。
- 检查 Fast Path 是否因某些节点被破坏。

#### 2. 控制更新数量

大量角色时：

- 远距离角色使用动画 LOD。
- 降低不可见角色更新频率。
- 使用 Update Rate Optimization。
- 减少骨骼数量。
- 关闭远距离不需要的 IK、布料和附加动画层。
- 根据可见性和玩法重要性分级。

#### 3. 将简单动画移到 GPU

课程案例使用材质 WPO 把某些简单重复动画移到 GPU。

可能收益：

- 减少 CPU 动画和组件更新。
- 大量实例可共享同一计算方式。

副作用：

- 增加顶点 Shader 成本。
- 阴影 Pass 也可能重复执行 WPO。
- Bounds 不正确会导致错误剔除。
- 碰撞不会自动跟随视觉变形。
- 材质复杂度和 Shader 变体可能增加。

只有 CPU 受限且 GPU 有余量时，这种转移才更可能有效。

#### 4. 第一次做动画性能检查：先确定是不是动画导致的

不要看到场景里有很多角色就直接修改动画蓝图。先用下面的方法确认：

1. 打开课程测试地图或自己的战斗地图。
2. 让角色数量、相机位置和行为保持固定。
3. 按 `~` 打开控制台，依次输入：

```text
stat unit
stat unitgraph
stat anim
```

4. 记录角色较少时的数据，例如 1 个角色。
5. 再记录 10、20、50 个角色时的数据。
6. 重点观察：
   - `Game` 是否随角色数量明显增加。
   - `stat anim` 中动画更新、求值和骨骼处理是否增加。
   - Unreal Insights 中是否出现大量动画相关事件。
7. 暂时停用非关键角色的动画更新，再跑一次相同路线。

如果停用动画后 Game Thread 明显下降，才说明动画是当前值得优先处理的热点。若 GPU 时间更高或 ShadowDepths 才是主因，应该先处理对应问题。

建议把测试结果写成：

```text
地图：
角色数量：
Game Thread：
GPU：
动画总耗时：
最贵的动画蓝图或骨骼网格：
是否为稳定耗时/偶发尖峰：
```

#### 5. AnimGraph Fast Path 的实际操作

Fast Path 的目标是让 AnimGraph 尽量直接读取数据，减少动画蓝图虚拟机参与。

##### 第一步：整理 Event Graph

1. 打开角色使用的 **Animation Blueprint**。
2. 进入 **Event Graph**。
3. 找到 `Event Blueprint Update Animation`。
4. 检查是否每帧反复执行以下操作：
   - `Try Get Pawn Owner`。
   - 多次 Cast 到角色蓝图。
   - 多次读取相同组件。
   - 距离、速度、是否在空中等重复计算。
5. 在初始化阶段缓存 Pawn Owner 或角色引用。
6. 在 Update 阶段只计算 AnimGraph 真正需要的简单状态，例如：

```text
Speed
Direction
bIsInAir
bIsAccelerating
bIsCrouching
```

7. 一个值只算一次，再保存到变量，不要让多个动画节点分别重复计算。

##### 第二步：把线程安全的数据读取移出普通 Event Graph

较新的 UE5 版本支持 **Blueprint Thread Safe Update Animation** 和 **Property Access**：

1. 在动画蓝图的 **My Blueprint** 面板中找到或添加
   `Blueprint Thread Safe Update Animation`。
2. 使用 `Property Access` 节点读取角色或移动组件中的数据。
3. 将结果写入动画蓝图变量。
4. 不要在该线程安全函数里调用未标记为线程安全的普通 UObject 函数。
5. 编译动画蓝图，确认没有线程安全警告。

> 不同 UE5 小版本的菜单文字会略有差异。如果找不到该事件，可在动画蓝图空白处右键搜索 `Thread Safe` 或 `Property Access`。

##### 第三步：检查 Fast Path 是否生效

1. 打开动画蓝图。
2. 点击工具栏的 **Class Settings（类设置）**。
3. 在 Details 中搜索 `Warn About Blueprint Usage`。
4. 如果当前版本提供该选项，启用后重新编译。
5. 查看编译结果和 AnimGraph 节点：
   - 闪电标记通常表示节点可以使用 Fast Path。
   - 编译警告会指出哪些读取或函数让节点退回蓝图路径。
6. 逐个修改警告，不要一次重写整个 AnimGraph。

以下做法经常会破坏 Fast Path：

- 在转换规则中调用复杂蓝图函数。
- 从对象层层取值，再进行动态 Cast。
- 在 AnimGraph 内进行复杂计算。
- 每个状态重复读取 Pawn、Movement Component 或其他 UObject。

#### 6. Update Rate Optimization 的操作方法

Update Rate Optimization（URO）适合数量较多、远距离或不需要每帧更新的骨骼角色。

1. 在关卡中选择角色，或打开角色 Blueprint。
2. 选择 `SkeletalMeshComponent`。
3. 在 Details 搜索：

```text
Update Rate
Optimization
```

4. 找到并启用 **Enable Update Rate Optimizations**。
5. 保存并编译。
6. 从近、中、远三个距离观察角色。
7. 同时记录 `stat anim` 和 Game Thread。
8. 检查动作是否出现：
   - 明显跳帧。
   - 脚底滑动。
   - 瞄准抖动。
   - 蒙太奇不同步。
   - 攻击判定与画面不一致。

URO 不能只看平均帧率。近距离主角和玩法关键敌人通常需要更高更新频率，远距离背景角色才适合更激进地降频。

#### 7. Animation Budget Allocator 的操作思路

角色数量会大幅变化时，固定给每个角色相同的动画更新频率通常不够灵活。Animation Budget Allocator 可以让动画系统在给定 CPU 预算内动态分配更新。

##### 启用插件

1. 点击 **编辑（Edit）→ 插件（Plugins）**。
2. 搜索 `Animation Budget Allocator`。
3. 勾选启用。
4. 按提示重启编辑器。

##### 接入前需要注意

- 它使用预算版的骨骼网格组件，而不是自动接管项目里所有普通 `SkeletalMeshComponent`。
- 旧角色蓝图直接替换组件可能影响代码、引用和动画逻辑，应先复制一个测试角色。
- C++ 项目需要加入对应模块；纯蓝图项目可检查组件添加菜单中是否出现 Budgeted Skeletal Mesh Component。
- 运行时通常还需要启用动画预算功能；可在控制台输入 `a.Budget` 查看当前版本提供的相关命令和帮助。

##### 推荐验证方法

1. 复制一份敌人角色作为测试版。
2. 只在测试版上接入预算组件。
3. 用相同数量的普通角色和预算角色各测一次。
4. 记录 Game Thread、动画耗时和最低更新质量。
5. 特别检查近距离攻击、受击、根运动和联网同步。

Animation Budget Allocator 适合“大量角色共享总预算”的场景；只有少量角色时，不一定比简单的 LOD/URO 更合适。

#### 8. 骨骼网格 LOD 与动画节点 LOD

##### 检查骨骼网格 LOD

1. 在 Content Browser 双击角色的 Skeletal Mesh。
2. 在 Skeletal Mesh Editor 中查看 **LOD Picker**。
3. 依次切换 LOD0、LOD1、LOD2。
4. 对每级检查：
   - 三角形数量。
   - Section/材质槽数量。
   - 骨骼数量。
   - 是否保留不再可见的小附件。
5. 在远距离 LOD 中移除不必要骨骼，但要确认蒙皮和插槽不会损坏。

##### 给昂贵 AnimGraph 节点设置 LOD Threshold

某些动画节点支持 `LOD Threshold`：

1. 打开 Animation Blueprint 的 AnimGraph。
2. 选择 IK、修改骨骼或其他昂贵节点。
3. 在 Details 中搜索 `LOD Threshold`。
4. 设置该节点允许执行的最高 LOD。
5. 编译后，在角色远离相机、切换 LOD 时验证动作。

例如，脚部 IK 可能只在 LOD0～LOD1 执行；更远 LOD 可以停用。但攻击方向、根运动或玩法需要的节点不能随意关闭。

#### 9. 不可见角色和 Bounds 的检查

1. 选择 Skeletal Mesh Component。
2. 在 Details 搜索 `Visibility Based Anim Tick Option`。
3. 根据玩法测试：
   - 始终更新。
   - 只在渲染时更新姿势。
   - 只在渲染时更新并刷新骨骼。
4. 角色离开画面后继续测试：
   - AI 逻辑是否正常。
   - 服务器判定是否依赖骨骼。
   - 再次进入画面是否跳姿势。
   - 蒙太奇事件是否漏掉。

`Component Use Fixed Skel Bounds` 可能减少 Bounds 更新成本，但只适合动画不会超出固定范围的资产。启用后必须测试大幅动作、武器、布料和附加组件，否则可能错误剔除。

#### 10. 动画优化完成标准

- [ ] 已证明动画是 CPU 热点，而不是凭角色数量猜测。
- [ ] 已分别测试少量、中量和最坏数量的角色。
- [ ] 动画蓝图没有重复 Cast 和重复取值。
- [ ] Fast Path/Property Access 的编译警告已检查。
- [ ] 远距离角色使用合理的骨骼 LOD 和动画降级。
- [ ] 不可见角色不会执行不必要的完整动画更新。
- [ ] IK、布料、附加动画层按 LOD 或重要性控制。
- [ ] 优化后攻击判定、根运动、蒙太奇和联网行为仍正确。
- [ ] 若把动画转移到 WPO，已同时复测 GPU、阴影和 Bounds。

---

## 第四部分：内存

### 十二、内存与垃圾回收

对应课程：**06 内存、17 垃圾回收**

#### 1. 四类常见内存问题

1. **常驻基线过高**：进入游戏后即占用过多。
2. **峰值过高**：切关或加载时短时间超预算。
3. **持续增长**：离开场景后内存不回落。
4. **频繁分配造成卡顿**：总量不一定高，但创建和释放太频繁。

#### 2. 调查方式

记录以下时间点：

- 进入场景前。
- 进入场景后。
- 高强度玩法期间。
- 离开场景后。
- 执行垃圾回收后。

如果离开场景并回收后仍无法回落，应检查：

- 仍然存在的硬引用。
- Delegate 或 Timer。
- 常驻单例数组。
- 未释放的资源句柄。
- 对象池是否保留过多实例。
- 异步请求是否仍持有对象。

#### 3. 垃圾回收成本

GC 需要扫描 UObject 和它们之间的引用。以下情况会提高压力：

- UObject 数量很大。
- 每帧创建大量短命 UObject。
- 同一帧集中销毁大量对象。
- 引用关系复杂。
- 回收间隔过长导致单次工作量过大。

解决方法：

- 降低对象总数。
- 避免无意义的创建销毁。
- 分散大批销毁。
- 对真正高频且状态可控的对象使用池。
- 清理让对象意外存活的引用。
- 在自然过场或加载界面安排回收时机。

单纯延长 GC 间隔只会减少回收频率，可能同时增加内存峰值和单次回收耗时。

#### 4. CPU 内存与显存

GPU 相关资源也会带来内存压力：

- 高分辨率纹理。
- 大量网格和实例数据。
- Virtual Shadow Map 页面。
- Render Target。
- Lumen 和其他渲染缓存。

画质伸缩不仅要降低 GPU 时间，也要控制 CPU 内存和显存预算。

#### 5. 先做一次最简单的内存基线检查

1. 使用同一个 Development 打包版本。
2. 启动后先停留在主菜单或空关卡，等待资源加载稳定。
3. 打开控制台，输入：

```text
stat memory
stat streaming
```

4. 记录主菜单状态。
5. 进入要测试的地图，等待 30～60 秒，再记录一次。
6. 完成一次高强度战斗后记录一次。
7. 离开地图返回主菜单，等待一段时间后再记录一次。

重点比较：

- Physical/Used 等总体内存是否持续上升。
- Texture Pool 是否超预算。
- 进入和离开同一地图多次后，基线是否越来越高。
- 内存上涨是否来自正常缓存，还是始终被对象引用。

不要因为离开关卡后内存没有立即回到启动值，就直接认定泄漏。引擎和操作系统可能保留缓存；真正需要关注的是多次重复同一路线后是否持续、近似单向增长。

#### 6. 使用 MemReport 做前后对比

MemReport 适合保存某一时刻的内存概况。

1. 在 Development 包中打开控制台。
2. 输入：

```text
memreport -full
```

3. 等待命令完成。
4. 报告通常保存到项目的：

```text
Saved/Profiling/MemReports
```

5. 建议分别生成：

```text
01_Menu
02_EnteredMap
03_AfterCombat
04_BackToMenu
05_SecondEnteredMap
```

6. 比较报告中的主要类别、对象数量和资源占用。

生成报告时命令通常会自动命名。为了避免混淆，可在每次生成后把文件复制到自己的测试记录目录并改成有意义的名称。

对比时优先看：

- 哪一类对象数量增加后没有减少。
- 哪些纹理、网格、音频或蓝图占用异常高。
- 是否有同一类 Actor、Component、Widget 不断累积。
- 第二次进入地图是否比第一次多出近似相同的一批对象。

#### 7. 使用 Memory Insights 记录分配过程

MemReport 告诉你“某一刻有什么”，Memory Insights 更适合回答“内存是什么时候分配、为什么还活着”。

##### 启动跟踪

给打包程序添加启动参数：

```text
-trace=default,memory -tracehost=127.0.0.1
```

也可以写入前面已经使用的快捷方式“目标”末尾。启动 Unreal Insights 后再运行游戏，确认会话出现在 Session Browser。

如果希望直接写到文件，可使用当前 UE 版本 Trace 文档支持的文件输出方式；不同版本参数可能变化，先在控制台或官方 Trace 帮助中确认。

##### 记录有意义的阶段

按固定顺序操作：

1. 启动并等待主菜单稳定。
2. 记下时间或添加 Bookmark：`Menu Stable`。
3. 进入地图：`Enter Map`。
4. 运行战斗：`Combat Peak`。
5. 返回主菜单：`Leave Map`。
6. 等待回收：`After GC/Wait`。
7. 停止 Trace。

##### 在 Memory Insights 中调查

1. 双击 Trace。
2. 打开 **Memory Insights**。
3. 在时间轴选择两个时间点。
4. 使用 Investigation/Query 视图调查：
   - 在某时间点仍然存活的分配。
   - 两个时间点之间新增且未释放的分配。
   - 某个 Tag、资产、类或调用栈的分配。
5. 先按 Tag/资产类型分组，再逐步缩小到调用栈。
6. 对可疑分配回到 Timing Insights，对照加载、Spawn、销毁和 GC 时刻。

Memory Trace 会增加跟踪数据量。不要从启动一直无目的录制几十分钟；先设计 1～3 分钟的复现路线。

#### 8. 调查“离开关卡后对象还活着”

按照下面的顺序比乱调 GC 参数更有效：

1. 确定没有回落的对象类型，例如敌人、Widget、音频组件或某资源。
2. 在蓝图和 C++ 中查找谁保存了它：
   - GameInstance/SubSystem。
   - Static 变量。
   - 单例管理器数组。
   - Delegate 绑定。
   - Timer。
   - Async 回调。
   - 对象池。
3. 在 Reference Viewer 中检查资产硬引用。
4. 检查 Widget 是否只从屏幕移除，但仍被数组或变量持有。
5. 检查 Timer 是否在对象结束时清除。
6. 检查 Delegate 是否解绑。
7. 检查异步加载句柄是否释放。
8. 再次运行“进入→离开”路线，确认对象数量不再累积。

可在控制台输入 `obj list`、`obj refs` 并使用 `?` 或控制台自动补全查看当前版本参数。它们输出可能很多，最好先知道要调查的具体类或对象名。

#### 9. 在 Insights 中确认 GC 卡顿

1. 录制包含一次明显卡顿的 CPU Trace。
2. 在 Timing Insights 中放大卡顿帧。
3. 搜索或检查：

```text
CollectGarbage
GarbageCollection
IncrementalPurgeGarbage
```

4. 查看 Game Thread 是否在 GC 期间出现长时间连续工作。
5. 对照同一时间的对象创建、关卡切换和批量销毁。
6. 分别回答：
   - 是不是对象数量太多？
   - 是不是同一帧销毁太多？
   - 是不是回收间隔导致单次工作量太大？
   - 是不是某个系统每帧制造大量短命 UObject？

只有确定 GC 是尖峰来源后，才值得调整垃圾回收设置。

#### 10. Garbage Collection 项目设置怎么改

入口：

```text
编辑（Edit）
→ 项目设置（Project Settings）
→ Engine
→ Garbage Collection
```

操作原则：

1. 修改前截图或记录所有原始值。
2. 一次只修改一个选项。
3. 使用相同地图和相同路线复测。
4. 同时记录：
   - GC 次数。
   - 最长 GC 时间。
   - 平均帧时间。
   - 内存峰值。
5. 若只减少 GC 次数却显著增加内存峰值或最长停顿，不算成功。

常见设置的含义：

- **Time Between Purging Pending Kill Objects**：影响等待清理对象的时间；增大可能减少频率，但也可能提高峰值。
- **Create Garbage Collector UObject Clusters**：让适合的对象按 Cluster 管理，可能降低引用扫描成本。
- **Allow Parallel GC**：在支持的情况下并行执行部分 GC 工作；仍需在目标 CPU 上实测。
- 增量可达性/增量清理相关选项：可把部分工作拆散，但是否可用及名称取决于 UE 版本。

不要把网上某个项目的 GC 数值原样复制到自己的项目。对象数量、平台内存和关卡切换方式不同，结果可能完全相反。

#### 11. 是否应该手动执行垃圾回收

手动回收只适合已经证明有必要、而且玩家可以接受停顿的位置，例如：

- 加载画面。
- 大关卡切换完成后。
- 明确的章节结算界面。

不建议：

- 每隔几秒调用一次。
- 在战斗过程中固定调用。
- 为了让内存数字好看而频繁调用。
- 把真正的引用泄漏误当成“没有及时 GC”。

蓝图中的 `Collect Garbage` 或 C++ 中的强制回收都可能产生明显停顿，必须用 Insights 验证。

#### 12. 纹理池超预算的处理步骤

当屏幕出现 `Texture Streaming Pool Over Budget`：

1. 输入 `stat streaming`。
2. 记录 Pool Size、当前使用量和超出量。
3. 打开 **Window → Statistics → Texture Stats**，按尺寸或当前内存排序。
4. 检查异常纹理：
   - 分辨率是否远超屏幕贡献。
   - 是否缺少 Mip。
   - 是否被设为 Never Stream。
   - UI、特效和世界纹理是否分类合理。
5. 先修正资源，再考虑调整纹理池。
6. 在最低显存目标机器上重新走完整路线。

直接增大 `r.Streaming.PoolSize` 可能暂时隐藏警告，但也可能让目标显卡显存不足。它必须是平台预算决策，而不是第一反应。

#### 13. 内存优化完成标准

- [ ] 已保存主菜单、进入地图、战斗峰值和离开地图的基线。
- [ ] 已重复进入/离开至少 3 次，判断是否持续增长。
- [ ] 已区分 CPU 内存、纹理池和其他 GPU 资源压力。
- [ ] 可疑对象已经找到持有引用的一方。
- [ ] Timer、Delegate、Widget、异步句柄和对象池已检查。
- [ ] GC 调整同时比较了停顿和内存峰值。
- [ ] 没有通过盲目增大纹理池或延长 GC 间隔掩盖问题。
- [ ] 最低内存/显存目标设备已复测。

---

## 第五部分：GPU 渲染专题

### 十三、Nanite 优化

对应课程：**19 Nanite**

Nanite 通过虚拟化几何和集群级裁剪提高高密度几何的可用性，但并不意味着所有成本消失。

#### 1. Nanite 擅长解决

- 高几何复杂度资产。
- 大量几何细节。
- 自动化几何 LOD 和集群裁剪。

#### 2. Nanite 不能自动解决

- 昂贵材质。
- 透明过绘制。
- 大量像素覆盖。
- 阴影成本。
- 过多实例的 CPU 场景管理。
- WPO 和特殊变形路径。
- 所有非 Nanite 渲染路径。

#### 3. 常见误区

**误区一：Nanite 三角形完全免费。**
微小三角形、复杂轮廓、集群可见性和大面积覆盖仍有成本。

**误区二：用了 Nanite 就不需要距离裁剪。**
远距离小物体仍可能产生 CPU、材质、阴影和场景管理成本。

**误区三：所有资产都应该启用。**
特殊材质、透明、变形和平台兼容性都要单独评估。

#### 4. 优化重点

- 检查实例数量。
- 控制材质槽和材质复杂度。
- 对屏幕贡献极小的对象做距离裁剪。
- 使用 Nanite 可视化检查集群与过度绘制。
- 与 VSM、WPO、Lumen 和 Software VRS 联合分析。

#### 5. 如何给静态网格启用 Nanite

##### 单个资产

1. 在 Content Browser 中双击 Static Mesh。
2. 在 Static Mesh Editor 的 Details 中搜索 `Nanite`。
3. 展开 **Nanite Settings**。
4. 勾选 **Enable Nanite Support**。
5. 点击 Apply/保存，等待 Nanite 数据构建完成。
6. 查看 Nanite Settings 中的统计信息，确认资产已生成 Nanite 资源。

##### 批量资产

1. 在 Content Browser 选中一批静态网格。
2. 右键查找 **Nanite** 菜单。
3. 选择 **Enable**。
4. 等待 Shader 和 Nanite 数据构建。
5. 不要一口气给整个项目启用；先选择一类代表资产测试。

不同 UE5 版本右键菜单位置可能略有变化。找不到时，先打开单个 Static Mesh，在 Details 搜索 `Nanite`。

#### 6. 如何确认场景里的资产真的走 Nanite

1. 打开测试地图。
2. 点击视口左上角的 **View Mode（视图模式）**。
3. 选择 **Nanite Visualization**。
4. 先使用 `Overview`。
5. 再分别检查：
   - **Triangles**：屏幕上实际处理的三角形密度。
   - **Clusters**：Nanite 集群分布。
   - **Overdraw**：同一区域重复处理的 Nanite 层数。
   - **Material ID**：材质分区是否过碎。
   - **Streaming Geometry**：当前流送几何情况。
6. 非 Nanite 资产通常不会以相同的 Nanite 可视化方式显示，应单独检查它们的传统 LOD。

运行时还可尝试：

```text
stat nanite
```

如果命令在当前版本不可用，在控制台输入 `stat nan` 查看自动补全。不要仅凭资产勾选框判断，最终要在实际关卡可视化中确认。

#### 7. Nanite Overdraw 怎么看

Nanite 能减少不可见几何，但密集、相互叠压的表面仍可能产生较高 Overdraw，例如：

- 一层层贴在一起的岩石。
- 大量细薄叶片。
- 多个几乎重合的壳体。
- 从相机方向看有很多纵深层的复杂轮廓。

排查方法：

1. 固定相机到性能最差的观察位置。
2. 打开 **Nanite Visualization → Overdraw**。
3. 找到颜色最热、层数最高的区域。
4. 单独隐藏一组资产，观察热点是否消失。
5. 尝试以下 A/B：
   - 删除看不见的内部表面。
   - 减少相互重叠的装饰层。
   - 为远距离小物体设置最大绘制距离。
   - 将不适合 Nanite 的细薄重复几何改为更合适的表现方法。
6. 回到 Lit 模式，用 ProfileGPU 复测真实帧时间。

Nanite 可视化只能解释原因，最终收益仍以 GPU 帧时间为准。

#### 8. 材质槽、WPO 与 Nanite

##### 材质槽

1. 打开 Static Mesh。
2. 查看 Materials/Sections 数量。
3. 检查是否为了很小的颜色差异拆出大量材质槽。
4. 在 Nanite Material ID 可视化中查看是否过度碎片化。
5. 合并材质前先确认不会增加过大纹理、透明区域或制作成本。

##### World Position Offset

Nanite 对 WPO 的支持和成本会随引擎版本、资产设置及阴影路径变化。测试步骤：

1. 复制一份材质实例作为实验。
2. 将 WPO 幅度暂时设为 0。
3. 固定相机，分别记录：
   - Base Pass。
   - ShadowDepths/VSM。
   - 总 GPU 时间。
4. 查看 Bounds 是否覆盖最大变形范围。
5. 若 WPO 只在近距离可见，使用合理的距离或 LOD 策略停用远处变形。

#### 9. Nanite 资产优化的推荐顺序

1. 先用 ProfileGPU 证明几何/Nanite 相关 Pass 值得处理。
2. 用 Nanite Overview 确认资产路径。
3. 检查 Overdraw，而不是只看源模型三角形数。
4. 检查材质槽、实例数和屏幕覆盖。
5. 对远处没有视觉贡献的对象做距离裁剪。
6. 检查 WPO、阴影和 Lumen 的联动成本。
7. 最后才考虑修改高级 Nanite CVar 或 Streaming Pool。

不要为了消除某个警告就随意增大 Nanite Streaming Pool。池大小属于显存/内存预算，需要在目标平台测量。

#### 10. Nanite 优化完成标准

- [ ] 已确认热点资产实际使用 Nanite。
- [ ] 已查看 Overview、Triangles、Clusters 和 Overdraw。
- [ ] 没有把源模型三角形数当成唯一指标。
- [ ] 材质槽和重叠几何已检查。
- [ ] 远距离小物体仍有合理裁剪策略。
- [ ] WPO、Bounds、VSM 和 Lumen 已联合复测。
- [ ] 非 Nanite 平台或回退路径仍能正常显示。
- [ ] 优化结论有 ProfileGPU 前后数据支持。

---

### 十四、Virtual Shadow Maps 优化

对应课程：**20 映射虚拟阴影**

VSM 使用虚拟页面保存阴影数据。稳定区域可以复用缓存页，变化区域需要重新绘制。

#### 1. 两类主要成本

- **ShadowDepths**：从光源视角生成阴影深度。
- **ShadowProjection**：把阴影应用到最终画面。

ShadowDepths 高不等于 ShadowProjection 高，必须分别分析。

#### 2. 页面失效

常见失效来源：

- 移动光源。
- 移动投影物。
- 被错误设置为 Movable 的静态组件。
- 骨骼网格。
- WPO/PDO 等改变几何位置的材质。
- 影响范围巨大的局部灯。

页面持续失效会让缓存无法复用，导致 ShadowDepths 工作量增加。

#### 3. 分析流程

1. 用 ProfileGPU 确认是 ShadowDepths 还是 ShadowProjection。
2. 用 Cached Page、Page Invalidations 等可视化查看失效区域。
3. 检查组件 Mobility。
4. 检查骨骼网格和 WPO。
5. 检查局部灯影响半径和远距离投影。
6. 处理异常内容后，再调整画质和 CVar。

#### 4. 优化手段

- 静态内容使用合理 Mobility。
- 不需要阴影的对象关闭 Cast Shadow。
- 不重要的远距离局部灯关闭阴影。
- 缩小灯光影响半径。
- 控制会导致失效的 WPO。
- 按画质档调整阴影分辨率、距离和过滤质量。

不要直接复制不明来源的 VSM CVar 数值。CVar 名称、默认值和含义可能随引擎版本变化。

#### 5. 如何确认项目正在使用 VSM

1. 点击 **编辑（Edit）→ 项目设置（Project Settings）**。
2. 进入 **Engine → Rendering**。
3. 搜索 `Shadow Map Method`。
4. 查看是否选择 **Virtual Shadow Maps**。
5. 修改该设置后按编辑器提示重启。

如果项目使用 Lumen/Nanite，VSM 通常是常见组合，但仍应以项目设置和实际视口可视化为准。

#### 6. 第一次抓取 VSM 成本

1. 进入代表性最坏场景。
2. 固定相机和时间。
3. 先运行：

```text
stat unit
stat unitgraph
```

4. 输入：

```text
ProfileGPU
```

5. 在 GPU Visualizer 中分别查找：
   - `ShadowDepths` 或 VSM 页面渲染相关事件。
   - `ShadowProjection` 或阴影投射相关事件。
6. 截图并记录总 GPU 时间。
7. 连续抓取 3 次，不要只用一次偶然结果。

判断方式：

- ShadowDepths 高：优先找哪些灯和投影物在不断生成/更新阴影。
- ShadowProjection 高：优先看覆盖面积、灯数量和过滤/投射成本。
- 两者都不高：不要因为场景使用 VSM 就优先改 VSM。

#### 7. Cached Page 可视化的具体操作

1. 点击视口的 **View Mode**。
2. 进入 **Virtual Shadow Map** 可视化分类。
3. 选择 **Cached Page** 或当前版本中名称相近的缓存页视图。
4. 保持相机静止，观察一段时间。
5. 然后分别让角色移动、灯光移动或 WPO 动画运行。

常见颜色含义会显示在视口图例中，应以当前版本图例为准。通常需要关注：

- 已缓存并能复用的页面。
- 本帧新生成或失效后重绘的页面。
- 部分缓存/静态与动态内容混合的页面。

也可在控制台查询：

```text
r.Shadow.Virtual.Visualize ?
```

若当前版本支持，可使用：

```text
r.Shadow.Virtual.Visualize cache
```

结束后恢复：

```text
r.Shadow.Virtual.Visualize none
```

先用 `?` 查看帮助，是为了避免不同 UE5 版本的可视化模式名称变化。

#### 8. 找到“是谁让页面失效”

按照从大到小的顺序排查：

1. 在 Outliner 中把角色、植被、灯光等分组。
2. 固定相机并观察缓存页。
3. 一次隐藏一组对象。
4. 如果页面重绘明显减少，再对该组逐个定位。
5. 对可疑对象检查：
   - Mobility 是否误设为 Movable。
   - 是否每帧改变 Transform。
   - 是否为 Skeletal Mesh。
   - 材质是否使用 WPO/PDO。
   - Bounds 是否过大。
   - 是否在多个局部灯影响范围内。

部分版本还提供失效 Bounds 调试 CVar。可先输入：

```text
r.Shadow.Virtual.Cache.DrawInvalidatingBounds ?
```

只有控制台帮助确认当前版本支持后再设为 `1`，测试结束后设回 `0`。

#### 9. 逐个灯光做 A/B 测试

1. 在 Outliner 选择一个可疑灯光。
2. 在 Details 记录：
   - 类型。
   - Mobility。
   - Attenuation Radius。
   - Cast Shadows。
   - 阴影相关距离和质量。
3. 复制当前数据作为基线。
4. 一次只做一个实验：
   - 临时关闭 `Cast Shadows`。
   - 将影响半径缩小 25%。
   - 暂时隐藏灯。
   - 对远距离非关键灯设置最大绘制距离。
5. 每次都用相同相机重新执行 ProfileGPU。
6. 恢复设置后再做下一个实验。

临时关闭阴影的目的不是直接作为最终方案，而是测出“这个灯的阴影最多值多少毫秒”。

#### 10. 骨骼角色的 VSM 优化

大量动态角色往往会持续更新阴影页：

1. 选择一个敌人。
2. 临时关闭 Skeletal Mesh 的 `Cast Shadow`。
3. 比较 ShadowDepths。
4. 如果单个角色影响不明显，使用 20～50 个角色做规模测试。
5. 再考虑更细的策略：
   - 远距离 LOD 不投射阴影。
   - 只有关键角色投射高质量阴影。
   - 限制局部灯同时影响的角色数量。
   - 减少不必要的骨骼或 WPO 阴影变形。
   - 对非常远的角色使用更便宜的表现。

必须检查关闭远距离阴影后是否出现明显“漂浮感”和突然跳变。

#### 11. VSM 优化完成标准

- [ ] 已区分 ShadowDepths 与 ShadowProjection。
- [ ] 已用 Cached Page/失效可视化找到具体区域。
- [ ] 可疑灯光和投影物已逐个做 A/B。
- [ ] Mobility、WPO、骨骼角色和 Bounds 已检查。
- [ ] 局部灯影响半径和阴影距离合理。
- [ ] 优化没有破坏关键角色和玩法物体的阴影可读性。
- [ ] 每个画质档均复测 GPU 和页面缓存情况。

---

### 十五、灯光与接触阴影

对应课程：**21 灯光**

#### 1. 局部灯成本

局部灯成本通常受以下因素影响：

- 屏幕覆盖面积。
- 影响半径。
- 与其他灯的重叠。
- 是否投射阴影。
- 阴影质量。
- 影响多少可见物体。

#### 2. 优化顺序

1. 删除玩家几乎看不到的灯。
2. 缩小灯的影响半径。
3. 减少同一区域重叠灯数量。
4. 对不重要的灯关闭阴影。
5. 为远距离灯设置剔除。
6. 最后再降低全局灯光和阴影质量。

这样比直接关闭所有阴影更能保留关键画面质量。

#### 3. Contact Shadows

接触阴影是屏幕空间效果，适合补充物体与表面接触处的小尺度阴影。

优点：

- 能补充细小接触细节。
- 可与其他阴影方案组合。

限制：

- 只能使用屏幕中已有的深度信息。
- 看不到屏幕外内容。
- 可能出现噪声、断裂和边缘伪影。
- 成本受步进、屏幕覆盖和质量影响。

它通常适合作为 VSM 或其他阴影方案的细节补充，而不是完全替代。

#### 4. 用 Light Complexity 找灯光重叠

1. 打开性能最差的关卡。
2. 点击视口 **View Mode**。
3. 选择 **Optimization Viewmodes → Light Complexity**。
4. 沿固定路线观察高复杂度区域。
5. 在 Outliner 中逐个选中局部灯，查看其影响范围。
6. 优先处理：
   - 玩家看不到却覆盖很大的灯。
   - 多个灯完全重叠的区域。
   - 影响半径远超房间或道具范围的灯。
   - 每个小装饰灯都开启动态阴影的情况。

颜色图例表示同一像素受多少非静态灯影响。颜色越热通常表示重叠越多，但最终仍需 ProfileGPU 验证。

#### 5. 单个局部灯的详细检查

1. 在 Outliner 选择 Point Light、Spot Light 或 Rect Light。
2. 在 Details 依次检查：
   - **Mobility**。
   - **Intensity**。
   - **Attenuation Radius**。
   - **Cast Shadows**。
   - **Max Draw Distance**。
   - **Max Distance Fade Range**。
   - Contact Shadow 设置。
3. 按场景实际范围缩小 Attenuation Radius。
4. 设置 Max Draw Distance 后，从远到近观察灯光淡入。
5. 临时关闭 Cast Shadows，测出阴影成本。
6. 如果视觉上必须保留阴影，再考虑缩小范围、减少投影物或降低远距离质量。

灯的亮度和影响半径不是同一个概念。为了让灯更亮而把半径扩大，往往会无意中影响更多物体和像素。

#### 6. Contact Shadows 的操作方法

1. 选择需要补充接触细节的灯光。
2. 在 Details 搜索 `Contact Shadow`。
3. 找到 **Contact Shadow Length**。
4. 从较小值开始，逐步增加。
5. 每次观察：
   - 脚底、墙角和小物体接触是否更清楚。
   - 画面边缘是否断裂。
   - 细线和植被是否出现噪声。
   - GPU 的 ShadowProjection/Lighting 是否增加。
6. 如果版本提供“使用世界空间单位”选项，确认当前长度是屏幕空间还是世界空间；两者数值不能直接照搬。
7. 将长度设回 `0` 做关闭状态对比。

Contact Shadow Length 越大不代表越好。由于屏幕空间追踪的样本有限，追踪距离过长通常更容易产生噪声和遗漏。

#### 7. 灯光优化实验记录示例

```text
灯光名称：
灯光类型：
Mobility：
原影响半径：
修改后半径：
是否投射阴影：
原 GPU：
修改后 GPU：
ShadowDepths 变化：
ShadowProjection 变化：
可见副作用：
最终是否保留：
```

#### 8. 灯光优化完成标准

- [ ] 已用 Light Complexity 找到重叠区域。
- [ ] 每个重点局部灯的范围与实际场景匹配。
- [ ] 不重要的远距离灯有绘制距离或淡出策略。
- [ ] 动态阴影只保留给有视觉/玩法价值的灯。
- [ ] Contact Shadows 使用较小、经过验证的长度。
- [ ] 没有用 Contact Shadows 掩盖错误的基础阴影设置。
- [ ] 已同时检查 Lit 画质和真实 GPU 时间。

---

### 十六、材质性能

对应课程：**22 材质**

#### 1. Constant Folding

可以在编译时确定的表达式会被折叠成常量，从而减少运行时 Shader 指令。

例如只由常量组成的计算，不需要每个像素重新执行。

#### 2. Uniform Expression Folding

不需要逐像素变化的表达式可以移出逐像素路径，以较低频率求值。应尽量让真正不变的数据保持不变，避免无意义动态化。

#### 3. Static Switch

优点：

- 编译时移除未使用分支。
- 运行时不执行另一条路径。

代价：

- 每种组合产生不同 Shader Permutation。
- 增加 Shader 编译时间和包体。
- 扩大 PSO 组合数量。

因此，静态开关不是越多越好。应只保留真正有价值的组合。

#### 4. 动态分支

动态分支只有在以下情况下更可能收益：

- 分支在一大片像素中具有一致性。
- 能跳过非常昂贵的计算或纹理采样。
- 分支判断本身成本较小。

如果只是跳过少量简单数学，分支控制开销可能得不偿失。

#### 5. 常见材质热点

- 大面积透明和多层透明。
- 过多纹理采样。
- 昂贵数学运算。
- Pixel Depth Offset。
- 大范围 WPO。
- 高频细节导致的过绘制。
- 全屏后处理材质。

材质优化需要同时看 Shader Complexity、Quad Overdraw 和真实 GPU 计时。

#### 6. 在 Material Editor 中查看成本

1. 在 Content Browser 双击可疑材质。
2. 在 Material Editor 工具栏启用 **Stats**。
3. 如果提供 **Platform Stats**，选择目标平台和目标 RHI。
4. 点击 Apply/编译。
5. 查看：
   - Base Pass 的 Shader 指令。
   - 顶点/像素 Shader 指令。
   - Texture Samplers。
   - 编译错误和不支持项。
6. 修改一个节点后重新 Apply，比较数值变化。

指令数只能用于同一平台、相近材质的前后比较。一个指令数较低但覆盖全屏的材质，仍可能比一个局部复杂材质更贵。

#### 7. Shader Complexity 与 Quad Overdraw

##### Shader Complexity

1. 回到关卡视口。
2. 点击 **View Mode → Optimization Viewmodes → Shader Complexity**。
3. 沿测试路线观察高复杂度区域。
4. 隐藏某一类资产，确认颜色热点由谁造成。

##### Quad Overdraw

1. 在相同菜单中选择 **Quad Overdraw**。
2. 重点检查：
   - 草、树叶和毛发卡片。
   - 粒子。
   - 多层透明贴片。
   - 贴近相机的大面积透明面。
3. 旋转相机，观察过绘制是否只在特定角度恶化。

Shader Complexity 是诊断视图，不等同于毫秒。确定热点后必须回到 Lit 模式执行 ProfileGPU。

#### 8. 用简单材质做“最大可能收益”实验

如果不确定某个材质是否值得优化：

1. 复制一份关卡或选定一个可疑物体组。
2. 创建一个最简单的 Opaque 测试材质，只输出基础颜色和正常粗糙度。
3. 临时替换可疑材质。
4. 固定相机执行 3 次 ProfileGPU。
5. 与原材质比较 BasePass、Translucency、ShadowDepths 和总 GPU。

结果解释：

- 差异很大：材质是重要方向，可继续拆分节点定位。
- 差异很小：热点可能是几何、灯光、阴影或覆盖，而不是材质计算。
- 只在 ShadowDepths 变化：重点检查 WPO、Masked 和阴影材质路径。

测试材质只用于定位，不应覆盖用户原资产或直接作为最终视觉方案。

#### 9. Material Analyzer 的使用

Material Analyzer 适合检查材质实例层级、Static Switch 和 Shader 组合。

1. 在编辑器顶部打开 **Tools（工具）**。
2. 查找 **Audit → Material Analyzer**。不同版本可能位于 Window/Tools 的审计工具中。
3. 选择一个母材质。
4. 查看其材质实例和静态参数组合。
5. 找出：
   - 只被极少资产使用的组合。
   - 功能完全相同但参数组合不同的实例。
   - 大量相互独立的 Static Switch。
   - 不必要的材质层和功能分支。
6. 合并组合前，先统计哪些平台和资产真的使用它们。

Material Instance 可以减少美术重复创建母材质，但 Static Switch 的不同组合仍会产生不同 Shader Permutation。

#### 10. 优化材质图的推荐顺序

1. 先确认材质是 GPU 热点。
2. 删除完全没有使用的分支和纹理。
3. 复用重复计算，把同一结果存一次。
4. 减少真正昂贵的纹理采样和数学。
5. 检查 Masked/Translucent 是否必须。
6. 限制大面积透明层数。
7. 让不需要逐像素变化的表达式保持 Uniform。
8. 检查 WPO/PDO 是否只在必要距离执行。
9. 控制 Static Switch 数量和组合。
10. 在目标平台重新查看 Platform Stats 和 ProfileGPU。

不要为了让指令数看起来更低而增加大量静态开关，否则可能把运行时成本转变为 Shader 编译、包体和 PSO 问题。

#### 11. 动态分支怎么验证

1. 复制原材质。
2. A 版本保留当前计算。
3. B 版本加入动态分支，跳过一段真正昂贵的逻辑。
4. 分别测试：
   - 分支几乎全部走同一路径的画面。
   - 分支在相邻像素间频繁变化的画面。
5. 使用相同分辨率和相机抓取 GPU。

如果分支只跳过几次简单加减乘，收益很可能小于控制流代价。只有实测能决定。

#### 12. 材质优化完成标准

- [ ] 已在目标平台查看材质 Stats/Platform Stats。
- [ ] 已结合 Shader Complexity、Quad Overdraw 和 ProfileGPU。
- [ ] 可疑材质已用简单替代材质做最大收益实验。
- [ ] 透明、Masked、WPO 和 PDO 已重点检查。
- [ ] 重复计算和不必要纹理采样已处理。
- [ ] Static Switch 组合数量受到控制。
- [ ] 优化没有造成明显材质跳变、噪声或平台编译问题。
- [ ] Shader 编译时间、包体和 PSO 副作用已检查。

---

### 十七、PSO 缓存与卡顿

对应课程：**23 PSO Caching（Windows DX12）**

#### 1. PSO 是什么

Pipeline State Object 描述一组图形管线状态，包括 Shader、混合、深度和其他渲染配置。

运行时首次遇到新组合时，驱动可能需要创建或编译 PSO。如果同步发生在关键帧，就会出现明显卡顿。

#### 2. 两种主要方案

##### PSO Precaching

引擎根据将要使用的资产和组件，提前准备可能需要的 PSO。

优点：

- 自动化程度较高。
- 可以在内容显示前准备。

需要检查：

- 覆盖是否完整。
- 是否仍有运行时未命中。
- 某些资源是否在使用前没有完成预缓存。

##### Bundled / Recorded PSO Cache

在实际玩法中收集出现过的 PSO，然后随构建分发缓存。

优点：

- 基于真实内容路径。

限制：

- 采集路线必须覆盖足够内容。
- 新材质、特效和画质档需要重新覆盖。
- 引擎、Shader、驱动或内容变化可能让缓存失效。

两种方案可以互补。

#### 3. 验证流程

1. 清理本地缓存，模拟用户首次运行。
2. 运行固定路线并记录 PSO 尖峰。
3. 启用 Precaching 或随包缓存。
4. 再次从冷缓存运行同一路线。
5. 比较未命中数量和尖峰。
6. 覆盖角色、特效、材质、地图和所有画质档。

PSO 优化解决首次管线创建卡顿，不会降低 Shader 每帧执行时间。

#### 4. 先确认卡顿真的是 PSO

PSO 卡顿常见特征：

- 某个材质、特效、角色或地图内容第一次出现时卡一下。
- 第二次出现明显更顺。
- 清理驱动缓存后又能复现。
- Insights 或日志出现 PSO 创建、Precache Miss/Too Late 等信息。

先排除：

- 同步加载。
- Shader 尚未编译完成。
- GC。
- 大量 Spawn。
- 网络或磁盘 IO。
- 首次创建 Niagara、音频或物理资源。

#### 5. 冷缓存测试的正确方法

普通第二次运行会被驱动缓存掩盖，因此冷缓存和热缓存要分开记录。

1. 使用 Windows DX12 Development 打包版本。
2. 给快捷方式“目标”末尾加入：

```text
-clearPSODriverCache
```

3. 启动 Unreal Insights。
4. 执行固定路线，确保所有测试运行都使用相同参数。
5. 记录首次出现角色、材质和特效时的慢帧。
6. 再去掉该参数运行一次，作为热缓存参考。

`-clearPSODriverCache` 是测试参数，不应放进正式发给玩家的快捷方式。官方建议评估首次启动时始终一致使用它，否则前一次运行留下的驱动缓存可能掩盖卡顿。

#### 6. 检查 PSO Precaching 状态

在控制台逐个输入以下命令，不带值时先查看当前状态：

```text
r.PSOPrecaching
r.PSOPrecache.Components
r.PSOPrecache.GlobalShaders
```

较新的 UE5 版本通常默认启用全局、组件和 Global Shader 预缓存，但不要假设项目配置没有覆盖。

建议先启用轻量验证：

```text
r.PSOPrecache.Validation 1
stat PSOPrecache
```

需要详细日志定位时再使用：

```text
r.PSOPrecache.Validation 2
```

重点看：

- **Hit**：运行时使用且已经正确预缓存。
- **Missed**：本应预缓存但实际没有命中。
- **Too Late**：已经排队，但真正使用时仍未完成。
- **Untracked**：当前预缓存路径没有覆盖。

详细验证会增加开销和日志量，只用于调查，不应用它评价正常 Shipping 性能。

#### 7. 用 Unreal Insights 找 PSO 慢帧

1. 使用冷缓存参数启动打包程序。
2. 录制包含首次进入地图和第一次战斗的 Trace。
3. 在 Timing Insights 中打开慢帧。
4. 搜索或加入：

```text
PSOPrecache: Missed
PSOPrecache: Too Late
```

5. 对照该帧的 Render/RHI Thread 和日志。
6. 记录是哪一个：
   - Material。
   - Vertex Factory。
   - Mesh Pass。
   - 角色、特效或组件。
7. 修复后再次清理驱动缓存，走同一路线验证。

若卡顿帧没有 PSO Miss/Too Late 证据，就继续调查同步加载、GC 或其他线程阻塞。

#### 8. 加载界面要等待预缓存

异步预缓存不等于“资源一加载就立刻全部完成”。如果加载画面过早结束，组件第一次绘制时仍可能：

- 暂时不显示。
- 使用默认材质。
- 等待 PSO 并产生卡顿。

程序侧可以通过 `FShaderPipelineCache::NumPrecompilesRemaining()` 检查尚未完成的预编译数量。推荐做法：

1. 启动关卡加载。
2. 提交会用到的资源和组件。
3. 保持加载画面。
4. 等必要的 PSO 请求完成或达到可接受阈值。
5. 再允许玩家进入交互。

等待多久属于项目体验决策；需要在首次启动、低核心数 CPU 和不同驱动上测试。

#### 9. 手动采集 Bundled PSO Cache

这是高级流程。先把自动 PSO Precaching 验证好，仍有覆盖缺口时再做。

##### 第一步：准备配置

在项目的 `DefaultEngine.ini` 或平台专用 Engine 配置中启用 Stable Keys：

```ini
[DevOptions.Shaders]
NeedsShaderStableKeys=true
```

在 `DefaultGame.ini` 的打包设置中确认：

```ini
[/Script/UnrealEd.ProjectPackagingSettings]
bShareMaterialShaderCode=True
bSharedMaterialNativeLibraries=True
```

并确认：

```text
r.ShaderPipelineCache.Enabled 1
```

配置文件修改前先备份；平台专用配置更适合避免影响无关平台。

##### 第二步：打包并采集

1. 打一个 Windows DX12 Development 包。
2. 使用参数启动：

```text
-logPSO
```

3. 覆盖所有会产生视觉组合的路线：
   - 每张地图。
   - 所有角色和武器。
   - 所有 Niagara/后处理效果。
   - 昼夜或天气。
   - 各画质档。
4. 每次运行后收集：

```text
Saved/CollectedPSOs
```

中的 `rec.upipelinecache` 文件。

可以多次采集再合并，不必一次玩完整个项目。不同 RHI 的缓存不能混用，DX12、Vulkan 等要分别采集。

##### 第三步：生成 Stable Cache

1. 再次 Cook/Package，让引擎生成 `.shk` Stable Shader Key。
2. 从以下目录取得 `.shk`：

```text
Saved/Cooked/<平台>/<项目名>/Metadata/PipelineCaches
```

3. 使用引擎的 `ShaderPipelineCacheTools` Commandlet，把录制缓存和 `.shk` 展开为 `.spc`。
4. 输出文件名必须正确包含项目名和 Shader Format。
5. 将 `.spc` 放入：

```text
Build/<平台>/PipelineCaches
```

6. 重新打包。

Commandlet 的参数、Shader Format 名称和目录必须匹配当前构建，建议直接按当前 UE 版本的 Epic 官方“Manually Creating Bundled PSO Caches”文档生成，避免把其他项目的命令原样复制。

##### 第四步：验证打包是否包含缓存

1. 用 `-logPSO` 启动新包。
2. 查看日志是否成功打开 `stable.upipelinecache`。
3. 检查条目数是否与打包日志写出的 PSO 数量一致。
4. 再次执行冷缓存固定路线。
5. 查看是否仍出现新的 Graphics PSO 或 Miss。

#### 10. PSO 覆盖路线表

| 类别 | 必测内容 |
|---|---|
| 地图 | 每张可进入地图和主要房间 |
| 角色 | 每套皮肤、装备、材质状态 |
| 特效 | 武器、命中、爆炸、天气、UI 特效 |
| 灯光 | 昼夜、不同阴影和后处理组合 |
| 画质 | Low、Medium、High、Epic 及自定义档 |
| RHI | 项目实际支持的每个 RHI 分开采集 |
| 玩法 | 首次拾取、首次技能、首次受击、首次 Boss 阶段 |

#### 11. PSO 优化完成标准

- [ ] 已用冷缓存稳定复现首次运行卡顿。
- [ ] 已证明慢帧来自 PSO，而不是同步加载或 GC。
- [ ] `stat PSOPrecache` 的 Missed/Too Late 已记录。
- [ ] 加载画面考虑了尚未完成的预缓存请求。
- [ ] 每个目标 RHI 和画质档分别验证。
- [ ] Bundled Cache 确实被新包加载。
- [ ] 缓存更新流程已纳入内容版本发布。
- [ ] 优化后首次运行和热缓存运行都已复测。

---

### 十八、可见性、遮挡与距离裁剪

对应课程：**24 Visibility & Occlusion**

最便宜的对象是完全不更新、不提交、不绘制的对象。

#### 1. Distance Culling

应按照物体的屏幕贡献设置最大绘制距离：

- 小石头、碎片、远处小灯可以较早剔除。
- 地标建筑和玩法关键物体保留更远距离。
- 低画质档使用更积极的剔除距离。

距离裁剪可能同时降低：

- CPU 场景处理。
- Draw Call。
- 几何成本。
- 材质和像素成本。
- 阴影成本。

#### 2. Cull Distance Fade

突然消失会产生 Pop，可以使用材质淡出或抖动过渡。但淡出本身也有成本：

- 透明淡出可能增加过绘制。
- 抖动可能产生视觉噪声。
- 淡出距离太长会让对象继续消耗性能。

#### 3. Occlusion Culling

遮挡剔除适合被墙体、建筑和地形完全挡住的对象。

Bounds 非常重要：

- Bounds 过大：对象很难被完全遮挡，无法有效剔除。
- Bounds 过小：动画或 WPO 可能超出范围，造成错误消失。

需要特别检查骨骼网格、粒子和 WPO 资产的 Bounds。

#### 4. 给单个 Actor 设置最大绘制距离

1. 在关卡中选择一个小物体，例如石块、瓶子或远处装饰。
2. 在 Details 搜索 `Draw Distance`。
3. 找到：
   - **Min Draw Distance**。
   - **Desired Max Draw Distance** 或 **Max Draw Distance**。
   - 只读的 **Current Max Draw Distance**。
4. 输入最大距离，单位为 Unreal Unit；默认 1 UU 通常对应 1 cm。
5. 拉远相机，观察对象消失位置。
6. 在玩家正常速度下接近和离开，检查 Pop 是否明显。
7. 对相同尺寸和用途的对象使用一致规则。

`Current Max Draw Distance` 可能来自 Cull Distance Volume，因此它和手动 Desired Max Draw Distance 不一定相同。

#### 5. 使用 Cull Distance Volume 批量管理

适合大量普通静态装饰物：

1. 打开 **Place Actors（放置Actor）**。
2. 搜索 `Cull Distance Volume`。
3. 拖入关卡。
4. 缩放 Volume，使其包住需要管理的区域。
5. 在 Details 展开 **Cull Distances** 数组。
6. 添加多组：

```text
Size
Cull Distance
```

含义：

- `Size`：Actor Bounds 的近似尺寸。
- `Cull Distance`：达到该相机距离后不再绘制。
- `Cull Distance = 0`：该尺寸范围不进行距离剔除。

示例只用于理解，不能直接作为最终值：

| 物体近似尺寸 | 示例剔除距离 |
|---:|---:|
| 50 cm 小碎片 | 2,000 cm |
| 200 cm 普通道具 | 6,000 cm |
| 1,000 cm 建筑部件 | 20,000 cm |
| 大型地标 | 0，不由该 Volume 剔除 |

设置后选择对象，在 Details 查看 Current Max Draw Distance 是否被 Volume 更新。若没有生效，检查对象是否允许 Cull Distance Volume 影响、对象是否在 Volume 内，以及是否属于支持的组件类型。

#### 6. Bounds 可视化与修正

1. 视口点击 **Show（显示）→ Advanced（高级）→ Bounds**。
2. 选择可疑 Actor。
3. 查看 Bounds 是否：
   - 远大于可见物体。
   - 没有覆盖动画、粒子或 WPO 最大范围。
4. 对 Skeletal Mesh、Niagara 和 WPO 资产在运动状态下检查。
5. 只有确认不会裁掉可见内容后，才调整 Bounds Scale 或固定 Bounds。

Bounds Scale 调大可能修复错误消失，却会降低遮挡剔除效率并扩大阴影失效范围。不要把它当成无副作用的修复。

#### 7. 查看哪些物体已被遮挡剔除

在编辑器控制台输入：

```text
r.VisualizeOccludedPrimitives 1
```

被遮挡剔除的 Primitive 会以调试 Bounds 显示。观察完成后关闭：

```text
r.VisualizeOccludedPrimitives 0
```

注意：

- 该可视化主要用于编辑器调试。
- 仍要在打包版本验证性能。
- 看见大量绿色 Bounds 不代表一定有问题，它表示遮挡系统正在工作。

#### 8. FreezeRendering 检查剔除结果

1. 把相机放在测试位置。
2. 打开控制台输入：

```text
FreezeRendering
```

3. 移动编辑器相机，观察冻结视角当时提交了哪些对象。
4. 再输入一次 `FreezeRendering` 恢复。

这个方法可以帮助理解原视角的可见集，但冻结后画面不是正常渲染结果，不要用其帧率做性能结论。

#### 9. 遮挡剔除的常见误区

- **把物体拆得无限小**：可能更容易剔除，但 Actor/组件、Draw 和管理成本会上升。
- **把物体合成一个超大网格**：Draw Call 可能下降，但只露出一点就要提交整个网格，也更难被完全遮挡。
- **只依赖遮挡，不做距离裁剪**：很远的小对象即使未被遮挡仍会产生工作。
- **为了防止消失无限放大 Bounds**：会让遮挡、阴影和 VSM 都更昂贵。

要根据场景结构在合并粒度、距离裁剪和遮挡效率之间平衡。

#### 10. 可见性优化完成标准

- [ ] 小型非关键物体有合理最大绘制距离。
- [ ] Cull Distance Volume 已按尺寸分组并在实际路线验证。
- [ ] Bounds 没有异常过大或过小。
- [ ] 骨骼、粒子和 WPO 在最大运动范围内不会错误消失。
- [ ] 已用 Occluded Primitives/FreezeRendering 理解实际可见集。
- [ ] 没有为减少 Draw Call 把资产合并到无法有效剔除。
- [ ] 低画质档使用更积极但可接受的距离策略。
- [ ] CPU、GPU、阴影和视觉 Pop 都已复测。

---

### 十九、Variable Rate Shading

对应课程：**25 Variable Rate Shading**

VRS 允许一个着色结果覆盖多个像素，减少像素 Shader 执行次数。

#### 1. Tier 1：Material Shading Rate

按材质或 Draw 指定着色率。

适合：

- 明确知道哪些材质可以降低精度。
- 低对比、低细节区域。

限制：

- 控制粒度相对粗。
- 需要逐材质设置和验证。

#### 2. Tier 2：Contrast Adaptive Shading

根据图像对比度等信息生成 Shading Rate Image，自适应选择不同区域的着色率。

优点：

- 对低对比区域自动降低着色率。

风险：

- 高对比边缘、文字和细线可能损失质量。
- 不同场景收益不同。

#### 3. Software VRS 与 Nanite

Software VRS 可与 Nanite 路径结合，但受引擎版本、平台和功能限制。应使用可视化查看实际 Shading Rate 分布。

#### 4. VRS 何时有效

VRS 只有在 GPU 受像素着色限制时才更可能有效。如果瓶颈是：

- Game Thread。
- Draw Call。
- 几何。
- ShadowDepths。
- PSO。

那么降低着色率可能几乎没有收益。

质量测试应覆盖：

- UI 和文字。
- 角色轮廓。
- 细线、头发和植被。
- 高光和法线细节。
- 粒子。
- 快速运动。
- 不同分辨率。

#### 5. 先检查硬件和渲染路径是否支持

VRS 不是在所有机器上都生效。开始前确认：

1. Windows 桌面硬件测试通常使用 DX12。
2. 显卡和驱动支持相应 VRS Tier。
3. 项目设置已允许硬件 Variable Rate Shading。
4. 修改相关项目设置后按提示重启并重新编译 Shader。
5. 在控制台输入：

```text
r.VRS.Enable
r.VRS.EnableImage
```

不带数值可以查看当前状态；加 `?` 可查看当前版本帮助。

如果硬件/RHI 不支持，CVar 设为 1 也不代表渲染路径实际获得收益。

#### 6. 做一次最小 A/B 测试

1. 选择 GPU 明显受 Pixel Shader 限制的场景。
2. 固定相机、分辨率和画质。
3. 预热后连续抓取 3 次 GPU 基线。
4. 关闭 VRS：

```text
r.VRS.Enable 0
```

5. 记录 GPU 和画质截图。
6. 开启 VRS：

```text
r.VRS.Enable 1
```

7. 再记录同样数据。
8. 计算中位数差异，并检查画质。

如果 GPU 差异小于正常波动，不能声称 VRS 有效。可以提高分辨率或选择更重的像素场景继续验证，但不能用 VRS 处理 CPU 瓶颈。

#### 7. Material Shading Rate 的操作

1. 复制一个适合测试的材质。
2. 打开 Material Editor。
3. 在材质根节点或 Details 的高级选项中搜索：

```text
Variable Rate Shading
Shading Rate
```

4. 确认 **Allow Variable Rate Shading** 已启用。
5. 从保守着色率开始，不要直接使用最粗级别。
6. Apply 并保存。
7. 只把测试材质赋给一组低对比、低关注度物体。
8. 检查轮廓、法线、高光、细纹理和运动。
9. 用 ProfileGPU 比较。

不适合降低着色率的内容包括 UI、文字、准星、角色脸部、高对比轮廓、细线和需要精确深度的材质。

#### 8. Contrast Adaptive Shading 的操作

当前版本若支持，可先查询：

```text
r.VRS.ContrastAdaptiveShading ?
```

再启用：

```text
r.VRS.ContrastAdaptiveShading 1
```

查看分布可尝试：

```text
r.VRS.Preview 1
```

测试结束后恢复：

```text
r.VRS.Preview 0
r.VRS.ContrastAdaptiveShading 0
```

操作时重点观察：

1. 低对比的大面积墙面是否被分配较粗着色率。
2. 文字和高对比边缘是否仍保持精细。
3. 相机移动后前一帧分析是否造成闪烁或拖影感。
4. TSR、动态分辨率和后处理是否改变效果。
5. 总 GPU 是否实际下降。

这些 CVar 在不同 UE5 版本可能仍属于实验或发生变化，先用 `?` 确认。

#### 9. Software VRS 与 Nanite 的测试

UE5 的 Software VRS 可为支持它的渲染 Pass 生成更细粒度的 Shading Rate Image，目前常见测试对象是 Nanite 路径。

1. 先确认普通硬件 VRS 的基线。
2. 查询：

```text
r.VRS.EnableSoftware ?
```

3. 当前版本支持时，设置：

```text
r.VRS.EnableSoftware 1
```

4. 使用 VRS Preview 查看覆盖范围。
5. 比较 Nanite Base Pass 和总 GPU。
6. 检查非 Nanite 资产是否没有同等收益。
7. 测试结束后设回原值。

不要因为可视化中出现大量粗着色区域就认为成功；只有毫秒下降且画质可接受才算收益。

#### 10. VRS 画质检查清单

在开/关状态下截取完全相同的画面，并放大比较：

- UI、字幕、准星。
- 角色眼睛、脸部和头发。
- 栅栏、电线和细枝。
- 高光、法线和金属边缘。
- 粒子和透明。
- 快速横移与镜头旋转。
- 1080p、1440p、4K。
- TAA/TSR 的不同质量档。

#### 11. VRS 优化完成标准

- [ ] 目标 GPU、驱动和 RHI 确实支持所需 VRS Tier。
- [ ] 已证明场景受像素着色限制。
- [ ] 开/关 A/B 使用相同相机和分辨率。
- [ ] Material、Contrast Adaptive 和 Software VRS 分开验证。
- [ ] 已使用 Preview 检查实际着色率分布。
- [ ] UI、文字、轮廓、细线和运动画质已检查。
- [ ] GPU 收益大于测试波动。
- [ ] 不支持 VRS 的硬件有正确回退。

---

## 第六部分：平台与项目落地

### 二十、平台画质伸缩

对应课程：**26 渲染资源与自学、27 Platform Scalability**

Scalability 不是项目结束时统一降低几个数值，而应从内容制作阶段建立。

#### 1. 主要伸缩维度

- 内部渲染分辨率。
- 视距。
- 阴影距离和质量。
- 局部灯与阴影数量。
- 后处理。
- 特效数量。
- 植被密度。
- 纹理质量和纹理池。
- LOD。
- Detail Mode。
- Lumen、VSM、Nanite 和 VRS 相关设置。

#### 2. Device Profiles

Device Profile 用于根据平台和硬件类别覆盖配置。适合管理：

- 平台默认画质。
- 内存和纹理池。
- 特定 GPU 或设备配置。
- 移动、掌机、主机和 PC 的差异。

#### 3. Detail Mode

不应只把低画质内容隐藏，还要尽量避免加载和更新这些内容。低端平台不需要的装饰、灯光和特效可以通过 Detail Mode 或平台内容策略排除。

#### 4. 每档都要独立验证

低画质并不保证只影响 GPU。例如：

- 视距降低可能同时降低 CPU 和 GPU。
- 纹理质量影响显存和流送。
- 特效数量可能影响 Game Thread、粒子模拟和 GPU。
- 阴影设置可能影响 Render Thread、GPU 和显存。

每个档位都要检查：

- Game Thread。
- Render/RHI。
- GPU。
- CPU 内存。
- 显存。
- 加载时间。
- 画质。
- 玩法可读性。

Lyra Sample Game 可以作为 Device Profile、Scalability 和跨平台配置的参考。

#### 5. 在编辑器中快速测试画质档

1. 点击编辑器视口上方的 **Settings（设置）**。
2. 选择 **Engine Scalability Settings**。
3. 依次测试 Low、Medium、High、Epic。
4. 每切一次等待 Shader/资源和纹理流送稳定。
5. 使用固定相机记录：

```text
stat unit
stat unitgraph
stat gpu
stat streaming
```

6. 截图比较画质差异。

编辑器画质菜单适合快速预览，但正式性能结论仍要在对应配置的打包版本中取得。

#### 6. 用控制台单独测试某个画质组

先输入命令名查看当前值：

```text
sg.ViewDistanceQuality
sg.AntiAliasingQuality
sg.ShadowQuality
sg.GlobalIlluminationQuality
sg.ReflectionQuality
sg.PostProcessQuality
sg.TextureQuality
sg.EffectsQuality
sg.FoliageQuality
sg.ShadingQuality
```

常见等级为：

```text
0 = Low
1 = Medium
2 = High
3 = Epic
4 = Cinematic（并非所有组/项目都适合实时游戏）
```

例如，只测试阴影档位：

```text
sg.ShadowQuality 0
sg.ShadowQuality 1
sg.ShadowQuality 2
sg.ShadowQuality 3
```

每次只改变一个组，就能判断收益来自阴影、特效还是视距。测试完成后恢复项目默认值。

#### 7. 在游戏设置界面应用画质

蓝图可使用 `Game User Settings`：

1. 在设置 Widget 中取得 **Get Game User Settings**。
2. 根据用户选择调用：
   - `Set Overall Scalability Level`，或
   - 分别调用 `Set Shadow Quality`、`Set Texture Quality` 等。
3. 调用 **Apply Settings**。
4. 调用 **Save Settings**。
5. 需要确认时使用对应 Get 节点读回。
6. 分辨率、窗口模式和动态分辨率要单独处理。

测试：

1. 在游戏内改为 Low。
2. 退出程序。
3. 重新启动。
4. 确认设置被保存。
5. 检查命令行、Device Profile 或项目配置是否覆盖用户选择。

#### 8. 自定义 DefaultScalability.ini

项目专用画质值可放在：

```text
Config/DefaultScalability.ini
```

示意：

```ini
[ShadowQuality@0]
; Low 档阴影相关 CVar

[ShadowQuality@1]
; Medium 档

[ShadowQuality@2]
; High 档

[ShadowQuality@3]
; Epic 档
```

实际填写时：

1. 先查询当前 CVar 的默认值和帮助。
2. 每组只放归属于该画质方向的设置。
3. 记录为什么覆盖。
4. 在版本管理中保存。
5. 每档打包验证。

不要复制完整引擎 BaseScalability 配置到项目中；只覆盖项目确实需要改变的项，更容易维护引擎升级。

#### 9. Device Profile 的操作方法

编辑器入口在不同 UE5 小版本可能位于：

```text
Tools → Platforms → Device Profiles
```

或平台相关工具菜单中。找不到时在 Tools 中搜索 `Device Profile`。

基本操作：

1. 打开 Device Profile 窗口。
2. 找到目标平台父 Profile，例如 Windows、Android 或对应设备类型。
3. 查看继承关系，不要一开始就创建大量平级 Profile。
4. 创建项目需要的子 Profile。
5. 在 Profile 中加入少量平台特定 CVar。
6. 保存后在目标设备启动。
7. 通过日志或控制台确认实际激活的 Profile 和最终 CVar。

项目可在以下文件维护自定义配置：

```text
Config/DefaultDeviceProfiles.ini
```

Device Profile 适合“平台或硬件默认值”；游戏设置菜单适合“玩家可选值”。要明确谁覆盖谁，避免编辑器看起来是 Medium，打包后却被 Profile 改成另一组数值。

#### 10. Detail Mode 的操作方法

适合装饰、附加特效和非玩法关键内容：

1. 选择 Actor 或 Component。
2. 在 Details 搜索 `Detail Mode`。
3. 选择 Low、Medium 或 High。
4. 用控制台切换：

```text
r.DetailMode 0
r.DetailMode 1
r.DetailMode 2
```

5. 检查低档中对象是否按预期隐藏。
6. 用 Insights/统计确认隐藏后是否真的减少更新和渲染工作。

不要把碰撞、任务物体、掩体、交互提示或决定玩法可读性的对象仅靠 Detail Mode 隐藏。

#### 11. 制作每档画质差异表

| 项目 | Low | Medium | High | Epic |
|---|---|---|---|---|
| 内部渲染比例 | 项目填写 | 项目填写 | 项目填写 | 项目填写 |
| 视距 |  |  |  |  |
| 阴影距离/质量 |  |  |  |  |
| 局部阴影灯数量 |  |  |  |  |
| Lumen/GI |  |  |  |  |
| 反射 |  |  |  |  |
| 特效数量 |  |  |  |  |
| 植被密度 |  |  |  |  |
| 纹理池/纹理质量 |  |  |  |  |
| 目标 GPU 帧时间 |  |  |  |  |
| 目标显存 |  |  |  |  |

每档都应有明确目标，不能只写“Low 比 Epic 差一些”。

#### 12. 最低配置验收流程

1. 恢复干净的用户设置。
2. 启动最低目标硬件。
3. 确认实际分辨率、RHI、Device Profile 和画质档。
4. 运行最坏地图与最坏战斗。
5. 记录 Game、Draw、GPU、内存、显存和加载。
6. 运行至少 15～30 分钟，检查纹理流送和内存增长。
7. 切换 Low→Epic→Low，检查资源能否正确回落。
8. 退出重启，确认配置持久化。
9. 检查画质降低是否影响敌人、交互和任务可读性。

#### 13. 平台画质伸缩完成标准

- [ ] 每档有明确的目标硬件、帧率和内存预算。
- [ ] 每个 Scalability Group 都单独做过 A/B。
- [ ] 游戏内设置能够 Apply、Save 并在重启后恢复。
- [ ] Device Profile 的继承和覆盖关系已记录。
- [ ] Detail Mode 没有隐藏玩法关键内容。
- [ ] 最低配置的 CPU、GPU、内存和加载都达标。
- [ ] 首次运行、长时间运行和切档均已验证。
- [ ] 编辑器预览结论已在打包版本复核。

---

### 二十一、完整优化工作流

#### 第一步：定义问题

不要写“游戏有点卡”，应写成：

```text
在最低配置 PC、1080p Medium、60 FPS 目标下，
进入 20 个敌人的战斗后 GPU 帧时间从 13 ms 上升到 22 ms，
ProfileGPU 显示 ShadowDepths 增加约 7 ms。
```

#### 第二步：保存基线

保存：

- 构建版本。
- 测试条件。
- Insights Trace。
- ProfileGPU 截图。
- 场景截图。
- CVar 配置。
- 性能指标。

#### 第三步：提出可证伪假设

例如：

```text
假设：骨骼敌人使 VSM 页面每帧失效，导致 ShadowDepths 增加。
验证：查看 VSM Page Invalidations，并暂时关闭敌人阴影进行 A/B。
```

#### 第四步：一次改变一个变量

如果关闭敌人阴影后 ShadowDepths 明显下降，说明假设有证据支持。下一步不是永久关闭全部阴影，而是进一步测试：

- 哪些角色最昂贵。
- 是否所有 LOD 都需要阴影。
- 远距离是否可以关闭。
- 是否能减少骨骼或 WPO 影响。
- 是否可以调整阴影质量。

#### 第五步：检查成本转移

任何优化都可能转移成本：

| 修改 | 可能副作用 |
|---|---|
| 对象池 | 常驻内存增加 |
| ParallelFor | 调度、锁和同步增加 |
| CPU 动画改 WPO | GPU 顶点和阴影成本增加 |
| 软引用 | 加载延迟与状态管理复杂 |
| 降低 Tick 频率 | 反应延迟或视觉不平滑 |
| 激进距离裁剪 | Pop 和场景空洞 |
| Static Switch | Shader/PSO 组合增加 |
| 延长 GC 间隔 | 内存峰值和单次 GC 增加 |

#### 第六步：目标硬件复测

至少验证：

- 最低目标硬件。
- 最坏代表场景。
- 首次运行。
- 长时间运行。
- 各画质档。
- 不同玩法状态。

#### 第七步：建立回归

优化只有不被后续内容破坏才真正有价值。项目应长期保留：

- 固定测试地图和路线。
- 版本间可比较的数据。
- 各平台预算。
- 最坏场景。
- 超预算责任归属。

#### 第八步：建立性能问题记录单

每个性能问题都建议单独记录，模板如下：

```text
问题编号：
提交/构建版本：
发现日期：
负责人：

目标平台：
硬件：
操作系统/驱动：
分辨率：
画质档：
RHI：
帧率上限/VSync：

复现地图：
复现路线：
复现概率：
预热时间：
重复次数：

目标预算：
当前 Frame/Game/Draw/GPU：
最慢帧：
内存/显存：

证据文件：
- Insights Trace
- ProfileGPU 截图
- 场景截图
- MemReport
- 日志

当前瓶颈：
可证伪假设：
本次只改变的变量：
优化前数据：
优化后数据：
副作用：
是否回滚：
最终结论：
```

这张记录单能避免几周后只记得“好像快了一点”，却不知道当时测试了哪个版本、什么硬件和什么画质。

#### 第九步：给证据文件统一命名

推荐目录：

```text
PerformanceTests/
  2026-07-30_Windows_1080p_Medium/
    Baseline/
    Experiment_01_DisableEnemyShadow/
    Experiment_02_ShadowDistance/
    Final/
```

推荐文件名：

```text
Build123_TestLevel_Medium_Baseline.utrace
Build123_TestLevel_Medium_ProfileGPU.png
Build123_TestLevel_Medium_MemReport.memreport
Build124_TestLevel_Medium_Final.utrace
```

名称至少包含构建、地图、画质和 Baseline/Final，避免多个 `trace_001` 无法分辨。

#### 第十步：一个完整的初学者实战例子

假设现象是“20 个敌人出现后从 60 FPS 掉到 40 FPS”。

##### 1. 固定条件

```text
Windows Development 包
1920×1080
Medium
DX12
关闭 VSync
固定 20 个敌人
固定相机
相同战斗 60 秒
```

##### 2. 做瓶颈初筛

运行：

```text
stat unit
stat unitgraph
```

结果示例：

```text
Game  = 11 ms
Draw  = 8 ms
GPU   = 23 ms
```

结论：当前首先调查 GPU，而不是蓝图 Tick。

##### 3. 找到最贵 GPU Pass

运行 `ProfileGPU`，发现：

```text
ShadowDepths = 8 ms
BasePass     = 3 ms
Lighting     = 4 ms
```

提出假设：

```text
20 个动态骨骼敌人持续让 VSM 页面失效。
```

##### 4. 做一个可恢复实验

1. 暂时关闭敌人 Skeletal Mesh 的 Cast Shadow。
2. 不改灯、不改分辨率、不改敌人数量。
3. 重复 3 次。

结果：

```text
GPU 从 23 ms 降到 16 ms
ShadowDepths 从 8 ms 降到 1.8 ms
```

这说明敌人阴影是重要成本，但“全部永久关闭”还不是最终方案。

##### 5. 细化方案

分别测试：

- 近距离敌人保留阴影。
- 远距离 LOD 关闭阴影。
- 缩小局部灯影响半径。
- 限制同一灯影响的敌人数。
- 降低 Medium 档远距离阴影质量。

##### 6. 检查成本转移

确认：

- 角色没有明显漂浮。
- 阴影不会突然跳变。
- Game/Draw 没有上升。
- VSM 缓存页更稳定。
- Low/High 档行为正确。

##### 7. 最终复测

恢复干净环境，在最低目标 PC 重新跑 3 次，把最终 Trace、ProfileGPU 和截图放入 Final 目录。

#### 第十一步：如何判断优化是否真的有效

同时满足以下条件才建议合入：

1. 优化前后条件一致。
2. 差异大于正常运行波动。
3. 至少重复 3 次，优先比较中位数和慢帧。
4. 目标瓶颈确实下降。
5. 没把成本转移到另一个更严重的线程或内存。
6. 画质和玩法副作用可接受。
7. 最低目标硬件上仍有收益。
8. 可以通过固定测试路线再次复现。

#### 第十二步：常见失败流程及修正

| 失败做法 | 为什么不可靠 | 正确做法 |
|---|---|---|
| 只看编辑器 FPS | 编辑器有额外开销 | 使用打包版本和毫秒 |
| 一次改十个 CVar | 不知道谁有效 | 一次改变一个主要变量 |
| 只测一次 | 容易受偶然尖峰影响 | 预热并重复至少 3 次 |
| 只看平均 FPS | 会掩盖卡顿 | 同时看帧时间图和慢帧 |
| 只在高端电脑测 | 不能代表目标用户 | 在最低目标硬件复测 |
| 优化 GPU 时忽略 CPU | 可能只转移瓶颈 | 同时记录 Game/Draw/GPU |
| 直接接受画质损失 | 可能有更精确方案 | 先定位具体灯、物体或 Pass |
| 不保存 Trace | 无法复核结论 | 保存原始证据和配置 |

---

### 二十二、常用命令速查

> 命令和输出可能随 UE 版本、构建配置及平台变化。使用前以当前引擎控制台帮助为准。

| 命令/工具 | 作用 |
|---|---|
| `stat unit` | 查看 Frame、Game、Draw、GPU |
| `stat unitgraph` | 查看帧时间趋势和尖峰 |
| `stat fps` | 查看 FPS |
| `stat game` | 查看 Game Thread 分类统计 |
| `stat gpu` | 查看 GPU 分类统计 |
| `ProfileGPU` | 捕获并展开一帧 GPU Pass |
| `stat memory` | 查看内存概况 |
| `stat streaming` | 查看纹理流送和池状态 |
| `stat scenerendering` | 查看场景渲染统计 |
| `stat rhi` | 查看 RHI 和绘制相关统计 |
| `stat anim` | 查看动画统计 |
| `stat physics` | 查看物理统计 |
| `r.ScreenPercentage` | 调整内部渲染比例，辅助判断 GPU 瓶颈 |
| `r.VSync` | 检查是否受 VSync 限制 |
| `t.MaxFPS` | 设置或检查帧率上限 |
| Unreal Insights | CPU、线程、任务、加载和内存分析 |
| Console Variables Editor | 保存和切换 CVar 实验组 |
| RenderDoc | 检查单帧 Draw、资源和 Shader |

#### 1. 控制台命令怎么输入

在编辑器或 Development 包中：

1. 按键盘 `~` 打开控制台。
2. 输入命令。
3. 按 Enter。
4. 再按 `~` 关闭。

如果 `~` 无法打开：

1. 点击 **编辑 → 项目设置**。
2. 搜索 `Console`。
3. 检查 Console Keys。
4. 确认当前输入法和键盘布局。

Shipping 包通常会限制调试控制台和部分分析命令，所以课程练习应优先使用 Development 包。

#### 2. 查询当前值和帮助

修改 CVar 前先查询：

```text
r.ScreenPercentage
```

查看帮助：

```text
r.ScreenPercentage ?
```

设置值：

```text
r.ScreenPercentage 75
```

恢复本次常用基线：

```text
r.ScreenPercentage 100
```

不要默认 `0` 总是“恢复默认”；不同 CVar 对 `0` 的含义不同，先看 `?`。

#### 3. 基础帧时间组合

```text
stat fps
stat unit
stat unitgraph
```

推荐用法：

1. `stat unit` 判断 Game、Draw、GPU 谁最大。
2. `stat unitgraph` 看持续高成本还是偶发尖峰。
3. `stat fps` 只作直观参考。

再次输入同一 `stat` 命令通常会关闭该统计。也可尝试 `stat none` 关闭所有 Stat 显示。

#### 4. 解除帧率限制

```text
r.VSync 0
t.MaxFPS 0
```

说明：

- `r.VSync 0` 关闭垂直同步。
- `t.MaxFPS 0` 通常表示不使用该 CVar 限帧。
- 项目平滑帧率、平台同步或外部驱动仍可能限制。

测试结束后恢复项目需要的设置，不要把性能分析状态误当正式玩家配置。

#### 5. CPU 调查命令

```text
stat game
stat anim
stat physics
DumpTicks
listtimers
```

用途：

- `stat game`：查看 Game Thread 中较大的分类。
- `stat anim`：大量骨骼角色的动画成本。
- `stat physics`：物理模拟和碰撞相关分类。
- `DumpTicks`：输出正在 Tick 的对象；参数随版本变化，先用自动补全。
- `listtimers`：列出 Timer，排查数量和频率。

这些命令适合初筛；要定位具体函数和调用关系，继续使用 Unreal Insights。

#### 6. GPU 调查命令

```text
stat gpu
ProfileGPU
stat scenerendering
stat rhi
```

用途：

- `stat gpu`：实时查看主要 GPU 分类。
- `ProfileGPU`：抓取并展开一帧。
- `stat scenerendering`：查看 Primitive、Mesh、Lights 等场景统计。
- `stat rhi`：查看 Draw、Primitive 和 RHI 资源统计。

抓 ProfileGPU 时应保持相机固定，连续抓 3 次，并关闭不必要的调试可视化。

#### 7. 分辨率敏感度测试

```text
r.ScreenPercentage 100
r.ScreenPercentage 75
r.ScreenPercentage 50
```

如果降低内部渲染比例后 GPU 明显下降，而 Game/Draw 基本不变，说明存在明显像素/分辨率相关成本。

恢复：

```text
r.ScreenPercentage 100
```

TSR、动态分辨率和编辑器屏幕百分比覆盖可能影响结果，应记录实际生效值。

#### 8. 内存调查命令

```text
stat memory
stat streaming
memreport -full
```

用途：

- `stat memory`：内存总体分类。
- `stat streaming`：纹理流送池、Mip 和请求状态。
- `memreport -full`：把详细快照写入 Saved/Profiling/MemReports。

`memreport -full` 可能短暂停顿，应该在专门调查时运行，不要把执行命令的那一帧计入正常性能。

#### 9. Trace 命令

当前版本支持时，可在运行程序的控制台使用：

```text
Trace.Start cpu,gpu,frame,bookmark
Trace.Stop
```

使用前建议：

```text
Trace.Status
```

查看当前连接和已启用 Channel。不同版本的 Channel 名称可能变化，使用 Unreal Insights 的 Trace Control 面板通常更直观。

#### 10. PSO 调查命令

```text
r.PSOPrecache.Validation 1
stat PSOPrecache
```

详细定位：

```text
r.PSOPrecache.Validation 2
```

冷缓存启动参数：

```text
-clearPSODriverCache
```

不要在正式玩家构建中长期使用详细 Validation 或每次清理驱动缓存。

#### 11. 可见性和 VRS 调试

```text
r.VisualizeOccludedPrimitives 1
r.VisualizeOccludedPrimitives 0
FreezeRendering
r.VRS.Enable
r.VRS.Preview
```

这些可视化用于解释渲染行为。开启调试视图后得到的帧时间通常不能直接和正常 Lit 画面比较。

#### 12. 命令实验记录模板

```text
命令：
原始值：
测试值：
修改原因：
生效平台/RHI：
修改前数据：
修改后数据：
画质副作用：
是否恢复：
最终是否写入配置：
```

只有在多个代表场景和目标硬件上通过验证后，才把 CVar 写进项目配置或 Device Profile。

---

### 二十三、最终检查表

#### 测试条件

- [ ] 已明确目标平台、FPS、分辨率和画质档。
- [ ] 使用打包版本，而非只测编辑器。
- [ ] 固定地图、相机、AI、随机种子和测试时长。
- [ ] 已区分首次运行和预热后的稳定运行。
- [ ] 同一测试重复运行至少 3 次。

#### CPU

- [ ] 已确认 Game Thread 是否为真正瓶颈。
- [ ] 已检查无意义 Tick、Timer 和 Timeline。
- [ ] 已检查蓝图大循环和重复纯节点计算。
- [ ] 已检查同步加载、Spawn/Destroy 和 GC。
- [ ] 已检查动画、AI 和碰撞查询。
- [ ] 并行优化确实缩短了关键路径。

#### GPU

- [ ] 已用 ProfileGPU 找到最贵 Pass。
- [ ] 已用可视化模式解释成本原因。
- [ ] 已检查 VSM 页面失效。
- [ ] 已检查局部灯重叠和影响半径。
- [ ] 已检查材质复杂度和透明过绘制。
- [ ] 已检查远距离对象是否仍在绘制和投影。
- [ ] 已检查 PSO 首次运行卡顿。

#### 内容与内存

- [ ] 已用 Size Map 检查大型依赖。
- [ ] 已用 Reference Viewer 检查意外硬引用。
- [ ] 纹理尺寸、Mip 和流送设置合理。
- [ ] 离开场景后内存能够合理回落。
- [ ] 对象池没有造成不可接受的常驻内存。
- [ ] 各画质档符合平台内存和显存预算。

#### 验证

- [ ] 优化前后使用相同测试条件。
- [ ] 一次只改变一个主要变量。
- [ ] 同时记录平均值、慢帧和尖峰。
- [ ] 检查了画质和玩法副作用。
- [ ] 已在最低目标硬件验证。
- [ ] 已把测试场景和预算纳入性能回归。

#### 如何使用这张检查表

1. 不要在项目结束前一次性勾选。
2. 每处理一个性能问题，复制一份检查表。
3. 每个勾选项应能对应到证据：
   - Trace。
   - 截图。
   - 日志。
   - 数据表。
   - 提交记录。
4. 无法提供证据时保持未勾选。
5. 优化合入后，再用最新构建执行一次最终验证。

#### 问题关闭前的硬性门槛

| 门槛 | 通过条件 |
|---|---|
| 可复现 | 固定路线可稳定重现原问题 |
| 有基线 | 保存修改前的帧时间和证据 |
| 有归因 | 能指出具体线程、Pass、资源或系统 |
| 有对照 | 一次一个变量的 A/B 数据 |
| 有收益 | 差异大于正常波动 |
| 无严重转移 | CPU、GPU、内存、加载没有更坏 |
| 画质可接受 | 有相同视角截图或视频对比 |
| 玩法正确 | 判定、交互、动画和联网通过 |
| 目标机通过 | 最低目标硬件复测 |
| 可回归 | 测试地图、路线和预算可再次执行 |

#### 初学者建议练习顺序

##### 练习一：只判断瓶颈

1. 打包 Development。
2. 固定路线。
3. 使用 `stat unit`。
4. 写出 Game/Draw/GPU 中谁最大。
5. 不做任何优化。

目标：先学会不靠感觉判断。

##### 练习二：完成一次 GPU A/B

1. 选择 GPU 受限场景。
2. 用 ProfileGPU 找到最贵 Pass。
3. 临时关闭一个灯、阴影或复杂材质。
4. 前后各测 3 次。
5. 恢复原设置。

目标：理解“实验”与“最终方案”的区别。

##### 练习三：完成一次 CPU Trace

1. 录制 30～60 秒 Unreal Insights。
2. 找到一个慢帧。
3. 判断 Game Thread 是在工作还是等待。
4. 找到一个具体函数或系统。

目标：从 Stat 分类走到具体调用。

##### 练习四：完成一次内存往返

1. 主菜单生成 MemReport。
2. 进入地图。
3. 离开地图。
4. 重复 3 次。
5. 判断是缓存还是持续累积。

目标：不把“没有立刻下降”误判为泄漏。

##### 练习五：做一项可交付优化

1. 填性能问题记录单。
2. 保存基线。
3. 提出假设。
4. 做 A/B。
5. 检查副作用。
6. 在目标硬件复测。
7. 保存 Final 证据。

目标：完整走完一次可复核的优化闭环。

---

### 课程附带资料

- [UE Scalability Reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-reference)
- [Scalability and the Developer](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-and-the-developer-for-unreal-engine)
- [Detail Mode](https://dev.epicgames.com/documentation/en-us/unreal-engine/scalability-reference-for-unreal-engine#detailmode)
- [Lyra Sample Game](https://dev.epicgames.com/documentation/en-us/unreal-engine/lyra-sample-game-in-unreal-engine)
- [Low Latency Frame Syncing](https://dev.epicgames.com/documentation/en-us/unreal-engine/low-latency-frame-syncing-in-unreal-engine)
- [Trace Quick Start Guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/trace-quick-start-guide-in-unreal-engine)
- [Unreal Insights Reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-insights-reference-in-unreal-engine-5)
- [Stat Commands](https://dev.epicgames.com/documentation/en-us/unreal-engine/stat-commands-in-unreal-engine)
- [Reference Viewer](https://dev.epicgames.com/documentation/en-us/unreal-engine/reference-viewer-in-unreal-engine)
- [Using RenderDoc with Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-renderdoc-with-unreal-engine)
- [Animation Optimization](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-optimization-in-unreal-engine)
- [Animation Budget Allocator](https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-budget-allocator-in-unreal-engine)
- [Memory Insights](https://dev.epicgames.com/documentation/en-us/unreal-engine/memory-insights-in-unreal-engine)
- [Nanite Virtualized Geometry](https://dev.epicgames.com/documentation/en-us/unreal-engine/nanite-virtualized-geometry-in-unreal-engine)
- [Virtual Shadow Maps](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)
- [Contact Shadows](https://dev.epicgames.com/documentation/en-us/unreal-engine/contact-shadows-in-unreal-engine)
- [Material Analyzer](https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-engine-material-analyzer-tool)
- [PSO Precaching](https://dev.epicgames.com/documentation/en-us/unreal-engine/pso-precaching-for-unreal-engine)
- [Creating a Bundled PSO Cache](https://dev.epicgames.com/documentation/en-us/unreal-engine/manually-creating-bundled-pso-caches-in-unreal-engine)
- [Visibility and Occlusion Culling](https://dev.epicgames.com/documentation/en-us/unreal-engine/visibility-and-occlusion-culling-in-unreal-engine)
- [Cull Distance Volumes](https://dev.epicgames.com/documentation/en-us/unreal-engine/cull-distance-volumes-in-unreal-engine)
- [Setting Up Device Profiles](https://dev.epicgames.com/documentation/en-us/unreal-engine/setting-up-device-profiles-in-unreal-engine)

---

### 总结

UE5 性能优化最重要的不是记住某个 CVar，而是建立稳定的工作方式：

1. 明确目标平台和预算。
2. 在可重复的环境中测量。
3. 先判断 CPU、Render/RHI 还是 GPU 瓶颈。
4. 使用正确工具找到具体热点。
5. 优先消除不必要的工作。
6. 再考虑降频、批处理、异步和并行。
7. 检查内存、卡顿、画质和玩法副作用。
8. 在目标硬件上做严格 A/B 验证。

**先测量，再定位；先减少工作，再提高执行效率；最后用目标硬件的数据证明优化确实有效。**
