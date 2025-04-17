import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FRONTEND_URLS } from '@/common/urls';

const Register = () => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      await register(formData);
      navigate(FRONTEND_URLS.DASH);
    } catch (err) {
      localStorage.removeItem('token');
      setError(err.response?.data?.password?.[0] || 'Registration failed.');
      setErrors(err.response?.data || { non_field_errors: ['Registration failed'] });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-6'>Register</h2>

      {error && <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>{error}</div>}

      {errors.non_field_errors && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {errors.non_field_errors.join(', ')}
        </div>
      )}

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
            className='w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
          {errors.username && <p className='text-red-500 text-sm mt-1'>{errors.username.join(', ')}</p>}
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 mb-2' htmlFor='email'>
            Email
          </label>
          <input
            id='email'
            type='email'
            name='email'
            value={formData.email}
            onChange={handleChange}
            className='w-full px-3 py-2 border border-gray-300 rounded-md'
            required
          />
          {errors.email && <p className='text-red-500 text-sm mt-1'>{errors.email.join(', ')}</p>}
        </div>

        <div className='mb-4'>
          <label className='block text-gray-700 mb-2' htmlFor='password1'>
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
          {errors.password && <p className='text-red-500 text-sm mt-1'>{errors.password.join(', ')}</p>}
        </div>

        <div className='mb-6'>
          <label className='block text-gray-700 mb-2' htmlFor='password2'>
            Confirm Password
          </label>
          <input
            id='password2'
            type='password'
            name='password2'
            value={formData.password2}
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
          {isLoading ? 'Creating Account...' : 'Register'}
        </button>
      </form>

      <div className='mt-4 text-center'>
        <p>
          Already have an account?{' '}
          <a
            href={FRONTEND_URLS.LOGIN}
            className='text-blue-500 hover:text-blue-700'
            onClick={(e) => {
              e.preventDefault();
              navigate(FRONTEND_URLS.LOGIN);
            }}
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
