export const FRONTEND_URLS = {
  HOME: `/`,
  REGISTER: `/register`,
  LOGIN: `/login`,
  DASH: `/dash`,
};

export const API_URLS = {
  REFRESH_TOKEN: 'auth/token/refresh/',
  REGISTER: '/auth/register/',
  LOGIN: '/auth/login/',
  LOGOUT: '/auth/logout/',
  USER: '/auth/user/',
  EVENTS: '/ufc/events/',
  MATCHUPS: '/matchups/',
  MATCHUP_DETAILS: (id) => `/dash/matchups/${id}`,
  SELECTIONS: '/matchups/selections/',
  USERS: '/auth/users/',
  RECORD: '/matchups/record/',
  RECORD_DETAILS: (id) => `/dash/record/matchups/${id}`,
  VERSION: '/version',
};
