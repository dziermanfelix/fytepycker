import { IoMdClose } from 'react-icons/io';

const LifetimeTabControls = ({ setSelectedUser }) => {
  return (
    <div className='flex border-b mb-2'>
      <button
        className={`px-4 py-2 cursor-pointer rounded-sm hover:text-red-500`}
        onClick={() => {
          sessionStorage.removeItem('selectedUser');
          setSelectedUser(null);
        }}
      >
        <IoMdClose />
      </button>
    </div>
  );
};

export default LifetimeTabControls;
