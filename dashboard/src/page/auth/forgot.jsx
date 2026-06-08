import { useState } from "preact/hooks";
import { Link } from "wouter";
import useForgotPassword from "../../hook/auth/useForgotPassword";
import { Spinner } from "../../component/loader";

const Forgot = () => {
    const { step, isVerifying, isResetting, forgotPassword, resetPassword } = useForgotPassword();

    const [forgotData, setForgotData] = useState({ email: "", otp: "", password: "", confirm: "" });
    const [showPassword, setShowPassword] = useState({ password: false, confirm: false });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForgotData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const toggleVisibility = (event, key) => {
        const input = event.currentTarget.previousElementSibling;
        if (input) {
            input.type = input.type === "password" ? "text" : "password";
            input.focus();
        }

        setShowPassword((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const action = e.nativeEvent.submitter?.name;

        if (action === "forgot") {
            await forgotPassword(forgotData.email, setErrors);
        }
        else if (action === "reset") {
            await resetPassword(forgotData.email, forgotData.otp, forgotData.password, forgotData.confirm, setErrors);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="auth-form"
        >
            <div>
                <h1>Forgot Password</h1>
                <h2>Reset your password with email</h2>
            </div>

            {step === 0 ? (
                <>
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
                                    value={forgotData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={isVerifying}
                        type="submit"
                        name="forgot"
                        className="auth-btn"
                    >
                        {isVerifying && <Spinner />}
                        Verify
                    </button>
                </>
            ) : (
                <>
                    <p className="auth-info">
                        An OTP has been sent to your email address. Please check your inbox and enter it below to reset your password. If you do not see the email in your inbox, please check your spam or junk folder.
                    </p>

                    {errors.submit && (
                        <div className="auth-error" key={errors.ts}>
                            <div />
                            <p dangerouslySetInnerHTML={{ __html: errors.submit }} />
                        </div>
                    )}

                    <div className="auth-input">
                        {errors.otp && <p key={errors.ts}><span>{errors.otp}</span></p>}
                        <div className="auth-input-box">
                            <label htmlFor="otp">Enter OTP</label>
                            <div>
                                <input
                                    type="number"
                                    id="otp"
                                    name="otp"
                                    value={forgotData.otp}
                                    onChange={handleChange}
                                    step={1}
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
                                    type={showPassword.password ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={forgotData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={(event) => toggleVisibility(event, "password")}
                                >
                                    {showPassword.password ? (
                                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" strokeWidth="0" xmlns="http://www.w3.org/2000/svg"><path d="M8.052 5.837A9.715 9.715 0 0 1 12 5c2.955 0 5.309 1.315 7.06 2.864 1.756 1.553 2.866 3.307 3.307 4.08a.11.11 0 0 1 .016.055.122.122 0 0 1-.017.06 16.766 16.766 0 0 1-1.53 2.218.75.75 0 1 0 1.163.946 18.253 18.253 0 0 0 1.67-2.42 1.607 1.607 0 0 0 .001-1.602c-.485-.85-1.69-2.757-3.616-4.46C18.124 5.034 15.432 3.5 12 3.5c-1.695 0-3.215.374-4.552.963a.75.75 0 0 0 .604 1.373Zm11.114 12.15C17.328 19.38 14.933 20.5 12 20.5c-3.432 0-6.125-1.534-8.054-3.24C2.02 15.556.814 13.648.33 12.798a1.606 1.606 0 0 1 .001-1.6A18.283 18.283 0 0 1 3.648 7.01L1.317 5.362a.75.75 0 1 1 .866-1.224l20.5 14.5a.75.75 0 1 1-.866 1.224ZM4.902 7.898c-1.73 1.541-2.828 3.273-3.268 4.044a.112.112 0 0 0-.017.059c0 .015.003.034.016.055.441.774 1.551 2.527 3.307 4.08C6.69 17.685 9.045 19 12 19c2.334 0 4.29-.82 5.874-1.927l-3.516-2.487a3.5 3.5 0 0 1-5.583-3.949L4.902 7.899Z"></path></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" strokeWidth="0" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"></path><path d="M12 3.5c3.432 0 6.124 1.534 8.054 3.241 1.926 1.703 3.132 3.61 3.616 4.46a1.6 1.6 0 0 1 0 1.598c-.484.85-1.69 2.757-3.616 4.461-1.929 1.706-4.622 3.24-8.054 3.24-3.432 0-6.124-1.534-8.054-3.24C2.02 15.558.814 13.65.33 12.8a1.6 1.6 0 0 1 0-1.598c.484-.85 1.69-2.757 3.616-4.462C5.875 5.034 8.568 3.5 12 3.5ZM1.633 11.945a.115.115 0 0 0-.017.055c.001.02.006.039.017.056.441.774 1.551 2.527 3.307 4.08C6.691 17.685 9.045 19 12 19c2.955 0 5.31-1.315 7.06-2.864 1.756-1.553 2.866-3.306 3.307-4.08a.111.111 0 0 0 .017-.056.111.111 0 0 0-.017-.056c-.441-.773-1.551-2.527-3.307-4.08C17.309 6.315 14.955 5 12 5 9.045 5 6.69 6.314 4.94 7.865c-1.756 1.552-2.866 3.306-3.307 4.08Z"></path></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="auth-input">
                        {errors.confirm && <p key={errors.ts}><span>{errors.confirm}</span></p>}
                        <div className="auth-input-box">
                            <label htmlFor="confirm">Confirm Password</label>
                            <div>
                                <input
                                    type={showPassword.confirm ? "text" : "password"}
                                    id="confirm"
                                    name="confirm"
                                    value={forgotData.confirm}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={(event) => toggleVisibility(event, "confirm")}
                                >
                                    {showPassword.confirm ? (
                                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" strokeWidth="0" xmlns="http://www.w3.org/2000/svg"><path d="M8.052 5.837A9.715 9.715 0 0 1 12 5c2.955 0 5.309 1.315 7.06 2.864 1.756 1.553 2.866 3.307 3.307 4.08a.11.11 0 0 1 .016.055.122.122 0 0 1-.017.06 16.766 16.766 0 0 1-1.53 2.218.75.75 0 1 0 1.163.946 18.253 18.253 0 0 0 1.67-2.42 1.607 1.607 0 0 0 .001-1.602c-.485-.85-1.69-2.757-3.616-4.46C18.124 5.034 15.432 3.5 12 3.5c-1.695 0-3.215.374-4.552.963a.75.75 0 0 0 .604 1.373Zm11.114 12.15C17.328 19.38 14.933 20.5 12 20.5c-3.432 0-6.125-1.534-8.054-3.24C2.02 15.556.814 13.648.33 12.798a1.606 1.606 0 0 1 .001-1.6A18.283 18.283 0 0 1 3.648 7.01L1.317 5.362a.75.75 0 1 1 .866-1.224l20.5 14.5a.75.75 0 1 1-.866 1.224ZM4.902 7.898c-1.73 1.541-2.828 3.273-3.268 4.044a.112.112 0 0 0-.017.059c0 .015.003.034.016.055.441.774 1.551 2.527 3.307 4.08C6.69 17.685 9.045 19 12 19c2.334 0 4.29-.82 5.874-1.927l-3.516-2.487a3.5 3.5 0 0 1-5.583-3.949L4.902 7.899Z"></path></svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" stroke="currentColor" fill="currentColor" strokeWidth="0" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"></path><path d="M12 3.5c3.432 0 6.124 1.534 8.054 3.241 1.926 1.703 3.132 3.61 3.616 4.46a1.6 1.6 0 0 1 0 1.598c-.484.85-1.69 2.757-3.616 4.461-1.929 1.706-4.622 3.24-8.054 3.24-3.432 0-6.124-1.534-8.054-3.24C2.02 15.558.814 13.65.33 12.8a1.6 1.6 0 0 1 0-1.598c.484-.85 1.69-2.757 3.616-4.462C5.875 5.034 8.568 3.5 12 3.5ZM1.633 11.945a.115.115 0 0 0-.017.055c.001.02.006.039.017.056.441.774 1.551 2.527 3.307 4.08C6.691 17.685 9.045 19 12 19c2.955 0 5.31-1.315 7.06-2.864 1.756-1.553 2.866-3.306 3.307-4.08a.111.111 0 0 0 .017-.056.111.111 0 0 0-.017-.056c-.441-.773-1.551-2.527-3.307-4.08C17.309 6.315 14.955 5 12 5 9.045 5 6.69 6.314 4.94 7.865c-1.756 1.552-2.866 3.306-3.307 4.08Z"></path></svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={isResetting}
                        type="submit"
                        name="reset"
                        className="auth-btn"
                    >
                        {isResetting && <Spinner />}
                        Reset
                    </button>
                </>
            )}

            <div className="auth-extra">
                <p>Remember password?</p>
                <Link to="/login">Login</Link>
            </div>
        </form>
    )
}

export default Forgot