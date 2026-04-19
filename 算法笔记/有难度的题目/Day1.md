---
created: 2026年03月24日 19:14:42
random_id: 7311704
时间戳UID: 1774350882
页面ID: 1.65
---

# [2300. 咒语和药水的成功对数](https://leetcode.cn/problems/successful-pairs-of-spells-and-potions/description/)


1. 上下取整转换公式
$$
	⌈a/b​⌉=⌊(a+b−1)/b​⌋=⌊(a-1)/b​⌋+1  
$$
$$⌈x⌉代表向上取整，⌊y⌋代表向下取整$$

2. 前缀和与后缀和的一些理解
前缀和元素 x 统计：左边所有小于 x 的个数 
<--------x---------->
后缀和元素 x 统计：右边所有大于 x 的个数
关键字：元素之和、子序列