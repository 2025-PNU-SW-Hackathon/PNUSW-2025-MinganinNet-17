# GlassCard Component

A modern, reusable glassmorphism card component for React Native applications with full TypeScript support and accessibility features.

## Features

- 🎨 **Modern Glassmorphism Design**: Semi-transparent backgrounds with elevation effects
- 🌓 **Theme Support**: Automatic light/dark theme adaptation
- ♿ **Full Accessibility**: Complete screen reader and keyboard navigation support
- 🤖 **Android Optimized**: Elevation shadows and optimized rendering for Android devices
- 🎯 **TypeScript**: Full type safety with comprehensive interfaces
- 🔄 **Flexible**: Multiple variants, blur levels, and opacity settings

## Basic Usage

```tsx
import GlassCard from './components/GlassCard';

<GlassCard>
  <Text>Your content here</Text>
</GlassCard>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Content to display inside the card |
| `blur` | `'subtle' \| 'medium' \| 'strong'` | `'medium'` | Blur intensity level |
| `opacity` | `'light' \| 'medium' \| 'dark'` | `'medium'` | Background opacity level |
| `variant` | `'primary' \| 'secondary' \| 'accent'` | `'secondary'` | Visual style variant |
| `style` | `ViewStyle` | - | Custom styling for the container |
| `contentContainerStyle` | `ViewStyle` | - | Custom styling for the content |
| `disabled` | `boolean` | `false` | Disable interactions and reduce opacity |
| `onPress` | `() => void` | - | Press handler (makes component touchable) |
| `testID` | `string` | - | Testing identifier |
| `accessible` | `boolean` | `true` | Enable accessibility features |
| `accessibilityLabel` | `string` | - | Screen reader label |
| `accessibilityHint` | `string` | - | Screen reader hint |

## Variants

### Pre-configured Components

```tsx
import { PrimaryGlassCard, SecondaryGlassCard, AccentGlassCard } from './components/GlassCard';

// Primary - Accent color theme
<PrimaryGlassCard>
  <Text>Important content</Text>
</PrimaryGlassCard>

// Secondary - Neutral theme (default)
<SecondaryGlassCard>
  <Text>Regular content</Text>
</SecondaryGlassCard>

// Accent - Success/info theme
<AccentGlassCard>
  <Text>Special content</Text>
</AccentGlassCard>
```

### Custom Variants

```tsx
// Custom configuration
<GlassCard variant="primary" blur="strong" opacity="light">
  <Text>Highly emphasized content</Text>
</GlassCard>

// Interactive card
<GlassCard 
  variant="accent" 
  onPress={() => console.log('Pressed!')}
  accessibilityLabel="Interactive card"
  accessibilityHint="Double tap to activate"
>
  <Text>Tap me!</Text>
</GlassCard>
```

## Higher-Order Component

Wrap existing components with glassmorphism styling:

```tsx
import { withGlassCard } from './components/GlassCard';

const MyComponent = ({ title, content }) => (
  <View>
    <Text>{title}</Text>
    <Text>{content}</Text>
  </View>
);

const GlassMyComponent = withGlassCard(MyComponent, {
  variant: 'primary',
  blur: 'medium',
  opacity: 'light'
});

// Usage
<GlassMyComponent 
  title="Glass Card" 
  content="Wrapped with HOC" 
  glassCardProps={{ blur: 'strong' }} // Override HOC props
/>
```

## Blur Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `subtle` | Light blur effect | Background cards, subtle emphasis |
| `medium` | Moderate blur | Main content cards, balanced visibility |
| `strong` | Heavy blur effect | Modal overlays, strong emphasis |

## Opacity Levels

| Level | Light Theme | Dark Theme | Use Case |
|-------|-------------|------------|----------|
| `light` | High transparency | Low transparency | Subtle backgrounds |
| `medium` | Moderate transparency | Moderate transparency | Balanced visibility |
| `dark` | Low transparency | High transparency | Strong emphasis |

## Android Optimization

### Elevation and Shadows
- Uses Android's native elevation system for depth perception
- Optimized shadow configurations for different blur levels
- Enhanced opacity levels for better glass effect on Android

### Performance Considerations
- Optimized for Android's rendering system
- Efficient shadow and elevation calculations
- Consistent visual appearance across Android devices and screen densities

## Theme Integration

The component automatically adapts to your app's color scheme:

### Light Theme
- White/neutral backgrounds with dark text
- Subtle shadows and borders
- Lower opacity for blur effects

### Dark Theme  
- Dark backgrounds with light text
- Enhanced shadows and borders
- Higher opacity for blur effects

## Accessibility

Full accessibility support out of the box:

```tsx
<GlassCard 
  accessible={true}
  accessibilityLabel="Settings card"
  accessibilityHint="Contains app configuration options"
  accessibilityRole="button" // Added automatically if onPress provided
>
  <Text>App Settings</Text>
</GlassCard>
```

## Performance Considerations

- Optimized for Android's native rendering system
- Efficient elevation and shadow calculations
- Minimal re-renders with proper memoization
- Enhanced opacity settings for better Android glass effects

## Examples in HomeScreen

The component is already integrated in HomeScreen:

```tsx
// Coach status card
<AccentGlassCard
  blur="medium"
  opacity="medium"
  accessibilityLabel="Coach status card"
>
  {/* Coach content */}
</AccentGlassCard>

// Todo list card
<SecondaryGlassCard
  blur="subtle"
  opacity="medium"
  accessibilityLabel="Today's todo list"
>
  {/* Todo content */}
</SecondaryGlassCard>
```

## Migration from Existing Cards

Replace existing card styling:

### Before
```tsx
<View style={styles.card}>
  <Text>Content</Text>
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.1,
    // ... more styling
  }
});
```

### After
```tsx
<SecondaryGlassCard>
  <Text>Content</Text>
</SecondaryGlassCard>
```

## Best Practices

1. **Choose appropriate blur levels**: Use subtle for backgrounds, medium for main content, strong for emphasis
2. **Consider theme adaptation**: Test in both light and dark modes
3. **Add accessibility**: Always include labels and hints for screen readers
4. **Performance**: Avoid nesting multiple strong blur cards
5. **Visual hierarchy**: Use different variants to establish content importance

## Future Enhancements

Planned features for future versions:

- [ ] Animated blur transitions
- [ ] Custom gradient overlays
- [ ] Advanced shadow configurations
- [ ] Animated border effects
- [ ] Custom backdrop filters