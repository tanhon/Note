---
created: 2026年04月15日 22:38:03
random_id: 1507730
时间戳UID: 1776263883
页面ID: 1.82
---

# [2506. 统计相似字符串对的数目](https://leetcode.cn/problems/count-pairs-of-similar-strings/description/)

给你一个下标从 **0** 开始的字符串数组 `words` 。
如果两个字符串由相同的字符组成，则认为这两个字符串 **相似** 。
- 例如，`"abca"` 和 `"cba"` 相似，因为它们都由字符 `'a'`、`'b'`、`'c'` 组成。
- 然而，`"abacba"` 和 `"bcfd"` 不相似，因为它们不是相同字符组成的。
请你找出满足字符串 `words[i]` 和 `words[j]` 相似的下标对 `(i, j)` ，并返回下标对的数目，其中 `0 <= i < j <= words.length - 1` 。

```cpp
class Solution {
public:
    int similarPairs(vector<string>& words) {
        // 用二进制表示元素是否存在，这里 a-z 有 26 个，所以二进制长度是 26
        // 然后用哈希表统计数目。key 是上面的二进制，value 是“相似”的数目

        int ans = 0;
        unordered_map<int, int> cnt;

        for (auto& s : words) {
            int b = 0;
            for (char c : s) {
                b |= 1 << (c - 'a');
                // 1 << k  →  把 1 放到第 k 位
                // x | y：只要某一位有 1 → 结果就是 1    相当于： 把这一位“置为 																		1”
            }
            ans += cnt[b]++;
        }
        return ans;
    }
};
```

## b 的数据类型为什么用 int？
因为：
字符只有 26 个（a ~ z）

可以用一个 32 位整数表示：
第 k 位 = 1 → 表示字符 'a'+k 存在