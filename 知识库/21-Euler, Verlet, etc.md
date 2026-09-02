# Euler, Verlet, etc

- 如何用代码模拟效果

##### Euler

- 第0帧：给定初始位置、速度、加速度

- 第1帧：

- 第2帧开始依次类推

```php
self.curPos.x = self.prevPos.x + deltaTime * self.prevVel.x
self.curPos.y = self.prevPos.y + deltaTime * self.prevVel.y
self.curVel.x = self.prevVel.x + deltaTime * self.prevAccel.x
self.curVel.y = self.prevVel.y + deltaTime * self.prevAccel.y

transform2d.position = self.curPos

self.prevPos = self.curPos
self.prevVel = self.curVel
self.prevAccel = self.curAccel
```

##### Velocity Verlet

- 第0帧：给定初始位置、速度、加速度

- 第1帧：

，即

- 第2帧开始依次类推

```php
self.curVel.x = self.prevVel.x + deltaTime * self.prevAccel.x
self.curVel.y = self.prevVel.y + deltaTime * self.prevAccel.y
self.curPos.x = self.prevPos.x + (self.curVel.x + self.prevVel.x) * deltaTime / 2;
self.curPos.y = self.prevPos.y + (self.curVel.y + self.prevVel.y) * deltaTime / 2;

transform2d.position = self.curPos

self.prevPos = self.curPos
self.prevVel = self.curVel
self.prevAccel = self.curAccel
```

##### Verlet

分析：

```php
self.curPos.x = 2*self.prevPos.x - self.prevPrevPos.x + deltaTime * deltaTime * self.prevAccel.x
self.curPos.y = 2*self.prevPos.y - self.prevPrevPos.y + deltaTime * deltaTime * self.prevAccel.y

transform2d.position = self.curPos

self.prevPrevPos = self.prevPos
self.prevPos = self.curPos
self.prevAccel = self.curAccel
```

##### Symplectic Euler

- 第0帧：给定初始位置、速度、加速度

- 第1帧：

- 第2帧开始依次类推

分析：

- 从Symplectic Euler公式得

, same as Verlet integration

```php
self.curVel.x = self.prevVel.x + deltaTime * self.prevAccel.x
self.curVel.y = self.prevVel.y + deltaTime * self.prevAccel.y
self.curPos.x = self.prevPos.x + deltaTime * self.curVel.x
self.curPos.y = self.prevPos.y + deltaTime * self.curVel.y

transform2d.position = self.curPos

self.prevPos = self.curPos
self.prevVel = self.curVel
self.prevAccel = self.curAccel
```

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556886.png)

##### Demo

##### 应用

- 视情况 加上 碰撞检测/阻尼，以及一些具体case中的 加速度\速度更新方式，可以用来做一些带物理效果的玩法。

- 例如 Make a Splash With Dynamic 2D Water Effects

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556888.png)

![图片](https://yin-qin.oss-accelerate.aliyuncs.com/img/20260902152556887.png)

##### References

- http://kahrstrom.com/gamephysics/2011/08/01/hello-world/

- http://kahrstrom.com/gamephysics/2011/08/03/euler-vs-verlet/

[附件：Gabor Szauer - Game Physics Cookbook-Packt (2017).pdf](https://bytedance.larkoffice.com/file/X8Rdbxmexom2qpxN0BtcCsDDnve)（[本地附件](./resources/attachments/Gabor%20Szauer%20-%20Game%20Physics%20Cookbook-Packt%20(2017).pdf))
