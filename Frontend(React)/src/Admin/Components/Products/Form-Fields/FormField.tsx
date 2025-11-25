import React, { useRef } from "react";

interface Option {
  id: string | number;
  name: string;
}

interface FormFieldProps {
  field: {
    name: string;
    label: string;
    type: "text" | "numeric" | "select" | "date" | "radio" | "checkbox" | "textarea";
    fullWidth?: boolean;
    options?: Option[];
    minDate?: any;
  };
  value: any;
  onChange: (e: React.ChangeEvent<any> | any) => void;
  error?: string;
  editing?: boolean;
  editingProduct?: any;
}

const ClearIconSvg = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FormField: React.FC<FormFieldProps> = ({
  field,
  value,
  onChange,
  error,
  editing,
  editingProduct,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { name, label, type, fullWidth = true, options } = field;

  const isQtyDisabled =
    field.name === "qty" &&
    editing &&
    editingProduct?.total_qty !== 0 &&
    editingProduct?.total_qty != null &&
    (editingProduct?.parent_id === null ||
      editingProduct?.parent_id === undefined ||
      editingProduct?.parent_id === "");

  const displayValue = isQtyDisabled ? editingProduct?.total_qty : value;

  const emitChange = (payload: any) => {
    if (payload && payload.target && "name" in payload.target) {
      onChange(payload);
    } else {
      onChange({ target: { name, value: payload } });
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(e);
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      onChange(e);
    }
  };

  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const handleOpenCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inputRef.current) {
      try {
        (inputRef.current as any).showPicker?.();
      } catch {
        inputRef.current.focus();
      }
    }
  };

  const baseInputClasses =
    "block w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";

  const disabledInputClasses = "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-300";

  const errorTextClasses = "mt-1 text-sm text-red-600";

  const labelMarkup = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
  );

  switch (type) {
    case "numeric":
      return (
        <div className={`w-full ${fullWidth ? "" : ""}`}>
          {labelMarkup}
          <input
            name={name}
            value={displayValue === null || displayValue === undefined ? "" : displayValue}
            onChange={handleNumericChange}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            maxLength={field.name === "cubic" ? 4 : 9}
            min={0}
            step={1}
            disabled={isQtyDisabled || (field.name === "sku" && !!editing)}
            className={`${baseInputClasses} ${isQtyDisabled || (field.name === "sku" && !!editing) ? disabledInputClasses : "border-gray-300"}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          />
          {error && !isQtyDisabled && <p id={`${name}-error`} className={errorTextClasses}>{error}</p>}
        </div>
      );

    case "select":
      return (
        <div className="w-full">
          {labelMarkup}
          <select
            name={name}
            value={displayValue === null || displayValue === undefined ? "" : displayValue}
            onChange={handleNativeChange}
            disabled={field.name === "parent_id"}
            className={`${baseInputClasses} border-gray-300 bg-white`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          >
            <option value="">Select</option>
            {options?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          {error && <p id={`${name}-error`} className={errorTextClasses}>{error}</p>}
        </div>
      );

    case "date": {
      let minDate = "";
      if (name === "promo_start") {
        minDate = formattedToday;
      }
      if (name === "promo_end") {
        minDate = field.minDate || formattedToday;
      }

      return (
        <div className="w-full sm:w-1/2">
          {labelMarkup}
          <div className="relative">
            <input ref={inputRef} name={name} value={displayValue === null || displayValue === undefined ? "" : displayValue} onChange={handleNativeChange} 
            type="date" min={minDate || undefined} className={`${baseInputClasses} border-gray-300 pr-3`} aria-invalid={!!error} aria-describedby={error ? 
            `${name}-error` : undefined} />

            {displayValue ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); emitChange(""); }} className="absolute inset-y-0 right-[-45px] pr-2 flex items-center" 
              aria-label={`Clear ${label}`} >
                <span className="p-1 rounded hover:bg-gray-100">
                  <ClearIconSvg className="h-6 text-gray-500"/>
                </span>
              </button>
            ) : null}
          </div>
          {error && <p id={`${name}-error`} className={errorTextClasses}>{error}</p>}
        </div>
      );
    }

    case "textarea":
      return (
        <div className="w-full">
          {labelMarkup}
          <textarea
            name={name}
            value={displayValue === null || displayValue === undefined ? "" : displayValue}
            autoComplete="off"
            onChange={handleNativeChange}
            rows={3}
            className={`${baseInputClasses} border-gray-300 resize-vertical`}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          />
          {error && <p id={`${name}-error`} className={errorTextClasses}>{error}</p>}
        </div>
      );

    case "checkbox":
      return (
        <div className="w-full flex items-start">
          <div className="flex items-center h-5">
            <input
              id={name}
              name={name}
              type="checkbox"
              checked={!!value}
              onChange={(e) => emitChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              aria-invalid={!!error}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor={name} className="font-medium text-gray-700">{label}</label>
            {error && <p id={`${name}-error`} className={errorTextClasses}>{error}</p>}
          </div>
        </div>
      );

    case "radio":
      return (
        <div className="w-full">
          {labelMarkup}
          <div className="flex flex-row gap-4">
            {options?.map((option) => (
              <label key={option.id} className="inline-flex items-center space-x-2">
                <input
                  type="radio"
                  name={name}
                  value={option.id}
                  checked={String(value) === String(option.id)}
                  onChange={handleNativeChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{option.name}</span>
              </label>
            ))}
          </div>
          {error && <p id={`${name}-error`} className={errorTextClasses}>{error}</p>}
        </div>
      );

    default:
      return (
        <div className="w-full">
          {labelMarkup}
          <input
            name={name}
            autoComplete="off"
            value={displayValue === null || displayValue === undefined ? "" : displayValue}
            onChange={handleNativeChange}
            className={`${baseInputClasses} ${((field.name === "sku" && !!editing) || field.name === "parent_id" || isQtyDisabled) ? disabledInputClasses : "border-gray-300"}`}
            disabled={(field.name === "sku" && !!editing) || field.name === "parent_id" || isQtyDisabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          />
          {error && <p id={`${name}-error`} className={errorTextClasses}>{error}</p>}
        </div>
      );
  }
};

export default FormField;
