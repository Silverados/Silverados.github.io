# 排序
排序算法非常多，也很多人讲，我就不细讲了，这里提供几个`int`类型的升序实现，其中不同的排序实现这些方法：
- void sort(int[] arr)
- void sort(int[] arr, int low, int high)

这些固定实现：
- void main(String[] args)
- void swap(int[] arr, int i, int j)
- boolean isSorted(int[] arr)

排序算法的时间复杂度考虑两个方面，一个是比较的次数，一个是交换的次数。

## 比较排序
顾名思义，这类排序都有比较。按时间复杂度划分为：
- O(n^2):
  - [选择排序](/java/algorithms/sorts/SelectSort.md)
  - [插入排序](/java/algorithms/sorts/InsertSort.md)
  - [冒泡排序](/java/algorithms/sorts/BubbleSort.md)
- O(nlogN):
  - [归并排序](/java/algorithms/sorts/MergeSort.md)
  - [快速排序](/java/algorithms/sorts/QuickSort.md)
  - [堆排序](/java/algorithms/sorts/HeapSort.md)

## 非比较排序
对于没了解过的人会觉得挺不可思议的，排序居然不用比较。
- [计数排序](/java/algorithms/sorts/CountSort.md)

## JDK17中Arrays.sort()
这里浅浅看一下类库里的`sort`使用的排序算法, 不深入分析。首先看`Arrays.sort()`的几种实现可以发现基本的数值类型`byte, short, int, long, float, double, char`都使用`DualPivotQuickSort`来实现：
```java
    public static void sort(int[] a) {
        DualPivotQuicksort.sort(a, 0, 0, a.length);
    }
```

`DualPivotQuicksort`的实现中会根据数组大小选择使用哪种排序算法, 这里说的数组大小不太准确应该说数组待排序的一个区间。可以看到实际上是一个复合的算法，包含插入排序、归并排序、堆排序、快速排序：
```java
    static void sort(Sorter sorter, int[] a, int bits, int low, int high) {
        while (true) {
            int end = high - 1, size = high - low;

            /*
             * Run mixed insertion sort on small non-leftmost parts.
             */
            if (size < MAX_MIXED_INSERTION_SORT_SIZE + bits && (bits & 1) > 0) {
                mixedInsertionSort(a, low, high - 3 * ((size >> 5) << 3), high);
                return;
            }

            /*
             * Invoke insertion sort on small leftmost part.
             */
            if (size < MAX_INSERTION_SORT_SIZE) {
                insertionSort(a, low, high);
                return;
            }

            /*
             * Check if the whole array or large non-leftmost
             * parts are nearly sorted and then merge runs.
             */
            if ((bits == 0 || size > MIN_TRY_MERGE_SIZE && (bits & 1) > 0)
                    && tryMergeRuns(sorter, a, low, size)) {
                return;
            }

            /*
             * Switch to heap sort if execution
             * time is becoming quadratic.
             */
            if ((bits += DELTA) > MAX_RECURSION_DEPTH) {
                heapSort(a, low, high);
                return;
            }
            
            // quickSort
        }
}
```

对于`Object[]`使用的则是`ComparableTimSort`：
```java
    public static void sort(Object[] a) {
        if (LegacyMergeSort.userRequested)
            legacyMergeSort(a);
        else
            ComparableTimSort.sort(a, 0, a.length, null, 0, 0);
    }
```

对于泛型`T[]`使用的则是`TimSort`:
```java
    public static <T> void sort(T[] a, Comparator<? super T> c) {
        if (c == null) {
            sort(a);
        } else {
            if (LegacyMergeSort.userRequested)
                legacyMergeSort(a, c);
            else
                TimSort.sort(a, 0, a.length, c, null, 0, 0);
        }
    }
```
两者的区别就是`TimSort`支持比较器，具体的`TimSort`方法实现使用归并排序以及插入排序。`TimSort`是稳定的排序算法，在最坏的情况下时间复杂度为O(n log n)。

## 排序算法的选择
这里我想多说一句，虽然通常我们使用的时候都是调用类库里的排序算法，工作的重心是实现比较算法。但是掌握各种算法的应用场景也很重要。
例如对于大部分有序的数组选择插入排序通常会更加高效，对于重复性大但是数值跨度小的数组用计数排序。


## 固定实现
```java
// SortAlgorithm.java
public interface SortAlgorithm {
    default void sort(int[] arr) {
        if (arr == null || arr.length < 2) {
            return;
        }
        sort(arr, 0, arr.length);
    }

    void sort(int[] arr, int low, int high);

    default void swap(int[] arr, int i, int j) {
        int temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }

    default boolean isSorted(int[] arr) {
        if (arr == null || arr.length < 2) {
            return true;
        }

        for (int i = 1; i < arr.length; i++) {
            if (arr[i - 1] > arr[i]) {
                return false;
            }
        }
        return true;
    }
}

// Test.java
public class Test {
    public static final int MIN = -500;
    public static final int MAX = 500;
    public static final int COUNT = 20;

    public static void main(String[] args) {
        int[] arr = generateArray();
        // 这里替换排序算法
        SortAlgorithm sortAlgorithm = new InsertSort();
        sortAlgorithm.sort(arr);
        assert sortAlgorithm.isSorted(arr);
    }

    public static int[] generateArray() {
        int[] arr = new int[COUNT];
        Random random = new Random();
        for (int i = 0; i < COUNT; i++) {
            arr[i] = random.nextInt(MAX) + MIN;
        }
        return arr;
    }
}

```