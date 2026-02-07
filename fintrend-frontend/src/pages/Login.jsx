import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
const Login = () => {
  const navigate = useNavigate();
  const handleSuccess = () => {
    navigate('/dashboard');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-xl">📈</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Access AI-powered financial insights and trending news</p>
        </div>
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <AuthForm type="login" onSuccess={handleSuccess} />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Demo: Use any email and password to sign in</p>
          </div>
        </div>
        <div className="text-center">
          <a href="/signup" className="text-blue-600 hover:underline">New to FinTrend? Create new account</a>
        </div>
      </div>
    </div>
  );
};
export default Login;