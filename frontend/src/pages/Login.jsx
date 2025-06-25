import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FRONTEND_URLS } from '@/common/urls';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(formData);
      navigate(FRONTEND_URLS.DASH);
    } catch (err) {
      localStorage.removeItem('token');
      setError(err.response?.data?.non_field_errors?.[0] || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-6'>Login</h2>

      {error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className='mb-4'>
          <label className='block text-gray-700 mb-2' htmlFor='username'>
            Username
          </label>
          <input
            id='username'
            type='text'
            name='username'
            value={formData.username}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md lowercase'
            required
            autoCapitalize='off'
            spellCheck={false}
            autoComplete='off'
          />
        </div>

        <div className='mb-6'>
          <label className='block text-gray-700 mb-2' htmlFor='password'>
            Password
          </label>
          <input
            id='password'
            type='password'
            name='password'
            value={formData.password}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
        </div>

        <button
          type='submit'
          disabled={isLoading}
          className='w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded'
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className='mt-4 text-center'>
        <p>
          Don't have an account?{' '}
          <a
            href={FRONTEND_URLS.REGISTER}
            className='text-blue-500 hover:text-blue-700'
            onClick={(e) => {
              e.preventDefault();
              navigate(FRONTEND_URLS.REGISTER);
            }}
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
