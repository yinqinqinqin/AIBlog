# 顶点动画贴图 Vertex Animation Texture

> - Owner：
>
> - Amazing实现： [渲染效果-单项Demo-材质-顶点动画(通用）](https://bytedance.feishu.cn/docs/doccn7EL8jDfmbTqKUvYg1IaTFc)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902130758638.gif)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902131406557.webp)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902131407228.webp)

左：SoftVAT     中：RigidVAT      右：FluidVAT

顶点动画贴图是一张存储顶点动画数据的贴图，将顶点动画信息烘焙到2D纹理贴图中，以便以后在vertex shader中提取顶点位置并变化，最终实现物体/角色动画的方法。

## 基本原理

简单来说，就是把模型的所有顶点位置存在一个矩阵中，矩阵的尺寸大小是[顶点数量 x 总帧数]，其中每一个小单元都是一个vector3，横坐标为顶点索引，纵坐标为时间，即每一行单元存储的就是一帧的画面，而每一列就是同一个顶点在整个动画中的位置变化情况。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902130224677.png)

VAT的基本存储方式

这个矩阵的信息会被存储到一张纹理中，每一个像素的RGB值存储的就是每个顶点的坐标。通常我们使用的纹理贴图都是R8G8B8或者R8G8B8A8，它的通道可以表示0~255（整型）或者精度只有1/256的0~1的值，所以当我们要把顶点位置存储到VAT中时，往往都需要把顶点坐标归一化到0~1的区间内才能正确地存储到RGB上。

```makefile
#顶点的最大值
maxValue = 2;
#顶点的最小值
minValue = -1;
#数值范围
rangeValue = maxValue -minValue;
#原始坐标
XYZ = Vector((-1,2,1));
#像素RGB
RGB = （XYZ-minValue）/rangeValue;
#RGB转会XYZ
XYZ = RGB*rangeValue + minValue;
```

有时我们还需要法线的动画，法线的存储方式和顶点的存储方式一致，即法线值的范围需要从-1~1归一化到0~1。

## Shader

### 获取单帧顶点位置

在vertex shader中，我们使用当前所处理的顶点索引为u，动画播放至此的是时间刻度为v来对纹理进行采样，而采样的结果，则为当前这个顶点此时的位置。当我们在vertex shader中读取动画第一帧的顶点位置时，代码如下

```glsl
  float vertCoords = v.vertexId;    // 顶点索引
  float animCoords = 0;             // 动画时刻
  vec2 texCoords = vec2(vertCoords, animCoords);    // 采样uv坐标
  float4 position = texture(_AnimVertexTex, texCoords);  // 采样得到顶点位置
```

### 每帧读取生成动画

为了让物体动起来，我们只需要根据当前时间来改变采样位置。在上面的代码中把animCoord的值加上时间参数的影响。下面代码通过使用frac来实现动画的循环播放。

```apache
_AnimVertexTex_TexelSize = Vector4 (1/width, 1/height, width, height)
float animCoords = frac (_Time.y * _AnimVertexTex_TexelSize.y)
```

至此我们就可以实现通过对基本顶点动画贴图采样来获取每帧顶点位置的效果啦。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902130805599.webp)

遍历VAT

在上述介绍中，我们会将每一帧的顶点位置存在同一行里，即模型有多少个顶点纹理贴图的宽度就会是多少，而在移动端上贴图的最大尺寸往往不能超过2048，不然会影响到渲染性能，而很多时候我们需要用顶点数大于2048的模型来实现更平滑的效果，这就会大大限制VAT的使用场景。为了尽量避免这种情况，Houdini在导出VAT时会允许用户输入预期贴图宽度，即希望的每行存储的顶点信息数量，然后根据用户的输入数据来设置每行存储的顶点数量。

这时我们需要改变之前的采样坐标计算方式，通过引入总帧数frameNum，播放速度speed以及压缩比例paddedRatio来计算新的采样坐标，这些参数在VAT导出时会都包含在一起导出的json文件里。需要注意的是，在Houdini中，VAT输出节点会在v.texcoord1即是UV2中，储存每个顶点初始采样贴图的像素位置，打开导出的模型查看就UV可以发现：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902130804681.png)

UV2

所以我们只要在uv2的基础上根据时间把uv一帧一帧做位移即可。

```glsl
vec2 VAT_uvPosition(vec2 uvIndex, float frameNum, float speed, float time, vec2 paddedRatio){
        vec2 uvPosition;
        float timeInFrames = fract(speed * time);

        timeInFrames = ceil(timeInFrames * frameNum);
        timeInFrames /= frameNum;
        timeInFrames += (1.0 / frameNum);

        uvPosition.x = uvIndex.x * paddedRatio.x;
        uvPosition.y = (timeInFrames * paddedRatio.y) + (uvIndex.y * paddedRatio.y);

        return uvPosition;
}
```

在得到采样点之后对PositionTex进行采样，然后通过PosMin和PosMax将采样得到的值从归一化数据映射回原始数据。

```glsl
 vec2 uvPosition = VAT_uvPosition(vec2(attTexcoord1.x, 1.0 - attTexcoord1.y), u_VertexAnimFrameNum, u_VertexAnimSpeed, u_Time.y, vec2(u_VertexAnimPaddedRatioX, u_VertexAnimPaddedRatioY));
 vec4 texturePos = texture(u_VertexAnimPosTex, uvPosition);
 offset = vec3(texturePos.x, texturePos.y, texturePos.z) * (u_VertexAnimPosMax - u_VertexAnimPosMin) + u_VertexAnimPosMin;
```

### 法线的动画

因为法线在动画的每一帧也是不同的，所以我们也必须将新的法线存储在另一个与存储顶点数据相同尺寸的矩阵中。对于VAT来说法线有两种存储方式，一种是存储在顶点信息贴图的alpha通道中（pack normal），另一种是与顶点数据以同样的格式存储到一张新的贴图中。

存储在顶点信息贴图的alpha通道可以节省导入一张法线动画贴图的工作量，但也会让解析出的法线数据损失一定的精度。如果不需要打包法线数据进入顶点贴图的场景，可以直接用之前计算到的uv坐标对法线贴图进行采样，然后映射回-1~1的区间中。

```glsl
vec3 VAT_unpackAlpha(float alpha){
        // decode float to vec2
        alpha *= 1024.0;
        vec2 f2;
        f2.x = floor(alpha / 32.0) / 31.5;
        f2.y = (alpha - (floor(alpha / 32.0) * 32.0)) / 31.5;

        // decode vec2 to vec3
        vec3 f3;
        f2 *= 4.0;
        f2 -= 2.0;
        float f2dot = dot(f2, f2);
        f3.xy = sqrt(1.0 - (f2dot / 4.0)) * f2;
        f3.z = 1.0 - (f2dot / 2.0);
        f3 = clamp(f3, -1.0, 1.0);
        return f3;
}

#ifdef VATPackNormal
       usedNormal = VAT_unpackAlpha(texturePos.a);
#else
       vec4 textureN = texture(u_VertexAnimNormalTex, uvPosition);
       usedNormal = textureN.xyz * 2.0 - 1.0;
#endif
```

对于不同类型的VAT，得到的位置和法线信息也需要经过不同处理才能得到正确的结果。我们常用的VAT类型有：Soft，Rigid，Fluid。他们使用到的VAT贴图以及计算方式也有一些区别，可见下表。

| Type | Demo | VAT | 特征 | 相关计算 |
| --- | --- | --- | --- | --- |
| Soft | ![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902131921326.gif) | PositionTex；NormalTex | 整个模拟过程中保持一致的拓扑结构 | 相对变形；usedPosition += vec3(offset.x, offset.y, offset.z); |
| Rigid | ![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902131922696.gif) | PositionTex；RotationTex | 刚体仿真，刚体拓扑 | 结合rotationTex进行计算 |
| Fluid | ![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902131923946.gif) | PositionTex；NormalTex | 整个模拟过程中不断变化的拓扑结构 | 绝对变形；usedPosition = vec3(offset.x, offset.y, offset.z); |

Rigid类型的VAT包括存储旋转信息的贴图，并且需要额外输入锚点信息pivotMin和pivotMax。最后的输出结果是包括锚点、旋转以及位移信息的数据。

```glsl
vec4 textureRot = texture(u_VertexAnimRotationTex, uvPosition);
vec3 pivot = attColor.xyz * (u_VertexAnimPivMax - u_VertexAnimPivMin) + u_VertexAnimPivMin;
vec3 atOrigin = attPosition - pivot;

textureRot = textureRot * 2.0 - 1.0;
vec4 quat = textureRot;

vec3 rotated = 2.0 * cross(quat.xyz, cross(quat.xyz, atOrigin) + quat.w * atOrigin);
vec3 rotatedNormal = attNormal + 2.0 * cross(quat.xyz, cross(quat.xyz, attNormal) + quat.w * attNormal);

usedPosition = atOrigin + rotated + vec3(offset.x, offset.y, offset.z);
usedNormal = rotatedNormal;
```

## Pros & Cons

| 优点 | 缺点 |
| --- | --- |
| 1. 易于理解、易于实现；；1. CPU的计算（记录动画信息）发生在编辑器阶段，动画运行时CPU没有额外的开销；；1. 可以实现实例化绘制，充分发挥GPU的绘制效率。 | 1. 记录顶点动画的纹理大小，一方面取决于模型的顶点数量，另一方面取决于动画的长度，如果顶点数量过多，或动画过长，生成的纹理就会很大，对显存的占用量也会上升；；1. 实现动画混合，需要从多个动画纹理中采样并进行计算，采样次数多；；1. 无法使用动画状态机控制动作；；1. 动作信息在存储时会受保存格式的精度影响，因此读取出来的动画可能不够精确；；1. 无法实现骨骼动画中的IK（反向动力学）等。 |

虽然有不少缺点，但是如果目的是大批量绘制环境装饰（树、草、石头）或细节要求不高的杂鱼小兵、路人，它都是实现目的优秀手段，值得去使用尝试。
