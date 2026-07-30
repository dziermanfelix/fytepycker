const Spinner = () => (
  <div className='flex min-h-[50vh] w-full items-center justify-center' role='status' aria-label='Loading'>
    <div className='h-9 w-9 animate-spin rounded-full border-[3px] border-stone-300 border-t-yellow-900' />
  </div>
);

export default Spinner;
