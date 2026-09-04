# AttributeReader/LazyExporter/LazyShader

AttributeReader是一款基于After Effects Script的脚本，可以快捷将ae中的各种属性进行提取并整理为lua代码。在lua中根据需要可以将提取得到的数值根据帧数塞进shader并进行特效复现。

### 安装方法

git

```coffeescript
git@code.byted.org:panjiali.gali/ta-tools.git
```

将AttributeReader.jsx文件直接复制到

/Applications/Adobe After Effects CC 2018/Scripts/ScriptUI Panels

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556896.png)

打开AfterEffects，在窗口中添加AttributeReader。根据需要放置位置。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556889.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556891.png)

### 功能描述

- 导出范围：

- 相对/绝对数值：

- 时间范围：

- 折叠层级：生成的lua代码的折叠层级

- 重命名合成和图层：会将合成变量名重名为compFromAE，图层变量名重命名为layer0，layer1，…

- 添加local：添加local字样

- 归一化坐标：将坐标归一化到0-1

- 拆分通道：

- 生成各自帧序号：选中多个图层时，只会按照图层各自的起点进行记录

- 附加合成信息：添加导出的fps、帧数信息

- 操作：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556900.png)

### 特别提醒

### Lua中使用

```lua
-- 功能函数
local AttributeReader = {
    getFrameData = function(params, layerName, time)
        local frame = math.floor(time / params.frameRate)
        local frameData = {}
        for k,v in pairs(params[layerName]) do
            if(type(v) == "number") then
                frameData[k] = v
            elseif(type(v) == "table") then
                frame = math.max(frame, 0)
                frame = math.min(frame, #v - 1)
                frameData[k] = v[frame + 1]
            end
        end
        return frameData
    end
}
-- AE中抓到的数据
local shootParams={
    compDuration=0.53333333333333,
    frameRate=15,
    ["layer0"]={
        frameCount=8,
        ["gaussian_blur"]={0, 0, 0, 0, 0, 0, 0, 0, },
        ["scale"]={{1.2, 1.2, }, {1.17142857142857, 1.17142857142857, }, {1.14285714285714, 1.14285714285714, }, {1.11428571428571, 1.11428571428571, }, {1.08571428571429, 1.08571428571429, }, {1.05714285714286, 1.05714285714286, }, {1.02857142857143, 1.02857142857143, }, {1, 1, }, },
        ["position"]={{0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, },
        ["opacity"]={0, 0.14285714285714, 0.28571428571429, 0.42857142857143, 0.57142857142857, 0.71428571428571, 0.85714285714286, 1, },
        ["anchor"]={{0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, },
        ["rotate"]={0, 0, 0, 0, 0, 0, 0, 0, },
        ["frameTime"]={0, 0.06666666666667, 0.13333333333333, 0.2, 0.26666666666667, 0.33333333333333, 0.4, 0.46666666666667, },
    },
}

-- 根据数据、图层名和当前时间获得一帧中的所有数据
local frameData = AttributeReader.getFrameData(shootParams, "layer0", shootTime)

local feature = this:getFeature(feature_ge)
-- print(feature:getAbsPath())
feature = EffectSdk.castGeneralEffectFeature(feature)
if(feature) then
    -- 通过setUniform将数据传入通用特效shader
    feature:setUniformRenderCache("gx", 3000, "inputTex", defaultGrab)
    feature:setUniformRenderCache("gaussianBlend", 3000, "inputTex", defaultGrab)
    feature:setUniformVec2("transform", 4, "position", frameData["position"][1],frameData["position"][2])
    feature:setUniformVec2("transform", 4, "anchor", frameData["anchor"][1],frameData["anchor"][2])
    feature:setUniformVec2("transform", 4, "scale", frameData["scale"][1],frameData["scale"][2])
    feature:setUniformFloat("transform",3, "rotate", frameData["rotate"])
    feature:setUniformFloat("transform", 3, "opacity", frameData["opacity"])
    feature:setUniformFloat("gaussianBlend",3, "gaussian_blur", frameData["gaussian_blur"])
end
```

### 使用案例1

```htmlbars
local shootParams={
    compDuration=0.53333333333333,
    frameRate=15,
    ["layer0"]={
        frameCount=8,
        ["gaussian_blur"]={0, 0, 0, 0, 0, 0, 0, 0, },
        ["scale"]={{1.2, 1.2, }, {1.17142857142857, 1.17142857142857, }, {1.14285714285714, 1.14285714285714, }, {1.11428571428571, 1.11428571428571, }, {1.08571428571429, 1.08571428571429, }, {1.05714285714286, 1.05714285714286, }, {1.02857142857143, 1.02857142857143, }, {1, 1, }, },
        ["position"]={{0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, },
        ["opacity"]={0, 0.14285714285714, 0.28571428571429, 0.42857142857143, 0.57142857142857, 0.71428571428571, 0.85714285714286, 1, },
        ["anchor"]={{0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, },
        ["rotate"]={0, 0, 0, 0, 0, 0, 0, 0, },
        ["frameTime"]={0, 0.06666666666667, 0.13333333333333, 0.2, 0.26666666666667, 0.33333333333333, 0.4, 0.46666666666667, },
    },
}
local replayParams={
    compDuration=5.86666666666667,
    frameRate=15,
    ["layer0"]={
        frameCount=89,
        ["gaussian_blur"]={8, 5.09755580081439, 0.72036761938468, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.72036761941612, 5.09755580084915, 8, 6.21545314583068, 2.68804719633346, 0.15713397086798, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15713397089008, 2.68804719640079, 6.21545314586123, 8, 4.46092850697081, 0.83657632474944, 0.00638430246201, 0, 0, 0, 0, 0, 0, 0, 0.00476956143495, 0.62864610761966, 3.66356825198983, 8, 6.88412990009405, 4.3647901694319, 1.6843866039706, 0.08532498906527, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, },
        ["slider"]={0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, },
        ["scale"]={{5, 5, }, {1.80035556095008, 1.80035556095008, }, {1.15077141555102, 1.15077141555102, }, {1.09188728152324, 1.09188728152324, }, {1.06213344379592, 1.06213344379592, }, {1.04417103909275, 1.04417103909275, }, {1.03269724859956, 1.03269724859956, }, {1.02412910150343, 1.02412910150343, }, {1.01368699621735, 1.01368699621736, }, {1.00886018478504, 1.00886018478504, }, {1.00669603005876, 1.00669603005876, }, {1.00667375272395, 1.00667375272395, }, {1.00935187256597, 1.00935187256597, }, {1.0182286627453, 1.0182286627453, }, {1.04276477386062, 1.04276477386062, }, {1.109314677577, 1.109314677577, }, {1.34754336602112, 1.34754336602112, }, {1.94342458996912, 1.94342458996913, }, {5, 5, }, {1.80035556095008, 1.80035556095008, }, {1.15077143457935, 1.15077143457936, }, {1.09188738889673, 1.09188738889673, }, {1.06213363352534, 1.06213363352534, }, {1.04417128510997, 1.04417128510997, }, {1.03269750108645, 1.03269750108645, }, {1.02412924065302, 1.02412924065302, }, {1.01368692913019, 1.01368692913019, }, {1.00886036368005, 1.00886036368005, }, {1.00669651643995, 1.00669651643995, }, {1.00667448248007, 1.00667448248007, }, {1.00935264743332, 1.00935264743333, }, {1.01822883062803, 1.01822883062803, }, {1.0427643991979, 1.0427643991979, }, {1.10931456412624, 1.10931456412624, }, {1.34754336602112, 1.34754336602112, }, {1.94342458996912, 1.94342458996913, }, {3, 3, }, {1.494573420429, 1.494573420429, }, {1.1277296821371, 1.1277296821371, }, {1.07364554336089, 1.0736455433609, }, {1.04872630282284, 1.04872630282284, }, {1.03449542096557, 1.03449542096557, }, {1.02392153235779, 1.02392153235779, }, {1.02488720219352, 1.02488720219352, }, {1.02797178548542, 1.02797178548542, }, {1.02999483568587, 1.02999483568587, }, {1.01489921068936, 1.01489921068936, }, {1.02354345812936, 1.02354345812936, }, {1.18037637964401, 1.18037637964401, }, {1.97927327969058, 1.97927327969059, }, {3, 3, }, {1.47194127613379, 1.47194127613379, }, {1.12316519354802, 1.12316519354802, }, {1.07091413811435, 1.07091413811435, }, {1.04685769457349, 1.04685769457349, }, {1.03254081424366, 1.03254081424366, }, {1.02289525318353, 1.02289525318353, }, {1.02389590034813, 1.02389590034814, }, {1.027017814588, 1.027017814588, }, {1.02968101169391, 1.02968101169391, }, {1.06503142254344, 1.06503142254342, }, {1.4859785095659, 1.48597850956586, }, {2.07775407309683, 2.07775407309683, }, {2.09014589636277, 2.09014589636277, }, {2, 2, }, {1.95371755359681, 1.95371755359682, }, {1.97950424885484, 1.97950424885484, }, {2.01468584742924, 2.01468584742924, }, {2.01702636051885, 2.01702636051885, }, {2, 2, }, {1.9912583750348, 1.9912583750348, }, {1.99612885264685, 1.99612885264685, }, {2.00277379828638, 2.00277379828638, }, {2.00321586410713, 2.00321586410713, }, {2, 2, }, {1.99834892031492, 1.99834892031492, }, {1.99926883471, 1.99926883471, }, {2.00052390282349, 2.00052390282349, }, {2.00060739827188, 2.00060739827188, }, {2, 2, }, {1.99968815132915, 1.99968815132915, }, {1.99986190071508, 1.99986190071508, }, {2.00009895246161, 2.00009895246162, }, {2.00011472271476, 2.00011472271477, }, {2, 2, }, {1.9999410993943, 1.9999410993943, }, {1.99997391641431, 1.99997391641431, }, {2.00001868970584, 2.00001868970584, }, {2.00001868970584, 2.00001868970584, }, },
        ["position"]={{0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, },
        ["opacity"]={1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, },
        ["anchor"]={{0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, {0.5, 0.5, }, },
        ["rotate"]={19.964466094072, 8.62311157678078, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.48712645061636, 2.41119757248991, 6.47924735741765, 14.3848047946193, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.48712645061636, 2.41119757248991, 6.47924735741765, 14.3848047946193, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, },
        ["frameTime"]={0, 0.06666666666667, 0.13333333333333, 0.2, 0.26666666666667, 0.33333333333333, 0.4, 0.46666666666667, 0.53333333333333, 0.6, 0.66666666666666, 0.73333333333333, 0.8, 0.86666666666666, 0.93333333333333, 1, 1.06666666666666, 1.13333333333333, 1.2, 1.26666666666666, 1.33333333333333, 1.4, 1.46666666666666, 1.53333333333333, 1.59999999999999, 1.66666666666666, 1.73333333333333, 1.79999999999999, 1.86666666666666, 1.93333333333333, 1.99999999999999, 2.06666666666666, 2.13333333333333, 2.19999999999999, 2.26666666666666, 2.33333333333333, 2.39999999999999, 2.46666666666666, 2.53333333333333, 2.59999999999999, 2.66666666666666, 2.73333333333332, 2.79999999999999, 2.86666666666666, 2.93333333333332, 2.99999999999999, 3.06666666666666, 3.13333333333332, 3.19999999999999, 3.26666666666666, 3.33333333333332, 3.39999999999999, 3.46666666666666, 3.53333333333332, 3.59999999999999, 3.66666666666665, 3.73333333333332, 3.79999999999999, 3.86666666666665, 3.93333333333332, 3.99999999999999, 4.06666666666665, 4.13333333333332, 4.19999999999999, 4.26666666666665, 4.33333333333332, 4.39999999999999, 4.46666666666665, 4.53333333333332, 4.59999999999998, 4.66666666666665, 4.73333333333332, 4.79999999999998, 4.86666666666665, 4.93333333333332, 4.99999999999998, 5.06666666666665, 5.13333333333332, 5.19999999999998, 5.26666666666665, 5.33333333333332, 5.39999999999998, 5.46666666666665, 5.53333333333331, 5.59999999999998, 5.66666666666665, 5.73333333333331, 5.79999999999998, 5.86666666666665, },
    },
}
local AttributeReader = {
    getFrameData = function(params, layerName, time)
        local frame = math.floor(time * params.frameRate)
        local frameData = {}
        for k,v in pairs(params[layerName]) do
            if(type(v) == "number") then
                frameData[k] = v
                -- print(k,"=",v)
            elseif(type(v) == "table") then
                frame = math.max(frame, 0)
                frame = math.min(frame, #v - 1)
                frameData[k] = v[frame + 1]
                -- print(k,"=",v[frame + 1][1],",", v[frame + 1][2])
            end
        end
        return frameData
    end
}
```

```javascript
local replayTime = timeStamp - replayTimeBegin
local frameData = AttributeReader.getFrameData(replayParams, "layer0", replayTime)
local feature = this:getFeature(feature_ge)
feature = EffectSdk.castGeneralEffectFeature(feature)
if(feature) then
    feature:setUniformRenderCache("gx", 3000, "inputTex", "GrabFrame_5100_Shot_"..frameData["slider"])
    feature:setUniformRenderCache("gaussianBlend", 3000, "inputTex", "GrabFrame_5100_Shot_"..frameData["slider"])
    feature:setUniformVec2("transform", 4, "position", frameData["position"][1],frameData["position"][2])
    feature:setUniformVec2("transform", 4, "anchor", frameData["anchor"][1],frameData["anchor"][2])
    feature:setUniformVec2("transform", 4, "scale", frameData["scale"][1],frameData["scale"][2])
    feature:setUniformFloat("transform",3, "rotate", frameData["rotate"])
    feature:setUniformFloat("transform", 3, "opacity", frameData["opacity"])
    feature:setUniformFloat("gaussianBlend",3, "gaussian_blur", frameData["gaussian_blur"])
end
```

### 使用案例2

图中使用的时间模式是工作区长度，在工作区中，图层0起点为第1帧，包含2帧，带有3个高斯模糊，因此含有3个高斯模糊的数组；图层1起点为第0帧，包含3帧，带有一个置换图。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556897.png)

```bash
local compFromAE={
        compDuration=0.1875,
        frameRate=16,
        layer0={
                frameCount=2,
                gaussian_blur={
                        {0, 0, },
                        {0, 0, },
                        {0, 0, },
                },
                position={
                        {x=0.5, y=0.5, },
                        {x=0.5, y=0.5, },
                },
                anchor={
                        {x=0.5, y=0.5, },
                        {x=0.5, y=0.5, },
                },
                scale={
                        {x=1, y=1, },
                        {x=1, y=1, },
                },
                rotate={
                        0,
                        0,
                },
                opacity={
                        1,
                        1,
                },
                frameTime={
                        0.0625,
                        0.125,
                },
        },
        layer1={
                frameCount=3,
                max_horizontal_displacement={
                        0.00462962962963,
                        0.00462962962963,
                        0.00462962962963,
                },
                max_vertical_displacement={
                        0.00260416666667,
                        0.00260416666667,
                        0.00260416666667,
                },
                position={
                        {x=0.5, y=0.5, },
                        {x=0.5, y=0.5, },
                        {x=0.5, y=0.5, },
                },
                anchor={
                        {x=0.5, y=0.5, },
                        {x=0.5, y=0.5, },
                        {x=0.5, y=0.5, },
                },
                scale={
                        {x=1, y=1, },
                        {x=1, y=1, },
                        {x=1, y=1, },
                },
                rotate={
                        0,
                        0,
                        0,
                },
                opacity={
                        1,
                        1,
                        1,
                },
                frameTime={
                        0,
                        0.0625,
                        0.125,
                },
        },
}
```

### 使用案例3：MV小清新

[附件：小清新demo_1.mov](https://bytedance.larkoffice.com/file/G7wHbQnX3og5jyx3iM5cUn7qnnn)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556892.png)

小清新提供的AE工程打开如上：

经过整理，由于每一段特效可以复用两层通用特效，小清新的特效可分为4层layer

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613159.png)

第三层图层负责位移缩放旋转等。配合蒙版进行渲染。

第四层图层负责缩放和模糊

其中第三层和第四层都相关transform均由原始图层拷贝获得并进行拼接（不透明度需要手动设置以完成图层的复用）

```json
{
    "effect":{
        "Link":[
            {
                "defaultEnable": false,
                "path"      : "foreground_2DStickerV3_5101/",
                "type"      : "2DStickerV3",
                "zOrder"    : 15101
            },
            {
                "defaultEnable": false,
                "path": "layer1_GE/",
                "type": "GeneralEffect",
                "zorder": 15090
            },
            {
                "defaultEnable": false,
                "path": "layer2_GE/",
                "type": "GeneralEffect",
                "zorder": 15089
            },
            {
                "defaultEnable": false,
                "path": "layer1_matte_Grab/",
                "type": "GeneralEffect",
                "zorder": 15051
            },
            {
                "defaultEnable": false,
                "path"      : "matte_2DStickerV3_5050/",
                "type"      : "2DStickerV3",
                "zOrder"    : 15050
            },
            {
                "defaultEnable": false,
                "path": "source_Grab/",
                "type": "GeneralEffect",
                "zorder": 15000
            }
        ]

    },
    "name": "indiepop_E58BCEB6AA7043E4B4884B4AA2779B1B",
    "version": "4.0.0"
}
```

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556890.png)

使用本插件读取选中的图层的所有属性数据，拷贝至event.lua并根据需要重命名

对于layer1_GE和layer2_GE，创建shader：transform

```cpp
precision highp float;

varying highp vec2 textureCoordinate;
uniform sampler2D inputTex;
uniform sampler2D matteTex;
uniform int matteMode;
// 0=NONE, 1=LUMA, 2=LUMA_INV
uniform vec2 position;
uniform vec2 anchor;
uniform vec2 scale;
uniform float rotate;
uniform float opacity;
uniform vec2 offset;
uniform int repeatImage;

uniform int frameWidth;
uniform int frameHeight;

vec2 pointToLayerSpace(vec2 p){
    vec2 v = (p-position)*vec2(frameWidth, frameHeight);
    //relative to anthor
    vec2 r = vec2(cos(radians(-rotate)), sin(radians(-rotate)));
    //rotation cos sin
    vec2 uv = vec2(v.x*r.x-v.y*r.y, v.y*r.x+v.x*r.y);
    //rotate back
    return uv/scale/vec2(frameWidth, frameHeight) + anchor + offset;
    //scale back;
}

void main() {
    float factor = 1.0;
    if(matteMode != 0){
        vec3 matteColor = texture2D(matteTex, textureCoordinate).rgb;
        factor = (matteColor.r + matteColor.g + matteColor.b)/3.0;
        if(matteMode == 2)
            factor = 1.0 - factor;
    }

    vec2 uv = pointToLayerSpace(textureCoordinate);
    if(repeatImage == 1)
        uv = fract(uv);
    if(uv.x >= 0.0 && uv.x < 1.0 && uv.y >= 0.0 && uv.y < 1.0)
        gl_FragColor = texture2D(inputTex, uv) * factor * opacity;
    else
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
}
```

在event.lua中，使用setUniform将需要的数据塞进shader中

```cpp
local frame = math.max(math.floor(CommonFunc.getDiffTime(lastTime, time_now) * compFps),0)
            print("frame:",frame)
            local arridx = math.min(frame+frameRange[effectClip][1],frameRange[effectClip][2])+1
            local feature = this:getFeature("layer1_GE")
            if feature then
                feature = EffectSdk.castGeneralEffectFeature(feature)
                feature:setUniformInt("transform",1,"matteMode", 1)
                feature:setUniformVec2("transform",1,"position",compFromAE["layer1"]["position"][arridx][1],compFromAE["layer1"]["position"][arridx][2])
                feature:setUniformVec2("transform",1,"scale",compFromAE["layer1"]["scale"][arridx][1],compFromAE["layer1"]["scale"][arridx][2])
                feature:setUniformVec2("transform",1,"anchor",0.5,0.5)
                feature:setUniformFloat("transform",1,"rotationZ",compFromAE["layer1"]["rotate"][arridx])
                feature:setUniformFloat("transform",1,"opacity",compFromAE["layer1"]["opacity"][arridx])
                feature:setUniformVec2("transform",1,"offset",0.0,0.0)
                feature:setUniformInt("transform",1,"repeat", 0)
            end
            local feature = this:getFeature("layer2_GE")
            if feature then
                feature = EffectSdk.castGeneralEffectFeature(feature)
                feature:setUniformInt("transform",1,"matteMode", 0)
                feature:setUniformVec2("transform",1,"position",compFromAE["layer2"]["position"][arridx][1],compFromAE["layer2"]["position"][arridx][2])
                feature:setUniformVec2("transform",1,"scale",compFromAE["layer2"]["scale"][arridx][1],compFromAE["layer2"]["scale"][arridx][2])
                feature:setUniformVec2("transform",1,"anchor",0.5,0.5)
                feature:setUniformFloat("transform",1,"rotationZ",0.0)
                feature:setUniformFloat("transform",1,"opacity",1.0)
                feature:setUniformVec2("transform",1,"offset",0.0,0.0)
                feature:setUniformInt("transform",1,"repeat", 1)

                feature:setUniformFloat("blend",1,"factor",compFromAE["layer2"]["gaussian_blur"][arridx]/50)
            end
```

### 更新内容

```javascript
更新内容：
ver1.0
    1、完成基础UI设计和AE接口
    2、可以读取相对数值
    3、可以通过读取的数值格式化成lua代码
    4、可以通过lua代码反向解析成ae属性并应用
ver1.1
    1、修正了绝对坐标和相对坐标的选项描述
    2、可以导出position的世界坐标。
    3、可以导出2D下的rotation的绝对数值
ver1.2
    1、添加undogroup
    2、修复时间长度的bug
    3、修复反序列化时目标图层的bug
    4、添加置换图的参数解析
    5、添加归一化坐标的功能
    6、添加拆分通道功能
    7、重写ae属性的解析函数
    8、重写lua代码生成的方法
    9、添加searchPath，方便后续添加新的属性
ver1.2.1
    1、添加scale、opacity的归一化
ver1.2.2
    1、添加自定义帧范围
ver1.2.3
    1、添加图层下的frame索引
ver1.2.4
    1、生成各自的帧序号功能：图层的序列帧长度可以不一致（根据每个图层的起点和长度决定帧长度）
    2、当目标为合成时禁用图层长度
ver1.2.5
    1、添加高斯模糊属性导出
    2、导出帧率和图层长度
    3、在处理处理同名图层时增加随机后缀（不影响重命名后的结果，只是为了区分图层）
    4、添加多个同名特效的解析
    5、处理enbaled=false的特效的时候不会进行处理
ver1.2.6
    1、修复帧数序号起点偏差一帧
    2、修复目标为合成时无法使用其他模式
    3、修改frameCount和frameRate的位置以及命名
    4、将frame更改为frametime表示时间而不是帧数
    5、修复framecount和framerate错位
ver1.2.7
    1、将合成的frameCount替换为compDuration（合成时间长度）
    2、在layer中添加帧数frameCount（因为每个图层的帧数可能不一样）
```

### 添加特效支持的方法

在jsx文件的第55行searchPath中，添加对应的特效信息，例如

```javascript
var searchPath = {
        "ADBE Effect Parade": {
            "ADBE Displacement Map": {
                "ADBE Displacement Map-0003": {
                    varName: "max_horizontal_displacement",
                    normalize: "width",
                    subIdx: -1
                },
                "ADBE Displacement Map-0005": {
                    varName: "max_vertical_displacement",
                    normalize: "height",
                    subIdx: -1
                }
            },
            "ADBE Gaussian Blur 2": {
                "ADBE Gaussian Blur 2-0001": {
                    varName: "gaussian_blur",
                    subIdx: -1
                }
            },
            "ADBE Gaussian Blur": {
                "ADBE Gaussian Blur-0001": {
                    varName: "gaussian_blur",
                    subIdx: -1
                }
            },
            "ADBE Fast Blur": {
                "ADBE Fast Blur-0001": {
                    varName: "fast_blur",
                    subIdx: -1
                }
            },
            "ADBE Radial Blur":{
                "ADBE Radial Blur-0001":{
                    varName:"radial_blur",
                    subIdx : -1
                },
                "ADBE Radial Blur-0002":{
                    varName:"radial_blur_center",
                    normalize: "width and height",
                    subIdx : -1
                }
            }
        },
```

- normalize：在勾选归一化之后需要缩小的数值

- varName：导出的lua代码对应的变量名

- subIdx：对于多个变量需要合并成一个多纬变量的时候需要指定的下标

## LazyExporter

LazyExporter是一款能够将简单AE合成进行一键导出的AE脚本。需要配合LazyConfig插件进行完成。

### 安装方法

git

```coffeescript
git@code.byted.org:panjiali.gali/ta-tools.git
```

将LazyExporter.jsx文件直接复制到

/Applications/Adobe After Effects CC 2018/Scripts/ScriptUI Panels

将LazyConfig.plugin复制到

/Applications/Adobe After Effects CC 2018/Plug-ins/Bytedance

### LazyConfig

Mode：

Ignored：无视此图层，不做任何处理

PrerenderedSticker：将此图层预先渲染为2D贴纸

GeneralEffect：通用特效，适用transform，可以进行自合成（输入为自合成渲染结果）

CameraInput：特殊通用特效（仅仅是输入变为视频抓帧）

LoopAbled：图层是否循环

RepeatImage：图层缩小后是否填充（例如缩小为1/3，画面平铺9格）

### 使用案例（无递归案例）

各个添加LazyConfig如下

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556899.png)

操作：

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613160.png)

点击选择导出位置，选择路径，等待自动渲染。

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556898.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556893.png)

自动生成完毕，打包测试。

### 添加特效支持

#### searchPath

在jsx文件的第44行searchPath中，添加对应的特效信息，例如

```php
var searchPath = {
        "ADBE Effect Parade": {

            "ADBE Gaussian Blur 2": {
                "ADBE Gaussian Blur 2-0001": {
                    varName: "factor",
                    eName:"gaussianBlend",
                    normalize: 50.0,
                    pType:PropertyType.Float,
                }
            },
            "ADBE Gaussian Blur": {
                "ADBE Gaussian Blur-0001": {
                    varName: "factor",
                    eName:"gaussianBlend",
                    normalize: 50.0,
                    pType:PropertyType.Float,
                }
            }
        },
        "ADBE Transform Group": {
            //groupName:"transform",
            "BYTEDANCE LazyConfig":{
                "BYTEDANCE LazyConfig-0003":{
                    varName:"repeatImage",
                    eName:"transform",
                    pType:PropertyType.Int
                }
            },
            "ADBE Position": {
                varName: "position",
                eName:"transform",
                pType:PropertyType.Vec2,
                normalize: "width and height",
                splice:2
            },
            "ADBE Anchor Point": {
                varName: "anchor",
                eName:"transform",
                pType:PropertyType.Vec2,
                normalize: "width and height",
                splice:2
            },
            "ADBE Scale": {
                varName: "scale",
                eName:"transform",
                pType:PropertyType.Vec2,
                normalize: 100.0,
                splice:2
            },
            "ADBE Rotate Z": {
                varName: "rotate",
                eName:"transform",
                pType:PropertyType.Float,
            },
            "ADBE Opacity": {
                varName: "opacity",
                eName:"transform",
                pType:PropertyType.Float,
                normalize: 100.0,
            }
        }
    }
```

- varName：导出的变量名以及对应的shader uniform变量（需要和特效模板匹配）

- eName：对应的fragment shader（需要和特效模板匹配）

- pType：uniform类型

- normalize：缩放比例

#### LazyTemplate/effectlist.json

在effectlist.json中填写特效对应的shader文件信息

```json
{
    "ADBE Gaussian Blur 2":{
        "name":"gaussianBlur",
        "folder":"gaussianBlur/",
        "content":"gaussianBlur.json",
        "shaders":[
            "gaussian_sigma6.fsh",
            "gaussian_sigma6.vsh",
            "gaussian_blend.fsh",
            "gaussian_blend.vsh"
        ]
    }
}
```

#### gaussianBlur.json

其中用#LAST_EFFECT#代表上一个特效，在应用模板时，会自动根据上个特效修改对应的字符串，同时自己的name也会添加序号

```json
[
    {
        "name": "gx",
        "inputEffect": [
            "#LAST_EFFECT#"
        ],
        "viewport": [
            0,
            0,
            180,
            320
        ],
        "autoChangeViewport": true,
        "vertexShader": "resource/gaussian_sigma6.vsh",
        "vUniforms": [
            {
                "name": "texelWidthOffset",
                "type": 300
            },
            {
                "name": "texelHeightOffset",
                "type": 3,
                "data": [
                    0
                ]
            }
        ],
        "fragmentShader": "resource/gaussian_sigma6.fsh",
        "fUniforms": [
            {
                "name": "inputImageTexture",
                "type": 1000,
                "inputEffectIndex": 0
            }
        ]
    },
    {
        "name": "gy",
        "inputEffect": [
            "gx"
        ],
        "viewport": [
            0,
            0,
            180,
            320
        ],
        "autoChangeViewport": true,
        "vertexShader": "resource/gaussian_sigma6.vsh",
        "vUniforms": [
            {
                "name": "texelWidthOffset",
                "type": 3,
                "data": [
                    0
                ]
            },
            {
                "name": "texelHeightOffset",
                "type": 301
            }
        ],
        "fragmentShader": "resource/gaussian_sigma6.fsh",
        "fUniforms": [
            {
                "name": "inputImageTexture",
                "type": 1000,
                "inputEffectIndex": 0
            }
        ]
    },
    {
        "name": "gaussianBlend",
        "inputEffect": [
            "#LAST_EFFECT#",
            "gy"
        ],
        "vertexShader": "resource/gaussian_blend.vsh",
        "vUniforms": [
        ],
        "fragmentShader": "resource/gaussian_blend.fsh",
        "fUniforms": [
            {
                "name": "inputTex",
                "type": 1000,
                "inputEffectIndex": 0
            },
            {
                "name": "blurTex",
                "type": 1000,
                "inputEffectIndex": 1
            },
            {
                "name": "factor",
                "type": 3,
                "data" : [0.0]
            }
        ]
    }
]
```

### 必须注意：

1. 约束：

1. 目前BUG：

## LazyShader

### 安装方法

1. 使用编译LazyShader，得到LazyShader.plugin

1. 将LazyShader.plugin复制到/Applications/Adobe After Effects CC 2018/Plug-ins/Bytedance（工程中默认输出此位置）

[附件：LazyShader.plugin.zip](https://bytedance.larkoffice.com/file/HkrPbt4BDoq3xVxIzoucaCMKnrc)

### 使用方法

#### 添加特效

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556902.png)

#### 修改shader

点击Shader-Edit，修改fragment shader

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152613161.png)

#### 修改参数或者参数类型

1. edit name-Edit：修改参数名，修改为空时自动删除

1. uniform type：uniform类型（包含几个预定义类型）

1. uniform value：根据不同类型会有不同显示

例如修改iMouse数值（point2d）

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556901.png)

- layer

- color

- int slider

- float slider

- angle

- point2d

- point3d

- checkbox

- effect input(sampler2D)

- resolution(vec3)

- second time(float)

- frame time(int)

#### 自动添加参数

勾选automatic add parameters

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556894.png)

编辑shader，添加uniform参数

```cpp
uniform float testfloat;
```

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556895.png)

自动添加了参数
