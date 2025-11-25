import { Divider } from "@mui/material";
import React from "react";

interface CommonConfirmDialogProps {
  open: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "primary" | "error" | "success" | "warning";
  onClose: () => void;
  onConfirm: () => void;
  disableConfirm?: boolean;
  disableEscape?: boolean;
  countdown?: number;
  warningText?: string;
}

const CommonConfirmDialog: React.FC<CommonConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "primary",
  onClose,
  onConfirm,
  disableConfirm = false,
  disableEscape = false,
  countdown,
  warningText,
}) => {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (disableEscape || (countdown && countdown > 0)) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <Divider />
        <div className="text-center my-2">
          {typeof message === "string" ? (
            <p>{message}</p>
          ) : (
            message
          )}

          {warningText && (
            <div className="mt-4 text-red-600 font-bold">
              {warningText}
              {typeof countdown === "number" && countdown > 0 && (
                <div className="mt-1 text-sm font-medium">
                  Logging out in {countdown} seconds...
                </div>
              )}
            </div>
          )}
        </div>
        <Divider />
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={disableConfirm || Boolean(countdown && countdown > 0)}
            className="px-4 py-2 rounded border border-gray-300 text-gray-800 hover:bg-gray-100 disabled:opacity-50" >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={disableConfirm || Boolean(countdown && countdown > 0)}
            className={`px-4 py-2 rounded text-white ${confirmColor === "error"
              ? "bg-red-600 hover:bg-red-700"
              : confirmColor === "success"
                ? "bg-green-600 hover:bg-green-700"
                : confirmColor === "warning"
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-orange-600 hover:bg-orange-700"
              } disabled:opacity-50`}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CommonConfirmDialog;
