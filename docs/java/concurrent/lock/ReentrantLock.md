# ReentrantLock
`ReentrantLock`是可重入的锁，可重入的意思是当前线程获取到了锁，在拥有该资源的锁的期间再次获取锁不会被阻塞。`synchronized`隐式支持可重入。
`ReentrantLock`支持公平锁和非公平锁，这个公平指的是先访问锁的线程释放能优先获得资源的锁。