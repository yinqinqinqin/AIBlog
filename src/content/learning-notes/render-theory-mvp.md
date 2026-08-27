---
title: 渲染理论 - MVP矩阵
category: learning-notes
date: 2026-08-27
readTime: 2 min read
excerpt: 渲染理论 学习记录，整理 M：模型矩阵、缩放，旋转与平移、缩放矩阵 等内容。
tags: [渲染理论]
cover: ""
---

引擎自动执行：
$$
P_{\text{world}}=M P_{\text{local}}\\
Pview​=VPworld\\
Pclip​=PPview​
$$

# M：模型矩阵

## 缩放，旋转与平移

模型最开始处于自己的局部坐标系中，通常需要先改变模型大小，再改变朝向，最后放到目标位置

### 缩放矩阵

$$
\boxed{
S=
\begin{bmatrix}
s_x&0&0&0\\
0&s_y&0&0\\
0&0&s_z&0\\
0&0&0&1
\end{bmatrix}
}
$$

计算：
$$
TP=
\begin{bmatrix}
x+t_x\\
y+t_y\\
z+t_z\\
1
\end{bmatrix}
$$

### 旋转矩阵

绕X轴
$$
\boxed{
R_x=
\begin{bmatrix}
1&0&0&0\\
0&\cos\theta&-\sin\theta&0\\
0&\sin\theta&\cos\theta&0\\
0&0&0&1
\end{bmatrix}
}
$$

$$
\begin{aligned}
x'&=x\\
y'&=y\cos\theta-z\sin\theta\\
z'&=y\sin\theta+z\cos\theta
\end{aligned}
$$
绕y轴

$$
\boxed{
R_y=
\begin{bmatrix}
\cos\theta&0&\sin\theta&0\\
0&1&0&0\\
-\sin\theta&0&\cos\theta&0\\
0&0&0&1
\end{bmatrix}
}
$$

$$
\begin{aligned}
x'&=x\cos\theta+z\sin\theta\\
y'&=y\\
z'&=-x\sin\theta+z\cos\theta
\end{aligned}
$$

绕z轴
$$
\begin{aligned}
x'&=x\cos\theta-y\sin\theta\\
y'&=x\sin\theta+y\cos\theta\\
z'&=z
\end{aligned}
$$

### 平移矩阵

$$
\boxed{
T=
\begin{bmatrix}
1&0&0&t_x\\
0&1&0&t_y\\
0&0&1&t_z\\
0&0&0&1
\end{bmatrix}
}
$$

计算：
$$
TP=
\begin{bmatrix}
x+t_x\\
y+t_y\\
z+t_z\\
1
\end{bmatrix}
$$

### 齐次坐标系

根据模型矩阵，可以得到这是一个四维向量

在平移矩阵中用到了第四个向量原因是：==平移不是线性变换的==，平移是**ax+b**的方式进行变换
其中w向量的1表示==当前物体与相机的距离==，当相机平移后，可能会远离或者靠近相机，这时候要有一个近大远小的算法，所以需要/w向量。

# V：观察矩阵

目标：把所有顶点从世界坐标系变换到**以相机为原点、以相机朝向为轴向**的观察空间

```
世界点
  ↓ 减去相机位置
得到相对于相机的位置
  ↓ 使用相机的反向旋转
转换到相机自身坐标轴
  ↓
相机空间坐标
```

$$
\boxed{
P_{\text{view}}
=
R_{\text{camera}}^{-1}
(P_{\text{world}}-C)
}
$$

其中：

- 减去 C：把相机作为新原点；
- 乘 R^{-1}：把相机的朝向作为新坐标轴。逆旋转矩阵

## 绕 Z 轴的旋转矩阵

$$
R(\theta)=
\begin{bmatrix}
\cos\theta&-\sin\theta&0\\
\sin\theta&\cos\theta&0\\
0&0&1
\end{bmatrix}
$$

它的逆矩阵是：
$$
R^{-1}(\theta)=R(-\theta)
$$
也就是：
$$
R^{-1}=
\begin{bmatrix}
\cos\theta&\sin\theta&0\\
-\sin\theta&\cos\theta&0\\
0&0&1
\end{bmatrix}
$$

# P：投影矩阵

你设置相机的：

- FOV
- Aspect Ratio
- Near Clip Plane
- 透视或正交相机
# 总结分析

- 这篇主要记录 `MVP矩阵` 相关内容，核心集中在 M：模型矩阵、缩放，旋转与平移、缩放矩阵。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
