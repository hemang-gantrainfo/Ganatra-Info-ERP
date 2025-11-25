import React, { useEffect, useRef, useState } from "react";
import { Typography, Box, FormControl, Select, MenuItem, Button, IconButton, Switch, FormControlLabel, Tooltip } from "@mui/material";
import { Delete } from "@mui/icons-material";
import axiosInstance from "../../../Services/axiosInstance";
import { toast } from "react-toastify";
import LibraryAddOutlinedIcon from '@mui/icons-material/LibraryAddOutlined';
import { closeLoading, showLoading } from "../../../General/Loader";
import AuthService from "../../../Services/AuthService";

interface Mapping {
  id?: number;
  productCol: string;
  ecomField: string;
  isActive: boolean;
}

const Configurations: React.FC = () => {
  const [activePlatforms, setActivePlatforms] = useState<string[] | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [productColumns, setProductColumns] = useState<string[]>([]);
  const [shopifyFields, setShopifyFields] = useState<string[]>([]);
  const [maropostFields, setMaropostFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, Mapping[]>>({});
  const [originalMappings, setOriginalMappings] = useState<Record<string, Mapping[]>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<{ platform: string; index: number } | null>(null);
  const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
  const menuProps = { PaperProps: { style: { maxHeight: 200, width: 250 } } };
  const hasFetchedInitialData = useRef(false);
  const alwaysOnKeys = ["sku", "name", "qty"];
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const user = AuthService.getUser();
    if (user?.role) setUserRole(user.role);
    if (hasFetchedInitialData.current) return;
    hasFetchedInitialData.current = true;

    const fetchAllInitialData = async () => {
      setIsLoadingInitialData(true);
      showLoading(3000);

      try {
        const settingsResponse: any = await axiosInstance.get("/settings");
        const { settings, maropost_access, shopify_access } = settingsResponse.data;
        const enabledKeys: string[] = [];

        if (
          settings.maropost_status === "1" &&
          (maropost_access.api_key || maropost_access.api_username || maropost_access.api_password || maropost_access.store_url)
        ) {
          enabledKeys.push("neto");
        }

        if (
          settings.shopify_status === "1" &&
          (shopify_access.store_url || shopify_access.access_token)
        ) {
          enabledKeys.push("shopify");
        }

        setActivePlatforms(enabledKeys);

        const fieldsResponse: any = await axiosInstance.get("/product-fields");
        const mappingResponse: any = await axiosInstance.get("/field-mappings");
        const productColumns: string[] = fieldsResponse.data.product_columns || [];
        const shopifyFields: string[] = fieldsResponse.data.ecommerce_fields?.shopify || [];
        const maropostFields: string[] = fieldsResponse.data.ecommerce_fields?.maropost || [];

        setProductColumns(productColumns);
        setShopifyFields(shopifyFields);
        setMaropostFields(maropostFields);

        const newMappings: Record<string, Mapping[]> = {};
        Object.keys(mappingResponse.data).forEach((platform) => {
          const rows: Mapping[] = mappingResponse.data[platform].map((m: any) => ({
            id: m.id,
            productCol: productColumns.includes(m.local_field) ? m.local_field : "",
            ecomField:
              platform === "shopify"
                ? shopifyFields.includes(m.api_field)
                  ? m.api_field
                  : ""
                : maropostFields.includes(m.api_field)
                  ? m.api_field
                  : "",
            isActive: m.is_required,
          }));
          const key = platform === "maropost" ? "neto" : platform;
          const validRows = rows.filter(m => m.productCol || m.ecomField);
          newMappings[key] = validRows.length > 0 ? validRows : [];
        });

        setMappings(newMappings);
        setOriginalMappings(JSON.parse(JSON.stringify(newMappings)));
      } catch (error) {
        setActivePlatforms([]);
      } finally {
        closeLoading();
        setIsLoadingInitialData(false);
      }
    };

    fetchAllInitialData();
  }, []);

  const getFieldsByPlatform = (platform: string) => {
    const fields = platform === "shopify" ? [...shopifyFields] : platform === "neto" ? [...maropostFields] : [];
    const selected = mappings[platform]?.map((m) => m.ecomField).filter(Boolean) || [];
    selected.forEach((f) => {
      if (!fields.includes(f)) fields.push(f);
    });
    return fields;
  };

  const handleMappingChange = (platform: string, index: number, field: keyof Mapping, value: string | boolean) => {
    setMappings((prev) => {
      const updated = [...(prev[platform] || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [platform]: updated };
    });
  };

  const handleToggleSwitch = async (platform: string, index: number, checked: boolean) => {
    showLoading(3000);
    const mapping = mappings[platform][index];
    if (!mapping.productCol || !mapping.ecomField) {
      closeLoading();
      return;
    }

    const isActive = alwaysOnKeys.includes(mapping.productCol) ? true : checked;

    try {
      if (mapping.id) {
        await axiosInstance.put(`/field-mappings/${mapping.id}`, {
          local_field: mapping.productCol,
          api_field: mapping.ecomField,
          is_required: isActive,
        });
        toast.success("Status updated successfully", { autoClose: 3000 });
      } else {
        const response: any = await axiosInstance.post("/field-mappings", {
          platform: platform === "neto" ? "maropost" : platform,
          mappings: [
            {
              local_field: mapping.productCol,
              api_field: mapping.ecomField,
              is_required: isActive,
            },
          ],
        });
        mapping.id = response.data.id;
        toast.success("New mapping created and status updated successfully", { autoClose: 3000 });
      }

      setMappings(prev => {
        const updated = [...(prev[platform] || [])];
        updated[index] = { ...mapping, isActive };
        return { ...prev, [platform]: updated };
      });

      setOriginalMappings(prev => {
        const updated = [...(prev[platform] || [])];
        const originalIndex = updated.findIndex(m => m.id === mapping.id);
        if (originalIndex !== -1) {
          updated[originalIndex] = { ...mapping, isActive };
        } else if (mapping.id) {
          updated.push({ ...mapping, isActive });
        }
        return { ...prev, [platform]: updated };
      });


    } catch (err) {
      toast.error("Status update failed!");
    } finally {
      closeLoading();
    }
  };

  const addMapping = (platform: string) => {
    setMappings((prev) => ({
      ...prev,
      [platform]: [...(prev[platform] || []), { productCol: "", ecomField: "", isActive: false }],
    }));
  };

  const isSubmitDisabled = (platform: string): boolean => {
    const current = mappings[platform] || [];
    const original = originalMappings[platform] || [];

    const hasEmpty = current.some(m => !m.productCol || !m.ecomField);
    if (hasEmpty) return true;

    const hasChanges = current.some((m) => {
      const isRequiredActive = alwaysOnKeys.includes(m.productCol) ? true : m.isActive;
      if (!m.id) {
        return m.productCol && m.ecomField;
      }

      const orig = original.find((o) => o.id === m.id);
      if (!orig) return false;

      return (
        orig.productCol !== m.productCol ||
        orig.ecomField !== m.ecomField ||
        (orig.isActive !== isRequiredActive && !!m.productCol && !!m.ecomField)
      );
    });

    if (hasChanges) return false;

    const deletedCount = original.filter(o => o.id && !current.some(c => c.id === o.id)).length;
    if (deletedCount > 0) return false;

    return true;
  };


  const handleSubmit = async (platform: string) => {
    setSubmitting((prev) => ({ ...prev, [platform]: true }));
    showLoading(3000);
    const original = originalMappings[platform] || [];
    const current = mappings[platform] || [];
    const newMappings: Mapping[] = [];
    const editedMappings: Mapping[] = [];

    current.forEach((m) => {
      const orig = original.find((o) => o.id === m.id);
      const isActive = alwaysOnKeys.includes(m.productCol) ? true : m.isActive;
      if (!m.productCol || !m.ecomField) return;
      const mappingWithActive = { ...m, isActive };

      if (!m.id) {
        newMappings.push(mappingWithActive);
      } else if (
        orig &&
        (orig.productCol !== mappingWithActive.productCol ||
          orig.ecomField !== mappingWithActive.ecomField ||
          orig.isActive !== mappingWithActive.isActive)
      ) {
        editedMappings.push(mappingWithActive);
      }
    });

    try {

      if (newMappings.length > 0 && userRole !== "superadmin") {
        await axiosInstance.post("/field-mappings", {
          platform: platform === "neto" ? "maropost" : platform,
          mappings: newMappings.map((m) => ({
            local_field: m.productCol,
            api_field: m.ecomField,
            is_required: m.isActive,
          })),
        });
      }

      if (userRole !== "superadmin") {
        for (const m of editedMappings) {
          if (!m.id) continue;
          await axiosInstance.put(`/field-mappings/${m.id}`, {
            local_field: m.productCol,
            api_field: m.ecomField,
            is_required: m.isActive,
          });
        }

      }

      toast.success("Submitted successfully", { autoClose: 3000 });
      const updatedOriginal = JSON.parse(JSON.stringify(current));
      setOriginalMappings((prev) => ({
        ...prev,
        [platform]: updatedOriginal,
      }));
    } catch (error) {
      toast.error("Submission failed!");
    } finally {
      closeLoading();
      setSubmitting((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const openDeleteDialog = (platform: string, index: number) => {
    setDeleteInfo({ platform, index });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteInfo) return;
    const { platform, index } = deleteInfo;
    const mappingToDelete = mappings[platform][index];
    showLoading(3000);

    try {
      if (mappingToDelete.id) {
        await axiosInstance.delete(`/field-mappings/${mappingToDelete.id}`);
      }

      const updatedMappings = (mappings[platform] || []).filter((_, i) => i !== index);

      setMappings((prev) => ({
        ...prev,
        [platform]: updatedMappings,
      }));

      setOriginalMappings((prev) => ({
        ...prev,
        [platform]: (prev[platform] || []).filter(m => m.id !== mappingToDelete.id),
      }));
    } catch (error) {
      toast.error(`Deletion failed!`, { autoClose: 3000 });
    } finally {
      closeLoading();
      setDeleteDialogOpen(false);
      setDeleteInfo(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteInfo(null);
  };

  const getSelectedValues = (platform: string, field: keyof Mapping) => {
    return mappings[platform]?.map((m) => m[field]).filter(Boolean) || [];
  };

  const renderDropdowns = (platform: string) => {
    const platformMappings = mappings[platform] || [];
    const displayMappings = platformMappings.length === 0 ? [{ productCol: "", ecomField: "", isActive: false }] : platformMappings;
    const selectedProductCols = getSelectedValues(platform, "productCol");
    const selectedEcomFields = getSelectedValues(platform, "ecomField");

    const isAddDisabled = (platform: string): boolean => {
      const platformMappings = mappings[platform] || [];
      if (platformMappings.length === 0) return false;
      return platformMappings.some(
        (m) => !m.productCol || !m.ecomField
      );
    };

    return (
      <>
        <Box className="custom-scrollbar" sx={{ flex: 1, overflowY: "auto", pl: 2, minHeight: 0, mb: 2 }} >
          <Box sx={{ flex: 1, overflowY: "auto", pr: 1, minHeight: 0 }}>
            {displayMappings.map((mapping, index) => (
              <Box key={index} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 2, width: "100%", alignItems: { xs: "stretch", sm: "center" }, }} >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold", mb: 0.5, display: "block" }} >
                    Local Field
                  </Typography>
                  <FormControl fullWidth>
                    <Select value={mapping.productCol || ""} displayEmpty onChange={(e) => handleMappingChange(platform, index, "productCol", e.target.value)} renderValue={(selected) => selected || ""} MenuProps={menuProps} >
                      <MenuItem disabled value="">
                        Select Product Column
                      </MenuItem>
                      {productColumns.filter(
                        (col) =>
                          !selectedProductCols.includes(col) || col === mapping.productCol
                      ).map((col) => (
                        <MenuItem key={col} value={col}>
                          {col}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: "bold", mb: 0.5, display: "block" }} >
                    {platform.toUpperCase()} Field
                  </Typography>
                  <FormControl fullWidth>
                    <Select value={mapping.ecomField || ""} displayEmpty onChange={(e) => handleMappingChange(platform, index, "ecomField", e.target.value)} renderValue={(selected) => selected || ""} MenuProps={menuProps} >
                      <MenuItem disabled value="">
                        Select {platform.toUpperCase()} Field
                      </MenuItem>
                      {getFieldsByPlatform(platform).filter(
                        (field) => !selectedEcomFields.includes(field) || field === mapping.ecomField).map((field) => (
                          <MenuItem key={field} value={field}>
                            {field}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: { xs: 1, sm: 0 }, flexWrap: "wrap", justifyContent: { xs: "flex-start", sm: "flex-end" }, }} >
                  <FormControlLabel
                    control={
                      <Switch checked={mapping.productCol === "parent_id" ? false : alwaysOnKeys.includes(mapping.productCol) ? true : mapping.isActive
                      } onChange={(e) => handleToggleSwitch(platform, index, e.target.checked)} disabled={!mapping.productCol ||
                        !mapping.ecomField || alwaysOnKeys.includes(mapping.productCol) || mapping.productCol === "parent_id"} />}
                    label={mapping.productCol === "parent_id" ? "Off" : alwaysOnKeys.includes(mapping.productCol) ? "On" : mapping.isActive ? "On" : "Off"} />

                  {(platformMappings.length > 0) && (
                    <Tooltip title={alwaysOnKeys.includes(mapping.productCol) ? "This field is required and cannot be deleted" : ""} arrow >
                      <span>
                        <IconButton disabled={alwaysOnKeys.includes(mapping.productCol)} onClick={() => openDeleteDialog(platform, index)} color="error" size="small" >
                          <Delete />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{
          display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "flex-end", gap: 1, p: 2, borderTop: "1px solid #ddd",
          backgroundColor: "#fff", position: "sticky", bottom: 0, zIndex: 10
        }}>
          <Tooltip title={isAddDisabled(platform) ? "Please fill all fields before adding a new mapping" : ""} arrow >
            <span>
              <Button variant="outlined" disabled={isAddDisabled(platform)} onClick={() => addMapping(platform)}
                sx={{
                  width: { xs: "100%", sm: "150px" }, color: "#fc4e15", borderColor: "#fc4e15",
                  "&.Mui-disabled": { borderColor: "#ccc", color: "#aaa", },
                }} >
                <LibraryAddOutlinedIcon sx={{ mr: 1 }} /> Add
              </Button>
            </span>
          </Tooltip>

          <Tooltip title={submitting[platform] ? "Submitting..."
            : isSubmitDisabled(platform) ? "Fill all required fields or make a change before submitting" : ""} arrow >
            <span>
              <Button variant="contained" onClick={() => handleSubmit(platform)} disabled={submitting[platform] || isSubmitDisabled(platform)}
                sx={{ width: { xs: "100%", sm: "150px" }, color: "#fff", background: "#fc4e15", "&.Mui-disabled": { background: "#ccc", color: "#666" }, }} >
                {submitting[platform] ? "Submitting..." : "Submit"}
              </Button>
            </span>
          </Tooltip>

        </Box>
      </>
    );
  };

  return (
    <div className="flex flex-col max-h-[calc(100vh-253px)] h-[calc(100vh-253px)] pb-2 custom-scrollbar">
      {isLoadingInitialData ? (
        <></>
      ) : !activePlatforms || activePlatforms.length === 0 ? (
        <p className="pl-2 text-gray-700">No active platforms</p>
      ) : (
        <>
          {activePlatforms.length > 1 && (
            <div className="mb-2 pl-2 border-b border-gray-300">
              <div className="flex space-x-4">
                {activePlatforms.map((platform, index) => (
                  <button
                    key={platform}
                    onClick={() => setTabValue(index)}
                    className={`pb-2 text-sm font-medium transition-all duration-200 border-b-[3px] ${tabValue === index
                      ? "border-[#fc4e15] text-[#fc4e15] font-semibold"
                      : "border-transparent text-gray-600 hover:text-[#fc4e15]"
                      }`}
                  >
                    {platform.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activePlatforms.length === 1 ? (
            <>
              <h2 className="mb-2 font-bold pl-2 text-[#fc4e15] text-lg">
                {activePlatforms[0].toUpperCase()}
              </h2>
              {renderDropdowns(activePlatforms[0])}
            </>
          ) : (
            renderDropdowns(activePlatforms[tabValue])
          )}
        </>
      )}

      {deleteDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-80">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-gray-800 text-lg">
                Confirm Delete
              </h3>
            </div>
            <div className="p-4 text-gray-700">
              Are you sure you want to delete this mapping?
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t">
              <button
                onClick={cancelDelete}
                className="px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configurations;