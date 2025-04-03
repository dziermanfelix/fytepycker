import { useLifetime, LifetimeProvider } from '@/contexts/LifetimeContext';

const LifetimeContent = () => {
  const { isLoading, isError } = useLifetime();

  if (isLoading) return <p className='text-center text-gray-500'>Loading events...</p>;
  if (isError) return <p className='text-center text-red-500'>Failed to load events.</p>;

  return <div>lifetime</div>;
};

const Lifetime = () => (
  <LifetimeProvider>
    <LifetimeContent />
  </LifetimeProvider>
);

export default Lifetime;
