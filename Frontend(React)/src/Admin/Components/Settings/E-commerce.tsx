import React, { useEffect, useRef, useState } from "react";
import { Box, TextField, Button, Typography, FormGroup, Switch, FormControlLabel, IconButton, InputAdornment } from "@mui/material";
import AuthService from "../../../Services/AuthService";
import axiosInstance from "../../../Services/axiosInstance";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import { closeLoading, showLoading } from "../../../General/Loader";

const EcommerceSettings: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [platformSwitch, setPlatformSwitch] = useState<{ neto: boolean; shopify: boolean }>({
    neto: false,
    shopify: false,
  });
  const [formData, setFormData] = useState({
    neto: { url: "", apiKey: "", username: "", password: "" },
    shopify: { url: "", access_token: "" },
  });
  const [initialFormData, setInitialFormData] = useState({
    neto: { url: "", apiKey: "", username: "", password: "" },
    shopify: { url: "", access_token: "" },
  });
  const [errors, setErrors] = useState<any>({ neto: {}, shopify: {} });
  const [userId, setUserId] = useState<number>();
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const hasFetchedSettings = useRef(false);
  const isFormValid = (platform: "neto" | "shopify") => {
    const currentData = formData[platform];
    return Object.keys(currentData).every((field) => {
      const value = currentData[field as keyof typeof currentData]?.trim();
      if (!value) return false;
      if (field.toLowerCase().includes("url")) {
        try {
          new URL(value);
        } catch {
          return false;
        }
      }
      return true;
    });
  };

  useEffect(() => {
    if (hasFetchedSettings.current) return;
    hasFetchedSettings.current = true;

    const fetchSettings = async () => {
      try {
        showLoading(3000);
        setLoading(true);
        const response: any = await axiosInstance.get("/settings");
        const data = response.data;

        if (userRole === "superadmin") {
          setFormData({
            neto: { url: "", apiKey: "", username: "", password: "" },
            shopify: { url: "", access_token: "" },
          });
          setInitialFormData({
            neto: { url: "", apiKey: "", username: "", password: "" },
            shopify: { url: "", access_token: "" },
          });
          setPlatformSwitch({ neto: false, shopify: false });
          setLoading(false);
          return;
        }

        const maropostStatus = Number(data.settings.maropost_status) === 1;
        const shopifyStatus = Number(data.settings.shopify_status) === 1;


        setPlatformSwitch({ neto: maropostStatus, shopify: shopifyStatus });
        setFormData({
          neto: maropostStatus
            ? {
              url: data.maropost_access.store_url,
              apiKey: data.maropost_access.api_key,
              username: data.maropost_access.api_username,
              password: data.maropost_access.api_password,
            }
            : { url: "", apiKey: "", username: "", password: "" },

          shopify: shopifyStatus
            ? {
              url: data.shopify_access.store_url,
              access_token: data.shopify_access.access_token,
            }
            : { url: "", access_token: "" },
        });

        setInitialFormData({
          neto: maropostStatus
            ? {
              url: data.maropost_access.store_url,
              apiKey: data.maropost_access.api_key,
              username: data.maropost_access.api_username,
              password: data.maropost_access.api_password,
            }
            : { url: "", apiKey: "", username: "", password: "" },

          shopify: shopifyStatus
            ? {
              url: data.shopify_access.store_url,
              access_token: data.shopify_access.access_token,
            }
            : { url: "", access_token: "" },
        });

        setDataLoaded(true);
        setTimeout(() => setFormReady(true));
      } catch (error) {
      } finally {
        closeLoading();
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const user = AuthService.getUser();
    if (user?.id) setUserId(user.id);
    if (user?.role) setUserRole(user.role);
  }, []);

  useEffect(() => {
    if (dataLoaded) {
      Object.entries(formData).forEach(([platform, fields]) => {
        Object.entries(fields).forEach(([field, value]) => {
          validateField(platform, field, value);
        });
      });
    }
  }, [dataLoaded]);

  const isFormChanged = (platform: "neto" | "shopify") => {
    return JSON.stringify(formData[platform]) !== JSON.stringify(initialFormData[platform]);
  };

  const handleInputChange = (platform: keyof typeof formData, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: value },
    }));

    setErrors((prev: any) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: "" },
    }));
  };

  const validateField = (platform: any, field: any, value: any) => {
    const val = String(value ?? "").trim();
    let error = "";

    if (!val) {
      error = "This field is required";
    } else if (field.toLowerCase().includes("url")) {
      try {
        new URL(val);
      } catch {
        error = "Invalid URL format";
      }
    }

    setErrors((prev: any) => ({
      ...prev,
      [platform]: { ...prev[platform], [field]: error },
    }));

    return !error;
  };

  const handleSubmit = async (platform: keyof typeof formData) => {
    const payload: any = { ...formData[platform], platformName: platform.toLowerCase(), userId };
    let reqObj: any = {};

    if (payload.platformName === "neto") {
      reqObj = {
        store_url: payload.url,
        api_key: payload.apiKey,
        api_username: payload.username,
        api_password: payload.password,
        platform_name: payload.platformName,
        maropost_status: platformSwitch.neto ? 1 : 0,
      };
    } else if (payload.platformName === "shopify") {
      reqObj = {
        store_url: payload.url,
        access_token: payload.access_token,
        platform_name: payload.platformName,
        shopify_status: platformSwitch.shopify ? 1 : 0,
      };
    }

    try {
      const response: any = await axiosInstance.post(`/settings`, reqObj);
      if (response.data.message) {
        toast.success(`${response.data.message}`, { autoClose: 3000 });
      }
      setInitialFormData((prev) => ({
        ...prev,
        [platform]: { ...formData[platform] },
      }));

      setErrors((prev: any) => ({ ...prev, [platform]: {} }));
    } catch (error) {
      toast.error("Error saving settings. Please try again.", { autoClose: 3000 });
    }
  };

  const handleSwitchChange = async (platform: "neto" | "shopify") => {
    setFormReady(false);
    const newValue = !platformSwitch[platform];
    try {
      showLoading(3000);
      const response = await axiosInstance.post("/settings", {
        [platform === "neto" ? "maropost_status" : "shopify_status"]: newValue ? 1 : 0,
      });

      const data: any = response.data;
      const maropostStatus = Number(data.settings.maropost_status) === 1;
      const shopifyStatus = Number(data.settings.shopify_status) === 1;

       if (userRole === "superadmin") {
          setFormData({
            neto: { url: "", apiKey: "", username: "", password: "" },
            shopify: { url: "", access_token: "" },
          });
          setInitialFormData({
            neto: { url: "", apiKey: "", username: "", password: "" },
            shopify: { url: "", access_token: "" },
          });
          setPlatformSwitch((prev) => ({ ...prev, [platform]: newValue }));
          setLoading(false);
          return;
        }

      setFormData({
        neto: maropostStatus ? {
          url: data.maropost_access.store_url,
          apiKey: data.maropost_access.api_key,
          username: data.maropost_access.api_username,
          password: data.maropost_access.api_password,
        } : { url: "", apiKey: "", username: "", password: "" },

        shopify: shopifyStatus ? {
          url: data.shopify_access.store_url,
          access_token: data.shopify_access.access_token,
        } : { url: "", access_token: "" },
      });

      setPlatformSwitch((prev) => ({ ...prev, [platform]: newValue }));
      setFormReady(true)
      toast.success(`${platform} status updated successfully`, { autoClose: 3000 });
    } catch (error) {
      toast.error(`Failed to update ${platform} status. Please try again.`, { autoClose: 3000 });
    } finally {
      closeLoading();
    }
  };

  useEffect(() => {
    if (formReady) {
      Object.entries(formData).forEach(([platform, fields]) => {
        if (platformSwitch[platform as "neto" | "shopify"]) {
          Object.entries(fields).forEach(([field, value]) => {
            validateField(platform, field, value);
          });
        }
      });
    }
  }, [formReady]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(85vh - 200px)", gap: 4, p: 2 }}>
      {loading ? (
        <></>
      ) : (
        <Box className="custom-scrollbar" sx={{ flex: 1, overflowY: "auto", pr: 1 }} >
          <FormGroup sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, }} >
                <Typography sx={{ fontWeight: "bold" }}>Neto</Typography>
                <FormControlLabel
                  control={<Switch checked={platformSwitch.neto} onChange={() => handleSwitchChange("neto")} />}
                  label={platformSwitch.neto ? "On" : "Off"}
                  sx={{ m: 0 }}
                />
              </Box>

              {platformSwitch.neto && (
                <>
                  <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                    <TextField label="Username" size="small" value={formData.neto.username} disabled={userRole === "superadmin"} onChange={(e) => handleInputChange("neto", "username", e.target.value)}
                      onBlur={(e) => validateField("neto", "username", e.target.value)} fullWidth error={!!errors.neto.username} helperText={errors.neto.username} />
                    <TextField label="Password" type={showPassword ? "text" : "password"} disabled={userRole === "superadmin"} size="small" value={formData.neto.password} autoComplete="new-password"
                      onChange={(e) => handleInputChange("neto", "password", e.target.value)} onBlur={(e) => validateField("neto", "password", e.target.value)}
                      fullWidth error={!!errors.neto.password} helperText={errors.neto.password} InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                    <TextField label="Neto URL" size="small" value={formData.neto.url} disabled={userRole === "superadmin"} onChange={(e) => handleInputChange("neto", "url", e.target.value)}
                      onBlur={(e) => validateField("neto", "url", e.target.value)} fullWidth error={!!errors.neto.url} helperText={errors.neto.url} />
                    <TextField label="API Key" size="small" value={formData.neto.apiKey} disabled={userRole === "superadmin"} onChange={(e) => handleInputChange("neto", "apiKey", e.target.value)}
                      onBlur={(e) => validateField("neto", "apiKey", e.target.value)} fullWidth error={!!errors.neto.apiKey} helperText={errors.neto.apiKey} />
                  </Box>

                  <Button variant="contained" color="primary"
                    sx={{
                      alignSelf: { xs: "stretch", sm: "flex-start" }, color: "#fff", background: "#fc4e15",
                      "&.Mui-disabled": { cursor: "not-allowed", opacity: 0.6, pointerEvents: "auto", },
                    }}
                    onClick={() => handleSubmit("neto")} disabled={!isFormChanged("neto") || !isFormValid("neto") || userRole === "superadmin"} >
                    Submit
                  </Button>
                </>
              )}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, }} >
                <Typography sx={{ fontWeight: "bold" }}>Shopify</Typography>
                <FormControlLabel
                  control={<Switch checked={platformSwitch.shopify} onChange={() => handleSwitchChange("shopify")} />}
                  label={platformSwitch.shopify ? "On" : "Off"}
                  sx={{ m: 0 }}
                />
              </Box>

              {platformSwitch.shopify && (
                <>
                  <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
                    <TextField label="Store URL" size="small" value={formData.shopify.url} disabled={userRole === "superadmin"} onChange={(e) => handleInputChange("shopify", "url", e.target.value)}
                      onBlur={(e) => validateField("shopify", "url", e.target.value)} fullWidth error={!!errors.shopify.url} helperText={errors.shopify.url} />
                    <TextField label="Access Token" size="small" value={formData.shopify.access_token} disabled={userRole === "superadmin"}
                      onChange={(e) => handleInputChange("shopify", "access_token", e.target.value)}
                      onBlur={(e) => validateField("shopify", "access_token", e.target.value)} fullWidth error={!!errors.shopify.access_token} helperText={errors.shopify.access_token} />
                  </Box>

                  <Button variant="contained" color="primary" sx={{
                    alignSelf: { xs: "stretch", sm: "flex-start" }, color: "#fff",
                    background: "#fc4e15", "&.Mui-disabled": { cursor: "not-allowed", opacity: 0.6, pointerEvents: "auto", },
                  }}
                    onClick={() => handleSubmit("shopify")} disabled={!isFormChanged("shopify") || !isFormValid("shopify") || userRole === "superadmin"} >
                    Submit
                  </Button>
                </>
              )}
            </Box>
          </FormGroup>
        </Box>
      )}
    </Box>
  );
};

export default EcommerceSettings;
