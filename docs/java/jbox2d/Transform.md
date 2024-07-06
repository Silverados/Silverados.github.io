# Transform 
transform包含偏移和旋转两种信息。

## 字段定义
```java
  /** The translation caused by the transform */
  public final Vec2 p;

  /** A matrix representing a rotation */
  public final Rot q;
```

## 构造方法
略

## 方法
### mul(final Transform T, final Vec2 v)
可以得到一个点经过旋转和平移后的点：

这个实现返回一个新的Vec2:
```java
  public final static Vec2 mul(final Transform T, final Vec2 v) {
    return new Vec2((T.q.c * v.x - T.q.s * v.y) + T.p.x, (T.q.s * v.x + T.q.c * v.y) + T.p.y);
  }
```

这个实现将返回值赋值给入参Vec2 out, 这里我很疑惑引入tempy是为什么，直到看到`mulToOutUnsafe`的实现, v和out可能是同一个对象: 
```java
  public final static void mulToOut(final Transform T, final Vec2 v, final Vec2 out) {
    final float tempy = (T.q.s * v.x + T.q.c * v.y) + T.p.y;
    out.x = (T.q.c * v.x - T.q.s * v.y) + T.p.x;
    out.y = tempy;
  }
```

这个实现标记为unsafe，因为断言了v和out不是同一个对象。
```java
  public final static void mulToOutUnsafe(final Transform T, final Vec2 v, final Vec2 out) {
    assert (v != out);
    out.x = (T.q.c * v.x - T.q.s * v.y) + T.p.x;
    out.y = (T.q.s * v.x + T.q.c * v.y) + T.p.y;
  }
```

### mulTrans
可以得到一个经过变化的点在transform前的点。

有3个实现，和上面的同理：
```java
    public final static Vec2 mulTrans(final Transform T, final Vec2 v) {
        final float px = v.x - T.p.x;
        final float py = v.y - T.p.y;
        return new Vec2((T.q.c * px + T.q.s * py), (-T.q.s * px + T.q.c * py));
    }

    public final static void mulTransToOut(final Transform T, final Vec2 v, final Vec2 out) {
        final float px = v.x - T.p.x;
        final float py = v.y - T.p.y;
        final float tempy = (-T.q.s * px + T.q.c * py);
        out.x = (T.q.c * px + T.q.s * py);
        out.y = tempy;
    }

    public final static void mulTransToOutUnsafe(final Transform T, final Vec2 v, final Vec2 out) {
        assert (v != out);
        final float px = v.x - T.p.x;
        final float py = v.y - T.p.y;
        out.x = (T.q.c * px + T.q.s * py);
        out.y = (-T.q.s * px + T.q.c * py);
    }
```

### mul(final Transform A, final Transform B)
组合变换：

```java
  public final static Transform mul(final Transform A, final Transform B) {
    Transform C = new Transform();
    Rot.mulUnsafe(A.q, B.q, C.q);
    Rot.mulToOutUnsafe(A.q, B.p, C.p);
    C.p.addLocal(A.p);
    return C;
  }

  public final static void mulToOut(final Transform A, final Transform B, final Transform out) {
    assert (out != A);
    Rot.mul(A.q, B.q, out.q);
    Rot.mulToOut(A.q, B.p, out.p);
    out.p.addLocal(A.p);
  }

  public final static void mulToOutUnsafe(final Transform A, final Transform B, final Transform out) {
    assert (out != B);
    assert (out != A);
    Rot.mulUnsafe(A.q, B.q, out.q);
    Rot.mulToOutUnsafe(A.q, B.p, out.p);
    out.p.addLocal(A.p);
  }
```

### mulTrans(final Transform A, final Transform B)
逆组合变换

```java
  private static Vec2 pool = new Vec2();

  public final static Transform mulTrans(final Transform A, final Transform B) {
    Transform C = new Transform();
    Rot.mulTransUnsafe(A.q, B.q, C.q);
    pool.set(B.p).subLocal(A.p);
    Rot.mulTransUnsafe(A.q, pool, C.p);
    return C;
  }

  public final static void mulTransToOut(final Transform A, final Transform B, final Transform out) {
    assert (out != A);
    Rot.mulTrans(A.q, B.q, out.q);
    pool.set(B.p).subLocal(A.p);
    Rot.mulTrans(A.q, pool, out.p);
  }

  public final static void mulTransToOutUnsafe(final Transform A, final Transform B,
      final Transform out) {
    assert (out != A);
    assert (out != B);
    Rot.mulTransUnsafe(A.q, B.q, out.q);
    pool.set(B.p).subLocal(A.p);
    Rot.mulTransUnsafe(A.q, pool, out.p);
  }
```