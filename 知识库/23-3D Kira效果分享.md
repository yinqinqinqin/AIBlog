# 3D Kira效果分享

Owner：

## Kira实现方案对比

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613167.gif)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613166.gif)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613162.gif)

从左到右分别是全屏后处理Kira（Creator内置版本）、十字星3D Kira、点光斑3D Kira。

3D Kira的优势：

- 大幅提高性能

- 基于点图元的Kira效果可以随意更换kira形状。例如这里分别显示了十字星和点光斑两种Kira效果。

- 任意3D模型只要挂载3DKira脚本，即可以获得Kira效果，设计师和Pm都可以很方便地复用该效果。

## 渲染效果

### kira自动闪烁

[附件：kira自动闪烁.mov](https://bytedance.larkoffice.com/file/O5Fnbnkkuo1xbBxtYzJc1B5Yn1f)（[本地附件](./resources/attachments/kira自动闪烁.mov))

### 只根据亮度阈值显示kira

[附件：加了阈值判断.mov](https://bytedance.larkoffice.com/file/WMyMbANLnoEy8FxemFlc5z5bnMg)（[本地附件](./resources/attachments/加了阈值判断.mov))

## 原理

GDC2004: Draw a diamond

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613163.png)

## 实现

### mesh创建

```lua
function Kira3D:createMesh(comp)
    local parentTransform = comp.entity:getComponent("Transform")
    local parentMesh = comp.entity:getComponent("MeshRenderer").mesh
    self.parentMesh = parentMesh
    -- 获得3D模型顶点数
    local vCount = parentMesh:getVertexCount()
    local gap = self.sparseDegree
    self.oldSparseDegree = gap
    self.oldKiraCount = self.kiraCount
    -- 创建Kira mesh
    local customMesh = Amaz.Mesh()
    local customSubMesh = Amaz.SubMesh()
    customSubMesh.primitive = Amaz.Primitive.POINT
    -- 设置顶点属性
    local pos = Amaz.VertexAttribDesc()
    pos.semantic = Amaz.VertexAttribType.POSITION
    local uv = Amaz.VertexAttribDesc()
    uv.semantic = Amaz.VertexAttribType.TEXCOORD0
    local vads = Amaz.Vector()
    vads:pushBack(pos)
    vads:pushBack(uv)
    customMesh.vertexAttribs = vads

    local vertexData = {}
    local indexData = {}
    math.randomseed(tostring(os.time()):reverse():sub(1, 7))
    local curCount = 0;
    -- 创建顶点
    if self.useKiraCount then
        while(curCount < self.kiraCount) do
            local vPos = parentMesh:getVertex(math.random(vCount))

            table.insert(vertexData, #vertexData + 1, vPos.x)
            table.insert(vertexData, #vertexData + 1, vPos.y)
            table.insert(vertexData, #vertexData + 1, vPos.z)
            table.insert(vertexData, #vertexData + 1, curCount / self.kiraCount)
            table.insert(vertexData, #vertexData + 1, math.random())

            table.insert(indexData, #indexData + 1, curCount)
            curCount = curCount + 1;
            -- Amaz.LOGE("TAG","lxfkira useKiraCount: "..curCount..";"..comp.entity.name)
        end

    else
        local i = math.random(1, math.min(gap, vCount)) - 1;
        while(i < vCount) do
            local vPos = parentMesh:getVertex(i)

            table.insert(vertexData, #vertexData + 1, vPos.x)
            table.insert(vertexData, #vertexData + 1, vPos.y)
            table.insert(vertexData, #vertexData + 1, vPos.z)
            table.insert(vertexData, #vertexData + 1, math.random())
            table.insert(vertexData, #vertexData + 1, math.random())

            table.insert(indexData, #indexData + 1, curCount)
            curCount = curCount + 1;
            i = i + math.random(1, gap)

        end
    end
    -- Amaz.LOGE("TAG","lxfkira kira count: "..curCount..";"..comp.entity.name)

    local fv = Amaz.FloatVector()
    for i = 1, table.getn(vertexData) do
        fv:pushBack(vertexData[i])
    end
    customMesh.vertices = fv

    local indices = Amaz.UInt16Vector()
    for i = 1, table.getn(indexData) do
        indices:pushBack(indexData[i])
    end
    customSubMesh.indices16 = indices
    customSubMesh.mesh = customMesh
    customMesh:addSubMesh(customSubMesh)
    return customMesh
end
```

### 创建材质

```lua
function Kira3D:AddPassToMaterial(material, backend, vertCode, fragCode)
    local newPass = Amaz.Pass()
    local vs = Amaz.Shader()
    vs.type = Amaz.ShaderType.VERTEX
    vs.source = vertCode
    local fs = Amaz.Shader()
    fs.type = Amaz.ShaderType.FRAGMENT
    fs.source = fragCode
    local shaderVec = Amaz.Vector()
    shaderVec:pushBack(vs)
    shaderVec:pushBack(fs)
    local shaderMap = Amaz.Map()
    shaderMap:insert(backend, shaderVec)
    newPass.shaders = shaderMap
    local semantics = Amaz.Map()
    semantics:insert("inPosition", Amaz.VertexAttribType.POSITION)   -- all post effect shaders must follow this tradition
    semantics:insert("inTexCoord", Amaz.VertexAttribType.TEXCOORD0)  -- all post effect shaders must follow this tradition
    newPass.semantics = semantics
    local depthStencilState = Amaz.DepthStencilState()
    depthStencilState.depthTestEnable = false
    depthStencilState.depthWriteEnable = false
    depthStencilState.depthCompareOp = Amaz.CompareOp.LESS_OR_EQUAL
    local renderState = Amaz.RenderState()
    renderState.depthstencil = depthStencilState

    -- Amaz.LOGE("TAG","lxfkira materail 55")
    local colorBlend = Amaz.ColorBlendState()
    local blendState = Amaz.ColorBlendAttachmentState()
    blendState.blendEnable = true
    blendState.srcColorBlendFactor = Amaz.BlendFactor.ONE
    blendState.dstColorBlendFactor = Amaz.BlendFactor.ONE
    blendState.srcAlphaBlendFactor = Amaz.BlendFactor.ONE
    blendState.dstAlphaBlendFactor = Amaz.BlendFactor.ONE
    -- blendState.ColorBlendOp = Amaz.BlendOp.ADD
    -- blendState.AlphaBlendOp = Amaz.BlendOp.ADD
    blendState.colorWriteMask = 15
    colorBlend.attachments = {blendState}
    renderState.colorBlend = colorBlend
    -- Amaz.LOGE("TAG","lxfkira materail 66")
    newPass.renderState = renderState
    newPass.useFBOTexture = true
    material.xshader.passes:pushBack(newPass)

    return newPass
end
```

### 近大远小

```cpp
    void main(void) {
        ramdomValue = inTexCoord.xy;
        vec4 pos = u_MV * vec4(inPosition.xyz, 1.0);
        gl_Position = u_Projection * pos;

        float extraScale = 1.0 - scaleChangeDegree * sin(u_Time.x * scaleChangeSpeed + inTexCoord.y * 3.14);
        gl_PointSize = ((u_ProjectionParams.z - u_ProjectionParams.y) / abs(pos.z - u_ProjectionParams.y)) * scale * extraScale;
        screenPos = gl_Position.xy / gl_Position.w * 0.5 + 0.5;
    }
```

### Depth Test

```yaml
    depthStencilState.depthTestEnable = false
    depthStencilState.depthWriteEnable = false
```

### 亮度调整

## 使用方法

### 下载3D Kira脚本

[附件：Kira3D.lua](https://bytedance.larkoffice.com/file/VpFobdcxroIl87xujBzclivDn8g)（[本地附件](./resources/attachments/Kira3D.lua))

### 挂载脚本

下载上述3D Kira脚本，3D mesh对应的entity上，挂载该脚本，相应模型即可以获得3D Kira效果。然后选中该entity即可根据需求，随意调整参数。

#### Amazing Editor中的添加方式

导入Kira3D.lua文件到工程中，选中对应的3D mesh entity，点击“Add Component"，点击“LuaPlugin”，选择刚导入的Kira3D.lua文件

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613165.png)

#### Creator中的添加方式

EffectCreator/AmazingCreator中可用通过类似的方式导入脚本。但是目前Creator有bug，不能显示正确效果，工具同学正在排查中。

### 参数调整

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613164.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613168.png)

#### 基本参数调整

[附件：参数调整示范.mov](https://bytedance.larkoffice.com/file/RwpYbMW4so7rAtxSB4vcEuDqnjh)（[本地附件](./resources/attachments/参数调整示范.mov))

#### 闪烁参数调整

[附件：闪烁参数调整.mov](https://bytedance.larkoffice.com/file/FRDibhBnLoKxVGxRRVhckq3Inyg)（[本地附件](./resources/attachments/闪烁参数调整.mov))

## 相关内容

[cpu算法Kira各版绘制方式简析](https://bytedance.feishu.cn/docs/doccneCFP1pBdWysL8DdB8NK3me#)
