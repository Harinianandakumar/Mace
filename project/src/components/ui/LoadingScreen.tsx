import { Loader } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
    </div>
  );
};

export default LoadingScreen;