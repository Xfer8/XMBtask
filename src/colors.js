// Color Palettes
export const colorPalettes = {
  glow: {
    yellow: {
      text: "#FAC615",
      bg: "#D3D208",
      border: "#D3D208",
      hover: {
        text: "#FFE370",
        bg: "#E8E817",
        border: "#FFD72E"
      }
    },
    orange: {
      text: "#FF923C",
      bg: "#E2800",
      border: "#E2800",
      hover: {
        text: "#FFCA80",
        bg: "#F59231",
        border: "#FFA85F"
      }
    },
    red: {
      text: "#FF5D5D",
      bg: "#D32828",
      border: "#D32828",
      hover: {
        text: "#FFB3B3",
        bg: "#F55555",
        border: "#FF5858"
      }
    },
    pink: {
      text: "#F47286",
      bg: "#C41A4F",
      border: "#C41A4F",
      hover: {
        text: "#F99CB5",
        bg: "#E91E63",
        border: "#F794CB"
      }
    },
    purple: {
      text: "#D2022D",
      bg: "#2022D",
      border: "#2022D",
      hover: {
        text: "#D7A6FF",
        bg: "#7C3AED",
        border: "#C0ACF8"
      }
    },
    blue: {
      text: "#4AB6F6",
      bg: "#0D47A1",
      border: "#0D47A1",
      hover: {
        text: "#A5DAFF",
        bg: "#1E88E5",
        border: "#60CDFA"
      }
    },
    teal: {
      text: "#2DD48F",
      bg: "#003D33",
      border: "#003D33",
      hover: {
        text: "#6FE8B8",
        bg: "#00897B",
        border: "#5AE4B5"
      }
    },
    green: {
      text: "#85E063",
      bg: "#4DE380",
      border: "#4DE380",
      hover: {
        text: "#B5F590",
        bg: "#7EE6A6",
        border: "#9EF691"
      }
    },
    gray: {
      text: "#D1D508",
      bg: "#D1D508",
      border: "#D1D508",
      hover: {
        text: "#E8E817",
        bg: "#E8E817",
        border: "#F5F57E"
      }
    }
  },
  solid: {
    yellow: {
      text: "#3D3208",
      bg: "#FAC615",
      border: "none",
      hover: {
        text: "#3D3208",
        bg: "#FFD72E",
        border: "none"
      }
    },
    orange: {
      text: "#2A2A2A",
      bg: "#FB923C",
      border: "none",
      hover: {
        text: "#2A2A2A",
        bg: "#FFC080",
        border: "none"
      }
    },
    red: {
      text: "#2A2A2A",
      bg: "#FF68B8",
      border: "none",
      hover: {
        text: "#2A2A2A",
        bg: "#FF8ACC",
        border: "none"
      }
    },
    pink: {
      text: "#2A2A2A",
      bg: "#F472B6",
      border: "none",
      hover: {
        text: "#2A2A2A",
        bg: "#F994D4",
        border: "none"
      }
    },
    purple: {
      text: "#2A2A2A",
      bg: "#A78BFA",
      border: "none",
      hover: {
        text: "#2A2A2A",
        bg: "#C4B5FD",
        border: "none"
      }
    },
    blue: {
      text: "#2A2A2A",
      bg: "#38BDF8",
      border: "none",
      hover: {
        text: "#2A2A2A",
        bg: "#7DD3FC",
        border: "none"
      }
    },
    teal: {
      text: "#2A2A2A",
      bg: "#2DD48F",
      border: "none",
      hover: {
        text: "#2A2A2A",
        bg: "#5AE4B5",
        border: "none"
      }
    },
    green: {
      text: "#0E3F24",
      bg: "#4ADE80",
      border: "none",
      hover: {
        text: "#0E3F24",
        bg: "#7EE6A6",
        border: "none"
      }
    },
    gray: {
      text: "#2A2A2A",
      bg: "#D1D508",
      border: "none",
      hover: {
        text: "#2A2A2A",
        bg: "#E8E817",
        border: "none"
      }
    }
  }
};

// Helper function to get a color by palette and name
export const getColor = (palette, colorName) => {
  return colorPalettes[palette]?.[colorName] || null;
};
