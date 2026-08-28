---
title: 渲染管线 - 自定义管线
category: learning-notes
date: 2026-08-27
readTime: 3 min read
excerpt: 渲染管线 学习记录，整理 基础知识、常用的材质编辑器默认光照模型所在路径、主要使用方法 等内容。
tags: [渲染理论, 渲染管线]
cover: ""
---

# 基础知识

## 常用的材质编辑器默认光照模型所在路径

- ShadingMoudels.ush文件
- DefaultLitBxDF函数中

![image-20260702111354081](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707155356504.png)

```
FDirectLighting DefaultLitBxDF(
    FGBufferData GBuffer,
    half3 N,
    half3 V,
    half3 L,
    float Falloff,
    half NoL,
    FAreaLight AreaLight,
    FShadowTerms ...
)
```

| 参数           | 含义                                                     |
| -------------- | -------------------------------------------------------- |
| `GBuffer`      | 延迟渲染里的材质信息（BaseColor、Roughness、Metallic等） |
| `N`            | 法线（Normal）                                           |
| `V`            | 视线方向（View Dir）                                     |
| `L`            | 光照方向（Light Dir）                                    |
| `NoL`          | `dot(N, L)`，法线和光方向夹角                            |
| `Falloff`      | 光照衰减                                                 |
| `AreaLight`    | 面光源数据                                               |
| `FShadowTerms` | 阴影信息                                                 |

# 主要使用方法

## Init

路径：BRDF.ush

作用：初始化BxDF的参数值，该函数有多个重载，根据不同的着色器模式，使用不同的初始化函数

```
//各项异性初始化
void Init( inout BxDFContext Context, half3 N, half3 X, half3 Y, half3 V, half3 L )
{
    Context.NoL = dot(N, L);
    Context.NoV = dot(N, V);
    Context.VoL = dot(V, L);
    float InvLenH = rsqrt( 2 + 2 * Context.VoL );//Context.VoL -1 ~ 1
    Context.NoH = saturate( (Context.NoL + Context.NoV) * InvLenH );
    Context.VoH = saturate( InvLenH + InvLenH * Context.VoL );
    //NoL = saturate( NoL );
    //NoV = saturate( abs( NoV ) + 1e-5 );

    Context.XoV = dot(X, V);
    Context.XoL = dot(X, L);
    Context.XoH = (Context.XoL + Context.XoV) * InvLenH;
    Context.YoV = dot(Y, V);
    Context.YoL = dot(Y, L);
    Context.YoH = (Context.YoL + Context.YoV) * InvLenH;
}
```

## SphereMaxNoH

UE 渲染管线中**球面面光源（Sphere Area Light）的高光近似核心函数**，定义在 `BRDF.ush` 中，参考了 Decima Engine 的实时面光源方案。它的作用是**修正 BxDF 上下文中的 NoH（法线与半程向量的点积）等参数**，用极低的性能成本模拟球面面光源的柔和高光效果，替代点光源 “无限小发光点” 的假设。

```
// 球面面光源高光近似：修正 BxDF 上下文中的 NoH/VoH/XoH/YoH，模拟球面面积积分效果
// [ de Carpentier 2017, "Decima Engine: Advances in Lighting and AA" ]
void SphereMaxNoH( inout BxDFContext Context, float SinAlpha, bool bNewtonIteration )
{
    if( SinAlpha > 0 )
    {
        float CosAlpha = sqrt( 1 - Pow2( SinAlpha ) );
        
        // RoL = dot(R, L)，反射向量 R 与光源方向 L 的点积
        // 利用公式 R = 2*NoV*N - V 推导而来，避免显式计算反射向量
        float RoL = 2 * Context.NoL * Context.NoV - Context.VoL;

        // 情况1：反射方向直接命中球面，高光达到峰值，NoH = 1
        if( RoL >= CosAlpha )
        {
            Context.NoH = 1;
            Context.XoH = 0;
            Context.YoH = 0;
            Context.VoH = abs( Context.NoV );
        }
        // 情况2：反射方向未命中球面，找到球面上离反射方向最近的点，计算最大NoH
        else
        {
            // 球面切平面上的单位向量 Tr，指向离反射方向最近的点
            float rInvLengthT = SinAlpha * rsqrt( 1 - RoL*RoL );
            
            // 法线方向、视线方向在切向量上的投影
            float NoTr = rInvLengthT * ( Context.NoV - RoL * Context.NoL );
            float VoTr = rInvLengthT * ( 2 * Context.NoV*Context.NoV - 1 - RoL * Context.VoL );
            
            // 各向异性切线方向投影（UE早期版本默认关闭，后续逐步支持）
#if 0
            float XoTr = rInvLengthT * ( Context.XoV - RoL * Context.XoL );
            float YoTr = rInvLengthT * ( Context.YoV - RoL * Context.YoL );
#endif

            // 牛顿迭代：一次迭代提升近似精度，默认开启
            if( bNewtonIteration )
            {
                float NoBr   = rInvLengthT * ( Context.NoL - RoL * Context.NoV );
                float VoBr   = rInvLengthT * 2 * Context.NoV;

                float NoLVTr = Context.NoL * CosAlpha + Context.NoV + NoTr;
                float VoLVTr = Context.VoL * CosAlpha + 1        + VoTr;

                float p = NoBr   * VoLVTr;
                float q = NoLVTr * VoLVTr;
                float s = VoBr   * NoLVTr;

                float xNum   = q * ( -0.5 * p + 0.25 * VoBr * NoLVTr );
                float xDenom = p*p + s * (s - 2*p) + NoLVTr * ( (Context.NoL * CosAlpha + Context.NoV) * Pow2(VoLVTr) + q * (-0.5 * (VoLVTr + Context.VoL * CosAlpha) - 0.5) );

                float TwoX1    = 2 * xNum / ( Pow2(xDenom) + Pow2(xNum) );
                float SinTheta = TwoX1 * xDenom;
                float CosTheta = 1.0 - TwoX1 * xNum;

                // 用迭代后的角度修正投影值
                NoTr = CosTheta * NoTr + SinTheta * NoBr;
                VoTr = CosTheta * VoTr + SinTheta * VoBr;
#if 0
                XoTr = CosTheta * XoTr + SinTheta * XoBr;
                YoTr = CosTheta * YoTr + SinTheta * YoBr;
#endif
            }

            // 最终修正上下文里的几何项
            Context.NoH = saturate( Context.NoL * CosAlpha + Context.NoV + NoTr );
            Context.VoH = saturate( Context.VoL * CosAlpha + 1        + VoTr );
#if 0
            Context.XoH = Context.XoL * CosAlpha + Context.XoV + XoTr;
            Context.YoH = Context.YoL * CosAlpha + Context.YoV + YoTr;
#endif
        }
    }
}
```

## ShadingMoudles的SpacularGGX

```c++
float3 SpecularGGX(
    float Roughness,
    float Anisotropy,
    float3 SpecularColor,
    BxDFContext Context,
    float NoL,
    FAreaLight AreaLight
)
{
    // ===== 1️⃣ 粗糙度处理 =====
    float Alpha  = Roughness * Roughness;
    float a2     = Alpha * Alpha;

    // ===== 2️⃣ 构造点光源结构（用于能量补偿）=====
    FAreaLight Punctual = AreaLight;

    Punctual.SphereSinAlpha      = 0;
    Punctual.SphereSinAlphaSoft  = 0;
    Punctual.LineCosSubtended    = 1;
    Punctual.Rect                = (FRect)0;
    Punctual.IsRectAndDiffuseMicroReflectionWeight = 0;

    // ===== 3️⃣ 能量补偿（UE特有）=====
    float Energy = EnergyNormalization(a2, Context.VoH, Punctual);

    // ===== 4️⃣ 各向异性粗糙度 =====
    float ax = 0;
    float ay = 0;
    GetAnisotropicRoughness(Alpha, Anisotropy, ax, ay);

    // ===== 5️⃣ D项（NDF）=====
    float D = D_GGXaniso(ax, ay, Context.NoH, Context.XoH, Context.YoH) * Energy;

    // ===== 6️⃣ G项（可见性函数）=====
    float Vis = Vis_SmithJointAniso(
        ax, ay,
        Context.NoV, NoL,
        Context.XoV, Context.XoL,
        Context.YoV, Context.YoL
    );

    // ===== 7️⃣ F项（菲涅尔）=====
    float3 F = F_Schlick(SpecularColor, Context.VoH);

    // ===== 8️⃣ 最终结果 =====
    return D * Vis * F;
}
```

# 简单卡通渲染

参考文章：https://blog.csdn.net/yaoyutian/article/details/135911838

更高级的渲染通常需要修改渲染管线，为此通过尝试一次简单的卡通渲染学习如何修改UE的渲染管线

# 流程

## 步骤1-C++

定位到Engine/Source/Runtime/Engine/Classes/Engine/EngineTypes.h

注册自定义着色模型的枚举值

再定位到Engine/Source/Runtime/Engine/Private/Materials/MaterialShader.cpp

定义枚举到字符标识

定位到Engine/Source/Runtime/Engine/Private/MaterialsHLSLMaterialTranslator.cpp

在void FHLSLMaterialTranslator::GetMaterialEnvironment中添加

![image-20260707161003802](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161003935.png)

定位到Engine/Source/Runtime/Engine/PrivateMaterialsMaterial.cpp

在static bool IsPropertyActive_Internal中添加

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161143820.png)

定位到Engine/Source/Runtime/Engine/Public/MaterialShared.h

在inline bool IsSubsurfaceShadingModel修改

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161238398.png)

定位Engine/Source/Runtime/Engine/Private/Materials/MaterialShared.cpp

在FText FMaterialAttributeDefinitionMap::GetAttributeOverrideForMaterial添加

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161307047.png)

定位Engine/Source/Runtime/Render/Core/Public/ShaderMaterial.h

struct FShaderMaterialPropertyDefines，为自定义着色模型启用写入权限

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161401223.png)

定位EngineSourceRuntimeRenderCorePrivateShaderMaterialDerivedHelpers.cpp

在FShaderMaterialDerivedDefines RENDERCORE_API CalculateDerivedMaterialParameters添加

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161444970.png)

定位Engine/Source/Runtime/Engine/Private/ShaderCompiler/ShaderGenerationUtil.cpp

在void FShaderCompileUtilities::ApplyFetchEnvironment(FShaderMaterialPropertyDefines& SrcDefines, FShaderCompilerEnvironment& OutEnvironment)和static void DetermineUsedMaterialSlots

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161608861.png)

最后在UE5编辑器中检查刚刚到着色模型是否添加

# 步骤2-Shader

同样先注册着色模型

定位到Engine/Shaders/Private/Definitions.usf

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161834377.png)

定位到Engine/Shaders/Private/ShadingCommon.ush

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707161901593.png)

开启GBuffer相关写入权限

定位到Engine/Shaders/Private/BasePassCommon.ush

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707162025609.png)

定位到Engine/Shaders/Private/BasePassPixelShader.usf

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707162055606.png)

定位到Engine/Shaders/Private/DeferredShadingCommon.ush

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707162128651.png)

#### 将前面定义的 SSS 和 CustomData0 存入 GBuffer

定位到Engine/Shaders/Private/ShadingModelsMaterial.ush

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707162216739.png)

定位到Engine/Shaders/Private/ReflectionEnvironmentPixelShader.usf

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707162245883.png)

### 新定义着色模型的 BxDF

定位到Engine/Shaders/Private/ShadingModels.ush

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707162312522.png)

```
FDirectLighting ToonBxDF(FGBufferData GBuffer, half3 N, half3 V, half3 L, float Falloff, float NoL, FAreaLight AreaLight, FShadowTerms Shadow)
{
	//并不是真正光源颜色
	//真正的光源颜色在DeferredLightingCommon.ush中通过LightAccumulator_AddSplit()叠加
	float3 LightColor = AreaLight.FalloffColor * Falloff;
	//解GBuffer
	float SpecularRange 	= GBuffer.Metallic;
	float SpecularIntensity = GBuffer.Specular;
	float ShadowThreshold 	= GBuffer.Roughness;
	float InnerLine 	= GBuffer.CustomData.a;
	float3 SSSColor	 	= ExtractSubsurfaceColor(GBuffer); //解码SSS
	//明暗颜色
	float3 BrightColor = GBuffer.BaseColor;
	float3 ShadowColor = GBuffer.BaseColor * SSSColor;
	//加粗内描边
	if (InnerLine < 0.8f)
	{
		InnerLine *= 0.5f;
	}
	float3 InnerLineColor = float3(InnerLine, InnerLine, InnerLine);

	half3 H = normalize(V + L);
	float NoH = saturate(dot(N, H));
	//阴影区计算
	float IsShadow = step(ShadowThreshold, NoL * Shadow.SurfaceShadow);
	//光照计算
	FDirectLighting Lighting;
	Lighting.Diffuse = InnerLineColor * LightColor * Diffuse_Lambert(lerp(ShadowColor, BrightColor, IsShadow));
	Lighting.Specular = LightColor * BrightColor * IsShadow * InnerLineColor * step(0.2f, SpecularRange * pow(NoH, SpecularIntensity));
	Lighting.Transmission = 0;
	return Lighting;
}

```

定位到SkyLightingDiffuseShared

需要减少天光对着色的影响

![在这里插入图片描述](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260707162437182.png)
# 总结分析

- 这篇主要记录 `自定义管线` 相关内容，核心集中在 基础知识、常用的材质编辑器默认光照模型所在路径、主要使用方法。
- 归类到 `渲染管线` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
