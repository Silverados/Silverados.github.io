# 冒泡排序
## 算法实现思路
冒泡排序就像吐泡泡一样，两两比较将大值移到右方:
1. 将序列中所有元素两两比较，将较大的放在最后面。
2. 将剩余序列中所有元素两两比较，将较大的放在最后面。
3. 重复第二步，直到只剩下一个数。

## 算法复杂度
比较时间复制度为O(N^2)，改变时间复杂度为O(N)

## 算法实现
```java
public class BubbleSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        for(int i = high - 1; i > low; i--) {
            for(int j = low + 1; j <= i; j++) {
                if(arr[j] < arr[j - 1]) {
                    swap(arr, j, j - 1);
                }
            }
        }
    }
}
```