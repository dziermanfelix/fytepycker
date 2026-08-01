const sizeClasses = {
  page: 'h-9 w-9 border-[3px]',
  sm: 'h-4 w-4 border-2',
};

const Spinner = ({ size = 'page', className = '' }) => {
  const ring = (
    <div
      className={`animate-spin rounded-full ${sizeClasses[size]} ${
        className || 'border-stone-300 border-t-yellow-900'
      }`}
      role='status'
      aria-label='Loading'
    />
  );

  if (size === 'page') {
    return <div className='flex min-h-[50vh] w-full items-center justify-center'>{ring}</div>;
  }

  return ring;
};

export default Spinner;
