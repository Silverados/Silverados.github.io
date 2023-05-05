# 快速排序
## 算法实现思路
快速排序的实现主要是分区方法的实现，总体来说：
1. 选定基准值
2. 将小于基准值的放左边，大于基准值的放右边，那么中间的就是相等的值
3. 继续将左边的排序，右边的排序，递归下去总体就有序了

## 算法复杂度
- 时间复杂度为O(N LogN)

## 算法实现

```java
public class QuickSort implements SortAlgorithm {

    @Override
    public void sort(int[] arr, int low, int high) {
        if (low + 1 >= high) {
            return;
        }

        int pivot = low + (int) (Math.random() * (high - low));
        swap(arr, high - 1, pivot);

        int[] p = partition(arr, low, high);
        sort(arr, low, p[0]);
        sort(arr, p[1], high);
    }

    private int[] partition(int[] arr, int low, int high) {
        int less = low - 1;
        int more = high - 1;
        while (low < more) {
            if (arr[low] < arr[high - 1]) {
                swap(arr, low++, ++less);
            } else if (arr[low] > arr[high - 1]) {
                swap(arr, low, --more);
            } else {
                low++;
            }
        }
        swap(arr, more, high - 1);
        return new int[]{less + 1, more};
    }
}
```