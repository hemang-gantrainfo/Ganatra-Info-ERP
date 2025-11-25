import React, { useEffect, useRef, useState } from "react";

interface CustomFieldProps {
  field: any;
  value: any;
  onChange: (e: any) => void;
  error?: string;
  editing?: boolean;
}

const ClearIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const InfoIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const clampUniqueTrim = (arr: any[]) =>
  Array.from(new Set(arr.map((s) => (typeof s === "string" ? s.trim() : s)).filter((s) => s !== "")));

const CustomFieldRenderer: React.FC<CustomFieldProps> = ({ field, value, onChange, error }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [openTooltip, setOpenTooltip] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [editorHtml, setEditorHtml] = useState<string>(value || "");

  useEffect(() => {
    if (field?.fieldType === "Description" && value !== editorHtml) {
      setEditorHtml(value || "");
      if (editorRef.current) editorRef.current.innerHTML = value || "";
    }
  }, [value, field?.fieldType]);

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setOpenTooltip(false);
      }
    };
    if (openTooltip) window.addEventListener("mousedown", onClickAway);
    return () => window.removeEventListener("mousedown", onClickAway);
  }, [openTooltip]);

  useEffect(() => {
    if (editorRef.current && editorHtml !== (editorRef.current.innerHTML || "")) {
      editorRef.current.innerHTML = editorHtml || "";
    }
  }, [editorHtml]);


  const renderLabel = () => (
    <div className="flex items-center mb-1">
      <div className="text-sm font-medium text-gray-700">{field.label}</div>
      <div className="relative" ref={tooltipRef}>
        <button type="button" onClick={(e) => { e.stopPropagation(); setOpenTooltip((s) => !s); }} className="ml-2 p-1 rounded hover:bg-gray-100" aria-expanded={openTooltip} aria-label={`Info about ${field.name}`} >
          <InfoIcon />
        </button>
        {openTooltip && (
          <div className="absolute z-50 left-0 mt-1 w-48 bg-white border rounded shadow-sm p-2 text-xs text-gray-700">
            {String(field.name)}
          </div>
        )}
      </div>
    </div>
  );

  const emitValue = (val: any) => onChange({ target: { name: field.name, value: val } });

  if (field.fieldType === "Dropdown") {
    const isMultiple = field.selectionType === "Multiple selection";
    const cleanOptions = clampUniqueTrim(Array.isArray(field.options) ? field.options : []);
    let selectedValues: any[] = [];
    if (isMultiple) {
      if (Array.isArray(value)) selectedValues = value;
      else if (typeof value === "string" && value.length > 0) selectedValues = value.split(",").map((v) => v.trim()).filter(Boolean);
      else if (value) selectedValues = [value];
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (isMultiple) {
        const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
        const unique = Array.from(new Set(selected));
        emitValue(unique);
      } else {
        emitValue(e.target.value);
      }
    };

    return (
      <div className="w-full">
        {renderLabel()}
        <div>
          <select name={field.name} multiple={isMultiple} value={isMultiple ? selectedValues : (value)} onChange={handleSelectChange}
            className="block w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" aria-invalid={!!error} >
            {!isMultiple && <option value="">Select</option>}
            {cleanOptions.map((opt: any) => (
              <option key={String(opt)} value={String(opt)}>
                {String(opt)}
              </option>
            ))}
          </select>
          {isMultiple && (
            <div className="mt-1 text-sm text-gray-600">
              Selected: {(Array.isArray(selectedValues) ? selectedValues : []).join(", ")}
            </div>
          )}
          {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
        </div>
      </div>
    );
  }

  if (field.fieldType === "True/False") {
    const current = value === undefined || value === null ? false : !!value;
    return (
      <div className="w-full">
        {renderLabel()}
        <select
          name={field.name}
          value={current ? "True" : "False"}
          onChange={(e) => emitValue(e.target.value === "True")}
          className="block w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          aria-invalid={!!error}
        >
          <option value="True">True</option>
          <option value="False">False</option>
        </select>
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </div>
    );
  }

  if (field.fieldType === "Date") {
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

    return (
      <div className="w-full">
        {renderLabel()}
        <div className="relative">
          <input ref={inputRef} type="date" name={field.name} value={value || ""} onChange={(e) => emitValue(e.target.value)} className="block w-full border rounded px-3 py-2 text-sm pr-10 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" aria-invalid={!!error} />
          <button type="button" onClick={handleOpenCalendar} className="absolute inset-y-0 right-8 pr-2 flex items-center" aria-label="Open date picker" >
            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </button>

          {value ? (
            <button type="button" onClick={(e) => { e.stopPropagation(); emitValue(""); }} className="absolute inset-y-0 right-0 pr-2 flex items-center" aria-label={`Clear ${field.label}`} >
              <span className="p-1 rounded hover:bg-gray-100">
                <ClearIcon />
              </span>
            </button>
          ) : null}
        </div>
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </div>
    );
  }

  if (field.fieldType === "Integer Number" || field.fieldType === "Decimal Number") {
    const isInteger = field.fieldType === "Integer Number";

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (isInteger) {
        if (/^\d*$/.test(val)) emitValue(val);
      } else {
        if (/^\d*\.?\d*$/.test(val)) emitValue(val);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
    };

    return (
      <div className="w-full">
        {renderLabel()}
        <input type="text" name={field.name} value={value} onChange={handleNumericChange} autoComplete="off"
          onKeyDown={handleKeyDown} inputMode={isInteger ? "numeric" : "decimal"} className="block w-full border rounded p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" aria-invalid={!!error} />
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </div>
    );
  }

  if (field.fieldType === "Text" || field.fieldType === "Short Text") {
    return (
      <div className="w-full">
        {renderLabel()}
        <input name={field.name} value={value} onChange={(e) => emitValue(e.target.value)} autoComplete="off"
          className="block w-full border rounded p-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500" aria-invalid={!!error} />
        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </div>
    );
  }

  if (field.fieldType === "Description") {
    const exec = (command: string, valueArg?: string) => {
      document.execCommand(command, false, valueArg);
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        setEditorHtml(html);
        emitValue(html);
      }
    };

    const handleLink = () => {
      const url = window.prompt("Enter a URL", "https://");
      if (url) exec("createLink", url);
    };

    const handleClearFormatting = () => {
      if (editorRef.current) {
        const text = editorRef.current.innerText;
        editorRef.current.innerHTML = text;
        setEditorHtml(text);
        emitValue(text);
      }
    };

    const handleInput = () => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        setEditorHtml(html);
        emitValue(html);
      }
    };

    return (
      <div className="w-full">
        {renderLabel()}
        <div className={`border ${error ? "border-red-500" : "border-gray-300"} rounded bg-white overflow-hidden`}>
          <div className="bg-gray-50 border-b border-gray-200 px-2 py-1 flex flex-wrap gap-1">
            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("bold")} title="Bold"><strong>B</strong></button>
            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("italic")} title="Italic"><em>I</em></button>
            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("underline")} title="Underline"><span style={{ textDecoration: "underline" }}>U</span></button>
            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("strikeThrough")} title="Strike"><s>S</s></button>

            <span className="mx-1 border-l h-5" />

            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("insertOrderedList")} title="Numbered list">1.</button>
            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("insertUnorderedList")} title="Bullet list">•</button>

            <span className="mx-1 border-l h-5" />

            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={handleLink} title="Insert link">🔗</button>

            <span className="mx-1 border-l h-5" />

            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("undo")} title="Undo">↶</button>
            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={() => exec("redo")} title="Redo">↷</button>
            <button type="button" className="p-1 rounded hover:bg-gray-100" onClick={handleClearFormatting} title="Clear formatting">⌦</button>
            <select className="ml-1 text-sm border rounded px-1"
              onChange={(e) => { const v = e.target.value; if (v === "normal") exec("formatBlock", "P"); else exec("formatBlock", v); }} defaultValue="normal" >
              <option value="normal">Normal</option>
              <option value="H1">Heading 1</option>
              <option value="H2">Heading 2</option>
            </select>
          </div>

          <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={handleInput} dangerouslySetInnerHTML={{ __html: editorHtml || "" }}
            style={{ minHeight: 200 }} className="p-3 prose max-w-full outline-none text-sm" aria-multiline="true" />
        </div>

        {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
      </div>
    );
  }

  return null;
};

export default CustomFieldRenderer;
