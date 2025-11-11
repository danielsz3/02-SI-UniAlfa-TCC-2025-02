import React from "react";
import { Box, TextField } from "@mui/material";
import { DateFilters } from "./DashboardPage";

interface Props {
  filters: DateFilters;
  setFilters: React.Dispatch<React.SetStateAction<DateFilters>>;
}

export default function DashboardFilters({ filters, setFilters }: Props) {
  const handleChange = (field: keyof DateFilters, value: string) => {
    setFilters((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Box display="flex" gap={2}>
      <TextField
        label="Data Inicial"
        type="date"
        value={filters.startDate || ""}
        onChange={(e) => handleChange("startDate", e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Data Final"
        type="date"
        value={filters.endDate || ""}
        onChange={(e) => handleChange("endDate", e.target.value)}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
}
