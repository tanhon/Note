---
created: 2026年04月11日 21:36:57
random_id: 1267081
时间戳UID: 1775914617
页面ID: 1.67
---

# [3371. 识别数组中的最大异常值](https://leetcode.cn/problems/identify-the-largest-outlier-in-an-array/)



```cpp
class Solution {
public:
    int getLargestOutlier(vector<int>& nums) {
        // 有负数，负数之和只会变小，因此不能排序

        // 如果把异常值从数组中移除，那么剩下的数字之和就是 “和” 的两倍
        // sum - nums[j] - nums[i] == nums[i]
        // sum - 2 * nums[i] == nums[j]
        
        // 下标不能冲突，用哈希表记录所有数字的出现次数，然后枚举元素和 nums[i]，用上式表示出异常值，在哈希表中寻找异常值
        // 分情况：1、找到的值正好不同于其他值，符合题目。
        //         2、找到的值和 nums[i]相等，但数量超过了 1，这个值可以是异常值，答案需要更新
        //          3、找到的值和 nums[i]相等，但数量只有一个，这个值是“和”本身，pass
        
        unordered_map<int, int> cnt;
        int sum = 0;
        for(int& num : nums){
            cnt[num]++;
            sum += num;
        }

        int ans = INT_MIN;
        for(int& j : nums){
            int i = sum - 2 * j;
            auto it = cnt.find(i);
            if(it != cnt.end() && (i != j || it->second > 1)){
                ans = max(ans, i);
            }
        }
	    return ans;
    }
};

```