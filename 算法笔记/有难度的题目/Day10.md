---
created: 2026年04月22日 21:23:15
random_id: 1467533
时间戳UID: 1776864195
页面ID: 1.46
---

# [1930. 长度为 3 的不同回文子序列 ](https://leetcode.cn/problems/unique-length-3-palindromic-subsequences/description/)

给你一个字符串 `s` ，返回 `s` 中 **长度为 3** 的**不同回文子序列** 的个数。

<font color="#ffc000">即便存在多种方法来构建相同的子序列，但相同的子序列只计数一次。</font>

**回文** 是正着读和反着读一样的字符串，也就是关于中心轴左右对称。

**子序列** 是由原字符串删除其中部分字符（也可以不删除）且不改变剩余字符之间相对顺序形成的一个新字符串。

- 例如，`"ace"` 是 `"abcde"` 的一个子序列。


![](attachments/枚举中间.png)
```cpp
class Solution {
public:
    int countPalindromicSubsequence(string s) {
        int ans = 0;

        // 枚举中间——a-z
        for(char c = 'a'; c <= 'z'; c++){
            // 左边第一个
            int i = s.find(c);
            // 字符串中没有这个字母,跳过 
            if(i == -1) continue;
            // 最右边的那个
            int j = s.rfind(c);

            //为了避免重复计数，可以用一个26字母表来标记记录过的字母
            bool alpha[26]{};
            for(int k = i + 1; k < j; k++){
                if(!alpha[s[k] - 'a']){
                    alpha[s[k] - 'a'] = true;
                    ans++;
                }
            }
        }

        return ans;

    }
};
```

这个思路是最清晰的，但不容易想到。


