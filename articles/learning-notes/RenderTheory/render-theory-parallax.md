---
title: 渲染理论 - Parallax
category: learning-notes
date: 2026-08-27
readTime: 1 min read
excerpt: 渲染理论 学习记录，整理 Parallax 等内容。
tags: [渲染理论]
cover: ""
---

```glsl
// 自定义节点输出类型：Float2（严格匹配你的设置）
 // 输入：uv(float2), viewDir(float3), Tangent(float3), VertexNormalWS(float3), offset(float) float3 worldRayDir = -viewDir;
  float3 Bitangent = -cross(Tangent, VertexNormalWS);
   // 标准切线空间视线转换 float3 tsViewDir; 
   tsViewDir.x = dot(worldRayDir, Tangent); 
   tsViewDir.y = dot(worldRayDir, Bitangent); 
   tsViewDir.z = dot(worldRayDir, VertexNormalWS); 
   tsViewDir = normalize(tsViewDir); 
   float2 uvOffset = tsViewDir.xy / max(tsViewDir.z, 0.001f) * offset;
    float2 finalUV = uv - uvOffset; 
// 所有超出范围的UV都会被限制在纹理边缘，不会返回原始UV finalUV = clamp(finalUV, 0.0f, 1.0f);
 return finalUV;


  // 输入：uv, viewDirTS（切线空间）, strength float3 V = normalize(viewDirTS); 
  // 只用方向，不用深度 float2 offset =V.xy * strength;
   // 输出 return uv + offset;
    
    uv = uv *2.0-1.0; 
    uv = uv * ParallaxMap_ST.xy + ParallaxMap_ST.zw; 
    uv = uv *0.5+0.5; 
    float cosTheta = dot (viewTS,float3(0,0,1)); 
    float ViewTSLength = depth / cosTheta; 
    float3 startPoint = float3(uv,0); 
    float3 endPoint = startPoint + viewTS * ViewTSLength;
     return endPoint.xy;
```
# 总结分析

- 这篇目前内容较少，后续可以继续补充 `Parallax` 的具体步骤、问题和结论。
- 归类到 `渲染理论` 下，适合当作学习过程中的快速复习材料。
- 后续如果要对外展示，可以继续补充实际截图、关键参数和最终效果对比。
