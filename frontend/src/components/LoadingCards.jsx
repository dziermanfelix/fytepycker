const LoadingCards = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className='relative w-full overflow-hidden rounded-xl border border-stone-200/80 bg-white p-5 pl-6 animate-pulse'
        >
          <div className='absolute inset-y-0 left-0 w-1 bg-stone-200' />
          <div className='mb-4 flex items-center gap-2'>
            <div className='h-5 w-20 rounded-md bg-stone-200' />
            <div className='h-3 w-16 rounded bg-stone-100' />
          </div>
          <div className='flex items-center gap-4'>
            <div className='h-6 flex-1 rounded bg-stone-200' />
            <div className='h-9 w-9 shrink-0 rounded-full bg-stone-300' />
            <div className='h-6 flex-1 rounded bg-stone-200' />
          </div>
          <div className='mt-4 flex justify-between border-t border-stone-100 pt-3 sm:hidden'>
            <div className='h-8 w-16 rounded bg-stone-200' />
            <div className='h-4 w-20 rounded bg-stone-100' />
          </div>
        </div>
      ))}
    </>
  );
};

export default LoadingCards;
