const LoadingEvent = () => {
  return (
    <div className='grid gap-2'>
      <div className='p-4 shadow-lg rounded-lg border border-gray-200 animate-pulse'>
        <div className='flex justify-between items-center'>
          <div className='flex flex-col justify-center space-y-2 flex-1'>
            <div className='h-5 bg-gray-200 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
          <div className='h-10 w-24 bg-gray-300 rounded-lg'></div>
        </div>
      </div>
    </div>
  );
};
export default LoadingEvent;
