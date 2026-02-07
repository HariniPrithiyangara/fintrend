import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
const Signup = () => {
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Join FinTrend for AI-powered financial insights</p>
        </div>
        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <AuthForm type="signup" onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};
export default Signup;