# GPU Skinning突破骨骼限制

[附件：gpuskinning.zip](https://bytedance.larkoffice.com/file/RNnobMCaholJWgx3nQUcfb89nAd)

## Xshader

```yaml
--- !Shader &2
name: ""
guid: {a: 2254173664874999432, b: 16544293010681128865}
type:
  __class: ShaderType
  value: VERTEX
sourcePath: xshader/pbr.vert
macros:
  - AMAZING_USE_BONES
  - AMAZING_USE_GPU_SKINNING
  - MoreBones
  - NormalTexture
```

## material

```yaml
enabledMacros:
  __class: Map
  AE_DirLightNum: !<str> 1
  AE_PointLightNum: !<str> 0
  AE_SpotLightNum: !<str> 0
  AMAZING_USE_GPU_SKINNING: !<str> 1
  AlbedoTexture: !<str> 1
```

## VertexShader

```glsl
#ifdef AMAZING_USE_GPU_SKINNING
attribute vec4 attBoneIds;
attribute vec4 attWeights;
uniform sampler2D _TransTex;
uniform vec4 _TexSize;
#endif

……

#ifdef AMAZING_USE_GPU_SKINNING
mat4 getMat(float id)
{
    mat4 boneTransform = mat4(1.);
    for(int i=0;i<4;i++)
    {
        float index = 4. * id + float(i);
        float row = floor(index /_TexSize.x);
        float col = floor(index - row * _TexSize.x);
        vec2 uv = vec2(col/_TexSize.x,row/_TexSize.y);
        vec4 val = texture2D(_TransTex,uv);
        boneTransform[i] = val;
    }
    return boneTransform;
}

#endif

……

#elif defined AMAZING_USE_GPU_SKINNING
    mat4 boneTransform  = getMat(attBoneIds.x) * attWeights.x;
         boneTransform += getMat(attBoneIds.y) * attWeights.y;
         boneTransform += getMat(attBoneIds.z) * attWeights.z;
         boneTransform += getMat(attBoneIds.w) * attWeights.w;

    vec3 bm_postiton    = (boneTransform *  vec4(VB.model_position, 1.0)).xyz;
    vec3 bn_normal      = (boneTransform * vec4(VB.model_normal, 0.0)).xyz;
    varWorldPosition    = (u_Model * vec4(bm_postiton, 1.0)).xyz;
    varWorldNormal      = normalize((u_TransposeInvModel * vec4(bn_normal, 0.0)).xyz);
#ifdef NormalTexture
    vec3 bm_tangent     = (boneTransform * vec4(VB.model_tangent, 0.0)).xyz;
    vec3 bm_binormal    = (boneTransform * vec4(VB.model_binormal, 0.0)).xyz;
    varWorldTangent     = normalize((u_Model * vec4(bm_tangent, 0.0)).xyz);
    varWorldBinormal    = normalize((u_Model * vec4(bm_binormal, 0.0)).xyz);
#endif

```

## Editor

勾选GPU Texture Skinning后，会自动打开material的AMAZING_USE_GPU_SKINNING，同时自动关闭原有的AMAZING_USE_BONES。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335079.png)

### 使用了GPU Texture Skinning的效果

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335078.png)

### 如果不用的话是这个样子的

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152335077.png)
