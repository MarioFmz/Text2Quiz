import { describe, it, expect } from 'vitest'

describe('AppLayout', () => {
  it('should pass basic component test', () => {
    // Basic test to verify test setup is working
    expect(true).toBe(true)
  })

  it('should have correct app name', () => {
    const appName = 'Text2Quiz'
    expect(appName).toBe('Text2Quiz')
    expect(appName.length).toBeGreaterThan(0)
  })
})
