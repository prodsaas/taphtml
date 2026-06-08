import { useState } from "preact/hooks";
import useDeleteAccount from "../../hook/setting/useDeleteAccount";
import { Spinner } from "../../component/loader";

const Delete = () => {
    const { isDeleteLoading, deleteAccount } = useDeleteAccount();

    const [showDelete, setShowDelete] = useState(false);

    return (
        <>
            <section id="delete">
                <div className="setting-head">
                    <h4>Delete</h4>
                    <p>Delete your account permanently</p>
                </div>
                <div className="setting-card">
                    <p>Deleting your account is permanent. All your data, including settings, chats and related records will be permanently removed from our database.</p>
                    <button
                        onClick={() => setShowDelete(true)}
                        className="setting-btn danger"
                    >
                        Delete Account
                    </button>
                </div>
            </section>

            {showDelete && (
                <div
                    onClick={() => setShowDelete(false)}
                    className="modal"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="modal-content"
                    >
                        <div className="modal-head">
                            <p>Delete Account</p>
                            <button type="button" onClick={() => setShowDelete(false)} />
                        </div>
                        <form
                            onSubmit={(e) => deleteAccount(e)}
                            className="modal-body"
                        >
                            <p>Are you sure you want to delete your account? This will immediately and permanently delete all your data.</p>
                            <div className="modal-btns">
                                <button
                                    type="button"
                                    onClick={() => setShowDelete(false)}
                                    className="modal-btn tertiary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isDeleteLoading}
                                    className="modal-btn secondary"
                                >
                                    {isDeleteLoading ? <Spinner /> : "Delete"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

export default Delete