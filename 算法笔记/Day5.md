---
created: 2026年04月11日 21:36:57
random_id: 1267081
时间戳UID: 1775914617
页面ID: 1.67
---

# [3371. 识别数组中的最大异常值](https://leetcode.cn/problems/identify-the-largest-outlier-in-an-array/)



```cpp
class Solution {
public:
    int getLargestOutlier(vector<int>& nums) {
        // 有负数，负数之和只会变小，因此不能排序

        // 如果把异常值从数组中移除，那么剩下的数字之和就是 “和” 的两倍
        // sum - nums[j] - nums[i] == nums[i]
        // sum - 2 * nums[i] == nums[j]
        
        // 下标不能冲突，用哈希表记录所有数字的出现次数，然后枚举元素和 nums[i]，用上式表示出异常值，在哈希表中寻找异常值
        // 分情况：1、找到的值正好不同于其他值，符合题目。
        //         2、找到的值和 nums[i]相等，但数量超过了 1，这个值可以是异常值，答案需要更新
        //          3、找到的值和 nums[i]相等，但数量只有一个，这个值是“和”本身，pass 比如[2,2,4]
        
        unordered_map<int, int> cnt;
        int sum = 0;
        for(int& num : nums){
            cnt[num]++;
            sum += num;
        }

        int ans = INT_MIN;
        for(int& j : nums){
            int i = sum - 2 * j;
            auto it = cnt.find(i);
            if(it != cnt.end() && (i != j || it->second > 1)){
                ans = max(ans, i);
            }
        }
	    return ans;
    }
};

```

### Two Sum：
nums[i] + nums[j] == target  
→ nums[i] == target - nums[j]
### 本题 ：
sum - nums[j] - nums[i] == nums[i]
→ nums[j] == sum - 2 * nums[i] 

## 模板 A：总和拆分（本题同类）

- 数组总和：`S = sum(nums)`
- 特殊数字集合：`special`
- 特殊数字的和：`T`
- 异常值：`x`

**结构：**
S = 2 T + x  
→ T = (S - x)/2

**适用信号：**
- “一部分是另一部分的和”
- “多了一个异常值/冗余值”

**做法：**
- 枚举 `x`
- 查 `T`

---

## 模板 B：删除一个元素后的性质

**结构：**
S - x = 某种目标（如 2 T）

或：
S - x = y

**例：**
- 删除一个数后，剩下数组满足某性质

---

## 模板 C：前缀和 Two Sum 化

**结构：**
pre[r] - pre[l] = k  
→ pre[l] = pre[r] - k

**适用：**
- 子数组和 = k
- 计数类问题

👉 这就是“前缀和 + 哈希”的本质

---

## 模板 D：异或版 Two Sum
a ^ b —— 用集合理解就是 a 中独有的元素
**结构：**
a ^ b = target  
→ b = a ^ target

👉 与加法完全平行

---

## 模板 E：绝对值/距离最大化

**结构：**
|a - b| 最大  
→ max(a) - min(b)

👉 转化为“极值组合”（你之前那题）

| 只判断存在 | `unordered_set` |
| ----- | --------------- |
| 要计数   | `unordered_map` |
