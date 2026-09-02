# Convolution Soft Shadow Maps - Knowledge Sharing

#### Basic Shadow Mapping Overview

Compare camera view depth with light view depth

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152422997.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423012.png)

Let's set d as the depth of the pixel in light space, z as the corresponding shadow map depth(nearest blocker pixel)

Shadow Testing:

If x > z,  in shadow, otherwise if x <= z then not in shadow. (consider bias to remove shadow acne)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406832.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406822.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444776.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406827.png)

We want Hard shadow --> Soft shadow:

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406836.png)

Available soft shadow mapping techniques on the market

PCF, PCSS, ESM, VSM, EVSM, SAVSM, CSM, MIPCSM , SAVSM, MSM...

#### Core concept of CSM

Transform the standard shadow test function(or visibility function) into linear bases, which then enables the use of readily available filtering functions(such as mip-mapping). One industry method is to approximate visibility step function by Fourier expansion(1D)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152444775.png)

Why we can not simply blur/filter shadow map within shadow space?

First, think of the depth results and shadow testing result as result of functions:

| ![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406831.png) | ![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423006.png)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406825.png)；x is pixels world position, p is shadow map coordinates, s, f is the visibility(shadow test) function；f(d,z) is a binary function that returns 0 if d>z and 1 otherwise. |
| --- | --- |

| ![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406821.png) | [Optional Read on a derivation of why we can not do direct convolution/filtering]；A convolution (or linear filtering) operation on a function g with kernel w supported over a neighborhood N:；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351484.png)；The formula to convolve the shadow function s(x), and denote the result as s_f (x)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152422994.png)；Y is a nearby spot around x, so d(y) is roughly equal to d(x), so we have below(similar to PCF):；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406819.png)；Finally jump back to check Concolution Definition function, we have:；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406820.png) |
| --- | --- |

We cannot directly apply convolution to z(p), because f is nonlinear with respect to z(check convolution calculation rules: http://www.statistics4u.com/fundstat_eng/cc_convolution_rules.html):

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406830.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406828.gif)

So we need to find a way to transform the function into something linear so we can pre-filter. The most basic form we want can be something like this, as an expansion(truncated):

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406837.png)

Then we can do:

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351485.png)

Now we can convolving the individual basis images

each term in the expansion had to be separable with respect to d and z. Decoupling d(x) from z(p) is necessary, since it enables us to convolve the images Bi(z(p)) before the shadow test.

What is the expanded results? Use fourier series

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406834.png)

How do we reach the above equation? (Major steps briefed below and can dive in deeper if interested)

[Optional Read on Derivation]

| Fourier Series consists of cos/sin functions:；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152422995.png)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423004.png)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423008.gif)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406826.png)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406835.png)；Square wave function(naturally a match for shadow testing function) represented with fourier series bases:；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406829.gif)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423003.png)；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351480.png)；(F is frequency here).；Then f(d, z) can be converted into a Heaviside step function(https://en.wikipedia.org/wiki/Heaviside_step_function), we have: f(d,z)=H(d−z). If let t = d - z then we have H(t) which is what we want to figure out how to get an expansion for. And if we let the above x(t)'s frequency to be 0.5(which means period of 2), then we can have H(t) = 0.5 + 0.5x(t). So H(t) becomes:；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351482.png)；It is roughly equal because it is a truncation of the infinite series.；[Note: Ck=π(2k−1)]；A hand write process:；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423010.png)；Then with some trigonometric transform [sin(a - b) = sin(a)cos(b) - cos(a)sin(b)], we have:；![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406823.png) |
| --- |

Now we have those different terms which we can convolute separately:

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406824.png)

Note: Fourier is not the only option for decomposition, reason why this is chosen can be found in paper. Other applications utilizing similar linear decomposition idea for example: Exponential, VSM, etc

[附件：292d751a-c904-41a1-ac20-77da8d18dc53.png](https://bytedance.larkoffice.com/file/OYykbvbZKoH4jZx2iuvua9CpsSg)（[本地附件](./resources/attachments/292d751a-c904-41a1-ac20-77da8d18dc53.png))

From our shadow map, we calculate those above basis functions whose input is z(p), or Bi(z(p)), the result of the calculation in the form of textures are shown below:

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152422998.png)

Those basis textures can be packed, filtered or mipmaped.

Some dummy implementation here:

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406838.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152422996.png)

Some issues to solve: Light Bleeding and Ringing.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152422993.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423005.png)

Light Bleeding: Because around d=z our average value is 0.5.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152406833.png)

How to fix? Offseting and Scaling the whole graph. (Might not need to fix light bleeding if not much, or don't have to follow the method in paper, can get creative remapping values)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351481.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423000.png)

Ringing: Because we are using a truncated version of Fourier Series, so representation is an estimation.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423002.png)

How to fix? Attentuating corresponding sin/cos term with exp(−α(k/M)^2), high frequency terms will be downplayed more. This method, However, unavoidably make the visibility function less steep.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152422999.png)

What M value to choose?

M = 8 can be a good balance/quality trade-off, can use 8-bit textures, floating point no obvious advantages.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423009.png)

Note: The core idea of decomposing shadow map into linearly filterable items are not just tied to Fourier Series, but also other types of expansion.

#### Comparison:

##### Advantages

- Advantages over PCF(coz naturally work with MipMap and Bi/Tri-Anisotropic filtering)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152351483.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423007.png)

- Don't have problems with light leaking with a reasonably higher M

- Naturally, lower res texutre has filtering functionality.

- Can play around with arbitrary gaussian kernals even for different images as necessary

- Advantages over VSM on tackling light leaking(coz VSM's Chebyshev’s Inequality strongly assume the receiver and occluders are planar and parallel, artifacts quickly worsen as depth complexity in-crease)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423001.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152423011.png)

##### Disadvantages

- Ringing can be annoying

- Larger memory

- Bleeding under low term count M

- High M can be slow

References:

https://www.jankautz.com/publications/csmEGSR07.pdf（[本地 PDF](./resources/pdfs/Convolution%20Shadow%20Maps.pdf))

https://catlikecoding.com/unity/tutorials/rendering/part-7/

LearnOpenGL - Shadow Mapping

https://zhuanlan.zhihu.com/p/26853641

https://en.wikipedia.org/wiki/Fourier_series

https://en.wikipedia.org/wiki/Square_wave

https://hal.inria.fr/inria-00510082/document (another interesting concolution application)
