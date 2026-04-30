---
created: 2026年04月30日 18:42:31
random_id: 8720487
时间戳UID: 1777545751
页面ID: 1.70
---

# [3152. 特殊数组 II ](https://leetcode.cn/problems/special-array-ii/)

如果数组的每一对相邻元素都是两个<font color="#0070c0">奇偶性不同</font>的数字，则该数组被认为是一个 **特殊数组** 。

你有一个整数数组 `nums` 和一个二维整数矩阵 `queries`，对于 `queries[i] = [from, to]`，请你帮助你检查 子数组 `nums[from..to]` 是不是一个 **特殊数组** 。

返回布尔数组 `answer`，如果 `nums[from..to]` 是特殊数组，则 `answer[i]` 为 `true` ，否则，`answer[i]` 为 `false` 。


### 个人的初步想法

其实就是暴力：
把 nums 数组的值判断奇偶 0 偶 1 奇 表示，然后用一个字符串表示整个数据。
遍历 `queries` 数组，在上面的字符串的子字符串中找''00''或''11''，只要存在就不是特殊数组。

假设：
- n = 数组长度
- q = 查询数量
 你的做法复杂度：
每次查询都要扫描子串：
```
最坏：O(n - l)
```
总复杂度：
```
O(n * q)
```
👉 如果 n 和 q 都是 10^5，会直接超时。
而这道题给出的数据范围也确实如此。

### 题解思路

```cpp
class Solution {
public:
    vector<bool> isArraySpecial(vector<int>& nums, vector<vector<int>>& queries) {
        vector<int> s(nums.size());
        
        for (int i = 1; i < nums.size(); i++) {
            s[i] = s[i - 1] + (nums[i - 1] % 2 == nums[i] % 2);
        }
        
        vector<bool> ans(queries.size());
        
        for (int i = 0; i < queries.size(); i++) {
            auto& q = queries[i];
            ans[i] = s[q[0]] == s[q[1]];
        }
        return ans;
    }
};
```

<font color="#00b050">暴力的优化——提前统计：</font>
><font color="#00b050"> 有多少个“坏的相邻对”（奇偶相同）</font>
><font color="#00b050"> 把判断变成可量化的数据。</font>

代码中：
```
s[i] = s[i - 1] + (nums[i - 1] % 2 == nums[i] % 2);
```
 `s[i]` = 从开头到位置 `i`，一共出现了多少个“坏相邻对”
其中：
- “坏相邻对” =  相邻元素奇偶性相同
- `(nums[i - 1] % 2 == nums[i] % 2)`
    - true → 1
    - false → 0


“特殊数组”的定义是：
> 所有相邻元素都必须奇偶不同  
> 👉 等价于：**没有坏相邻对**

而子数组的坏对数量 = s[r] - s[l]，只要 s[r] - s[l] == 0 就可保证这是个“特殊数组”。