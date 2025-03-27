const FightTabControls = ({ selectItem, fights, activeFightTab, setActiveFightTab }) => {
  return (
    <div className='flex border-b mb-6'>
      <button
        className={`px-4 py-2 mr-2 cursor-pointer ${
          activeFightTab === 'all' ? 'border-b-2 border-blue-500 font-semibold' : ''
        }`}
        onClick={() => setActiveFightTab('all')}
      >
        All ({fights?.main?.length + (fights?.prelim?.length || 0) + (fights?.early?.length || 0)})
      </button>
      {fights?.main && (
        <button
          className={`px-4 py-2 cursor-pointer ${
            activeFightTab === 'main' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('main')}
        >
          Main ({fights.main.length})
        </button>
      )}
      {fights?.prelim && (
        <button
          className={`px-4 py-2 cursor-pointer ${
            activeFightTab === 'prelim' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('prelim')}
        >
          Prelim ({fights.prelim.length})
        </button>
      )}
      {fights?.early && (
        <button
          className={`px-4 py-2 cursor-pointer ${
            activeFightTab === 'early' ? 'border-b-2 border-blue-500 font-semibold' : ''
          }`}
          onClick={() => setActiveFightTab('early')}
        >
          Early ({fights.early.length})
        </button>
      )}
      <button
        className={`px-4 py-2 cursor-pointer bg-red-500 text-white rounded hover:bg-red-600`}
        onClick={() => {
          selectItem(null);
          setActiveFightTab('all');
        }}
      >
        Close
      </button>
    </div>
  );
};

export default FightTabControls;
