import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi2';

const EventViewCloseButton = ({ selectItem, basePath, label = 'Back', variant = 'light', className = '' }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(basePath);
    if (selectItem) selectItem(null);
  };

  const styles =
    variant === 'dark'
      ? 'text-stone-300 hover:bg-white/10 hover:text-white'
      : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900';

  return (
    <button
      type='button'
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${styles} ${className}`}
    >
      <HiOutlineArrowLeft className='h-4 w-4 shrink-0' />
      <span>{label}</span>
    </button>
  );
};

export default EventViewCloseButton;
