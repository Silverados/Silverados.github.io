# 选择排序
## 算法实现思路
选取最小值放到第一位，选取剩下的值的最小值放到第二位...以此类推。

## 算法复杂度
改变的时间复杂度为O(N), 比较的时间复杂度为O(N^2/2)

## 算法实现
```java
public class SelectSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        for (int i = low; i < high; i++) {
            for(int j = i + 1, min = arr[i]; j < high; j++) {
                if(min > arr[j]) {
                    min = arr[j];
                    swap(arr, i, j);
                }
            }
        }
    }
}
```

继续优化，减少交换次数：
```java
public class SelectSort implements SortAlgorithm {
    @Override
    public void sort(int[] arr, int low, int high) {
        for (int i = low; i < high; i++) {
            int minIndex = i;
            for(int j = i + 1; j < high; j++) {
                minIndex = arr[minIndex] > arr[j] ? j : minIndex;
            }
            swap(arr, i, minIndex);
        }
    }
}
```