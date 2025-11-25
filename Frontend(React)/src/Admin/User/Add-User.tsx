import React, { useEffect } from "react";
import AuthService from "../../Services/AuthService";
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

export interface UserFormData {
  id: number;
  first_name: string;
  last_name?: string;
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  role: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  showPassword?: boolean;
  showConfirmPassword?: boolean;
  errors?: Record<string, string>;
}

interface UserFormDialogProps {
  open: boolean;
  editingUser?: boolean;
  formData: UserFormData;
  currentUserRole?: "superadmin" | "admin" | "user";
  onClose: () => void;
  onInputChange: (field: keyof UserFormData, value: any) => void;
  onBlur: (field: keyof UserFormData) => void;
  onTogglePasswordVisibility: () => void;
  onToggleConfirmPasswordVisibility: () => void;
  onSave: () => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  editingUser,
  formData,
  currentUserRole = "",
  onClose,
  onInputChange,
  onBlur,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
  onSave,
}) => {
  useEffect(() => {
    const handleEnterNavigation = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const form =
          event.target instanceof HTMLElement
            ? event.target.closest("form, .dialog-content")
            : null;
        if (!form) return;

        const focusableElements = Array.from(
          form.querySelectorAll<HTMLElement>(
            'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
          )
        ).filter((el: any) => el.tabIndex !== -1 && !el.hidden && el.type !== "hidden");

        const index = focusableElements.indexOf(event.target as HTMLElement);
        if (index > -1) {
          const nextElement = focusableElements[index + 1];
          if (nextElement) {
            event.preventDefault();
            nextElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleEnterNavigation);
    return () => document.removeEventListener("keydown", handleEnterNavigation);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl p-6 animate-fadeIn max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 flex-shrink-0">
          <h2 className="text-lg font-semibold">
            {editingUser ? "Edit User" : "Add User"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-4 dialog-content custom-scrollbar pr-2">

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col w-full">
              <label className="font-medium">First Name*</label>
              <input
                type="text"
                value={formData.first_name || ""}
                onBlur={() => onBlur("first_name")}
                onChange={(e) => onInputChange("first_name", e.target.value)}
                className={`border p-2 rounded ${formData.errors?.first_name ? "border-red-500" : "border-gray-300"}`}
              />
              {formData.errors?.first_name && (
                <p className="text-xs text-red-500">
                  {formData.errors.first_name}
                </p>
              )}
            </div>

            <div className="flex flex-col w-full">
              <label className="font-medium">Last Name</label>
              <input
                type="text"
                value={formData.last_name || ""}
                onChange={(e) => onInputChange("last_name", e.target.value)}
                className={`border p-2 rounded ${formData.errors?.last_name
                  ? "border-red-500"
                  : "border-gray-300"
                  }`}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col w-full">
              <label className="font-medium">Username*</label>
              <input
                type="text"
                value={formData.username || ""}
                disabled={!!editingUser}
                onBlur={() => onBlur("username")}
                onChange={(e) => {
                  let input = e.target.value.toLowerCase();
                  const regex = /^[a-z0-9]*$/;
                  if ((input === "" || regex.test(input)) && input.length <= 15)
                    onInputChange("username", input);
                }}
                className={`border p-2 rounded ${formData.errors?.username ? "border-red-500" : "border-gray-300"
                  } ${editingUser ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {formData.errors?.username && (
                <p className="text-xs text-red-500">
                  {formData.errors.username}
                </p>
              )}
            </div>

            <div className="flex flex-col w-full">
              <label className="font-medium">Email*</label>
              <input
                type="email"
                value={formData.email || ""}
                onBlur={() => onBlur("email")}
                onChange={(e) => onInputChange("email", e.target.value)}
                className={`border p-2 rounded ${formData.errors?.email ? "border-red-500" : "border-gray-300"}`}
              />
              {formData.errors?.email && (
                <p className="text-xs text-red-500">
                  {formData.errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex flex-col w-full">
              <label className="font-medium">Password*</label>
              <input
                type={formData.showPassword ? "text" : "password"}
                value={formData.password || ""}
                onBlur={() => onBlur("password")}
                onChange={(e) => onInputChange("password", e.target.value)}
                className={`border p-2 rounded pr-10 ${formData.errors?.password ? "border-red-500" : "border-gray-300"}`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={onTogglePasswordVisibility}
                className="absolute right-2 top-8 text-gray-500"
              >
                {formData.showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
              {formData.errors?.password && (
                <p className="text-xs text-red-500">
                  {formData.errors.password}
                </p>
              )}
            </div>

            <div className="relative flex flex-col w-full">
              <label className="font-medium">Confirm Password*</label>
              <input
                type={formData.showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword || ""}
                onBlur={() => onBlur("confirmPassword")}
                onChange={(e) => onInputChange("confirmPassword", e.target.value)}
                className={`border p-2 rounded pr-10 ${formData.errors?.confirmPassword ? "border-red-500" : "border-gray-300"
                  }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={onToggleConfirmPasswordVisibility}
                className="absolute right-2 top-8 text-gray-500"
              >
                {formData.showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
              {formData.errors?.confirmPassword && (
                <p className="text-xs text-red-500">
                  {formData.errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col w-full">
              <label className="font-medium">Role*</label>
              <select
                value={formData.role || ""}
                onBlur={() => onBlur("role")}
                onChange={(e) => onInputChange("role", e.target.value)}
                disabled={formData.role === "superadmin"}
                className={`border p-2 rounded ${formData.errors?.role ? "border-red-500" : "border-gray-300"}`}
              >
                {currentUserRole === "superadmin" && (
                  <>
                    <option value="admin">admin</option>
                    <option value="user">user</option>
                  </>
                )}

                {currentUserRole === "admin" && (
                  <>
                    <option value="user">user</option>
                  </>
                )}

                {currentUserRole === "user" && (
                  <>
                    <option value="user">user</option>
                  </>
                )}
              </select>

              {formData.errors?.role && (
                <p className="text-xs text-red-500">{formData.errors.role}</p>
              )}
            </div>

            <div className="flex flex-col w-full">
              <label className="font-medium">Phone</label>
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) => {
                  let value = e.target.value;
                  if (/^\+?[0-9 ]*$/.test(value)) {
                    const len = value.replace(/ /g, "").length;
                    if (len > 13) return;
                    onInputChange("phone", value);
                  }
                }}
                className={`border p-2 rounded ${formData.errors?.phone ? "border-red-500" : "border-gray-300"}`}
              />
              {formData.errors?.phone && (
                <p className="text-xs text-red-500">
                  {formData.errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <label className="font-medium">Address (Optional)</label>
            <textarea
              rows={3}
              value={formData.address || ""}
              onChange={(e) => onInputChange("address", e.target.value)}
              className="border border-gray-300 rounded p-2"
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={formData.status === "active"}
              onChange={(e) => onInputChange("status", e.target.checked ? "active" : "inactive")}
              disabled={AuthService.getUser()?.role === "user" || AuthService.getUser()?.id === formData.id}
              className="w-5 h-5 accent-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <label className="font-medium">User Status*</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4 mt-4 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 border border-gray-400 rounded text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={onSave} className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
            {editingUser ? "Update" : "Save"}
          </button>
        </div>

      </div>
    </div>

  );
};

export default UserFormDialog;
