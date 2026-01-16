const LoadingCards = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='p-5 rounded-2xl shadow-sm border border-gray-100 bg-white animate-pulse'>
          {/* Header */}
          <div className='flex justify-between items-center mb-3'>
            <div className='flex-1'>
              <div className='h-3 bg-gray-200 rounded w-20 mb-2'></div>
              <div className='h-5 bg-gray-300 rounded w-24'></div>
            </div>
            <div className='w-3 h-3 bg-gray-200 rounded-full'></div>
          </div>

          {/* Info grid */}
          <div className='grid grid-cols-2 gap-3 text-sm'>
            <div>
              <div className='h-3 bg-gray-200 rounded w-16 mb-2'></div>
              <div className='h-4 bg-gray-300 rounded w-12'></div>
            </div>
            <div>
              <div className='h-3 bg-gray-200 rounded w-20 mb-2'></div>
              <div className='h-4 bg-gray-300 rounded w-16'></div>
            </div>
          </div>

          {/* Footer */}
          <div className='mt-4 flex justify-between'>
            <div className='h-3 bg-gray-200 rounded w-24'></div>
            <div className='h-3 bg-gray-200 rounded w-16'></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default LoadingCards;
