import { useNavigate } from 'react-router-dom';

const FightTabControls = ({ selectItem, fights, activeFightTab, setActiveFightTab, basePath }) => {
  const navigate = useNavigate();

  return (
    <div className='flex border-b mb-2'>
      <button
        className={`px-4 py-2 mr-2 cursor-pointer hover:text-yellow-700 ${
          activeFightTab === 'all' ? 'border-b-2 border-blue-500 font-semibold' : ''
        }`}
        onClick={() => setActiveFightTab('all')}
      >
        All ({fights?.main?.length + (fights?.prelim?.length || 0) + (fights?.early?.length || 0)})
      </button>
      {fights?.main && (
        <button
          className={`px-4 py-2 cursor-pointer hover:text-yellow-600 ${
            activeFightTab === 'main' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('main')}
        >
          Main ({fights.main.length})
        </button>
      )}
      {fights?.prelim && (
        <button
          className={`px-4 py-2 cursor-pointer hover:text-yellow-500 ${
            activeFightTab === 'prelim' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('prelim')}
        >
          Prelim ({fights.prelim.length})
        </button>
      )}
      {fights?.early && (
        <button
          className={`px-4 py-2 cursor-pointer hover:text-yellow-400 ${
            activeFightTab === 'early' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('early')}
        >
          Early ({fights.early.length})
        </button>
      )}
      <button
        className={`px-4 py-2 cursor-pointer rounded-sm hover:text-red-500`}
        onClick={() => {
          selectItem(null);
          setActiveFightTab('all');
          navigate(basePath);
        }}
      >
        Close
      </button>
    </div>
  );
};

export default FightTabControls;
