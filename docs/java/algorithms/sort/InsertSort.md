# 插入排序
## 算法实现思路
插入算法可以理解为不断的将元素插入到有序的序列中，直到取完无序的序列。需要注意的是插入排序对部分有序的数组有更高的效率。
- 最好的情况是这个数组原本就是有序的, 那么比较的实际时间复杂度为O(N-1)
- 最差的情况是这个数组的反序的, 那么比较的实际时间复杂度就来到了O(N^2/2), 修改的时间复杂度也来到了O(N^2/2), 因为每一次比较都会修改
- 平均的时间复杂度为O(N^2)

通常实现是将左边视为有序序列，随着下标往右移动，有序序列不断扩张。扩张过程是从有序队列的右侧进行比较，在找目标插入的位置过程中将元素不断右移，在移动结束时插入元素。

## 算法实现
这里算法实现的时候有一个小细节，这个细节很关键就是子循环的时候倒序，因为这实际上就代表了如果新的值是有序区间的最大值就不会继续走循环。用`swap`的写法是这样的：

> SortAlgorithm 实现在排序算法的[README.md](/java/algorithms/sort/README.md)中提供
```java
public class InsertSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        for(int i = low + 1; i < high; i++) {
            for (int j = i - 1; j >= 0 && arr[j] > arr[j + 1]; j--) {
                swap(arr, j, j + 1);
            }
        }
    }
}
```

这里我再贴一个`DualPivotQuickSort`中的`insertionSort`实现，可以看到因为在实际遍历的过程中我们并不需要交换，只是做替换这样写相当于少一次替换：
```java
    private static void insertionSort(int[] a, int low, int high) {
        for (int i, k = low; ++k < high; ) {
            int ai = a[i = k];

            if (ai < a[i - 1]) {
                while (--i >= low && ai < a[i]) {
                    a[i + 1] = a[i];
                }
                a[i + 1] = ai;
            }
        }
    }
```

基于这个实现再修改下我的实现：
```java
public class InsertSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        for(int i = low + 1; i < high; i++) {
            int j = i - 1, base = arr[j];
            for (; j >= 0 && base > arr[j + 1]; j--) {
                arr[j + 1] = arr[j];
            }

            if (j != i - 1) {
                arr[j + 1] = base;
            }
        }
    }
}
```
