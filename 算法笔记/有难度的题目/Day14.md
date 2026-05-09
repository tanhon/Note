---
created: 2026年05月09日 15:06:02
random_id: 1788903
时间戳UID: 1778310362
页面ID: 1.34
---

# [974. 和可被 K 整除的子数组](https://leetcode.cn/problems/subarray-sums-divisible-by-k/description/)

给定一个整数数组 `nums` 和一个整数 `k` ，返回其中元素之和可被 `k` 整除的非空 **子数组** 的数目。

**子数组** 是数组中 **连续** 的部分。

- `1 <= nums.length <= 3 * 104`
- `-104 <= nums[i] <= 104`
- `2 <= k <= 104`

设 nums 的前缀和数组为 s。子数组 $[l,r)$ 的元素和为 $s[r]−s[l]$。

题目要求
$(s[r]−s[l])modk=0$
即 $s[r] 与 s[l]$ 关于模 k **同余**。关于同余的概念，请看 [模运算的世界：当加减乘除遇上取模](https://leetcode.cn/circle/discuss/mDfnkW/)。

所以上式等价于
$s[l]modk=s[r]modk$
把前缀和的每一项都模 k，就变成了 560 题（相当于 560 题的 k=0）。
$s[l]modk-0=s[r]modk$

注意本题有负数，需要用 [模运算的世界：当加减乘除遇上取模](https://leetcode.cn/circle/discuss/mDfnkW/) 中的技巧，把负数前缀和调整为非负数。

如果不调整负数，会出现同余的数据没有汇总的情况。例如 k=4，−1 和 3 关于模 k 同余，如果不调整 −1，那么哈希表会分开保存 −1 和 3。正确做法是把 −1 的个数汇总到 3 上。

```cpp
class Solution {
public:
    int subarraysDivByK(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;
        cnt[0] = 1;
        int sum = 0, ans = 0;

        for(int j : nums){
            sum = ((sum + j) % k + k) % k; // 防止负数，同时不影响正数
            ans += cnt[sum];
            cnt[sum]++;
        }

        return ans;
    }
};
```