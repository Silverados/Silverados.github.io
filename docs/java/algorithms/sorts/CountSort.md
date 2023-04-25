# 计数排序
## 算法实现思路
计数排序是非比较排序，通过统计落在区间上点的个数来排序数组。
1. 找出最大值max和最小值min
2. 开辟大小为 (max - min + 1)的数组
3. 遍历原数组，统计元素个数到辅助数组中
4. 遍历新数组，放回原数组

通常适用数据比较集中、跨度小的数组。例如高考分数排位，总分750，那辅助数组最大也就750，可以得到每一分多少人然后再进行细分。

## 算法复杂度
假设数组的长度为n，最大值和最小值的差值为k。那么时间复杂度为：O(n + k), 额外空间复杂度为O(k)

## 算法实现
```java
public class CountSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        int max = arr[low];
        int min = arr[low];
        for (int i = low + 1; i < high; i++) {
            max = Math.max(arr[i], max);
            min = Math.min(arr[i], min);
        }

        int[] helper = new int[max - min + 1];
        for (int num : arr) {
            helper[num - min]++;
        }

        int index = low;
        for (int i = 0; i < helper.length; i++) {
            while (helper[i] > 0) {
                arr[index++] = i + min;
                helper[i]--;
            }
        }
    }
}
```