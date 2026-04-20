---
created: 2026年04月19日 20:08:07
random_id: 2088228
时间戳UID: 1776600487
页面ID: 1.33
---

# [2874. 有序三元组中的最大值 II ](https://leetcode.cn/problems/maximum-value-of-an-ordered-triplet-ii/)

给你一个下标从 **0** 开始的整数数组 `nums` 。

请你从所有满足 `i < j < k` 的下标三元组 `(i, j, k)` 中，找出并返回下标三元组的最大值。如果所有满足条件的三元组的值都是负数，则返回 `0` 。

**下标三元组** `(i, j, k)` 的值等于 `(nums[i] - nums[j]) * nums[k]` 。

```cpp
class Solution {
public:
    long long maximumTripletValue(vector<int>& nums) {

        // 枚举 k
        // 如果要 (nums[i] - nums[j]) * nums[k] 最大，那么 (nums[i] - nums[j]) 最大，也就是 nums[i] 最大
        
        // 那么 nums[j] 怎么才能最小？
        // 其实就藏在维护 nums[i]的过程中:
        // 情况 1：维护后的最大值 nums[i]到当前值之间还有几个值，这些值就是 nums[j]，而在遍历时我们就已经维护(nums[i] - nums[j])的最大值，自然也保证了nums[j]最小。
         // 情况2：维护后的最大值nums[i]是当前值的前一个值，意味着没有符合条件的j。
        
        long long ans = 0;
        int max_sub = 0; // 维护(nums[i] - nums[j])为最大值 
        int max_i = 0; // 维护nums[i]为最大值

        for(int k : nums){
            ans = max(ans, 1LL * max_sub * k);  
            max_sub = max(max_sub, max_i - k);
            max_i = max(max_i, k);
        }
        return ans;
    }
};
```

> 假设没有 k 的约束，先枚举 j。然后改变变量 x （这里用 ‘k’ 表示） 的含义，加上 k 这个变量，实现枚举 k

