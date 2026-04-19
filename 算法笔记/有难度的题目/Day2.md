---
created: 2026年03月25日 19:32:00
random_id: 4501791
时间戳UID: 1774438320
页面ID: 1.90
---

# [1011. 在 D 天内送达包裹的能力](https://leetcode.cn/problems/capacity-to-ship-packages-within-d-days/description/)
# 一、题目抽象成数学模型

给定：

- `weights[i]`：第 i 个包裹重量
- `D`：天数

要求：

> 找到**最小运载能力 x**，使得可以在 D 天内运完所有包裹

# 二、为什么可以用“二分答案”

核心在于：

> **答案是一个“能力值 x”**

并且存在<font color="#00b050">单调性</font>：

运载能力 x 越大 → 越容易在 D 天内运完

也就是：

x 太小 → 不行（false）  
x 足够大 → 可以（true）

形成结构：

FFFFFTTTTT  
     ↑  
   答案

---

# 三、check(mid) 的含义（关键）

```cpp
auto check = [&](int capacity) -> bool {  
    int days = 1;  
    int cur = 0;  
  
    for (int w : weights) {  
        if (cur + w > capacity) {  
            days++;  
            cur = 0;  
        }  
        cur += w;  
    }  
    return days <= D;  
};
```

---

## 这个 check 在做什么？

模拟运输过程：

- 每天装到不超过 `capacity`
- 超了就开新的一天

最终判断：

需要的天数 <= D → true  
否则 → false

---

# 四、循环不变量在这个题里的具体含义

我们定义：

int left = max(weights);   // 一定不够（或刚好边界）  
int right = sum(weights);  // 一定够

然后维护：

check(left) == false  
check(right) == true

---

## 为什么这样初始化？

### left = max(weights)

- 运载能力 < 最大包裹 → 不可能运
- 所以这是 **下界**

---

### right = sum(weights)

- 一天运完 → 一定可以
- 所以这是 **上界**

---

# 五、二分过程解析（结合你模板）

```cpp
while (left + 1 < right) {  
    int mid = left + (right - left) / 2;  
    if (check(mid)) {  
        right = mid;  
    } else {  
        left = mid;  
    }  
}  
return right;

```
---

## 每一步的含义

### 情况 1：check(mid) == true

说明：

capacity = mid 可以完成运输

那么：

答案 ≤ mid

更新：

right = mid;

👉 保证：

- right 永远是“能完成”的

---

### 情况 2：check(mid) == false

说明：

capacity = mid 不够

那么：

答案 > mid

更新：

left = mid;

👉 保证：

- left 永远是“不够”的

---

# 六、二分区间 vs 答案区间（在本题中）

## 1️⃣ 二分区间

(left, right)

表示：

> 当前还没确定的 capacity 范围

---

## 2️⃣ 答案区间

所有满足 check(x) == true 的 x

也就是：

[x*, +∞)

其中 `x*` 是最小可行解

---

## 两者结合后关键关系

答案 ∈ (left, right]

并且始终满足：

left 是最后一个 false  
right 是第一个 true


# 七、总结

- **check(mid)**：判断 capacity 是否够用
- **循环不变量**：
    - left 永远不够
    - right 永远够
- **二分区间**：不断逼近答案
- **答案区间**：所有“够用”的 capacity
- **最终返回**：第一个“够用”的值（right）