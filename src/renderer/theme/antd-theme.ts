import type { ThemeConfig } from 'antd'
import { theme as antdTheme } from 'antd'

const sharedToken = {
  borderRadius: 10,
  fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', Tahoma, system-ui, sans-serif",
  fontSize: 14,
  colorSuccess: '#16A34A',
  colorWarning: '#CA8A04',
  colorError: '#DC2626',
  colorInfo: '#2563EB',
}

const sharedComponents = {
  Card: { borderRadius: 14 },
  Button: { borderRadius: 10 },
  Input: { borderRadius: 10 },
  Select: { borderRadius: 10 },
  Menu: { itemBorderRadius: 9 },
  Modal: { borderRadius: 16 },
  Drawer: { borderRadius: 16 },
  Tag: { borderRadiusSM: 999 },
}

export const lightTheme: ThemeConfig = {
  direction: 'rtl',
  token: {
    ...sharedToken,
    colorPrimary: '#0F4C3A',
    colorLink: '#0F4C3A',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#F7F5F0',
    colorBgElevated: '#FBFAF7',
    colorBorder: '#E2DED5',
    colorBorderSecondary: '#EFEBE3',
    colorText: '#1A1F1C',
    colorTextSecondary: '#4E5954',
    colorTextTertiary: '#7E867F',
  },
  components: {
    ...sharedComponents,
    Table: {
      headerBg: '#FBFAF7',
      headerColor: '#7E867F',
      rowHoverBg: '#F3F1EC',
      borderColor: '#EFEBE3',
      borderRadius: 12,
    },
    Layout: {
      bodyBg: '#F7F5F0',
      headerBg: '#F7F5F0',
      siderBg: '#0F1512',
    },
  },
}

export const darkTheme: ThemeConfig = {
  direction: 'rtl',
  algorithm: antdTheme.darkAlgorithm,
  token: {
    ...sharedToken,
    colorPrimary: '#2D6B55',
    colorLink: '#3A8069',
    colorBgContainer: '#141B17',
    colorBgLayout: '#0A0F0D',
    colorBgElevated: '#0F1512',
    colorBorder: '#1F2924',
    colorBorderSecondary: '#161E1A',
    colorText: '#E8EDEA',
    colorTextSecondary: '#A8B2AD',
    colorTextTertiary: '#6B7570',
  },
  components: {
    ...sharedComponents,
    Table: {
      headerBg: '#0F1512',
      headerColor: '#6B7570',
      rowHoverBg: '#1A221D',
      borderColor: '#161E1A',
      borderRadius: 12,
    },
    Layout: {
      bodyBg: '#0A0F0D',
      headerBg: '#0A0F0D',
      siderBg: '#0C1210',
    },
  },
}

export const theme = lightTheme
