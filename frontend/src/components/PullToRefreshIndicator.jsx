import Spinner from '@/components/Spinner';

const PullToRefreshIndicator = ({ pullDistance, isRefreshing, isPulling, threshold }) => {
  const height = isRefreshing ? threshold : pullDistance;
  const progress = threshold ? Math.min(height / threshold, 1) : 0;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${
        isPulling ? '' : 'transition-[height] duration-200 ease-out'
      }`}
      style={{ height }}
      aria-hidden={height <= 0}
    >
      <div style={{ opacity: isRefreshing ? 1 : progress }}>
        <Spinner size='sm' />
      </div>
    </div>
  );
};

export default PullToRefreshIndicator;
