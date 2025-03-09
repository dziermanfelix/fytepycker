const Fighter = ({ img, name, url }) => (
  <div className='flex-row items-center text-center justify-between'>
    <img src={img} alt={name} className='w-50 h-50 object-contain mb-2' />
    <a href={url} target='_blank' rel='noopener noreferrer' className='underline font-semibold'>
      {name}
    </a>
  </div>
);

export default Fighter;
