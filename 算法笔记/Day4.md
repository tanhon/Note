---
created: 2026年04月10日 22:40:46
random_id: 1524969
时间戳UID: 1775832046
页面ID: 1.28
---

# [3805. 统计凯撒加密对数目](https://leetcode.cn/problems/count-caesar-cipher-pairs/description/)


```cpp
class Solution {
public:
    long long countPairs(vector<string>& words) {
        // 把一个字符串中 所有的字符都减去对应的数 变成第一个字符为 a 的字符串
        // 以此为基准，只需要每一个字符串都这样操作，通过哈希表计数，统计总和就可以了
        long long ans = 0;
        unordered_map<string, int> cnt;

        for(auto& s : words){
            int standard = s[0];
            for(char& c : s){ // 直接对 s 进行修改
                c = (c - standard + 26) % 26; // +26 可以避免产生负数
            }
            ans += cnt[s];
            cnt[s]++;
        }

        // 相比较暴力的解法——相互减，这个过程就需要 n(n-1)/2 次，只要有一个不同直接 pass。
        // 这种解法设立了一个基准，可以让每一个字符串都只减一次，最后统计符合基准的总数。
        // 因为字符串可以出现相同，一旦相同的字符串多了，那么每个字符串都减一次就变得复杂了
        // 优化的地方就在这里——以空间换时间——利用哈希表把重复的字符串统计下来，之后再按照上面的方式进行，保证重复的字符串只减一次

        return ans;
    }
};

```

例： words = ["abc", "abc", "abc", "def", "def"]  
优化前代码：直接遍历原始列表，对每个字符串（包括重复的）都单独处理, 'abc' 要处理 3 次
优化后代码：先统计词频，只对不同的字符串处理一次，然后批量处理. 'abc' 只用处理 1 次

```cpp
class Solution {
public:
    long long countPairs(vector<string>& words) {
        unordered_map<string, int> cnt_words;
        for (auto& s : words) {
            cnt_words[s]++;
        } // 统计重复的字符串

        unordered_map<string, int> cnt;
        long long ans = 0;
        for (auto& [s, c] : cnt_words) {
            string t = move(s);
            char base = t[0];
            for (char& ch : t) {
                ch = (ch - base + 26) % 26; // 保证结果在 [0, 25] 中
            }
            // c 个 s 中选 2 个有 C(c, 2) 种方案
            ans += 1LL * cnt[t] * c + 1LL * c * (c - 1) / 2;
            cnt[t] += c;
        }
        return ans;
    }
};
```

`ans += 1 LL * cnt[t] * c + 1 LL * c * (c - 1) / 2;` 
解释：
从“之前的字符串”中选择 ，
从“当前字符串（c 个）”中选择，
如果之前的字符串没有，那么 cnt[t]就是 0
加号左边的 就是原来有 3 个，新来 2个，相当于又组合了 2 * 3 = 6 种结果。
加号右边的就是新来 2 个内部的组合结果，一共是 2 * (2 - 1) / 2 = 1 种结果。
