const EventCards = ({ setSelectedEvent, events }) => (
  <div className='grid gap-4'>
    {events.length > 0 ? (
      events.map((event) => (
        <div
          key={event.id}
          className='p-4 bg-white shadow-lg rounded-lg border border-gray-200 cursor-pointer'
          onClick={() => setSelectedEvent(event)}
        >
          {event.url && (
            <a href={event.url} target='_blank' rel='noopener noreferrer' className='underline'>
              {event.name}
            </a>
          )}
          <p className='text-gray-600'>{new Date(event.date).toLocaleString()}</p>
          <p className='text-gray-700'>{event.location}</p>
        </div>
      ))
    ) : (
      <p className='text-center text-gray-500'>No events available.</p>
    )}
  </div>
);

export default EventCards;
