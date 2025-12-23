import React from 'react'
import { render, screen } from '@testing-library/react'
import { Slider } from './slider'

describe('Slider Component', () => {
  test('renders with single thumb by default', () => {
    render(<Slider data-testid="slider" />)
    const slider = screen.getByTestId('slider')
    const thumbs = slider.querySelectorAll('[role="slider"]')
    expect(thumbs).toHaveLength(1)
  })

  test('renders with single thumb when single value provided', () => {
    render(<Slider defaultValue={[50]} data-testid="slider" />)
    const slider = screen.getByTestId('slider')
    const thumbs = slider.querySelectorAll('[role="slider"]')
    expect(thumbs).toHaveLength(1)
  })

  test('renders with multiple thumbs when array of values provided', () => {
    render(<Slider defaultValue={[20, 80]} data-testid="slider" />)
    const slider = screen.getByTestId('slider')
    const thumbs = slider.querySelectorAll('[role="slider"]')
    expect(thumbs).toHaveLength(2)
  })

  test('renders with three thumbs when three values provided', () => {
    render(<Slider defaultValue={[10, 50, 90]} data-testid="slider" />)
    const slider = screen.getByTestId('slider')
    const thumbs = slider.querySelectorAll('[role="slider"]')
    expect(thumbs).toHaveLength(3)
  })

  test('applies custom className', () => {
    render(<Slider className="custom-class" data-testid="slider" />)
    const slider = screen.getByTestId('slider')
    expect(slider).toHaveClass('custom-class')
  })
})
