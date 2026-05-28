/* eslint-disable prettier/prettier */
// apps/web/src/stories/DesignSystem.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs'
import { colors, typography, spacing } from '../design-system/tokens'
import { Logo } from '../design-system/components/Logo/Logo'

// ── Color Palette ──────────────────────────────────────────────────
function ColorSwatch({ name, value }: { readonly name: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-16 w-full rounded-lg border border-black/5"
        style={{ backgroundColor: value }}
      />
      <p className="text-xs font-medium text-neutral-700">{name}</p>
      <p className="font-mono text-xs text-neutral-400">{value}</p>
    </div>
  )
}

function DesignSystemDoc() {
  return (
    <div
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '48px',
        maxWidth: '960px',
        color: '#0f172a',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '64px' }}>
        <Logo size="lg" />
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            marginTop: '32px',
            letterSpacing: '-0.02em',
          }}
        >
          Design System
        </h1>
        <p style={{ color: '#64748b', marginTop: '8px', fontSize: '1.125rem' }}>
          Vidya Dhara — Visual Language & Component Library
        </p>
        <div
          style={{
            display: 'inline-block',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#15803d',
            marginTop: '16px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Version 1.0 — Work in Progress
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '48px' }} />

      {/* Logo Section */}
      <section style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          Logo
        </h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          Placeholder logo — to be replaced with final brand assets.
        </p>
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Large
            </p>
            <Logo size="lg" />
          </div>
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Medium
            </p>
            <Logo size="md" />
          </div>
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Small
            </p>
            <Logo size="sm" />
          </div>
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Icon only
            </p>
            <Logo size="md" variant="icon" />
          </div>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '48px' }} />

      {/* Brand Colors */}
      <section style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          Brand Colors
        </h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>Green — growth, education, trust.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {Object.entries(colors.brand).map(([shade, value]) => (
            <ColorSwatch key={shade} name={`Brand ${shade}`} value={value} />
          ))}
        </div>
      </section>

      {/* Neutral Colors */}
      <section style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          Neutral Colors
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {Object.entries(colors.neutral).map(([shade, value]) => (
            <ColorSwatch key={shade} name={`Neutral ${shade}`} value={value} />
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '48px' }} />

      {/* Typography */}
      <section style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          Typography
        </h2>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          Inter — modern, clean, highly legible at all sizes.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Object.entries(typography.fontSize).map(([name, size]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'baseline', gap: '24px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  width: '60px',
                  flexShrink: 0,
                  fontFamily: 'monospace',
                }}
              >
                {size}
              </span>
              <span style={{ fontSize: size, fontWeight: 500, letterSpacing: '-0.01em' }}>
                The quick brown fox jumps
              </span>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '48px' }} />

      {/* Semantic Colors */}
      <section style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          Semantic Colors
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          {Object.entries(colors.semantic).map(([name, shades]) => (
            <div key={name}>
              <p
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                  textTransform: 'capitalize',
                }}
              >
                {name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(shades).map(([shade, value]) => (
                  <ColorSwatch key={shade} name={shade} value={value} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', marginBottom: '48px' }} />

      {/* Spacing */}
      <section style={{ marginBottom: '56px' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          Spacing Scale
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(spacing).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  width: '32px',
                  fontFamily: 'monospace',
                }}
              >
                {key}
              </span>
              <div
                style={{
                  background: '#16a34a',
                  height: '8px',
                  width: value,
                  borderRadius: '2px',
                  minWidth: '4px',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta: Meta = {
  title: 'Design System/Style Guide',
  component: DesignSystemDoc,
  parameters: {
    layout: 'fullscreen',
    docs: { disable: true },
  },
}

export default meta
type Story = StoryObj

export const StyleGuide: Story = {}
