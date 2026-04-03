import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  direction: 'rtl',
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    borderRadius: 8,
    fontFamily: "'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif",
    fontSize: 14,
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5'
  },
  components: {
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#e6f4ff',
      borderRadius: 8
    },
    Card: {
      borderRadius: 12
    },
    Button: {
      borderRadius: 8
    },
    Input: {
      borderRadius: 8
    },
    Select: {
      borderRadius: 8
    },
    Menu: {
      itemBorderRadius: 8
    }
  }
}
