---
created: 2026年05月02日 21:33:36
random_id: 9974596
时间戳UID: 1777728816
页面ID: 1.2
---

# [560. 和为 K 的子数组](https://leetcode.cn/problems/subarray-sum-equals-k/description/)
给你一个整数数组 `nums` 和一个整数 `k` ，请你统计并返回 _该数组中和为 `k` 的子数组的个数_ 。

子数组是数组中元素的连续非空序列。

<font color="#ffc000">子数组之和：这种问题都可以优先考虑前缀和、后缀和的思想。</font>
<font color="#ffc000">统计个数：因为统计的对象是无序的，所以如果范围比较小，可以直接使用数组，但这里范围比较大，采用哈希表更省空间。</font>

我们知道，子数组之和意味着：
![441](attachments/Pasted%20image%2020260502214048.png)
子数组表示出来就是 $s[ j ] - s[ i ]$，其中 i < j。
而 $s[j] -s[i] == k$，此时问题就转为了之前的两数之和。

枚举 j，维护 i：
遍历的是 j，找的是 i，即找 $s[j] - k == s[i]$。

```cpp
class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        int n = nums.size();
        vector<int> s(n + 1);
        // 前缀和
        for (int i = 0; i < n; i++) {
            s[i + 1] = s[i] + nums[i];
        }
		
        unordered_map<int, int> cnt;
        int ans = 0;
        for (int sj : s) {
            // 注意不要直接 += cnt[sj-k]，虽然没有逻辑错误，但如果 sj-k 不存在，会插入 sj-k，增加空间复杂度
            ans += cnt.contains(sj - k) ? cnt[sj - k] : 0;
            cnt[sj]++;
        }
        return ans;
    }
};
```

在上面的代码中，我们是先求前缀和，后统计数目。
那么能不能边求前缀和边统计数目？
答：可以。

```cpp
class Solution {
public:
    int subarraySum(vector<int>& nums, int k) {
        unordered_map<int, int> cnt;
        int ans = 0, s = 0;
        
        for (int x : nums) {
            cnt[s]++; // 这里放到前面，主要是前缀和第一个元素0必须加入到哈希表中
            s += x;
            // 注意不要直接 += cnt[s-k]，如果 s-k 不存在，这会插入 s-k，消耗更多空间
            ans += cnt.contains(s - k) ? cnt[s - k] : 0;
        }
        return ans;
    }
};
```


**问**：为什么要把 $s[0]=0$ 也加到哈希表中？
**答**：举个最简单的例子，$nums=[1], k=1$。如果不把 $s[0]=0$ 加到哈希表中，按照我们的算法，没法算出这里有 1 个符合要求的子数组。
也可以这样理解，要想把任意子数组都表示成两个前缀和的差，必须添加 $s[0]=0$，否则当子数组是前缀时，没法减去一个数。


变形题  
1.改成计算元素和等于 k 的<font color="#00b050">最短</font>子数组，要怎么做？  
答：求最短，哈希表的 value 里不再存出现的个数，应该存<font color="#00b0f0">最后一次</font>出现的<font color="#ffff00">下标</font>（i 越靠近 j 越符合），这样计算出来的长度最短。  
```cpp
// j 代表当前元素的下标，这里在每次循环中不断覆盖原来的下标
cnt[sum] = j;
```
2.改成计算元素和等于 k 的<font color="#00b050">最长</font>子数组，要怎么做？  
答：求最长，哈希表的 value 里不再存出现的个数，应该存<font color="#00b0f0">第一次</font>出现的<font color="#ffff00">下标</font>（i 越远离 j 越符合），这样计算出来的长度最长。  
```cpp
// j 代表当前的元素下标，这里只记录第一次出现的下标
if (!cnt.count(sum)) {  
	cnt[sum] = j;  
}
```

3.改成计算元素和等于 k 的<font color="#00b050">所有子数组的长度之和</font>，要怎么做？  
答：求长度之和，我们需要两个哈希表，分别统计出现次数、所有出现位置的下标之和。
假设有多个满足条件的 `l`：
```
l1, l2, ..., lm
```
那么总长度：
```
∑(r - li + 1)= m * (r + 1) - (l1 + l2 + ... + lm)
```
```cpp
unordered_map<long long, long long> cnt, sum;
cnt[0] = 1;
sum[0] = 0;

long long s = 0;
long long ans = 0;

for (int i = 0; i < n; i++) {
    s += nums[i];

    if (cnt.count(s - k)) {
        long long c = cnt[s - k];
        long long total_l = sum[s - k];

        ans += c * (i + 1) - total_l;
    }

    cnt[s]++;
    sum[s] += (i + 1);
    // 把当前这个前缀和 s 出现的位置 (i+1)，加入到总和中
    // 别忘了，前缀和第一个元素必须是0
}
```

4.改成元素和至多为 k，要怎么做？  
答：哈希表变成有序的红黑树，unordered_map 换成 map，这样 key 从匹配 s-k 到能匹配>=s - k 的所有方案，还可以用二分查到边界 lower_bound。  

5.改成计算元素和为奇数的子数组个数，要怎么做？  
答：哈希表的 key 不存具体某个 s 的个数，而是存奇和偶的个数，遇到奇偶个数加一。