# VFX - GPU Particle System 101

Maintainer:

Last Update: 08/25/2021

### Naming

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223379.png)

Usually when people talk about VFX they might think it as the use of green screen and postprocessed visual effects in filming. Although it is the same thing that when we refer to VFX in games, it is more like a subset of VFX, which is often the GPU particle system. This might because game engine companies and competitors borrowed the word VFX and use it as a code name for GPU particle system and this article is focusing on the latter.

### History

Particles are the essence of the world. Our world consists of many small particles, such as dust in the air, water drops or the bubbles inside and fire embers. From a macro perspective, large objects such as grass is also a particle system if we think each grass leaf is a particle. Partilces can also be used to think of a piece of fabric, where each particles are just tightly bounded together.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223387.png)

The first appearance of particles in games was in one of the earliest video games called Spacewar!, which was invented in 1962 in an MIT lab. The game is a two player game where each player controls a spaceship named the needle and the wedge, and each player has limited fuel and weapons to move and shoot across the space. When the spaceship gets hit, it will explode with randomly generated pixels on the screen to show the explosion. Although there was no concept of particle systems at the time, it pointed out a direction for the usage of small particles in games.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306482.gif)

> https://www.youtube.com/watch?v=1EWQYAfuMYw

The term particle system was officially brought in the movie Star Trek II in 1982 and it was used to create the visual effect of the Genesis Device. William Reeves, who is the inventor of the method to simulate early particle systems in this movie, also gave the definition of it. Here is a short video of what genesis device is and how the particle system played in the visual effect:

> “A particle system is a collection of many many minute particles that together represent a fuzzy object. Over a period of time, particles are generated into a system, move and change from within the system, and die from the system.”
>
> —William Reeves, "Particle Systems—A Technique for Modeling a Class of Fuzzy Objects," ACM Transactions on Graphics 2:2 (April 1983), 92.

### Concepts

Particle system is basically a data structure where the particle system class holds the particles, with the ability to add, update and remove the particles. In the particle class, it holds the information about itself such as its current position, velocity and maybe some other attributes such as age and max lifetime.

```cpp
 class ParticleSystem { //https://natureofcode.com/

  vector<Particle> particles;

  function addParticle();
  function run();

}

class Particle {

  Vector3 location;
  Vector3 velocity;
  Vector3 acceleration;
  float lifespan;

}
```

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306480.png)

> Possible particle attributes
>
> Unity - The Particle System

A particle system usually has four steps or context at each frame when it is running. The Spawn context will add new particles to the system based on its spawn rate or the type of particle system. The Init context will initialize the particles just spawned and then Update every particle that is alive with numerical integrations( ). Finally, the particles usually get Output to the screen as a mesh. [Euler, Verlet, etc](https://bytedance.feishu.cn/docs/doccnaHj5cjG00pvRdbCX2o0GYb)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306483.png)

### GPU Particle System and Graph

In the early stage, people are using CPU to simulate particle system, which can handle up to 10,000 particles in realtime simulations and are mostly limited by the transfer of particle data from the CPU to the graphics hardware (GPU) for rendering. For particle simulations, there is no fancy operations such as memory manipulation but only numeric calculations, which is apparently more suitable for GPU to do the job and it can simulate over millions of particles at the same time.

At the beginning around 2000, GPU could only write its processed data into textures, which are used as buffers to store particle data, such as position textures and velocity textures. Because shaders at runtime cannot read and write to the same buffer during execution, there would be another texture as the destination buffer and switching between the buffers at the next frame. The technique is called ping-pong buffering, which was one of the earliest ways to use GPU to do general calculations such as updating a large amount of particles.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223377.png)

> Building a Million-Particle System

#### Compute Shader

The above technique is of course very complex to handle and it doubles the memory usage for storing particle information. Although it's possible to use other techniques such as Transform Feedback to do particle simulation, there is actually no need for a particle system to go through the original rendering pipeline during spawn, init and update phases. Therefore, in the emerging of general purposed computing on GPU such as CUDA and OpenCL, graphics APIs are also getting compute shader to skip the traditional graphic pipeline directly to the computing stage. The shaders also have the new capabilities to directly read and write to a large set of data with shader storage buffer object (SSBO, equivalent to UAV/RWBuffer in Unity/DirectX) and uniform buffer object(UBO, equivalent to constant buffer in Unity/DirectX).

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223385.png)

> https://www.youtube.com/watch?v=0DLOJPSxJEg
>
> Shaders are executed in groups, such that every shader executes in lock-step. Each group of individual shader invocations has access to a block of memory. This memory is what UBOs represent. It is relatively small (on the order of kilobytes), but accessing it is quite fast. When performing a rendering operation, data from UBOs are copied into this shader local memory.
>
> SSBOs represent global memory. They're basically pointers. That's why they generally have no storage limitations (the minimum GL requirement is 16 Megabytes, with most implementations returning a number on the order of the GPU's memory size). They are slower to access, but this performance is because of where they exist and how they're accessed, not because they might not be constant. Global memory is global GPU memory rather than local constant memory.
>
> SSBO as bigger UBO?

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306474.png)

In a compute shader based GPU particle system, the Init and Update context will be done in compute shaders, while the output context is done with primitives or instanced mesh and vert/frag shaders. In the shaders, particle attributes will be directly accessed and updated with an attribute SSBO. For dead particles, there is also a dead SSBO for particle recycle.

#### VFX Graph

To make easier to create GPU particle systems, game editors and competitors developed graph systems for it that will automatically generate compute shader codes. Although with different UIs, they are still the same old particle system. In every graph, there are four contexts: spawn, init, update and output. The Lens Studio one is little bit different because it combines the spawn and init phase to make it easier for user to understand the graph, but you can still adjust behaviors such as spawn rate on the property panel. Additionally, Unreal's Niagara particle system combines CPU and GPU particle systems. These tools have greatly accelerated the process of creating GPU particle effects and make it accessible for everyone.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223384.png)

For AmazingEditor, we currently have a very early stage VFX graph system, you can check out the demo from here  and the editor can be downloaded from here. [VFX Graph Demo](https://bytedance.feishu.cn/docs/doccn8BeXGTAhMrHj5LNha7MNce)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306476.png)

### Effects

This part contains the realization and usages for some GPU particle effects. Some examples are from Unity's VFX graph samples repo:

https://github.com/Unity-Technologies/VisualEffectGraph-Samples

#### Multi-Context

A particle system does not have to have one each of the four contexts. GPU particle system graphs can help users to easily manage those different contexts.  The butterfly particle effect example from Unity that has several outputs. Instead of using animation, the particle system has one quad outputs for each wing and make them flippy procedurally.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306475.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223378.gif)

Here is another example that combines multiple outputs and texture sampling. The particle system reads a height map and gets the particle positions. It uses three outputs: one for the light shafts, one for the points and another one adds volume to the points.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223380.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223382.gif)

#### GPU Event

By using additional buffer, it is possible to let one particle system to trigger another. In the firework example, each upward firework particle, it has a repeating event to spawn its trail. When the upward particle dies, it will explode and burst another group of particles with their trail particle system.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306477.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306478.gif)

#### SDF vs Point Cache

SDF and Point Cache are the two cool abilities can be only done with GPU particle system. They are quite similar and in some applications they are interchangable to each other. Signed Distanced Field(SDF) or Vector Field(VF) is a 3D field containing 1-4D values stored in voxels. They are basically the same as 3D textures that GPU can read and interpolate between voxels.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306479.png)

Point Cache is an asset type that bundles a Point Count, and One or Many AttributeMaps, which can be used for store vertex information that is pre-baked or get at runtime. In our VFX system, it is passed into compute shaders as UBO.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152306481.png)

> Tutorial of using Houdini to bake point cache and use it in Unreal.
>
> https://vimeo.com/479992969

Depending on the situation, you might want to use SDF as the path of GPU particles, usually a noise field, and use point cache as determined positions(might also include color/direction and some other data).

> In the game Rez Infinite(2016), a remaster of an original game on PS2 and Dreamcast in 2001, these kinds of GPU particle effects have been used extensively.

#### Strip/Ribbon

GPU particle systems also provide different output options. Besides one quad for each particle, It can also output quad mesh in between each particles and forms a strip or a ribbon.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223386.gif)

This is very useful when to create effects such as audio spectrum visualizer, or even hair and grassland. In the grass land example,each grass leaf is a long quad on the land that will never die during the update process. It reads a texture with the information of player's path and walking direction, and based on that the system put down the grass.

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223381.gif)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152223383.gif)

> https://blog.unity.com/technology/visual-effect-graph-samples

### Next

To learn how to use AmazingEditor's VFX Graph Editor to build a particle ocean effect, please check out  . [VFX - GPU Particle System 102](https://bytedance.feishu.cn/docs/doccnJtpdvZwjPDmMdfLaF0RZZb#)

### Reference

- https://natureofcode.com/book/chapter-4-particle-systems/

- https://www.youtube.com/watch?v=1EWQYAfuMYw

- https://www.gamasutra.com/view/feature/130535/building_a_millionparticle_system.php?page=1

- https://www.tutorialspoint.com/unity/unity_the_particle_system.htm

- [Euler, Verlet, etc](https://bytedance.feishu.cn/docs/doccnaHj5cjG00pvRdbCX2o0GYb)

- https://stackoverflow.com/questions/33589784/ssbo-as-bigger-ubo

- https://www.youtube.com/watch?v=0DLOJPSxJEg

- https://blog.unity.com/technology/visual-effect-graph-samples

- https://vimeo.com/479992969

- https://github.com/cinder/Cinder/tree/master/samples/_opengl/ParticleSphereCS
