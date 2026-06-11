import { useState } from "preact/hooks";
import { Link } from "wouter";
import usePasskeySignup from "../../hook/auth/usePasskeySignup";
import { Spinner } from "../../component/loader";

const Passkey = () => {
    const { isPasskeyLoading, passkeySignup } = usePasskeySignup();

    const [passkeyData, setPasskeyData] = useState({ name: "", email: "" });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasskeyData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handlePasskey = async (e) => {
        e.preventDefault();

        await passkeySignup(passkeyData.name, passkeyData.email);
    }

    return (
        <form
            onSubmit={handlePasskey}
            className="auth-form"
        >
            <div>
                <h1>Register device</h1>
                <h2>Setup your device for passkey</h2>
            </div>

            <div className="auth-input">
                <div className="auth-input-box">
                    <label htmlFor="name">Name</label>
                    <div>
                        <input
                            id="name"
                            name="name"
                            value={passkeyData.name}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="auth-input">
                <div className="auth-input-box">
                    <label htmlFor="email">Email</label>
                    <div>
                        <input
                            type="email"
                            autoComplete="email"
                            id="email"
                            name="email"
                            value={passkeyData.email}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="auth-extra">
                <p>By clicking "Signup", you agree to our</p>
                <a
                    href="https://taphtml.com/policy/terms.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Terms of Service
                </a>
                <p>and our</p>
                <a
                    href="https://taphtml.com/policy/privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Privacy Policy
                </a>
            </div>

            <button
                disabled={isPasskeyLoading}
                type="submit"
                name="signup"
                className="auth-btn"
            >
                {isPasskeyLoading && <Spinner />}
                Signup
            </button>

            <div className="auth-extra">
                <p>Have account?</p>
                <Link to="/login">Login</Link>
            </div>
        </form>
    )
}

export default Passkey