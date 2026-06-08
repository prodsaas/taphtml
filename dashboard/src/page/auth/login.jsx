import { useState } from "preact/hooks";
import { Link } from "wouter";
import usePasskeyLogin from "../../hook/auth/usePasskeyLogin";
import useLoginAdmin from "../../hook/auth/useLoginAdmin";
import GoogleBtn from "./google";
import { Spinner } from "../../component/loader";

const Login = () => {
    const { isPasskeyLoading, passkeyLogin } = usePasskeyLogin();
    const { isLoginLoading, loginAdmin } = useLoginAdmin();

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLoginData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const toggleVisibility = (event) => {
        const input = event.currentTarget.previousElementSibling;
        if (input) {
            input.type = input.type === "password" ? "text" : "password";
            input.focus();
        }

        setShowPassword((prev) => !prev);
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        await loginAdmin(loginData.email, loginData.password, setErrors);
    };

    return (
        <form
            onSubmit={handleLogin}
            className="auth-form"
        >
            <div>
                <h1>Welcome back</h1>
                <h2>Login with your account</h2>
            </div>

            <GoogleBtn content="Login" />

            <button
                disabled={isPasskeyLoading}
                type="button"
                onClick={passkeyLogin}
                className="auth-btn other"
            >
                {isPasskeyLoading ? <Spinner /> : <svg viewBox="0 0 153 78.03" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M153 28.376h-41.727v21.28H153z" fill="#188038" /><path d="M38.25 78.03C17.213 78.03 0 60.473 0 39.016S17.213 0 38.25 0 76.5 17.558 76.5 39.016 59.287 78.03 38.25 78.03m0-56.75c-9.563.002-17.386 7.981-17.386 17.736 0 9.754 7.823 17.734 17.386 17.734s17.386-7.98 17.386-17.734S47.813 21.28 38.25 21.28" fill="#4285f4" /><path d="M139.09 49.657h-27.817v21.28h13.909v-7.094c0-3.901 3.129-7.093 6.954-7.093 3.826 0 6.955 3.192 6.955 7.093v7.094H153V49.655h-13.91z" fill="#34a853" /><path d="M75.11 28.376H52.16c2.085 3.014 3.476 6.56 3.476 10.64 0 4.079-1.39 7.625-3.477 10.64h22.95c.87-3.37 1.391-6.916 1.391-10.64s-.522-7.271-1.39-10.641z" fill="#ea4335" /><path d="M111.273 28.376H75.109c.87 3.369 1.391 6.915 1.391 10.64 0 3.724-.522 7.27-1.39 10.64h36.163V28.374Z" fill="#fbbc04" /></svg>}
                Login with Passkey
            </button>

            <div className="auth-or">
                <div />
                <p>or</p>
                <div />
            </div>

            {errors.submit && (
                <div className="auth-error" key={errors.ts}>
                    <div />
                    <p dangerouslySetInnerHTML={{ __html: errors.submit }} />
                </div>
            )}

            <div className="auth-input">
                {errors.email && <p key={errors.ts}><span>{errors.email}</span></p>}
                <div className="auth-input-box">
                    <label htmlFor="email">Email</label>
                    <div>
                        <input
                            type="email"
                            autoComplete="email"
                            id="email"
                            name="email"
                            value={loginData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="auth-input">
                {errors.password && <p key={errors.ts}><span>{errors.password}</span></p>}
                <div className="auth-input-box">
                    <label htmlFor="password">Password</label>
                    <div>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={loginData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            onClick={toggleVisibility}
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" strokeWidth="0" xmlns="http://www.w3.org/2000/svg"><path d="M8.052 5.837A9.715 9.715 0 0 1 12 5c2.955 0 5.309 1.315 7.06 2.864 1.756 1.553 2.866 3.307 3.307 4.08a.11.11 0 0 1 .016.055.122.122 0 0 1-.017.06 16.766 16.766 0 0 1-1.53 2.218.75.75 0 1 0 1.163.946 18.253 18.253 0 0 0 1.67-2.42 1.607 1.607 0 0 0 .001-1.602c-.485-.85-1.69-2.757-3.616-4.46C18.124 5.034 15.432 3.5 12 3.5c-1.695 0-3.215.374-4.552.963a.75.75 0 0 0 .604 1.373Zm11.114 12.15C17.328 19.38 14.933 20.5 12 20.5c-3.432 0-6.125-1.534-8.054-3.24C2.02 15.556.814 13.648.33 12.798a1.606 1.606 0 0 1 .001-1.6A18.283 18.283 0 0 1 3.648 7.01L1.317 5.362a.75.75 0 1 1 .866-1.224l20.5 14.5a.75.75 0 1 1-.866 1.224ZM4.902 7.898c-1.73 1.541-2.828 3.273-3.268 4.044a.112.112 0 0 0-.017.059c0 .015.003.034.016.055.441.774 1.551 2.527 3.307 4.08C6.69 17.685 9.045 19 12 19c2.334 0 4.29-.82 5.874-1.927l-3.516-2.487a3.5 3.5 0 0 1-5.583-3.949L4.902 7.899Z"></path></svg>
                            ) : (
                                <svg viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" strokeWidth="0" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"></path><path d="M12 3.5c3.432 0 6.124 1.534 8.054 3.241 1.926 1.703 3.132 3.61 3.616 4.46a1.6 1.6 0 0 1 0 1.598c-.484.85-1.69 2.757-3.616 4.461-1.929 1.706-4.622 3.24-8.054 3.24-3.432 0-6.124-1.534-8.054-3.24C2.02 15.558.814 13.65.33 12.8a1.6 1.6 0 0 1 0-1.598c.484-.85 1.69-2.757 3.616-4.462C5.875 5.034 8.568 3.5 12 3.5ZM1.633 11.945a.115.115 0 0 0-.017.055c.001.02.006.039.017.056.441.774 1.551 2.527 3.307 4.08C6.691 17.685 9.045 19 12 19c2.955 0 5.31-1.315 7.06-2.864 1.756-1.553 2.866-3.306 3.307-4.08a.111.111 0 0 0 .017-.056.111.111 0 0 0-.017-.056c-.441-.773-1.551-2.527-3.307-4.08C17.309 6.315 14.955 5 12 5 9.045 5 6.69 6.314 4.94 7.865c-1.756 1.552-2.866 3.306-3.307 4.08Z"></path></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <button
                disabled={isLoginLoading}
                type="submit"
                className="auth-btn"
            >
                {isLoginLoading && <Spinner />}
                Login
            </button>

            <div className="auth-extras">
                <div className="auth-extra">
                    <p>Forgot password?</p>
                    <Link to="/forgot">Reset Password</Link>
                </div>

                <div className="auth-extra">
                    <p>New here?</p>
                    <Link to="/signup">Create Account</Link>
                </div>
            </div>
        </form>
    )
}

export default Login