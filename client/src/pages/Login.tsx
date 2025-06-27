import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthContext from "../context/userContext";
import { HiOutlineMail } from "react-icons/hi";
import { MdLockOutline } from "react-icons/md";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import axios from "../utils/axios";
import Loader from "../components/Loader";
axios.defaults.withCredentials = true;

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { setUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetPassword, setResetPassword] = useState(false);
  const [pswdPreview, setPswdPreview] = useState(false);

  const handleFormData = (e) => {
    if (error) {
      setError(null);
    }
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const fetch = async () => {
      const token = await window.electron.ipcRenderer.invoke("get-token");
      if (token) {
        const res = await axios.get("http://localhost:5000/api/v1/auth/me", {
          headers: {
            Authorization: token,
          },
        });
        console.log(res);
        

        setUser(res.data.user);
      }
    }

    fetch()
  }, [])


  const handleLogin = async (e) => {

    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { email, password } = formData;

      if (!email || !password) {
        setError("Please enter your details");
        setLoading(false);
        return;
      }

      const res = await axios.post("http://localhost:5000/api/v1/auth/login", formData);
      const userData = res.data.user;
      const token = res.data.token;
      console.log(res);
      

      // ✅ Save auth data to Electron Store
      if (window?.electron?.ipcRenderer) {
        window.electron.ipcRenderer.send("set-token", token);
        window.electron.ipcRenderer.send("set-user-id", userData._id);
      }

      // ✅ Save user to context
      setUser(userData);

      navigate("/selectfolders");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div className="w-full max-w-md sm:max-w-lg">
        {!resetPassword ? (
          <div className="w-full text-left">
            {/* Headings */}
            <h1 className="text-3xl font-bold mb-2 font-liter text-center sm:text-left">
              Welcome Back
            </h1>
            <p className="text-gray-500 mb-6 text-center sm:text-left">
              Enter your credentials to access your account
            </p>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form className="w-full" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="mb-4">
                <label className="block text-sm sm:text-base text-gray-600 mb-1 text-left">
                  Email address
                </label>
                <div className="flex gap-1.5 items-center focus-within:border-[#4153ee] border-2 border-gray-600/50 rounded-2xl p-2">
                  <HiOutlineMail size={20} className="text-gray-600/50" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormData}
                    className="w-full bg-transparent outline-none"
                    placeholder="your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-2 relative">
                <label className="block text-sm sm:text-base text-gray-600 mb-1 text-left">
                  Password
                </label>
                <div className="flex gap-1.5 items-center focus-within:border-[#4153ee] border-2 border-gray-600/50 rounded-2xl p-2">
                  <MdLockOutline size={20} className="text-gray-600/50" />
                  <input
                    type={pswdPreview ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleFormData}
                    className="w-full bg-transparent outline-none"
                    placeholder="your password"
                  />
                  <div onClick={() => setPswdPreview(!pswdPreview)}>
                    {pswdPreview ? (
                      <LuEyeClosed
                        size={20}
                        className="text-gray-600/50 cursor-pointer"
                      />
                    ) : (
                      <LuEye
                        size={20}
                        className="text-gray-600/50 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Forget Password */}
              <div className="flex items-center justify-end">
                <Link
                  to="/accounts/password/reset"
                  className="text-sm sm:text-[15px] text-right mr-2 cursor-pointer text-[#4153ee]"
                >
                  Forget Password
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-[#4153ee] text-white p-2 sm:p-3 rounded-2xl my-4 sm:my-5 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? <Loader /> : "Log in"}
              </button>
            </form>

            {/* Signup Redirect */}
            <p className="text-sm sm:text-base text-gray-500 mt-4 text-center sm:text-left">
              Create an account?{" "}
              <Link to="/signup" className="text-[#4153ee]">
                Sign up
              </Link>
            </p>
          </div>
        ) : (
          <div className="w-full text-left">
            <p className="text-xl sm:text-2xl font-semibold text-gray-700 mb-4 sm:mb-6 text-center sm:text-left">
              Reset Your Password Here
            </p>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form className="w-full" onSubmit={handlePassReset}>
              {/* Email Field */}
              <div className="mb-3">
                <label className="block text-sm sm:text-base text-gray-600 mb-1 text-left">
                  Email address
                </label>
                <div className="flex gap-1.5 items-center focus-within:border-[#4153ee] border-2 border-gray-600/50 rounded-2xl p-2">
                  <HiOutlineMail size={20} className="text-gray-600/50" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormData}
                    required
                    className="w-full bg-transparent outline-none"
                    placeholder="Your Email"
                  />
                </div>
              </div>

              {/* Back to Login */}
              <p
                className="text-sm sm:text-[15px] text-[#4153ee] text-right mr-2 cursor-pointer"
                onClick={() => setResetPassword(false)}
              >
                back to login
              </p>

              {/* Reset Password Button */}
              <button
                type="submit"
                className="w-full bg-[#4153ee] text-white p-2 rounded-2xl my-5"
                disabled={loading}
              >
                {loading ? "Processing..." : "Reset Password"}
              </button>
            </form>

            <p className="text-sm sm:text-base text-gray-500 mt-4 text-center sm:text-left">
              Create an account?{" "}
              <Link to="/signup" className="text-[#4153ee]">
                Sign up
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
