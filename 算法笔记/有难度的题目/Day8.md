---
created: 2026年04月20日 17:25:49
random_id: 6785710
时间戳UID: 1776677149
页面ID: 1.1
---

# [3583. 统计特殊三元组](https://leetcode.cn/problems/count-special-triplets/)
给你一个整数数组 `nums`。

**特殊三元组** 定义为满足以下条件的下标三元组 `(i, j, k)`：

- `0 <= i < j < k < n`，其中 `n = nums.length`
- `nums[i] == nums[j] * 2`
- `nums[k] == nums[j] * 2`

返回数组中 **特殊三元组** 的总数。

由于答案可能非常大，请返回结果对  $10^9 + 7$  取余数后的值。

```cpp
class Solution { 
	public: int specialTriplets(vector<int>& nums) { 
		const int MOD = 1'000'000'007; 
		unordered_map<int, int> suf; 
		for (int x : nums) { 
			suf[x]++; 
		} 
		
		long long ans = 0; 
		unordered_map<int, int> pre; 
		for (int x : nums) { 
			suf[x]--;  
			ans += 1LL * pre[x * 2] * suf[x * 2]; 
			pre[x]++; 
		} 
		
		return ans % MOD; 
	} 
}; 
```

枚举中间的 j，问题变成：
- 在 [0,j−1] 中，nums[j]⋅2 的出现次数。
- 在 [j+1,n−1] 中，nums[j]⋅2 的出现次数。
- 在这些出现次数中，左右两边各选一个。根据乘法原理，把这两个出现次数相乘，加到答案中。

用哈希表（或者数组）统计 j 左右每个数的出现次数。
- 右边的元素出现次数，可以先统计整个数组，然后再次遍历数组，**撤销** [0,j] 中统计的元素出现次数，即为 [j+1,n−1] 中的元素出现次数。
- 左边的元素出现次数，可以一边遍历 nums，一边统计。


我做时出现的一个重要问题：怎么用哈希表保证随 j 的更新，哈希表的内容是 j 之后的每个数的出现次数？
卡住时的想法是每个 j 的右侧 对数的统计都用一个哈希表表示，相当于多个哈希表嵌套在一个数组中。显然空间复杂度太高了，不可行。
突破点在于可以统计完数组所有数的出现次数后，在维护 j 和 i 时删除左侧的元素的出现次数。