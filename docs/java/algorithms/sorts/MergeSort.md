# 归并排序
## 算法实现思路
归并排序的实现思路：
1. 首先将数组分成两半进行排序，得到两个排序后的子数组。
2. 然后将这两个子数组组合起来形成一个排序后的新数组。

## 算法复杂度
- 时间复杂度为O(N LogN)
- 空间复杂度N

## 算法实现

```java
public class MergeSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        if (low + 1 >= high) {
            return;
        }
        int mid = low + (high - low) / 2;
        sort(arr, low, mid);
        sort(arr, mid, high);
        merge(arr, low, mid, high);
    }

    private void merge(int[] arr, int low, int mid, int high) {
        int[] helper = new int[high - low];
        int i = low;
        int j = mid;
        int index = 0;
        while (i < mid && j < high) {
            helper[index++] = arr[i] < arr[j] ? arr[i++] : arr[j++];
        }

        while (i < mid) {
            helper[index++] = arr[i++];
        }

        while (j < high) {
            helper[index++] = arr[j++];
        }

        System.arraycopy(helper, 0, arr, low, helper.length);
    }
}
```