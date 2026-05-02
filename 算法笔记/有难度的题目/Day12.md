---
created: 2026年05月02日 20:57:47
random_id: 9749472
时间戳UID: 1777726667
页面ID: 1.37
---

# [3361. 两个字符串的切换距离](https://leetcode.cn/problems/shift-distance-between-two-strings/description/)
给你两个长度相同的字符串 `s` 和 `t` ，以及两个整数数组 `nextCost` 和 `previousCost` 。
一次操作中，你可以选择 `s` 中的一个下标 `i` ，执行以下操作 **之一** ：

- 将 `s[i]` 切换为字母表中的下一个字母，如果 `s[i] == 'z'` ，切换后得到 `'a'` 。操作的代价为 `nextCost[j]` ，其中 `j` 表示 `s[i]` 在字母表中的下标。
- 将 `s[i]` 切换为字母表中的上一个字母，如果 `s[i] == 'a'` ，切换后得到 `'z'` 。操作的代价为 `previousCost[j]` ，其中 `j` 是 `s[i]` 在字母表中的下标。

**切换距离** 指的是将字符串 `s` 变为字符串 `t` 的 **最少** 操作代价总和。
请你返回从 `s` 到 `t` 的 **切换距离** 。


```cpp
class Solution {
public:
    long long shiftDistance(string s, string t, vector<int>& nextCost, vector<int>& previousCost) {
        // nextCost统计前缀和
        // previousCost统计前缀和
        // 因为可能出现'z'-'a'这种循环，所以可以将Cost的前后缀和的长度变成原来的两倍 
        // 必须next和prev进行比较，min(next, prev)
        // 特殊情况：tar == cur，此时的结果应该是0

        const int ALPHA = 26;
        const int n = ALPHA * 2 + 1;
        vector<long long> next_sum(n), prev_sum(n);

        for(int i = 0; i < n - 1; i++){
        	next_sum[i + 1] = next_sum[i] + nextCost[i % ALPHA];
           	prev_sum[i + 1] = prev_sum[i] + previousCost[i % ALPHA];
        }

        long long ans = 0;

        for(int i = 0; i < s.size(); i++){
            int cur = s[i] - 'a';
            int tar = t[i] - 'a';
           	if(tar == cur) continue;
            long long next = next_sum[tar > cur ? tar : tar + ALPHA] - next_sum[cur];
            long long prev = prev_sum[(cur > tar ? cur : cur + ALPHA) + 1] - prev_sum[tar + 1];
            
            ans += min(next, prev); 
        }
        return ans;

   }
};
```

关于 next、prev 的定义原理：
[Day12.excalidraw](attachments/Day12.excalidraw.md)