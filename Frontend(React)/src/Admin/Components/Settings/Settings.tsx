import React, { useState, useEffect } from "react";
import { Box, Tabs, Tab, Paper } from "@mui/material";
import EcommerceSettings from "./E-commerce";
import Configurations from "./Configurations";
import CustomFieldsList from "./CustomFieldsList";

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const savedTab = localStorage.getItem("settingsTab");
    if (savedTab) setValue(Number(savedTab));
  }, []);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    localStorage.setItem("settingsTab", String(newValue));
  };

  return (
    <Paper sx={{ height: "calc(100vh - 205px)", mt: 6.5 }}>
      <Tabs value={value} onChange={handleChange} sx={{
        borderBottom: 1, borderColor: "divider",
        "& .MuiTabs-indicator": { backgroundColor: "#fc4e15", height: "3px", borderRadius: "2px" },
        "& .MuiTab-root": {
          textTransform: "none", minWidth: "unset", borderBottom: "3px solid transparent", transition: "all 0.2s ease-in-out", "&:hover": { color: "#fc4e15" }},
        "& .Mui-selected": { color: "#fc4e15 !important", borderBottom: "3px solid #fc4e15", fontWeight: "bold", },
      }} >
        <Tab label="E-Commerce" />
        <Tab label="Configurations" />
        <Tab label="Custom Fields" />
      </Tabs>

      <TabPanel value={value} index={0}>
        <EcommerceSettings />
      </TabPanel>

      <TabPanel value={value} index={1}>
        <Configurations />
      </TabPanel>

      <TabPanel value={value} index={2}>
        <CustomFieldsList />
      </TabPanel>
    </Paper>
  );
};

export default Settings;
