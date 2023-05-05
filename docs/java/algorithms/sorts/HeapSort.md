# 堆排序
## 算法实现
初版：
```java
public class HeapSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        for (int i = low; i < high; i++) {
            heapInsert(arr, low, i);
        }

        int size = high - low;
        swap(arr, low, --size);

        while (size > 0) {
            heapify(arr, low, size);
            swap(arr, 0, --size);
        }
    }

    private void heapify(int[] arr, int i, int size) {
        int left = 2 * i + 1;
        while (left < size) {
            int largest = left + 1 < size && arr[left + 1] > arr[left] ? left + 1 : left;
            largest = arr[largest] > arr[i] ? largest : i;
            if (largest == i) {
                return;
            }

            swap(arr, largest, i);
            i = largest;
            left = 2 * i + 1;
        }
    }

    private void heapInsert(int[] arr, int low, int i) {
        while ((i - 1) / 2 >= low && arr[i] > arr[(i - 1) / 2]) {
            swap(arr, i, (i - 1) / 2);
            i = (i - 1) / 2;
        }
    }
}
```



`DualPivotQuickSort`中的对排序实现：
```java
    private static void heapSort(int[] a, int low, int high) {
        for (int k = (low + high) >>> 1; k > low; ) {
            pushDown(a, --k, a[k], low, high);
        }
        while (--high > low) {
            int max = a[low];
            pushDown(a, low, a[high], low, high);
            a[high] = max;
        }
    }

    private static void pushDown(int[] a, int p, int value, int low, int high) {
        for (int k ;; a[p] = a[p = k]) {
            k = (p << 1) - low + 2; // Index of the right child

            if (k > high) {
                break;
            }
            if (k == high || a[k] < a[k - 1]) {
                --k;
            }
            if (a[k] <= value) {
                break;
            }
        }
        a[p] = value;
    }
```