const SigninLayout = ({ children }) => {
  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-100">
      {/* Left Side - Form */}
      <div className="w-full sm:w-1/2 flex items-center justify-center py-8 sm:py-0">
        <div className="w-full max-w-md px-6 sm:px-8">{children}</div>
      </div>
      {/* Right Side - Illustration */}
      <div className="hidden sm:flex w-full sm:w-1/2 bg-blue-500 text-white flex-col justify-between items-center p-8 relative rounded-2xl m-3 mt-0 sm:mt-3">
        <div className="flex flex-col items-center justify-center flex-grow">
          <h1 className="text-2xl sm:text-3xl font-bold mb-8 font-liter text-center">
            Track, manage, and grow your finances <br /> effortlessly
          </h1>
          <div className="flex items-center justify-center w-full">
            <img
              src="/Expense Dashboard.svg"
              alt=""
              className="w-[70%] rounded-lg"
            />
          </div>
        </div>

        <div className="w-full flex justify-center py-4">
          <span className="text-white text-sm">2025 © All right Reserved</span>
        </div>
      </div>
    </div>
  );
};

export default SigninLayout;
