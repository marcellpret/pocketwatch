import { useColorMode } from '@vueuse/core'

export function useTheme() {
  const colorMode = useColorMode({
    selector: 'html',
    attribute: 'class',
    modes: {
      light: '',
      dark: 'dark',
    },
    storageKey: 'pocketwatch-theme',
    initialValue: 'light',
  })

  const isDark = computed(() => colorMode.value === 'dark')

  function toggleTheme() {
    colorMode.value = isDark.value ? 'light' : 'dark'
  }

  return { colorMode, isDark, toggleTheme }
}
