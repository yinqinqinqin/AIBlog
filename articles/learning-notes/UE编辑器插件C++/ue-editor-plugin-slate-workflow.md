---
title: UE编辑器插件C++ - Slate与工作流开发
category: learning-notes
date: 2026-08-27
readTime: 3 min read
excerpt: UE编辑器插件C++ 学习记录，整理 目标、第一部分、Unreal Engine Modules（模块） 等内容。
tags: [UE编辑器插件C++]
cover: ""
---

# 目标

- 创建自定义编辑器消息
- 菜单项
- Slate控件
- 自定义编辑器快捷键
- 扩展
- 内容浏览器
- 关卡编辑器
- World OutLiner

第一部分

- 资源操作
- 现有的脚本库
  - Ueditor Asset Library
  - Ueditor Utility Library
  - 创建自定义编辑器消息
  - 加载其他模块

第二部分

- 添加自定义菜单项，帮助搜索
- 删除未使用的资源和空文件夹
- Unreal不同类型的委托，解读声明委托的宏

第三部分

- 理解如何成功绑定函数
- 智能指针
- 如何注册
- 如何创建自定义编辑器标签页
- 使用slate代码创建文本块，列表视图，复选框
- 与自己的模块通信，定义此Slate模块的功能
- 添加自定义图标，static关键字
- 自动化材质，使用代码创建材质
  - 如何创建节点，以及如何用代码和编辑器工具控件连接节点
  - 从而筛选出需要的纹理，用于连接材质编辑器的正确输出节点



# 第一部分

## Unreal Engine Modules（模块）

- 模块能够实现代码分离
- 所有的模块需要一个`[ModuleName].Build.cs文件`
- 添加外部模块到Bulid.cs文件之后，能够被引擎所引用
  - 在C++开发中，通常需要引用不同的头文件
  - 想要引用这些文件，就需要把模块名添加到Build.cs文件里

# 创建空白插件

1. 点击 编辑->插件 ->添加 ->空白模板 
2. 创建插件名（后续无法修改）
3. 确保勾选显示内容目录
4. 点击创建插件

# 基础插件设置

1. 回到Code，在Plugins中找到创建的插件
2. 找到uplugin，修改两个地方分别为，Editor和PreDefault
   1. “Type“：决定了该插件会影响内容的哪些部分
      1. 影响游戏代码：Runtime
      2. 仅用于编辑器：Editor
   2. “LoadingPhase”： 决定插件何时被加载
      1. “Defalut”
      2. “PreDefault ” 这个插件会在游戏模块之前加载

# 资产操作工具

## 创建一个基于 **Asset Action Utility**新类（资源操作类）

1. 点击Tool -> New C++ Class-> All Classes ->AssetAction->next
2. 为类选择目标模块，也就是刚刚创建的模块中,并为这个类命名
3. **选择路径**
   1. 在模块的路径后面添加专用文件夹`/AssetActions`
   2. 选择Public定义类的类型：头文件便会放在Public文件夹中
4. 关闭UE，使用Code进行编译
5. 检查public文件夹，生成了刚刚创建的C++类
6. 在头文件中，能看到#include "AssetActionUtility.h"出现错误，反映我们无法访问这个头文件
   1. ==复制AssetActionUtility.h==文件名到资源管理器中查找
   2. 发现这个头文件在==Blutility模块==中，所以需要把这个模块加入到`Build.cs`文件中
   3. 打开刚刚创建的插件的Build.cs文件
   4. 在==PublicDependencyModuleNames（公共依赖模块名）==里面增加一个Blutility
      1. 编译成功则跳过
      2. 在Blutility的Bulid.cs文件中，发现`PrivateIncludePaths.Add("Editor/Blutility/Private");`指向私有包含模块，对于插件来说，也需要包含这个路径
      3. 回到插件的Bulid.cs,找到私有包含路径
      4. 添加`System.IO.Path.GetFullPath(Target.RelativeEnginePath) + "/Source/Editor/Blutility/Private"`
      5. 检查是否编译成功
7. 回到资源操作类的头文件，可以添加资源操作相关的方法了
   1. 在public类型下面，声明类的方法
      1. 使用UFUNCTION(CallInEditor)标记该方法
      2. 复制这个方法的标签，粘贴到cpp文件
      3. 在cpp文件中，定义该方法`		GEngine->AddOnScreenDebugMessage(-1, 8.f, FColor::Cyan, TEXT("Working"));`使用这行代码进行测试

8. 使用ctrl + F5编译进入UE，在5.2-5.6版本中，右键的菜单系统中，不会扫描C++类，只会扫描蓝图类，只有创建一个空的以资源操作类为父类的蓝图类才能正常使用

# 创建调试标题

为了避免每次都要输入一大串调试代码，所以创建一个调试类保存调试的方法

1. 在插件文件夹下，找到public文件夹，点击右键，选择添加新项
2. 重新选择位置，改为插件的存放位置的public目录下面
3. 选择头文件类型，并修改名字 
4. 在资源操作类的方法中添加头文件名字，编译检查是否成功
5. 随后在头文件中声明并定义两个打印函数
6. 编译成功后,启动编辑器能看到日志和屏幕界面显示的打印提示

# 资源批量复制

首先需要了解两个脚本库

- ==UEditorUtilityLibrary==
  - GetSelectedAssets
    - static TArray<UObject*> GetSelectedAssets();
    - 返回被选中资源的实例
  - GetSelectedAssetData
    - Static TArray<FAssetData> GetSelectedAssetData();
    - 返回被选中资源的数据，告诉我们多少个资源被使用（大部分使用）
- ==UEditorAssetLibrary==
  - ListAssets
    - Static TArray<FString> ListAssets(const String& DirectoryPath,bool); 

# 文件详细介绍

`[ModuleName].Build.cs文件`

`ctrl + B`对代码进行编译

`ctrl + F5`启动编辑器

- `资产操作工具类`：AssetActionUtility
- `Actor操作工具类：`：ActorActionUtility

`ctrl + Alt + F11`热重载

`UFUNCTION(CallInEditor)`

- 标记U函数
  - 右键单击资源时就会出现按钮
  - 触发自定义编辑器的功能
- CallInEditor修饰符
# 总结分析

- 这篇主要记录 `Slate与工作流开发` 相关内容，核心集中在 目标、第一部分、Unreal Engine Modules（模块）。
- 归类到 `UE编辑器插件C++` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
