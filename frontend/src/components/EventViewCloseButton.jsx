import { useNavigate } from 'react-router-dom';
import { IoMdClose } from 'react-icons/io';

const EventViewCloseButton = ({ selectItem, basePath }) => {
  const navigate = useNavigate();

  return (
    <div className='flex justify-end mb-2'>
      <button
        className='px-4 py-2 rounded-sm hover:text-red-500'
        onClick={() => {
          navigate(basePath);
          if (selectItem) selectItem(null);
        }}
      >
        <IoMdClose />
      </button>
    </div>
  );
};

export default EventViewCloseButton;
