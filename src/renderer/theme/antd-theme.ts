import type { ThemeConfig } from 'antd'
import { theme as antdTheme } from 'antd'

const sharedToken = {
  borderRadius: 8,
  fontFamily: "'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif",
  fontSize: 14,
  colorPrimary: '#1B6B93',
  colorSuccess: '#2DA44E',
  colorWarning: '#D29922',
  colorError: '#CF222E',
  colorLink: '#1B6B93',
}

const sharedComponents = {
  Card: { borderRadius: 12 },
  Button: { borderRadius: 8 },
  Input: { borderRadius: 8 },
  Select: { borderRadius: 8 },
  Menu: { itemBorderRadius: 8 },
}

export const lightTheme: ThemeConfig = {
  direction: 'rtl',
  token: {
    ...sharedToken,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#F6F8FA',
  },
  components: {
    ...sharedComponents,
    Table: {
      headerBg: 'transparent',
      rowHoverBg: '#F0F4F7',
      borderRadius: 8,
    },
  },
}

export const darkTheme: ThemeConfig = {
  direction: 'rtl',
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...sharedToken,
    colorPrimary: '#2D99C8',
    colorBgContainer: '#161B22',
    colorBgLayout: '#0D1117',
    colorBgElevated: '#1C2333',
  },
  components: {
    ...sharedComponents,
    Table: {
      headerBg: '#1C2333',
      rowHoverBg: '#1C2333',
      borderRadius: 8,
    },
  },
}

export const theme = lightTheme
