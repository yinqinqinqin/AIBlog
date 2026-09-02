# SDF 学习记录

#### SDF(Signed Distance Field)

符号距离场，通过坐标与函数图像的距离信息以隐式函数的方式表示图像，在图像上距离为0，在图像外为正，图像内为负，数值表示距离图像的距离。如下图以圆为例

#### 绘制SDF图像

##### 画一个圆

```typescript
float sdCircle( vec2 p, float r )
{
    return length(p) - r;
}

vec4 drawSdf(vec4 sdfColor,float threshold,float sdf){
    return mix(sdfColor,vec4(0.0,0.0,0.0,1.0),smoothstep(threshold-0.01,threshold+0.01,sdf));
}
```

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902172013109.png)

其他SDF图像可以参考 [https://iquilezles.org/articles/distfunctions2d/](https://iquilezles.org/articles/distfunctions2d/)

##### 丝滑变换

通过插值两个距离场可以得到两个图像丝滑变换效果

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902172013106.gif)

```typescript
color = mix(sdf1,sdf2,_Progress)
```

##### 运算

- 取并集

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902172013107.gif)

```typescript
float mergeSdf(float sdf1,float sdf2){
    return min(sdf1,sdf2);
}
```

- 取交集

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902172013105.gif)

```typescript
float intersectionSdf(float sdf1,float sdf2)
{
    return max(sdf1,sdf2);
}
```

- 相减

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902172013111.gif)

```typescript
float subtractSdf(float sdf1,float sdf2)
{
    return -mergeSdf(-sdf1,sdf2);
}
float mergeSdf(float sdf1,float sdf2){
    return min(sdf1,sdf2);
}
```

- 丝滑取并集

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902172013110.gif)

推导函数

```typescript
float smoothUnion(float sdf1,float sdf2 ,float k){
    float alpha = clamp(0.5+(sdf1-sdf2)/(2.0*k),0.0,1.0);
    return mix(sdf1,sdf2,alpha)- k*alpha*(1.0-alpha);
}
```
