import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthContext from "../context/userContext";
import { HiOutlineMail } from "react-icons/hi";
import { FiUser } from "react-icons/fi";
import { MdLockOutline } from "react-icons/md";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import Loader from "../components/Loader";
import axios from "axios";


const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pswdPreview, setPswdPreview] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useAuthContext();

  const handleFormData = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));

    if (error) {
      setError("");
    }
  };

 const handleSignup = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");

  try {
    const response = await axios.post('http://localhost:5000/api/v1/auth/signup', formData);

    // ✅ Store token
    localStorage.setItem('token', response.data.token);

    setUser(response.data.user);
    navigate('/');
  } catch (error: any) {
    alert(error.response?.data?.error || 'Signup failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-lg sm:max-w-lg">
        {" "}
        {/* Set max width here */}
        <div className="text-center sm:text-left">
          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 font-liter text-center sm:text-left">
            Get Started Now
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 text-center sm:text-left">
            Enter your credentials to create your account
          </p>

          {/* Error message */}
          {error && (
            <p className="text-sm sm:text-base text-red-500 mb-4">{error}</p>
          )}

          {/* Signup Form */}
          <form className="w-full" onSubmit={handleSignup}>
            {/* Name Field */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm sm:text-base text-gray-600 mb-1 text-left">
                Name
              </label>
              <div className="flex gap-1.5 items-center focus-within:border-[#4153ee] border-2 border-gray-600/50 rounded-2xl p-2 sm:p-3">
                <FiUser size={18} className="sm:size-5 text-gray-600/50" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleFormData}
                  className="w-full bg-transparent outline-none text-sm sm:text-base"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-sm sm:text-base text-gray-600 mb-1 text-left">
                Email address
              </label>
              <div className="flex gap-1.5 items-center focus-within:border-[#4153ee] border-2 border-gray-600/50 rounded-2xl p-2 sm:p-3">
                <HiOutlineMail
                  size={18}
                  className="sm:size-5 text-gray-600/50"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormData}
                  className="w-full bg-transparent outline-none text-sm sm:text-base"
                  placeholder="Your Email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-2 sm:mb-3 relative">
              <label className="block text-sm sm:text-base text-gray-600 mb-1 text-left">
                Password
              </label>
              <div className="flex gap-1.5 items-center focus-within:border-[#4153ee] border-2 border-gray-600/50 rounded-2xl p-2 sm:p-3">
                <MdLockOutline
                  size={18}
                  className="sm:size-5 text-gray-600/50"
                />
                <input
                  type={pswdPreview ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleFormData}
                  className="w-full bg-transparent outline-none text-sm sm:text-base"
                  placeholder="Your Password"
                />
                <div onClick={() => setPswdPreview(!pswdPreview)}>
                  {pswdPreview ? (
                    <LuEyeClosed
                      size={18}
                      className="sm:size-5 text-gray-600/50 cursor-pointer"
                    />
                  ) : (
                    <LuEye
                      size={18}
                      className="sm:size-5 text-gray-600/50 cursor-pointer"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="mb-4 flex items-center justify-center sm:justify-start">
              <input
                type="checkbox"
                id="terms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleFormData}
                className="mr-2"
              />
              <label
                htmlFor="terms"
                className="text-sm sm:text-base text-gray-600"
              >
                I agree to the{" "}
                <span className="text-[#4153ee]">Terms & Privacy</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#4153ee] text-white p-2 sm:p-3 rounded-2xl my-4 sm:my-5 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? <Loader /> : "Sign Up"}
            </button>
          </form>

          {/* Login Redirect */}
          <p className="text-sm sm:text-base text-gray-500 mt-4 text-center sm:text-left">
            Have an account?{" "}
            <Link to="/login" className="text-[#4153ee]">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
