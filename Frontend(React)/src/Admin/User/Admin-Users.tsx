import React, { Component, ChangeEvent } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../Services/axiosInstance";
import AuthService from "../../Services/AuthService";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import CommonConfirmDialog from "./CommonConfirmDialoge";
import UserFormDialog, { UserFormData } from "./Add-User";
import { Switch, Tooltip } from "@mui/material";
import { closeLoading, showLoading } from "../../General/Loader";
import { PencilIcon, TrashIcon } from "lucide-react";

interface User {
    id: number;
    first_name: any;
    last_name: string;
    username: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    address: string;
    status: string;
}

interface UsersState {
    users: User[];
    totalUsers: number;
    page: number;
    rowsPerPage: number;
    open: boolean;
    editingUser: User | null;
    originalUser: Partial<User> | null;
    formData: Partial<User> & {
        confirmPassword?: string;
        username?: string;
        showPassword?: boolean;
        showConfirmPassword?: boolean;
        errors?: Record<string, string>;
    };
    searchQuery: string;
    selectedFilters: string[];
    filterOptions: string[];
    deleteDialogOpen: boolean;
    userToDelete: User | null;
    logoutCountdown: number;
    isDeletingSelf: any;
    statusDialogOpen: boolean;
    loading: boolean;
    statusUser: User | null;
    newStatus: string | undefined;
}

const currentUser = AuthService.getUser();

class Users extends Component<{}, UsersState> {
    private hasFetchedData: boolean = false;

    constructor(props: {}) {
        super(props);
        this.state = {
            users: [],
            totalUsers: 0,
            page: 0,
            rowsPerPage: 10,
            open: false,
            editingUser: null,
            originalUser: null,
            formData: { showPassword: false, showConfirmPassword: false, errors: {} },
            searchQuery: "",
            selectedFilters: [],
            filterOptions: ["First Name", "Last Name", "Email"],
            deleteDialogOpen: false,
            userToDelete: null,
            isDeletingSelf: false,
            logoutCountdown: 0,
            statusDialogOpen: false,
            loading: false,
            statusUser: null,
            newStatus: undefined,
        };
    }

    /***********************
     * Validation helpers
     ***********************/
    handleBlur = (field: keyof UsersState["formData"]) => {
        const { formData } = this.state;
        const errors = { ...formData.errors };

        switch (field) {
            case "first_name":
                if (!formData.first_name?.trim()) errors.first_name = "First Name is required";
                else delete errors.first_name;
                break;
            case "username":
                if (!formData.username?.trim()) errors.username = "Username is required";
                else delete errors.username;
                break;
            case "email":
                if (!formData.email?.trim()) errors.email = "Email is required";
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";
                else delete errors.email;
                break;
            case "password":
                const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,15}$/;

                if (!formData.password?.trim()) {
                    if (!this.state.editingUser) {
                        errors.password = "Password is required";
                    } else {
                        delete errors.password;
                    }
                } else if (!passwordRegex.test(formData.password)) {
                    errors.password = "Min 8 & Max 15 chars, 1 uppercase & 1 special char";
                } else {
                    delete errors.password;
                }
                break;

            case "confirmPassword":
                if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
                else delete errors.confirmPassword;
                break;
            case "role":
                if (!formData.role) errors.role = "Role is required";
                else delete errors.role;
                break;
            default:
                break;
        }

        this.setState({ formData: { ...formData, errors } });
    };

    /***********************
     * Lifecycle & data
     ***********************/
    componentDidMount(): void {
        if (!this.hasFetchedData) {
            this.fetchUsers();
            this.hasFetchedData = true;
        }
    }

    fetchUsers = async (pageNumber: number = this.state.page, perPage: number = this.state.rowsPerPage) => {
        showLoading(3000);
        this.setState({ loading: true });
        try {
            const res: any = await axiosInstance.get(`/user?page=${pageNumber + 1}&per_page=${perPage}`);
            let fetchedUsers = res.data.data || [];
            // total may come from server
            const totalFromServer = res.data.total ?? fetchedUsers.length;

            const current = AuthService.getUser();
            if (current?.role === "user") {
                fetchedUsers = fetchedUsers.filter((u: any) => u.id === current.id);
            }

            this.setState({
                users: fetchedUsers,
                totalUsers: totalFromServer,
            });
        } catch (error) {
            toast.error("Failed to fetch users", { autoClose: 3000 });
        } finally {
            closeLoading();
            this.setState({ loading: false });
        }
    };

    /***********************
     * Form helpers
     ***********************/
    togglePasswordVisibility = () => {
        this.setState(prev => ({ formData: { ...prev.formData, showPassword: !prev.formData.showPassword } }));
    };

    toggleConfirmPasswordVisibility = () => {
        this.setState(prev => ({ formData: { ...prev.formData, showConfirmPassword: !prev.formData.showConfirmPassword } }));
    };

    handleOpenDialog = (user: User | null = null) => {
        if (user) {
            this.setState({
                editingUser: user,
                originalUser: { ...user },
                formData: {
                    first_name: user.first_name || "",
                    id: user.id,
                    last_name: user.last_name || "",
                    email: user.email || "",
                    username: user.username || "",
                    password: "",
                    confirmPassword: "",
                    role: user.role || "user",
                    phone: user.phone || "",
                    address: user.address || "",
                    status: user.status || "active",
                    showPassword: false,
                    showConfirmPassword: false,
                    errors: {},
                },
                open: true,
            });
        } else {
            this.setState({
                editingUser: null,
                originalUser: null,
                formData: {
                    first_name: "",
                    last_name: "",
                    email: "",
                    username: "",
                    password: "",
                    confirmPassword: "",
                    role: "user",
                    phone: "",
                    address: "",
                    status: "active",
                    showPassword: false,
                    showConfirmPassword: false,
                    errors: {},
                },
                open: true,
            });
        }
    };

    handleClose = () => this.setState({ open: false, originalUser: null });

    handleInputChange = (field: keyof UsersState["formData"], value: string | boolean) => {
        this.setState(prev => {
            const newErrors = { ...prev.formData.errors };
            if (newErrors && newErrors[field as string]) delete newErrors[field as string];
            return { formData: { ...prev.formData, [field]: value, errors: newErrors } };
        });
    };

    validateForm = (): boolean => {
        const { formData, editingUser, originalUser } = this.state;
        const errors: Record<string, string> = {};
        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,15}$/;

        if (!formData.first_name?.trim()) errors.first_name = "First Name is required";
        if (!formData.username?.trim()) errors.username = "Username is required";
        if (!formData.email?.trim()) errors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Invalid email format";

        if (!editingUser) {
            if (!formData.password?.trim()) errors.password = "Password is required";
            else if (!passwordRegex.test(formData.password))
                errors.password = "Min 8 & Max 15 chars, 1 uppercase & 1 special char";
        } else if (formData.password?.trim() && formData.password !== originalUser?.password) {
            if (!passwordRegex.test(formData.password))
                errors.password = "Min 8 & Max 15 chars, 1 uppercase & 1 special char";
        }

        const isPasswordModified = editingUser && formData.password?.trim() && formData.password !== originalUser?.password;
        if (!editingUser || isPasswordModified) {
            if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
        }

        if (editingUser && formData.password?.trim() && !formData.confirmPassword?.trim() && isPasswordModified) {
            errors.confirmPassword = "Confirm Password is required if updating password";
        }

        if (!formData.role) errors.role = "Role is required";

        this.setState({ formData: { ...formData, errors } });
        return Object.keys(errors).length === 0;
    };

    handleSave = async () => {
        const { editingUser, formData, originalUser } = this.state;
        if (!this.validateForm()) return;

        let payload: any = {};
        if (!editingUser) {
            payload = { ...formData, username: formData.username };
        } else {
            let changes: Partial<User> = {};
            ([
                "first_name",
                "last_name",
                "username",
                "email",
                "role",
                "phone",
                "address",
                "status",
                "password",
            ] as (keyof User)[]).forEach((field) => {
                if (formData[field] !== originalUser?.[field] || formData[field] === "") {
                    changes[field] = formData[field];
                }
            });

            if (Object.keys(changes).length === 0) {
                toast.info("No changes detected.", { autoClose: 3000 });
                this.handleClose();
                return;
            }

            payload = changes;
        }

        if (payload.status) payload.status = (payload.status as string).toLowerCase();
        delete payload.confirmPassword;
        delete payload.showPassword;
        delete payload.showConfirmPassword;
        delete payload.errors;

        try {
            if (editingUser) {
                await axiosInstance.put(`/user/${editingUser.id}`, payload);
                toast.success("User updated successfully!", { autoClose: 3000 });
            } else {
                await axiosInstance.post("/admin-register", payload);
                toast.success("User created successfully!", { autoClose: 3000 });
            }
            this.fetchUsers();
            this.handleClose();
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.errors) {
                const errors = err.response.data.errors;
                Object.keys(errors).forEach((field) => {
                    toast.error(`${errors[field]}`, { autoClose: 3000 });
                });
            } else {
                toast.error("Something went wrong during save/update.", { autoClose: 3000 });
            }
        }
    };

    /***********************
     * Delete handlers
     ***********************/
    handleDeleteClick = (user: User) => {
        const isCurrentUser = currentUser && currentUser.id === user.id;
        this.setState({ deleteDialogOpen: true, userToDelete: user, isDeletingSelf: isCurrentUser });
    };

    handleDeleteDialogClose = () => this.setState({ deleteDialogOpen: false, userToDelete: null });

    handleDeleteConfirm = async () => {
        const { userToDelete, isDeletingSelf } = this.state;
        if (!userToDelete) return;
        try {
            await axiosInstance.delete(`/user/${userToDelete.id}`);
            toast.success("User deleted successfully!", { autoClose: 3000 });
            if (isDeletingSelf) {
                let countdown = 5;
                this.setState({ logoutCountdown: countdown });
                const timer = setInterval(() => {
                    countdown--;
                    this.setState({ logoutCountdown: countdown });
                    if (countdown <= 0) {
                        clearInterval(timer);
                        this.handleDeleteDialogClose();
                        AuthService.logout();
                        window.location.href = "/login";
                    }
                }, 1000);
            } else {
                this.handleDeleteDialogClose();
                this.fetchUsers();
            }
        } catch {
            toast.error("Error deleting user", { autoClose: 3000 });
            this.handleDeleteDialogClose();
        }
    };

    handleStatusClick = (user: User) => {
        const newStatus = user.status === "active" ? "inactive" : "active";
        this.setState({ statusDialogOpen: true, statusUser: user, newStatus });
    };

    handleStatusDialogClose = () => this.setState({ statusDialogOpen: false, statusUser: null, newStatus: undefined });

    handleStatusConfirm = async () => {
        const { statusUser, newStatus } = this.state;
        if (!statusUser || newStatus === undefined) return;
        try {
            await axiosInstance.put(`/user/${statusUser.id}`, { status: newStatus });
            toast.success("User status updated successfully!", { autoClose: 3000 });
            this.fetchUsers();
        } catch {
            toast.error("Error updating status", { autoClose: 3000 });
        }
        this.handleStatusDialogClose();
    };

    handleChangePage = (_event: unknown, newPage: number) => {
        this.setState({ page: newPage }, () => this.fetchUsers(newPage, this.state.rowsPerPage));
    };

    handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
        const perPage = parseInt(event.target.value, 10);
        this.setState({ rowsPerPage: perPage, page: 0 }, () => this.fetchUsers(0, perPage));
    };

    handleSearchChange = (value: string) => this.setState({ searchQuery: value });
    handleFilterChange = (selected: string[]) => this.setState({ selectedFilters: selected });

    render() {
        const {
            users,
            page,
            rowsPerPage,
            searchQuery,
            selectedFilters,
            deleteDialogOpen,
            userToDelete,
            statusDialogOpen,
            statusUser,
            newStatus,
            totalUsers,
        } = this.state;

        if (searchQuery && selectedFilters.length > 0) {
            const query = searchQuery.toLowerCase();
            users.filter(user =>
                selectedFilters.some(filter => {
                    switch (filter) {
                        case "First Name":
                            return user.first_name?.toLowerCase().includes(query);
                        case "Last Name":
                            return user.last_name?.toLowerCase().includes(query);
                        case "Username":
                            return user.username?.toLowerCase().includes(query);
                        case "Email":
                            return user.email?.toLowerCase().includes(query);
                        default:
                            return false;
                    }
                })
            );
        }

        const bgClass = "bg-gray-100";
        const totalPages = Math.max(1, Math.ceil((totalUsers || users.length) / rowsPerPage));

        return (
            <>
                <div className="flex flex-col sm:flex-row justify-end items-center mb-4 gap-2">
                    <div className="w-full sm:w-auto">
                        <div title={AuthService.getUser()?.role === "user" ? "You don't have permission to add users" : "Add a new user"}>
                            <button onClick={() => this.handleOpenDialog()} disabled={AuthService.getUser()?.role === "user"} className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-md text-white font-medium
                  ${AuthService.getUser()?.role === "user" ? "bg-gray-300 cursor-not-allowed text-gray-700" : "bg-[#fc4e15] hover:bg-[#e04612]"}`} >
                                <LibraryAddOutlinedIcon fontSize="small" />
                                <span>Add User</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded overflow-hidden">
                    <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "calc(100vh - 280px)", height: "calc(100vh - 280px)", }} >
                        <table className="min-w-full divide-y border-collapse">
                            <thead className={`${bgClass} sticky top-0 z-20`}>
                                <tr className="text-xs uppercase text-gray-700">
                                    <th className="px-4 py-3 text-left font-semibold">User ID</th>
                                    <th className="px-4 py-3 text-left font-semibold">First Name</th>
                                    <th className="px-4 py-3 text-left font-semibold">Last Name</th>
                                    <th className="px-4 py-3 text-left font-semibold">Username</th>
                                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                                    <th className="px-4 py-3 text-left font-semibold">Phone</th>
                                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y">
                                {users.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{row.id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{row.first_name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{row.last_name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{row.username}</td>
                                        <td className="px-4 py-3 break-words text-sm text-gray-800">{row.email}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{row.role}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{row.phone}</td>

                                        {row.role !== "superadmin" && (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <Tooltip
                                                    title={
                                                        AuthService.getUser()?.id === row.id ? "You cannot change your own status" : "Change status"} >
                                                    <span style={{
                                                        display: "inline-flex", cursor: AuthService.getUser()?.id === row.id
                                                            || (AuthService.getUser()?.role === "user" && row.role === "admin") || AuthService.getUser()?.role === "user" ? "not-allowed" : "pointer",
                                                    }} >
                                                        <Switch checked={row.status === "active"} onChange={() => this.handleStatusClick(row)}
                                                            disabled={AuthService.getUser()?.id === row.id || AuthService.getUser()?.role === "user" || row.role === "superadmin"}
                                                            sx={{ "&.Mui-disabled": { cursor: "not-allowed", opacity: 0.6, }, }} />
                                                    </span>
                                                </Tooltip>
                                            </td>
                                        )}
                                        {row.role !== "superadmin" && (
                                            <td className="p-3 text-right space-x-2">
                                                <button onClick={() => this.handleOpenDialog(row)} disabled={row.role === "superadmin" || (AuthService.getUser()?.role === "user" && AuthService.getUser()?.id !== row.id)} title={AuthService.getUser()?.id === row.id ? "Edit your own profile" : "Edit this user"}
                                                    className={`inline-flex items-center justify-center p-1 rounded ${(AuthService.getUser()?.role === "user" && AuthService.getUser()?.id !== row.id) ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:text-[#fc4e15]"}`} >
                                                    <PencilIcon className="w-4 h-4 inline" />
                                                </button>

                                                <button onClick={() => this.handleDeleteClick(row)} disabled={row.role === "superadmin" || AuthService.getUser()?.role === "user"}
                                                    title={AuthService.getUser()?.role === "user" ? "You don't have permission to delete any users" : "Delete this user"}
                                                    className={`ml-2 inline-flex items-center justify-center p-1 rounded ${AuthService.getUser()?.role === "user" ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:text-red-600"}`} >
                                                    <TrashIcon className="w-4 h-4 inline" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}

                                {users.length === 0 && !this.state.loading && (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-white">
                        <div className="text-sm text-gray-600">
                            Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalUsers || users.length)} of {totalUsers || users.length}
                        </div>

                        <div className="flex items-center gap-3">
                            <label htmlFor="rowsPerPage" className="text-sm text-gray-600">Rows per page:</label>
                            <select id="rowsPerPage" value={rowsPerPage}
                                onChange={(e: any) => { this.handleChangeRowsPerPage(e); }} className="border rounded px-2 py-1 text-sm" >
                                {[10, 20, 50].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>

                            <div className="flex items-center">
                                <button onClick={() => this.handleChangePage({}, Math.max(0, page - 1))} disabled={page === 0}
                                    className={"px-3 py-1 border border-gray-300 rounded-l hover:bg-gray-100 disabled:opacity-50"} >
                                    Previous
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => {
                                    const start = Math.max(0, page - 2);
                                    const end = Math.min(totalPages, start + 5);
                                    if (i < start || i >= end) return null;
                                    return (
                                        <button key={i} onClick={() => this.handleChangePage({}, i)}
                                            className={`px-3 py-1 border border-gray-300 hover:bg-gray-100 ${i === page ? "bg-blue-50 text-blue-600" : ""}`} >
                                            {i + 1}
                                        </button>
                                    );
                                })}
                                <button onClick={() => this.handleChangePage({}, Math.min(totalPages - 1, page + 1))} disabled={page + 1 >= totalPages}
                                    className={"px-3 py-1 border border-gray-300 rounded-r hover:bg-gray-100 disabled:opacity-50"} >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {this.state.open && (
                    <UserFormDialog open={this.state.open} editingUser={!!this.state.editingUser}
                        formData={this.state.formData as UserFormData} currentUserRole={AuthService.getUser()?.role as "admin" | "user"} onClose={this.handleClose} onInputChange={this.handleInputChange}
                        onBlur={this.handleBlur} onTogglePasswordVisibility={this.togglePasswordVisibility} onToggleConfirmPasswordVisibility={this.toggleConfirmPasswordVisibility} onSave={this.handleSave} />
                )}

                {Boolean(deleteDialogOpen) && (
                    <CommonConfirmDialog
                        open={Boolean(deleteDialogOpen)} title="Delete User"
                        message={`Are you sure you want to delete ${userToDelete?.first_name} ${userToDelete?.last_name}?`} confirmLabel="Delete" confirmColor="error"
                        onClose={this.handleDeleteDialogClose} onConfirm={this.handleDeleteConfirm} disableConfirm={this.state.logoutCountdown > 0} disableEscape={this.state.logoutCountdown > 0}
                        warningText={this.state.isDeletingSelf ? "You are currently logged in as this user. Deleting this account will logout!" : undefined} countdown={this.state.logoutCountdown} />
                )}

                {Boolean(statusDialogOpen) && (
                    <CommonConfirmDialog open={Boolean(statusDialogOpen)} title="Change User Status" message={`Are you sure you want to change status of ${statusUser?.first_name} ${statusUser?.last_name} to ${newStatus}?`}
                        confirmLabel="Yes" confirmColor="primary" onClose={this.handleStatusDialogClose} onConfirm={this.handleStatusConfirm} />
                )}
            </>
        );
    }
}

export default Users;
