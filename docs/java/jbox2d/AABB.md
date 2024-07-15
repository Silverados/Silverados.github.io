# AABB

- `void set(final AABB aabb)`：从给定的AABB对象设置当前对象的边界。
- `boolean isValid()`：验证当前AABB的边界是否排序正确。
- `Vec2 getCenter()`：获取当前AABB的中心点。
- `void getCenterToOut(final Vec2 out)`：计算当前AABB的中心点并输出到指定的向量。
- `Vec2 getExtents()`：获取当前AABB的宽度和高度的一半。
- `void getExtentsToOut(final Vec2 out)`：计算当前AABB的宽度和高度的一半并输出到指定的向量。
- `void getVertices(Vec2[] vertices)`：获取当前AABB的顶点坐标。
- `void combine(final AABB aabb1, final AABB aabb2)`：将两个AABB合并为当前AABB。
- `float getPerimeter()`：计算并返回当前AABB的周长。
- `void combine(final AABB aabb)`：将当前AABB与另一个AABB合并。
- `boolean contains(final AABB aabb)`：检查当前AABB是否包含另一个AABB。
- `boolean raycast(final RayCastOutput output, final RayCastInput input)`：对AABB进行射线检测，并将结果存储在`output`中。
- `boolean raycast(final RayCastOutput output, final RayCastInput input, IWorldPool pool)`：使用池对象进行射线检测，性能更好。
- `static boolean testOverlap(final AABB a, final AABB b)`：检查两个AABB是否重叠。