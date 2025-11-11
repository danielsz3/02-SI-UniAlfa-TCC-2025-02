import React from "react";
import { Card, CardActionArea, CardContent, Typography, Box } from "@mui/material";

interface MetricCardProps {
  title: string;
  value: string | number;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, onClick }) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0px 4px 16px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardActionArea onClick={onClick} disabled={!onClick}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" p={1}>
            <Typography variant="subtitle2" color="textSecondary">
              {title}
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              color="text.primary"
              sx={{ mt: 1 }}
            >
              {value}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default MetricCard;
``
