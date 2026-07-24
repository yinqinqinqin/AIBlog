---
title: Niagara 电弧效果测试：从参考拆解到性能控制
category: learning-notes
date: 2026.06.07
readTime: 7 分钟
excerpt: 一次关于电弧特效的拆解实验，重点记录参考归纳、层次拆分和实时性能限制下的取舍。
tags: Niagara, VFX, 性能
cover: https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=unreal%20engine%20niagara%20lightning%20effect%20study%2C%20dark%20technology%20scene%2C%20blue%20electric%20arcs%2C%20premium%20editorial%20look&image_size=landscape_16_9
---

做电弧类效果时，最容易失控的是细节层太多导致画面吵闹。我把电弧拆成主体形态、噪声扰动和瞬时闪烁三层，先让主体可读，再加细节。

另一部分是性能控制。很多好看的电弧效果一旦进入真实场景就会成本过高，所以我更关注粒子数量、贴图复用和发光范围。

这类文章更像学习记录和项目备忘的结合体。
